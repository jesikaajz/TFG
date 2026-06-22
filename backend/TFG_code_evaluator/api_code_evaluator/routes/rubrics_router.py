from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.rubric_model import Rubric
from ..models.exercise_model import Exercise
from ..models.teacher_assignments_model import TeacherAssignment
from ..models.user_model import User

from ..schemas.rubrics_schema import (
    RubricCreate,
    RubricPatch,
    RubricResponse
)

from ..dependencies.auth_dependencies import (
    get_current_user
)

router = APIRouter(
    prefix="/rubrics",
    tags=["Rubrics"]
)


def teacher_has_access(db, teacher_id, offering_id):

    assignment = db.query(TeacherAssignment).filter(
        TeacherAssignment.professor_id == teacher_id,
        TeacherAssignment.course_offering_id == offering_id
    ).first()

    return assignment is not None


# GET RUBRIC
@router.get("/exercise/{exercise_id}", response_model=RubricResponse)
def get_rubric(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):

    rubric = db.query(Rubric).filter(
        Rubric.exercise_id == exercise_id
    ).first()

    if not rubric:
        raise HTTPException(404, "Rubric not found")

    return rubric


# CREATE
@router.post("/", response_model=RubricResponse)
def create(
    data: RubricCreate,
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

    exists = db.query(Rubric).filter(
        Rubric.exercise_id == data.exercise_id
    ).first()

    if exists:
        raise HTTPException(400, "Rubric already exists")

    rubric = Rubric(**data.model_dump())

    db.add(rubric)
    db.commit()
    db.refresh(rubric)

    return rubric


# PATCH
@router.patch("/{rubric_id}", response_model=RubricResponse)
def patch(
    rubric_id: int,
    data: RubricPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    rubric = db.query(Rubric).filter(
        Rubric.id == rubric_id
    ).first()

    if not rubric:
        raise HTTPException(404, "Rubric not found")

    exercise = db.query(Exercise).filter(
        Exercise.id == rubric.exercise_id
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

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(rubric, key, value)

    db.commit()
    db.refresh(rubric)

    return rubric


# DELETE
@router.delete("/{rubric_id}")
def delete(
    rubric_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    rubric = db.query(Rubric).filter(
        Rubric.id == rubric_id
    ).first()

    if not rubric:
        raise HTTPException(404, "Rubric not found")

    exercise = db.query(Exercise).filter(
        Exercise.id == rubric.exercise_id
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

    db.delete(rubric)
    db.commit()

    return {"message": "Rubric deleted"}