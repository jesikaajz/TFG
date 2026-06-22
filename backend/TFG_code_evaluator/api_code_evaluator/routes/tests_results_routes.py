from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.tests_results_model import TestResult
from ..models.evaluation_model import Evaluation
from ..models.submissions_model import Submission
from ..models.exercise_model import Exercise
from ..models.teacher_assignments_model import TeacherAssignment

from ..schemas.tests_results_schema import TestResultResponse

from ..dependencies.auth_dependencies import get_current_user

from ..models.user_model import User

router = APIRouter(
    prefix="/test-results",
    tags=["Test Results"]
)


def teacher_has_access(
    db: Session,
    teacher_id: int,
    submission: Submission
):

    exercise = db.query(Exercise).filter(
        Exercise.id == submission.exercise_id
    ).first()

    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.professor_id == teacher_id,
        TeacherAssignment.course_offering_id == exercise.course_offering_id
    ).first()

    return assignment is not None


# ==========================================
# GET TEST RESULTS OF EVALUATION
# ==========================================

@router.get(
    "/evaluation/{evaluation_id}",
    response_model=list[TestResultResponse]
)
def get_test_results(
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

    return db.query(TestResult).filter(
        TestResult.evaluation_id == evaluation_id
    ).all()