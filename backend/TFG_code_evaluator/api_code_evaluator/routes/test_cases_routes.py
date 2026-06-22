# test_cases_routes.py - Actualizado para usar los nuevos campos
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.test_cases_model import TestCase
from ..models.exercise_model import Exercise
from ..models.teacher_assignments_model import TeacherAssignment
from ..models.user_model import User

from ..schemas.test_cases_schema import (
    TestCaseCreate,
    TestCasePatch,
    TestCaseResponse
)

from ..dependencies.auth_dependencies import (
    get_current_user
)

router = APIRouter(
    prefix="/test-cases",
    tags=["Test Cases"]
)


def teacher_has_access(db, teacher_id, offering_id):
    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.professor_id == teacher_id,
        TeacherAssignment.course_offering_id == offering_id
    ).first()
    return assignment is not None


# GET BY EXERCISE
@router.get("/exercise/{exercise_id}", response_model=list[TestCaseResponse])
def get_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return db.query(TestCase).filter(
        TestCase.exercise_id == exercise_id
    ).all()


# CREATE - ACTUALIZADO para usar input_data y expected_output
@router.post("/", response_model=TestCaseResponse)
def create(
    data: TestCaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == data.exercise_id
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

    tc = TestCase(
        exercise_id=data.exercise_id,
        input_data=data.input_data,
        expected_output=data.expected_output,
        is_hidden=data.is_hidden
    )

    db.add(tc)
    db.commit()
    db.refresh(tc)

    return tc


# PATCH - ACTUALIZADO
@router.patch("/{test_case_id}", response_model=TestCaseResponse)
def patch(
    test_case_id: int,
    data: TestCasePatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tc = db.query(TestCase).filter(
        TestCase.id == test_case_id
    ).first()

    if not tc:
        raise HTTPException(404, "Test case not found")

    exercise = db.query(Exercise).filter(
        Exercise.id == tc.exercise_id
    ).first()

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized")
        if not teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            raise HTTPException(403, "Not your exercise")

    update_data = data.model_dump(exclude_unset=True)
    
    if "input_data" in update_data:
        tc.input_data = update_data["input_data"]
    if "expected_output" in update_data:
        tc.expected_output = update_data["expected_output"]
    if "is_hidden" in update_data:
        tc.is_hidden = update_data["is_hidden"]

    db.commit()
    db.refresh(tc)

    return tc


# DELETE
@router.delete("/{test_case_id}")
def delete(
    test_case_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    tc = db.query(TestCase).filter(
        TestCase.id == test_case_id
    ).first()

    if not tc:
        raise HTTPException(404, "Test case not found")

    exercise = db.query(Exercise).filter(
        Exercise.id == tc.exercise_id
    ).first()

    if current_user.role != "admin":
        if current_user.role != "teacher":
            raise HTTPException(403, "Not authorized")
        if not teacher_has_access(
            db,
            current_user.id,
            exercise.course_offering_id
        ):
            raise HTTPException(403, "Not your exercise")

    db.delete(tc)
    db.commit()

    return {"message": "Test case deleted"}