from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.evaluation_model import Evaluation
from ..models.submissions_model import Submission
from ..schemas.evaluation_schema import EvaluationResponse
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User

router = APIRouter(prefix="/evaluations", tags=["Evaluations"])


# 🔹 GET evaluation de una submission
@router.get("/submission/{submission_id}", response_model=EvaluationResponse)
def get_evaluation(submission_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if submission.student_id != user.id and user.role != "teacher":
        raise HTTPException(403, "Not allowed")

    evaluation = db.query(Evaluation).filter(Evaluation.submission_id == submission_id).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    return evaluation