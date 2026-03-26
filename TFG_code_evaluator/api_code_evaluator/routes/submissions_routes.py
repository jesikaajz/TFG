from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.submissions_model import Submission
from ..models.test_cases_model import TestCase
from ..models.tests_results_model import TestResult
from ..models.evaluation_model import Evaluation

from ..schemas.submissions_schema import SubmissionCreate, SubmissionResponse

from ..dependencies.auth_dependencies import get_current_user

from ..services.code_runner import evaluate_code

router = APIRouter(prefix="/submissions", tags=["Submissions"])


# VM CONFIG (mejor usar .env en el futuro)
VM_HOST = "192.168.1.151"
VM_USER = "JESIKA"
VM_PASS = "drpnll00"


# ------------------ CREATE ------------------
@router.post("/")
def create(
    data: SubmissionCreate,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)  # 👈 quitamos tipo User (evita import circular)
):
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

    tests = db.query(TestCase).filter(
        TestCase.exercise_id == data.exercise_id
    ).all()

    if not tests:
        submission.status = "error"
        db.commit()
        raise HTTPException(400, "No tests for this exercise")

    result = evaluate_code(
        vm_host=VM_HOST,
        vm_user=VM_USER,
        vm_pass=VM_PASS,
        code=data.code,
        tests=[
            {
                "input": t.input,
                "expected_output": t.expected_output,
                "id": t.id
            } for t in tests
        ],
        exercise_id=data.exercise_id
    )

    evaluation = Evaluation(
        submission_id=submission.id,
        score=result["score"],
        passed_tests=result["passed"],
        total_tests=result["total"]
    )

    db.add(evaluation)
    db.commit()
    db.refresh(evaluation)

    for r in result["results"]:
        db.add(TestResult(
            evaluation_id=evaluation.id,
            test_case_id=r["test_case_id"],
            passed=r["passed"],
            actual_output=r["output"],
            error=r["error"],
            execution_time=r.get("execution_time", 0)
        ))

    submission.status = "completed"
    db.commit()
    db.refresh(submission)

    return {
        "submission": submission,
        "evaluation": result
    }


# ------------------ GET MY ------------------
@router.get("/me", response_model=list[SubmissionResponse])
def my_submissions(
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    return db.query(Submission).filter(
        Submission.student_id == user.id
    ).all()


# ------------------ GET BY ID ------------------
@router.get("/{id}", response_model=SubmissionResponse)
def get_submission(
    id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    submission = db.query(Submission).filter(
        Submission.id == id
    ).first()

    if not submission:
        raise HTTPException(404, "Submission not found")

    if submission.student_id != user.id and user.role != "teacher":
        raise HTTPException(403, "Not allowed")

    return submission


# ------------------ GET BY EXERCISE ------------------
@router.get("/exercise/{exercise_id}", response_model=list[SubmissionResponse])
def get_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    user=Depends(get_current_user)
):
    if user.role != "teacher":
        raise HTTPException(403, "Only teachers")

    return db.query(Submission).filter(
        Submission.exercise_id == exercise_id
    ).all()