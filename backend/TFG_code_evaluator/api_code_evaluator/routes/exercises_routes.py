from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .academic_years_routes import AcademicYear
from .subjects_routes import Subject

from ..bd.connection import get_db
from ..models.rubric_model import Rubric
from ..models.programming_languages_model import ProgrammingLanguage

from ..models.exercise_model import Exercise
from ..models.course_offerings_model import CourseOffering
from ..models.teacher_assignments_model import TeacherAssignment
from ..models.user_model import User
from ..models.submissions_model import Submission
from ..models.evaluation_model import Evaluation
from ..models.exercise_languange_model import ExerciseLanguage
from ..models.test_cases_model import TestCase

from ..schemas.exercise_schema import (
    ExerciseCreate,
    ExercisePatch,
    ExerciseResponse
)

from ..dependencies.auth_dependencies import (
    get_current_user,
    admin_required
)

router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"]
)


def teacher_has_access(db: Session, user_id: int, offering_id: int):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.professor_id == user_id,
        TeacherAssignment.course_offering_id == offering_id
    ).first()
    return assignment is not None


# GET ALL
@router.get("/", response_model=list[ExerciseResponse])
def get_all(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        return db.query(Exercise).all()
    if current_user.role == "teacher":
        return (
            db.query(Exercise)
            .join(
                CourseOffering,
                Exercise.course_offering_id == CourseOffering.id
            )
            .join(
                TeacherAssignment,
                TeacherAssignment.course_offering_id == CourseOffering.id
            )
            .filter(
                TeacherAssignment.professor_id == current_user.id
            )
            .all()
        )
    return db.query(Exercise).filter(
        Exercise.visibility == True
    ).all()


# GET ONE
@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_one(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if current_user.role == "admin":
        return exercise
    if current_user.role == "teacher":
        if teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            return exercise
        raise HTTPException(403, "Not authorized")
    if not exercise.visibility:
        raise HTTPException(403, "Exercise not visible")
    return exercise


# GET BY OFFERING
@router.get("/offering/{offering_id}", response_model=list[ExerciseResponse])
def get_by_offering(
    offering_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(Exercise).filter(
        Exercise.course_offering_id == offering_id
    )

    if current_user.role == "student":
        query = query.filter(Exercise.visibility == True)
    elif current_user.role == "teacher":
        if not teacher_has_access(
            db,
            current_user.id,
            offering_id
        ):
            raise HTTPException(403, "Not authorized")

    return query.all()


# CREATE - ACTUALIZADO con evaluation_mode
@router.post("/", response_model=ExerciseResponse)
def create(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    offering = db.query(CourseOffering).filter(
        CourseOffering.id == data.course_offering_id
    ).first()

    if not offering:
        raise HTTPException(404, "Course offering not found")

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized")
        if not teacher_has_access(
            db,
            current_user.id,
            data.course_offering_id
        ):
            raise HTTPException(403, "Not your course offering")

    # Crear ejercicio con evaluation_mode (si viene en el schema)
    exercise_data = data.model_dump()
    exercise = Exercise(**exercise_data)

    db.add(exercise)
    db.commit()
    db.refresh(exercise)

    return exercise


# UPDATE
@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update(
    exercise_id: int,
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized")
        if not teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            raise HTTPException(403, "Not your exercise")

    for key, value in data.model_dump().items():
        setattr(exercise, key, value)

    db.commit()
    db.refresh(exercise)

    return exercise


# PATCH
@router.patch("/{exercise_id}", response_model=ExerciseResponse)
def patch(
    exercise_id: int,
    data: ExercisePatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized")
        if not teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            raise HTTPException(403, "Not your exercise")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(exercise, key, value)

    db.commit()
    db.refresh(exercise)

    return exercise


# DELETE
@router.delete("/{exercise_id}")
def delete(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized - Solo administradores o profesores pueden eliminar ejercicios")
        if not teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            raise HTTPException(403, "Not authorized - No tienes permiso para eliminar este ejercicio")
    
    submissions_count = db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).count()
    
    if submissions_count > 0:
        raise HTTPException(
            409,
            detail=f"No se puede eliminar el ejercicio porque tiene {submissions_count} submission(s) asociada(s)."
        )
    
    evaluations_count = db.query(Evaluation).join(
        Submission, Evaluation.submission_id == Submission.id
    ).filter(
        Submission.exercise_id == exercise_id
    ).count()
    
    if evaluations_count > 0:
        raise HTTPException(
            409,
            detail=f"No se puede eliminar el ejercicio porque tiene {evaluations_count} evaluación(es) asociada(s)."
        )
    
    db.delete(exercise)
    db.commit()

    return {
        "message": "Exercise deleted successfully",
        "exercise_id": exercise_id,
        "title": exercise.title
    }


# ==========================================
# GET SUBMISSIONS COUNT
# ==========================================
@router.get("/{exercise_id}/submissions-count")
def get_exercise_submissions_count(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(403, "Not authorized")
    
    if current_user.role == "teacher":
        if not teacher_has_access(db, current_user.id, exercise.course_offering_id):
            raise HTTPException(403, "Not authorized")
    
    submissions_count = db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).count()
    
    return {
        "exercise_id": exercise_id,
        "title": exercise.title,
        "submissions_count": submissions_count,
        "can_be_deleted": submissions_count == 0
    }


# ==========================================
# GET EXERCISES BY SUBJECT ID
# ==========================================
@router.get("/exercises/subject/{subject_id}")
def get_exercises_by_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    subject = db.query(Subject).filter(Subject.id == subject_id).first()
    if not subject:
        raise HTTPException(404, f"Subject with id {subject_id} not found")
    
    offerings = db.query(CourseOffering).filter(
        CourseOffering.subject_id == subject_id
    ).all()
    
    offering_ids = [offering.id for offering in offerings]
    
    if not offering_ids:
        return []
    
    query = db.query(Exercise).filter(
        Exercise.course_offering_id.in_(offering_ids)
    )
    
    if current_user.role == "student":
        query = query.filter(Exercise.visibility == True)
    elif current_user.role == "teacher":
        has_access = False
        for offering_id in offering_ids:
            if teacher_has_access(db, current_user.id, offering_id):
                has_access = True
                break
        if not has_access:
            raise HTTPException(403, "Not authorized to view exercises for this subject")
    
    exercises = query.all()
    
    result = []
    for exercise in exercises:
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == exercise.course_offering_id
        ).first()
        
        academic_year = None
        if offering:
            year = db.query(AcademicYear).filter(
                AcademicYear.id == offering.academic_year_id
            ).first()
            if year:
                academic_year = f"{year.start_year}-{year.end_year}"
        
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description,
            "deadline": exercise.deadline,
            "course_offering_id": exercise.course_offering_id,
            "visibility": exercise.visibility,
            "evaluation_mode": exercise.evaluation_mode,  # 🆕 AGREGADO
            "academic_year": academic_year,
            "has_solution": exercise.solution is not None,
            "test_cases_count": len(exercise.test_cases) if exercise.test_cases else 0
        })
    
    return result


# ==========================================
# GET MY ATTEMPTS
# ==========================================
@router.get("/exercise/{exercise_id}/my-attempts")
def get_my_attempts(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["student", "teacher", "admin"]:
        raise HTTPException(403, "Not authorized")
    
    submissions = db.query(Submission).filter(
        Submission.exercise_id == exercise_id,
        Submission.student_id == current_user.id
    ).order_by(Submission.submitted_at.desc()).all()
    
    result = []
    for sub in submissions:
        result.append({
            "id": sub.id,
            "submitted_at": sub.submitted_at,
            "status": sub.status,
            "evaluation": {
                "score": sub.evaluation.score if sub.evaluation else None,
                "passed_tests": sub.evaluation.passed_tests if sub.evaluation else None,
                "total_tests": sub.evaluation.total_tests if sub.evaluation else None
            } if sub.evaluation else None,
            "code_preview": sub.code[:200] + "..." if len(sub.code) > 200 else sub.code
        })
    
    return result


# ==========================================
# DUPLICATE EXERCISE
# ==========================================
@router.post("/{exercise_id}/duplicate")
def duplicate_exercise(
    exercise_id: int,
    target_course_offering_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    original_exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()
    
    if not original_exercise:
        raise HTTPException(404, "Exercise not found")
    
    target_offering = db.query(CourseOffering).filter(
        CourseOffering.id == target_course_offering_id
    ).first()
    
    if not target_offering:
        raise HTTPException(404, "Target course offering not found")
    
    if current_user.role != "admin":
        teacher_in_target = db.query(TeacherAssignment).filter(
            TeacherAssignment.course_offering_id == target_course_offering_id,
            TeacherAssignment.professor_id == current_user.id
        ).first()
        
        if not teacher_in_target:
            raise HTTPException(403, "No tienes permiso para añadir ejercicios a esta course offering")
    
    existing_exercise = db.query(Exercise).filter(
        Exercise.course_offering_id == target_course_offering_id,
        Exercise.title == original_exercise.title
    ).first()
    
    if existing_exercise:
        raise HTTPException(400, f"Ya existe un ejercicio con título '{original_exercise.title}' en la course offering destino")
    
    new_exercise = Exercise(
        title=original_exercise.title,
        description=original_exercise.description,
        deadline=original_exercise.deadline,
        course_offering_id=target_course_offering_id,
        solution=original_exercise.solution,
        visibility=original_exercise.visibility,
        evaluation_mode=original_exercise.evaluation_mode  # 🆕 COPIAR evaluation_mode
    )
    db.add(new_exercise)
    db.flush()
    
    # Duplicar test cases
    test_cases = db.query(TestCase).filter(
        TestCase.exercise_id == exercise_id
    ).all()
    
    test_cases_created = []
    for tc in test_cases:
        new_tc = TestCase(
            exercise_id=new_exercise.id,
            expected_output=tc.expected_output,
            input_data=tc.input_data,  # 🆕 COPIAR JSON
            is_hidden=tc.is_hidden
        )
        db.add(new_tc)
        test_cases_created.append({
            "original_id": tc.id,
            "new_id": new_tc.id
        })
    
    # Duplicar rúbrica
    rubric = db.query(Rubric).filter(
        Rubric.exercise_id == exercise_id
    ).first()
    
    rubric_created = None
    if rubric:
        new_rubric = Rubric(
            exercise_id=new_exercise.id,
            criteria=rubric.criteria
        )
        db.add(new_rubric)
        db.flush()
        rubric_created = {
            "original_id": rubric.id,
            "new_id": new_rubric.id
        }
    
    # Duplicar lenguajes permitidos
    languages = db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == exercise_id
    ).all()
    
    languages_created = []
    for lang in languages:
        existing_lang = db.query(ProgrammingLanguage).filter(
            ProgrammingLanguage.id == lang.language_id
        ).first()
        
        if existing_lang:
            new_lang = ExerciseLanguage(
                exercise_id=new_exercise.id,
                language_id=lang.language_id
            )
            db.add(new_lang)
            languages_created.append({
                "language_id": lang.language_id,
                "language_name": existing_lang.name
            })
    
    db.commit()
    db.refresh(new_exercise)
    
    return {
        "message": "Exercise duplicated successfully",
        "original_exercise": {
            "id": original_exercise.id,
            "title": original_exercise.title,
            "course_offering_id": original_exercise.course_offering_id,
            "evaluation_mode": original_exercise.evaluation_mode
        },
        "new_exercise": {
            "id": new_exercise.id,
            "title": new_exercise.title,
            "course_offering_id": new_exercise.course_offering_id,
            "evaluation_mode": new_exercise.evaluation_mode,
            "target_offering_subject": target_offering.subject.name if target_offering.subject else None,
            "target_academic_year": f"{target_offering.academic_year.start_year}-{target_offering.academic_year.end_year}" if target_offering.academic_year else None
        },
        "statistics": {
            "test_cases_duplicated": len(test_cases_created),
            "languages_duplicated": len(languages_created),
            "has_rubric": rubric_created is not None
        }
    }


# ==========================================
# GET EXERCISES AVAILABLE FOR DUPLICATE
# ==========================================
@router.get("/available-for-duplicate")
def get_exercises_available_for_duplicate(
    target_course_offering_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role == "admin":
        exercises = db.query(Exercise).all()
    elif current_user.role == "teacher":
        exercises = db.query(Exercise).all()
    else:
        raise HTTPException(403, "Not authorized")
    
    result = []
    for exercise in exercises:
        offering = db.query(CourseOffering).filter(
            CourseOffering.id == exercise.course_offering_id
        ).first()
        
        already_exists = False
        if target_course_offering_id:
            existing = db.query(Exercise).filter(
                Exercise.course_offering_id == target_course_offering_id,
                Exercise.title == exercise.title
            ).first()
            already_exists = existing is not None
        
        result.append({
            "id": exercise.id,
            "title": exercise.title,
            "description": exercise.description[:200] + "..." if len(exercise.description) > 200 else exercise.description,
            "deadline": exercise.deadline,
            "visibility": exercise.visibility,
            "evaluation_mode": exercise.evaluation_mode,  # 🆕 AGREGADO
            "has_solution": exercise.solution is not None,
            "test_cases_count": db.query(TestCase).filter(TestCase.exercise_id == exercise.id).count(),
            "has_rubric": db.query(Rubric).filter(Rubric.exercise_id == exercise.id).first() is not None,
            "languages": [
                {"id": lang.language_id, "name": lang.language.name}
                for lang in db.query(ExerciseLanguage).filter(ExerciseLanguage.exercise_id == exercise.id).all()
                if lang.language
            ],
            "source_offering": {
                "id": offering.id if offering else None,
                "subject_name": offering.subject.name if offering and offering.subject else None,
                "academic_year": f"{offering.academic_year.start_year}-{offering.academic_year.end_year}" if offering and offering.academic_year else None
            },
            "already_in_destination": already_exists
        })
    
    return result


# ==========================================
# GET MY COURSE OFFERINGS
# ==========================================
@router.get("/my-course-offerings")
def get_my_course_offerings_for_duplicate(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(403, "Not authorized")
    
    query = db.query(CourseOffering)
    
    if current_user.role == "teacher":
        query = query.join(
            TeacherAssignment, CourseOffering.id == TeacherAssignment.course_offering_id
        ).filter(
            TeacherAssignment.professor_id == current_user.id
        )
    
    offerings = query.all()
    
    result = []
    for offering in offerings:
        current_exercises_count = db.query(Exercise).filter(
            Exercise.course_offering_id == offering.id
        ).count()
        
        result.append({
            "id": offering.id,
            "subject_id": offering.subject_id,
            "subject_name": offering.subject.name if offering.subject else None,
            "academic_year": f"{offering.academic_year.start_year}-{offering.academic_year.end_year}" if offering.academic_year else None,
            "current_exercises_count": current_exercises_count
        })
    
    return result


# ==========================================
# TOGGLE EXERCISE VISIBILITY
# ==========================================
@router.patch("/{exercise_id}/visibility")
def toggle_exercise_visibility(
    exercise_id: int,
    visibility: bool,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    
    if current_user.role != "admin":
        teacher_in_offering = db.query(TeacherAssignment).filter(
            TeacherAssignment.course_offering_id == exercise.course_offering_id,
            TeacherAssignment.professor_id == current_user.id
        ).first()
        
        if not teacher_in_offering:
            raise HTTPException(403, "No tienes permiso para cambiar la visibilidad de este ejercicio")
    
    exercise.visibility = visibility
    db.commit()
    db.refresh(exercise)
    
    status_text = "visible" if visibility else "no visible"
    
    return {
        "message": f"Ejercicio '{exercise.title}' ahora es {status_text}",
        "exercise_id": exercise.id,
        "title": exercise.title,
        "visibility": exercise.visibility
    }


# ==========================================
# GET EXERCISES BY VISIBILITY
# ==========================================
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
            "evaluation_mode": exercise.evaluation_mode,  # 🆕 AGREGADO
            "deadline": exercise.deadline,
            "course_offering_id": exercise.course_offering_id,
            "subject_name": offering.subject.name if offering and offering.subject else None,
            "academic_year": f"{offering.academic_year.start_year}-{offering.academic_year.end_year}" if offering and offering.academic_year else None,
            "has_solution": exercise.solution is not None,
            "test_cases_count": len(exercise.test_cases) if exercise.test_cases else 0
        })
    
    return result


# ==========================================
# SET EVALUATION MODE (NUEVO ENDPOINT)
# ==========================================
@router.patch("/{exercise_id}/evaluation-mode")
def set_evaluation_mode(
    exercise_id: int,
    mode: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(403, "Solo administradores pueden cambiar el modo de evaluación")
    
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(404, "Exercise not found")
    
    if mode not in ["function", "legacy_stdin"]:
        raise HTTPException(400, "Modo inválido. Use 'function' o 'legacy_stdin'")
    
    exercise.evaluation_mode = mode
    db.commit()
    
    return {
        "message": f"Modo de evaluación cambiado a '{mode}'",
        "exercise_id": exercise.id,
        "title": exercise.title,
        "evaluation_mode": exercise.evaluation_mode
    }