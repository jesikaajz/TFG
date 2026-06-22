from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.exercise_languange_model import ExerciseLanguage
from ..models.exercise_model import Exercise
from ..models.programming_languages_model import ProgrammingLanguage
from ..models.teacher_assignments_model import TeacherAssignment
from ..models.user_model import User

from ..schemas.exercise_language_schema import (
    ExerciseLanguageCreate,
    ExerciseLanguageResponse
)

from ..dependencies.auth_dependencies import get_current_user

router = APIRouter(
    prefix="/exercise-languages",
    tags=["Exercise Languages"]
)


def check_teacher_permission(exercise, user, db):

    if user.role == "admin":
        return

    assignment = db.query(TeacherAssignment).join(
        Exercise,
        Exercise.course_offering_id == TeacherAssignment.course_offering_id
    ).filter(
        Exercise.id == exercise.id,
        TeacherAssignment.professor_id == user.id
    ).first()

    if not assignment:
        raise HTTPException(403, "Not authorized")


@router.post("/", response_model=ExerciseLanguageResponse)
def create(
    data: ExerciseLanguageCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(
        Exercise.id == data.exercise_id
    ).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    language = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.id == data.language_id
    ).first()

    if not language:
        raise HTTPException(404, "Language not found")

    check_teacher_permission(exercise, user, db)

    exists = db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == data.exercise_id,
        ExerciseLanguage.language_id == data.language_id
    ).first()

    if exists:
        raise HTTPException(400, "Already assigned")

    new_relation = ExerciseLanguage(**data.dict())

    db.add(new_relation)
    db.commit()

    return new_relation


@router.get("/exercise/{exercise_id}",
response_model=list[ExerciseLanguageResponse])
def get_by_exercise(
    exercise_id: int,
    db: Session = Depends(get_db),
):
    return db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == exercise_id
    ).all()


@router.delete("/")
def delete(
    exercise_id: int,
    language_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    relation = db.query(ExerciseLanguage).filter(
        ExerciseLanguage.exercise_id == exercise_id,
        ExerciseLanguage.language_id == language_id
    ).first()

    if not relation:
        raise HTTPException(404, "Relation not found")

    exercise = db.query(Exercise).filter(
        Exercise.id == exercise_id
    ).first()

    check_teacher_permission(exercise, user, db)

    db.delete(relation)
    db.commit()

    return {"message": "Relation deleted"}