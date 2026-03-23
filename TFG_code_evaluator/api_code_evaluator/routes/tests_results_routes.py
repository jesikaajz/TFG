from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.tests_results_model import TestResult
from ..models.evaluation_model import Evaluation
from ..models.submissions_model import Submission
from ..schemas.tests_results_schema import TestResultResponse
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User

router = APIRouter(prefix="/test-results", tags=["Test Results"])


# 🔹 GET resultados de una evaluation
@router.get("/evaluation/{evaluation_id}", response_model=list[TestResultResponse])
def get_test_results(evaluation_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):

    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()

    if not evaluation:
        raise HTTPException(404, "Evaluation not found")

    submission = db.query(Submission).filter(Submission.id == evaluation.submission_id).first()

    if submission.student_id != user.id and user.role != "teacher":
        raise HTTPException(403, "Not allowed")

    return db.query(TestResult).filter(TestResult.evaluation_id == evaluation_id).all()