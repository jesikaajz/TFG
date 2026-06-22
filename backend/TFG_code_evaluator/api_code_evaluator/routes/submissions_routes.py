from datetime import datetime
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.params import Query
from sqlalchemy.orm import Session

from ..models.rubric_model import Rubric

from ..models.course_offerings_model import CourseOffering
from ..models.subjects_model import Subject

from ..bd.connection import get_db

from ..models.submissions_model import Submission
from ..models.exercise_model import Exercise
from ..models.exercise_languange_model import ExerciseLanguage
from ..models.teacher_assignments_model import TeacherAssignment
from ..models.user_model import User
from ..models.evaluation_model import Evaluation
from ..models.programming_languages_model import ProgrammingLanguage

from ..services.code_runner import VM_HOST, VM_USER, VM_PASS, evaluate_code, evaluate_function_code
from ..models.test_cases_model import TestCase

from ..schemas.submissions_schema import (
    SubmissionCreate,
    SubmissionPatch,
    SubmissionResponse
)

from ..dependencies.auth_dependencies import (
    get_current_user,
    admin_required
)

from ..tasks import process_submission_task, process_submission_function_task
import logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/submissions",
    tags=["Submissions"]
)


def teacher_has_access(user_id, exercise, db):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.course_offering_id == exercise.course_offering_id,
        TeacherAssignment.professor_id == user_id
    ).first()
    return assignment is not None


# ==========================================
# GESTIÓN DE WEBSOCKETS
# ==========================================

class EvaluationStatusManager:
    """Maneja conexiones WebSocket para estado de evaluaciones"""
    
    def __init__(self):
        self.active_connections: dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, submission_id: int):
        await websocket.accept()
        self.active_connections[submission_id] = websocket
        print(f"🔌 WebSocket connected for submission {submission_id}")
    
    def disconnect(self, submission_id: int):
        if submission_id in self.active_connections:
            del self.active_connections[submission_id]
            print(f"🔌 WebSocket disconnected for submission {submission_id}")
    
    async def send_status(self, submission_id: int, status_data: dict):
        if submission_id in self.active_connections:
            try:
                await self.active_connections[submission_id].send_json(status_data)
                return True
            except Exception:
                self.disconnect(submission_id)
        return False


evaluation_status_manager = EvaluationStatusManager()


def get_submission_status_sync(db: Session, submission_id: int, user: User) -> dict:
    """Versión síncrona para usar dentro del WebSocket"""
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        return {"error": "Submission not found"}
    
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    has_rubric = False
    if exercise:
        rubric = db.query(Rubric).filter(Rubric.exercise_id == exercise.id).first()
        has_rubric = rubric is not None
    
    pdf_ready = False
    if evaluation and evaluation.feedback_pdf and os.path.exists(evaluation.feedback_pdf):
        pdf_ready = True
    
    return {
        "submission_id": submission_id,
        "status": submission.status,
        "has_rubric": has_rubric,
        "pdf_ready": pdf_ready,
        "evaluation": {
            "score": float(evaluation.score) if evaluation and evaluation.score is not None else None,
            "passed_tests": evaluation.passed_tests if evaluation else None,
            "total_tests": evaluation.total_tests if evaluation else None,
        } if evaluation else None
    }


# ==========================================
# RUTAS ESPECÍFICAS (sin parámetros dinámicos) - DEBEN IR PRIMERO
# ==========================================

@router.get("/me", response_model=list[SubmissionResponse])
def my_submissions(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role != "student":
        raise HTTPException(403, "Only students")
    return db.query(Submission).filter(
        Submission.student_id == user.id
    ).all()


@router.get("/filter-options")
def get_submission_filter_options(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "teacher":
        teacher_offerings = db.query(CourseOffering.id).join(
            TeacherAssignment, CourseOffering.id == TeacherAssignment.course_offering_id
        ).filter(
            TeacherAssignment.professor_id == current_user.id
        ).subquery()
        
        students = db.query(User).join(
            Submission, User.id == Submission.student_id
        ).join(
            Exercise, Submission.exercise_id == Exercise.id
        ).filter(
            Exercise.course_offering_id.in_(teacher_offerings)
        ).distinct().all()
        
        exercises = db.query(Exercise).filter(
            Exercise.course_offering_id.in_(teacher_offerings)
        ).all()
        
        subjects = db.query(Subject).join(
            CourseOffering, Subject.id == CourseOffering.subject_id
        ).filter(
            CourseOffering.id.in_(teacher_offerings)
        ).distinct().all()
        
    elif current_user.role == "student":
        students = [current_user]
        exercises = db.query(Exercise).join(
            Submission, Exercise.id == Submission.exercise_id
        ).filter(
            Submission.student_id == current_user.id
        ).all()
        subjects = db.query(Subject).join(
            CourseOffering, Subject.id == CourseOffering.subject_id
        ).join(
            Exercise, CourseOffering.id == Exercise.course_offering_id
        ).join(
            Submission, Exercise.id == Submission.exercise_id
        ).filter(
            Submission.student_id == current_user.id
        ).distinct().all()
    else:
        students = db.query(User).filter(User.role == "student").all()
        exercises = db.query(Exercise).all()
        subjects = db.query(Subject).all()
    
    statuses = ["pending", "processing", "evaluated", "error"]
    languages = db.query(ProgrammingLanguage).all()
    
    return {
        "students": [{"id": s.id, "name": s.name, "email": s.email} for s in students],
        "exercises": [{"id": e.id, "title": e.title} for e in exercises],
        "subjects": [{"id": s.id, "name": s.name} for s in subjects],
        "statuses": statuses,
        "languages": [{"id": l.id, "name": l.name, "version": l.version} for l in languages]
    }
# ==========================================
# CONTAR TOTAL DE SUBMISSIONS (solo admin)
# ==========================================
@router.get("/count")
def get_total_submissions_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener el número total de submissions en el sistema - Solo administradores"""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Se requieren permisos de administrador")
    
    total_submissions = db.query(Submission).count()
    return {"count": total_submissions}


@router.get("/search", response_model=dict)
def search_submissions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    student_id: Optional[int] = Query(None),
    student_name: Optional[str] = Query(None),
    exercise_id: Optional[int] = Query(None),
    exercise_title: Optional[str] = Query(None),
    subject_id: Optional[int] = Query(None),
    subject_name: Optional[str] = Query(None),
    course_offering_id: Optional[int] = Query(None),
    language_id: Optional[int] = Query(None),
    language_name: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_score: Optional[float] = Query(None, ge=0, le=100),
    max_score: Optional[float] = Query(None, ge=0, le=100),
    passed: Optional[bool] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    has_evaluation: Optional[bool] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    order_by: str = Query("submitted_at"),
    order_desc: bool = Query(True)
):
    query = db.query(Submission).join(
        User, Submission.student_id == User.id
    ).join(
        Exercise, Submission.exercise_id == Exercise.id
    ).join(
        CourseOffering, Exercise.course_offering_id == CourseOffering.id
    ).join(
        Subject, CourseOffering.subject_id == Subject.id
    ).outerjoin(
        ProgrammingLanguage, Submission.language_id == ProgrammingLanguage.id
    ).outerjoin(
        Evaluation, Submission.id == Evaluation.submission_id
    )
    
    if current_user.role == "teacher":
        teacher_offerings = db.query(CourseOffering.id).join(
            TeacherAssignment, CourseOffering.id == TeacherAssignment.course_offering_id
        ).filter(
            TeacherAssignment.professor_id == current_user.id
        ).subquery()
        query = query.filter(Exercise.course_offering_id.in_(teacher_offerings))
    elif current_user.role == "student":
        query = query.filter(Submission.student_id == current_user.id)
    
    # Aplicar filtros...
    if student_id:
        query = query.filter(Submission.student_id == student_id)
    if student_name:
        # Si es una sola letra, buscar solo al inicio del nombre
        if len(student_name.strip()) == 1:
            query = query.filter(User.name.ilike(f"{student_name.strip()}%"))
        else:
            query = query.filter(User.name.ilike(f"%{student_name}%"))
    if exercise_id:
        query = query.filter(Submission.exercise_id == exercise_id)
    if exercise_title:
        query = query.filter(Exercise.title.ilike(f"%{exercise_title}%"))
    if subject_id:
        query = query.filter(Subject.id == subject_id)
    if subject_name:
        query = query.filter(Subject.name.ilike(f"%{subject_name}%"))
    if course_offering_id:
        query = query.filter(Exercise.course_offering_id == course_offering_id)
    if language_id:
        query = query.filter(Submission.language_id == language_id)
    if language_name:
        query = query.filter(ProgrammingLanguage.name.ilike(f"%{language_name}%"))
    if status:
        query = query.filter(Submission.status == status)
    if min_score is not None:
        query = query.filter(Evaluation.score >= min_score)
    if max_score is not None:
        query = query.filter(Evaluation.score <= max_score)
    if passed is not None:
        if passed:
            query = query.filter(Evaluation.score >= 60)
        else:
            query = query.filter(Evaluation.score < 60)
    if date_from:
        query = query.filter(Submission.submitted_at >= date_from)
    if date_to:
        query = query.filter(Submission.submitted_at <= date_to)
    if has_evaluation is not None:
        if has_evaluation:
            query = query.filter(Evaluation.id.isnot(None))
        else:
            query = query.filter(Evaluation.id.is_(None))
    
    total = query.count()
    
    order_column_map = {
        "student_name": User.name,
        "exercise_title": Exercise.title,
        "score": Evaluation.score,
        "status": Submission.status,
        "submitted_at": Submission.submitted_at,
        "id": Submission.id
    }
    order_column = order_column_map.get(order_by, Submission.submitted_at)
    
    if order_desc:
        query = query.order_by(order_column.desc())
    else:
        query = query.order_by(order_column.asc())
    
    submissions = query.offset(offset).limit(limit).all()
    
    result = []
    for sub in submissions:
        result.append({
            "id": sub.id,
            "student_id": sub.student_id,
            "student_name": sub.student.name if sub.student else None,
            "student_email": sub.student.email if sub.student else None,
            "exercise_id": sub.exercise_id,
            "exercise_title": sub.exercise.title if sub.exercise else None,
            "subject_id": sub.exercise.course_offering.subject_id if sub.exercise and sub.exercise.course_offering else None,
            "subject_name": sub.exercise.course_offering.subject.name if sub.exercise and sub.exercise.course_offering and sub.exercise.course_offering.subject else None,
            "course_offering_id": sub.exercise.course_offering_id if sub.exercise else None,
            "language_id": sub.language_id,
            "language_name": sub.language.name if sub.language else None,
            "code_preview": sub.code[:200] + "..." if len(sub.code) > 200 else sub.code,
            "status": sub.status,
            "submitted_at": sub.submitted_at.isoformat() if sub.submitted_at else None,
            "evaluation": {
                "id": sub.evaluation.id if sub.evaluation else None,
                "score": float(sub.evaluation.score) if sub.evaluation and sub.evaluation.score is not None else None,
                "passed_tests": sub.evaluation.passed_tests if sub.evaluation else None,
                "total_tests": sub.evaluation.total_tests if sub.evaluation else None,
                "passed": (sub.evaluation.score >= 60) if sub.evaluation and sub.evaluation.score is not None else None
            } if sub.evaluation else None
        })
    
    return {
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": offset + limit < total,
        "items": result,
        "filters_applied": {
            "student_id": student_id,
            "student_name": student_name,
            "exercise_id": exercise_id,
            "exercise_title": exercise_title,
            "subject_id": subject_id,
            "subject_name": subject_name,
            "course_offering_id": course_offering_id,
            "language_id": language_id,
            "language_name": language_name,
            "status": status,
            "min_score": min_score,
            "max_score": max_score,
            "passed": passed,
            "date_from": date_from.isoformat() if date_from else None,
            "date_to": date_to.isoformat() if date_to else None,
            "has_evaluation": has_evaluation
        }
    }


@router.get("/export")
def export_submissions_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    student_id: Optional[int] = Query(None),
    exercise_id: Optional[int] = Query(None),
    subject_id: Optional[int] = Query(None),
    date_from: Optional[datetime] = Query(None),
    date_to: Optional[datetime] = Query(None),
    min_score: Optional[float] = Query(None),
    max_score: Optional[float] = Query(None)
):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(403, "No autorizado para exportar")
    
    import csv
    from io import StringIO
    
    query = db.query(Submission).join(
        User, Submission.student_id == User.id
    ).join(
        Exercise, Submission.exercise_id == Exercise.id
    ).join(
        CourseOffering, Exercise.course_offering_id == CourseOffering.id
    ).join(
        Subject, CourseOffering.subject_id == Subject.id
    ).outerjoin(
        Evaluation, Submission.id == Evaluation.submission_id
    )
    
    if current_user.role == "teacher":
        teacher_offerings = db.query(CourseOffering.id).join(
            TeacherAssignment, CourseOffering.id == TeacherAssignment.course_offering_id
        ).filter(
            TeacherAssignment.professor_id == current_user.id
        ).subquery()
        query = query.filter(Exercise.course_offering_id.in_(teacher_offerings))
    
    if student_id:
        query = query.filter(Submission.student_id == student_id)
    if exercise_id:
        query = query.filter(Submission.exercise_id == exercise_id)
    if subject_id:
        query = query.filter(Subject.id == subject_id)
    if date_from:
        query = query.filter(Submission.submitted_at >= date_from)
    if date_to:
        query = query.filter(Submission.submitted_at <= date_to)
    if min_score:
        query = query.filter(Evaluation.score >= min_score)
    if max_score:
        query = query.filter(Evaluation.score <= max_score)
    
    submissions = query.all()
    
    output = StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Estudiante", "Email", "Ejercicio", "Materia", "Fecha Envío", "Estado", "Lenguaje", "Puntuación", "Tests Pasados", "Tests Totales", "Evaluado"])
    
    for sub in submissions:
        writer.writerow([
            sub.id,
            sub.student.name if sub.student else "",
            sub.student.email if sub.student else "",
            sub.exercise.title if sub.exercise else "",
            sub.exercise.course_offering.subject.name if sub.exercise and sub.exercise.course_offering and sub.exercise.course_offering.subject else "",
            sub.submitted_at.isoformat() if sub.submitted_at else "",
            sub.status,
            sub.language.name if sub.language else "",
            float(sub.evaluation.score) if sub.evaluation and sub.evaluation.score is not None else "",
            sub.evaluation.passed_tests if sub.evaluation else "",
            sub.evaluation.total_tests if sub.evaluation else "",
            "Sí" if sub.evaluation else "No"
        ])
    
    from fastapi.responses import Response
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=submissions_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"}
    )


@router.post("/run-tests")
def run_tests_only(
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    print(f"[RUN-TESTS] ========================================")
    print(f"[RUN-TESTS] Iniciando run_tests_only")
    print(f"[RUN-TESTS] exercise_id: {data.exercise_id}")
    print(f"[RUN-TESTS] language_id: {data.language_id}")
    print(f"[RUN-TESTS] code length: {len(data.code)}")
    print(f"[RUN-TESTS] code content: {data.code[:100]}")
    print(f"[RUN-TESTS] ========================================")
    
    # ==========================================
    # 1. VERIFICAR EJERCICIO
    # ==========================================
    exercise = db.query(Exercise).filter(
        Exercise.id == data.exercise_id
    ).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    print(f"[RUN-TESTS] ✅ Ejercicio encontrado: {exercise.title}")

    # ==========================================
    # 2. CARGAR ARGUMENTOS
    # ==========================================
    from ..models.problem_argument_model import ProblemArgument
    arguments = db.query(ProblemArgument).filter(
        ProblemArgument.problem_id == data.exercise_id
    ).order_by(ProblemArgument.position).all()
    
    print(f"[RUN-TESTS] Argumentos encontrados: {len(arguments)}")
    for arg in arguments:
        print(f"[RUN-TESTS]   - {arg.name}: {arg.type_name} (posición {arg.position})")
    
    exercise.arguments = arguments

    # ==========================================
    # 3. VERIFICAR LENGUAJE PERMITIDO
    # ==========================================
    allowed_language = db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == data.exercise_id,
        ExerciseLanguage.language_id == data.language_id
    ).first()
    if not allowed_language:
        raise HTTPException(400, "Language not allowed for this exercise")
    print(f"[RUN-TESTS] ✅ Lenguaje permitido")

    # ==========================================
    # 4. OBTENER TEST CASES
    # ==========================================
    test_cases = db.query(TestCase).filter(
        TestCase.exercise_id == data.exercise_id
    ).all()
    if not test_cases:
        raise HTTPException(404, "No test cases found for this exercise")
    print(f"[RUN-TESTS] ✅ Test cases encontrados: {len(test_cases)}")

    # ==========================================
    # 5. DETERMINAR LENGUAJE
    # ==========================================
    language_name = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.id == data.language_id
    ).first()
    language_map = {"python": "python", "cpp": "cpp", "c++": "cpp", "java": "java"}
    language = language_map.get(language_name.name.lower(), "cpp")
    
    print(f"[RUN-TESTS] Lenguaje detectado: {language} (original: {language_name.name})")
    print(f"[RUN-TESTS] Modo evaluación: {exercise.evaluation_mode}")

    try:
        if exercise.evaluation_mode == "function" or exercise.evaluation_mode == "function_calls":
            # ==========================================
            # 6. PREPARAR TESTS PARA EL RUNNER
            # ==========================================
            tests_for_runner = [
                {
                    "id": tc.id,
                    "input_data": tc.input_data,
                    "expected_output": tc.expected_output
                }
                for tc in test_cases
            ]
            print(f"[RUN-TESTS] ✅ Tests preparados: {len(tests_for_runner)}")
            
            # ==========================================
            # 7. GENERAR EL WRAPPER
            # ==========================================
            print(f"[RUN-TESTS] ⚠️ PUNTO 1: Importando WrapperGeneratorService...")
            from ..services.wrapper_generator_service import WrapperGeneratorService
            print(f"[RUN-TESTS] ⚠️ PUNTO 2: Importación exitosa")
            
            wrapper_gen = WrapperGeneratorService()
            print(f"[RUN-TESTS] ⚠️ PUNTO 3: WrapperGeneratorService creado")
            
            print(f"[RUN-TESTS] 🔧 Generando wrapper para {language}...")
            wrapped_code = wrapper_gen.generate(
                language=language,
                user_code=data.code,
                problem=exercise
            )
            print(f"[RUN-TESTS] ⚠️ PUNTO 4: Wrapper generado")
            
            # ==========================================
            # 8. LOGS DETALLADOS DEL WRAPPER
            # ==========================================
            print(f"[RUN-TESTS] ========================================")
            print(f"[RUN-TESTS] 📦 WRAPPER GENERADO")
            print(f"[RUN-TESTS] Tamaño total: {len(wrapped_code)} bytes")
            print(f"[RUN-TESTS] ¿Contiene '#include'? {'✅' if '#include' in wrapped_code else '❌'}")
            print(f"[RUN-TESTS] ¿Contiene 'int main()'? {'✅' if 'int main()' in wrapped_code else '❌'}")
            print(f"[RUN-TESTS] ¿Contiene 'solution'? {'✅' if 'solution' in wrapped_code else '❌'}")
            print(f"[RUN-TESTS] PRIMEROS 800 caracteres:")
            print(wrapped_code[:800])
            print(f"[RUN-TESTS] ...")
            print(f"[RUN-TESTS] ÚLTIMOS 200 caracteres:")
            print(wrapped_code[-200:])
            print(f"[RUN-TESTS] ========================================")
            
            # ==========================================
            # 9. GUARDAR WRAPPER A DISCO PARA DEBUG
            # ==========================================
            try:
                with open(f"debug_wrapper_{language}_{data.exercise_id}.cpp", "w") as f:
                    f.write(wrapped_code)
                print(f"[RUN-TESTS] ✅ Wrapper guardado en debug_wrapper_{language}_{data.exercise_id}.cpp")
            except Exception as e:
                print(f"[RUN-TESTS] ⚠️ No se pudo guardar wrapper a disco: {e}")
            
            # ==========================================
            # 10. LLAMAR A evaluate_function_code
            # ==========================================
            print(f"[RUN-TESTS] Llamando a evaluate_function_code...")
            print(f"[RUN-TESTS]   - submission_id: temp_{user.id}_{data.exercise_id}")
            print(f"[RUN-TESTS]   - wrapped_code size: {len(wrapped_code)}")
            print(f"[RUN-TESTS]   - tests: {len(tests_for_runner)}")
            print(f"[RUN-TESTS]   - language: {language}")
            
            result = evaluate_function_code(
                VM_HOST, VM_USER, VM_PASS,
                f"temp_{user.id}_{data.exercise_id}",
                wrapped_code,
                tests_for_runner,
                problem=exercise,
                language=language
            )
            
            print(f"[RUN-TESTS] evaluate_function_code retornó")
            print(f"[RUN-TESTS] Resultado: passed={result['passed']}/{result['total']}, score={result['score']}")
            
            # ==========================================
            # 11. CONSTRUIR RESPUESTA
            # ==========================================
            return {
                "success": True,
                "passed_tests": result["passed"],
                "total_tests": result["total"],
                "score": result["score"],
                "test_results": [
                    {
                        "test_case_id": r["test_case_id"],
                        "passed": r["passed"],
                        "expected_output": r["expected_output"],
                        "actual_output": r["actual_output"],
                        "error": r.get("error", ""),
                        "execution_time": r.get("execution_time", 0)
                    }
                    for r in result["results"]
                ]
            }
        else:
            # ==========================================
            # MODO LEGACY
            # ==========================================
            print(f"[RUN-TESTS] Usando modo legacy (no wrapper)")
            tests_for_runner = [
                {"id": tc.id, "input": tc.input_data, "expected_output": tc.expected_output}
                for tc in test_cases
            ]
            result = evaluate_code(
                VM_HOST, VM_USER, VM_PASS,
                f"temp_{user.id}_{data.exercise_id}",
                data.code,
                tests_for_runner,
                language=language
            )
            return {
                "success": True,
                "passed_tests": result["passed"],
                "total_tests": result["total"],
                "score": result["score"],
                "test_results": [
                    {
                        "test_case_id": r["test_case_id"],
                        "passed": r["passed"],
                        "expected_output": r["expected_output"],
                        "actual_output": r["actual_output"],
                        "error": r.get("error", ""),
                        "execution_time": r.get("execution_time", 0)
                    }
                    for r in result["results"]
                ]
            }
    except Exception as e:
        print(f"[RUN-TESTS] Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            "success": False,
            "error": str(e),
            "passed_tests": 0,
            "total_tests": len(test_cases) if test_cases else 0,
            "test_results": []
        }
    
# ==========================================
# RUTAS CON PATH PARAMS ESPECÍFICOS
# ==========================================

@router.get("/students/{student_id}/avg-best-notes", response_model=dict)
def get_avg_best_notes_by_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "student" and current_user.id != student_id:
        raise HTTPException(403, "No puedes ver las notas de otro estudiante")

    submissions = db.query(Submission).filter(
        Submission.student_id == student_id
    ).all()

    if not submissions:
        return {"student_id": student_id, "average_best_score": None}

    best_scores = {}
    for sub in submissions:
        evaluation = db.query(Evaluation).filter(
            Evaluation.submission_id == sub.id
        ).first()
        if not evaluation or evaluation.score is None:
            continue
        exercise_id = sub.exercise_id
        score = float(evaluation.score)
        if exercise_id not in best_scores:
            best_scores[exercise_id] = score
        else:
            best_scores[exercise_id] = max(best_scores[exercise_id], score)

    if not best_scores:
        return {"student_id": student_id, "average_best_score": None}

    avg = sum(best_scores.values()) / len(best_scores)
    return {
        "student_id": student_id,
        "average_best_score": avg,
        "exercises_count": len(best_scores)
    }


@router.get("/exercise/{exercise_id}", response_model=list[SubmissionResponse])
def get_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    if user.role not in ["teacher", "admin"]:
        raise HTTPException(403, "Not authorized")

    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if user.role == "teacher":
        if not teacher_has_access(user.id, exercise, db):
            raise HTTPException(403, "Not authorized")

    return db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).all()


@router.get("/by-visibility/{is_visible}")
def get_exercises_by_visibility(
    is_visible: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Exercise).filter(Exercise.visibility == is_visible)
    
    if current_user.role == "teacher":
        my_offering_ids = db.query(TeacherAssignment.course_offering_id).filter(
            TeacherAssignment.professor_id == current_user.id
        ).subquery()
        query = query.filter(Exercise.course_offering_id.in_(my_offering_ids))
    elif current_user.role == "student":
        if not is_visible:
            return []
    
    exercises = query.all()
    
    result = []
    for exercise in exercises:
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == exercise.course_offering_id
        ).first()
        
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description[:200] + "..." if len(exercise.description) > 200 else exercise.description,
            "visibility": exercise.visibility,
            "evaluation_mode": exercise.evaluation_mode,
            "deadline": exercise.deadline,
            "course_offering_id": exercise.course_offering_id,
            "subject_name": offering.subject.name if offering and offering.subject else None,
            "academic_year": f"{offering.academic_year.start_year}-{offering.academic_year.end_year}" if offering and offering.academic_year else None,
            "has_solution": exercise.solution is not None,
            "test_cases_count": len(exercise.test_cases) if exercise.test_cases else 0
        })
    
    return result


# ==========================================
# RUTAS CON {submission_id} (deben ir al final)
# ==========================================

@router.get("/{submission_id}/status")
def get_submission_status(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtener el estado detallado de una submission.
    Útil para mostrar una barra de carga en el frontend.
    
    Estados posibles:
    - pending: Esperando en cola
    - running_tests: Evaluando tests
    - evaluating_rubric: Evaluando rúbrica (post-tests)
    - generating_pdf: Generando PDF
    - completed: Completado
    - error: Error
    """
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        raise HTTPException(404, "Submission not found")
    
    # Verificar permisos
    allowed = False
    if current_user.role == "admin":
        allowed = True
    elif current_user.role == "student":
        allowed = submission.student_id == current_user.id
    elif current_user.role == "teacher":
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        if exercise:
            assignment = db.query(TeacherAssignment).filter(
                TeacherAssignment.professor_id == current_user.id,
                TeacherAssignment.course_offering_id == exercise.course_offering_id
            ).first()
            allowed = assignment is not None
    
    if not allowed:
        raise HTTPException(403, "Not authorized")
    
    # Obtener evaluación
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    
    # Verificar si hay rúbrica
    exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
    has_rubric = False
    rubric_status = None
    if exercise:
        rubric = db.query(Rubric).filter(Rubric.exercise_id == exercise.id).first()
        has_rubric = rubric is not None
        if has_rubric and evaluation:
            rubric_scores = evaluation.rubric_scores
            if rubric_scores and len(rubric_scores) > 0:
                rubric_status = "completed"
            elif evaluation.feedback:
                rubric_status = "completed"
            else:
                rubric_status = "pending"
    
    # Verificar si PDF está generado
    pdf_ready = False
    pdf_path = f"feedback_pdfs/submission_{submission_id}.pdf"
    if evaluation and evaluation.feedback_pdf and os.path.exists(evaluation.feedback_pdf):
        pdf_ready = True
    elif os.path.exists(pdf_path):
        pdf_ready = True
    
    # Determinar estado detallado
    detailed_status = submission.status
    
    if submission.status == "pending":
        detailed_status = "pending"
    elif submission.status == "processing":
        if evaluation and evaluation.passed_tests is not None:
            if has_rubric and rubric_status == "pending":
                detailed_status = "evaluating_rubric"
            elif (has_rubric and rubric_status == "completed") or not has_rubric:
                if not pdf_ready:
                    detailed_status = "generating_pdf"
                else:
                    detailed_status = "completed"
            else:
                detailed_status = "running_tests"
        else:
            detailed_status = "running_tests"
    elif submission.status == "evaluated":
        if has_rubric and rubric_status == "pending":
            detailed_status = "evaluating_rubric"
        elif (has_rubric and rubric_status == "completed") or not has_rubric:
            if not pdf_ready:
                detailed_status = "generating_pdf"
            else:
                detailed_status = "completed"
        else:
            detailed_status = "completed"
    elif submission.status == "error":
        detailed_status = "error"
    
    # Construir respuesta
    response = {
        "submission_id": submission_id,
        "status": submission.status,
        "detailed_status": detailed_status,
        "has_rubric": has_rubric,
        "pdf_ready": pdf_ready,
        "created_at": submission.submitted_at.isoformat() if submission.submitted_at else None,
    }
    
    # Agregar información de evaluación si existe
    if evaluation:
        response["evaluation"] = {
            "score": float(evaluation.score) if evaluation.score is not None else None,
            "passed_tests": evaluation.passed_tests,
            "total_tests": evaluation.total_tests,
            "progress_percentage": (evaluation.passed_tests / evaluation.total_tests * 100) if evaluation.total_tests > 0 else 0
        }
    
    # Agregar mensajes según el estado
    if detailed_status == "pending":
        response["message"] = "En cola de procesamiento..."
        response["progress"] = 0
    elif detailed_status == "running_tests":
        response["message"] = "Ejecutando tests..."
        if evaluation and evaluation.total_tests:
            response["progress"] = min(25 + int((evaluation.passed_tests or 0) / evaluation.total_tests * 50), 70)
        else:
            response["progress"] = 25
    elif detailed_status == "evaluating_rubric":
        response["message"] = "Evaluando con rúbrica..."
        response["progress"] = 80
    elif detailed_status == "generating_pdf":
        response["message"] = "Generando PDF..."
        response["progress"] = 95
    elif detailed_status == "completed":
        response["message"] = "Evaluación completada"
        response["progress"] = 100
    elif submission.status == "error":
        response["message"] = "Error en la evaluación"
        response["progress"] = 0
    
    return response


@router.websocket("/ws/{submission_id}")
async def websocket_evaluation_status(
    websocket: WebSocket,
    submission_id: int,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket para recibir actualizaciones en tiempo real del estado de evaluación.
    Conectar a: ws://localhost:8000/submissions/ws/123?token=eyJ...
    """
    # Autenticar
    from ..security.jwt_handler import decode_token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id = payload["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    # Verificar que el usuario tiene acceso a esta submission
    submission = db.query(Submission).filter(Submission.id == submission_id).first()
    if not submission:
        await websocket.close(code=1008, reason="Submission not found")
        return
    
    allowed = False
    if user.role == "admin":
        allowed = True
    elif user.role == "student":
        allowed = submission.student_id == user.id
    elif user.role == "teacher":
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        if exercise:
            assignment = db.query(TeacherAssignment).filter(
                TeacherAssignment.professor_id == user.id,
                TeacherAssignment.course_offering_id == exercise.course_offering_id
            ).first()
            allowed = assignment is not None
    
    if not allowed:
        await websocket.close(code=1008, reason="Not authorized")
        return
    
    await evaluation_status_manager.connect(websocket, submission_id)
    
    try:
        # Enviar estado inicial
        initial_status = get_submission_status_sync(db, submission_id, user)
        await websocket.send_json(initial_status)
        
        # Mantener conexión abierta esperando actualizaciones
        while True:
            # Recibir ping para mantener conexión viva
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong"})
            
    except WebSocketDisconnect:
        evaluation_status_manager.disconnect(submission_id)


@router.get("/{submission_id}", response_model=SubmissionResponse)
def get_one(
    submission_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if user.role == "admin":
        return submission
    if user.id == submission.student_id:
        return submission
    if user.role == "teacher":
        exercise = db.query(Exercise).filter(
            Exercise.id == submission.exercise_id
        ).first()
        if teacher_has_access(user.id, exercise, db):
            return submission

    raise HTTPException(403, "Not authorized")


@router.post("/", response_model=SubmissionResponse)
def create(
    data: SubmissionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    logger.info(f"Nueva submission - Usuario: {user.id}, Ejercicio: {data.exercise_id}, Lenguaje: {data.language_id}")
    if user.role != "student":
        raise HTTPException(403, "Only students can submit")

    exercise = db.query(Exercise).filter(
        Exercise.id == data.exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if exercise.visibility is False:
        raise HTTPException(403, "Exercise hidden")

    allowed_language = db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == data.exercise_id,
        ExerciseLanguage.language_id == data.language_id
    ).first()

    if not allowed_language:
        raise HTTPException(400, "Language not allowed")

    # Validar que el código tiene función 'solution' (para modo función)
    if exercise.evaluation_mode == "function":
        if 'def solution' not in data.code and 'solution(' not in data.code:
            raise HTTPException(400, "Tu código debe definir una función llamada 'solution'")

    submission = Submission(
        student_id=user.id,
        exercise_id=data.exercise_id,
        language_id=data.language_id,
        code=data.code,
        status="processing"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    # Usar la tarea adecuada según el modo de evaluación
    if exercise.evaluation_mode == "function":
        process_submission_function_task.delay(submission.id)
    else:
        process_submission_task.delay(submission.id)
    logger.info(f"Submission creada con ID {submission.id} - Estado: processing")
    return submission
    


@router.patch("/{submission_id}", response_model=SubmissionResponse)
def patch(
    submission_id: int,
    data: SubmissionPatch,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(submission, key, value)

    db.commit()
    db.refresh(submission)

    return submission


@router.delete("/{submission_id}")
def delete(
    submission_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    db.delete(submission)
    db.commit()

    return {"message": "Submission deleted"}