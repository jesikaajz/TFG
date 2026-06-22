from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.evaluation_model import Evaluation
from ..models.submissions_model import Submission
from ..models.exercise_model import Exercise
from ..models.course_offerings_model import CourseOffering
from ..models.teacher_assignments_model import TeacherAssignment
from fastapi.responses import FileResponse
import os
from ..models.rubric_model import Rubric
from ..schemas.evaluation_schema import (
    EvaluationResponse,
    EvaluationPatch
)

from ..dependencies.auth_dependencies import (
    get_current_user,
    admin_required
)

from ..models.user_model import User

router = APIRouter(
    prefix="/evaluations",
    tags=["Evaluations"]
)


def teacher_has_access(db: Session, teacher_id: int, submission: Submission):

    exercise = db.query(Exercise).filter(
        Exercise.id == submission.exercise_id
    ).first()

    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.professor_id == teacher_id,
        TeacherAssignment.course_offering_id == exercise.course_offering_id
    ).first()

    return assignment is not None


# ==========================================
# GET EVALUATION BY SUBMISSION
# ==========================================

@router.get(
    "/submission/{submission_id}",
    response_model=EvaluationResponse
)
def get_evaluation(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    submission = db.query(Submission).filter(
        Submission.id == submission_id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    # ACCESS CONTROL

    allowed = False

    if current_user.role == "admin":
        allowed = True

    elif current_user.role == "student":
        allowed = submission.student_id == current_user.id

    elif current_user.role == "teacher":
        allowed = teacher_has_access(
            db,
            current_user.id,
            submission
        )

    if not allowed:
        raise HTTPException(403, "Not authorized")

    evaluation = db.query(Evaluation).filter(
        Evaluation.submission_id == submission_id
    ).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    return evaluation


# ==========================================
# GET BY ID
# ==========================================

@router.get("/{evaluation_id}", response_model=EvaluationResponse)
def get_by_id(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id
    ).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    submission = db.query(Submission).filter(
        Submission.id == evaluation.submission_id
    ).first()

    allowed = False

    if current_user.role == "admin":
        allowed = True

    elif current_user.role == "student":
        allowed = submission.student_id == current_user.id

    elif current_user.role == "teacher":
        allowed = teacher_has_access(
            db,
            current_user.id,
            submission
        )

    if not allowed:
        raise HTTPException(403, "Not authorized")

    return evaluation


# ==========================================
# PATCH
# ONLY ADMIN OR TEACHER
# ==========================================

@router.patch("/{evaluation_id}", response_model=EvaluationResponse)
def patch_evaluation(
    evaluation_id: int,
    data: EvaluationPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id
    ).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    submission = db.query(Submission).filter(
        Submission.id == evaluation.submission_id
    ).first()

    # ACCESS CONTROL

    allowed = False

    if current_user.role == "admin":
        allowed = True

    elif current_user.role == "teacher":
        allowed = teacher_has_access(
            db,
            current_user.id,
            submission
        )

    if not allowed:
        raise HTTPException(403, "Not authorized")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(evaluation, key, value)

    db.commit()
    db.refresh(evaluation)

    return evaluation


# ==========================================
# DELETE
# ONLY ADMIN
# ==========================================

@router.delete("/{evaluation_id}")
def delete_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):

    evaluation = db.query(Evaluation).filter(
        Evaluation.id == evaluation_id
    ).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    db.delete(evaluation)

    db.commit()

    return {
        "message": "Evaluation deleted"
    }

@router.post("/evaluations/by-submissions", response_model=list[EvaluationResponse])
async def get_evaluations_by_submission_ids(
    submission_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Evaluaciones por submissions
    teacher/admin only
    """

    if current_user.role not in ["teacher", "admin"]:
        raise HTTPException(403, "No autorizado")

    if not submission_ids:
        raise HTTPException(400, "Se requiere al menos un ID")

    evaluations = db.query(Evaluation).filter(
        Evaluation.submission_id.in_(submission_ids)
    ).all()

    return evaluations

# routes/evaluation_routes.py - Corregir la ruta

# ==========================================
# DESCARGAR PDF DE EVALUACIÓN
# ==========================================

@router.get("/submission/{submission_id}/pdf")
def download_evaluation_pdf(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Descargar el PDF de evaluación de una submission.
    Permisos:
    - Admin: puede descargar cualquier PDF
    - Teacher: puede descargar PDF de submissions de sus estudiantes
    - Student: solo puede descargar sus propios PDFs
    
    El PDF se guarda como: feedback_pdfs/submission_{submission_id}.pdf
    """
    # Verificar que la submission existe
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
    
    # Buscar la evaluación (no es necesaria para el PDF, pero verificamos que existe)
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    if not evaluation:
        raise HTTPException(404, "Evaluation not found for this submission")
    
    # Buscar el PDF - el nombre es submission_{submission_id}.pdf, no submission_{evaluation_id}.pdf
    pdf_path = f"feedback_pdfs/submission_{submission_id}.pdf"
    
    # Verificar alternativas si no existe
    if not os.path.exists(pdf_path):
        # Intentar con el path guardado en la evaluación
        if evaluation.feedback_pdf and os.path.exists(evaluation.feedback_pdf):
            pdf_path = evaluation.feedback_pdf
        else:
            raise HTTPException(404, f"PDF not found. Expected at: feedback_pdfs/submission_{submission_id}.pdf")
    
    # Nombre del archivo para descargar
    filename = f"evaluation_submission_{submission_id}.pdf"
    
    return FileResponse(
        path=pdf_path,
        filename=filename,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/submission/{submission_id}/pdf-status")
def get_evaluation_pdf_status(
    submission_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Verificar si el PDF de evaluación está disponible.
    Retorna:
    - available: bool
    - url: str (si está disponible)
    - message: str (mensaje informativo)
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
    
    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()
    if not evaluation:
        return {
            "available": False,
            "message": "Evaluation not completed yet"
        }
    
    # Verificar si el PDF existe
    pdf_path = f"feedback_pdfs/submission_{submission_id}.pdf"
    if evaluation.feedback_pdf and os.path.exists(evaluation.feedback_pdf):
        pdf_path = evaluation.feedback_pdf
    
    if os.path.exists(pdf_path):
        return {
            "available": True,
            "url": f"/evaluations/submission/{submission_id}/pdf",
            "message": "PDF available"
        }
    else:
        # Verificar si hay rúbrica
        exercise = db.query(Exercise).filter(Exercise.id == submission.exercise_id).first()
        has_rubric = db.query(Rubric).filter(Rubric.exercise_id == exercise.id).first() is not None if exercise else False
        
        if has_rubric:
            message = "PDF is being generated with rubric evaluation..."
        else:
            message = "PDF will be generated with basic evaluation (no rubric defined)"
        
        return {
            "available": False,
            "has_rubric": has_rubric,
            "message": message
        }