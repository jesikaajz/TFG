from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.submissions_model import Submission
from ..schemas.submissions_schema import SubmissionCreate, SubmissionResponse
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User

router = APIRouter(prefix="/submissions", tags=["Submissions"])


# 🔹 CREATE (solo estudiantes)
@router.post("/", response_model=SubmissionResponse)
def create(data: SubmissionCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    if user.role != "student":
        raise HTTPException(403, "Only students can submit")

    submission = Submission(
        student_id=user.id,
        exercise_id=data.exercise_id,
        code=data.code,
        status="pending"
    )

    db.add(submission)
    db.commit()
    db.refresh(submission)

    return submission


# 🔹 GET MIS SUBMISSIONS
@router.get("/me", response_model=list[SubmissionResponse])
def my_submissions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Submission).filter(Submission.student_id == user.id).all()


# 🔹 GET POR ID (control acceso)
@router.get("/{id}", response_model=SubmissionResponse)
def get_submission(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    submission = db.query(Submission).filter(Submission.id == id).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if submission.student_id != user.id and user.role != "teacher":
        raise HTTPException(403, "Not allowed")

    return submission


# 🔹 GET POR EJERCICIO (profesor)
@router.get("/exercise/{exercise_id}", response_model=list[SubmissionResponse])
def get_by_exercise(exercise_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    if user.role != "teacher":
        raise HTTPException(403, "Only teachers")

    return db.query(Submission).filter(Submission.exercise_id == exercise_id).all()