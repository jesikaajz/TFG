from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..bd.connection import get_db
from ..models.test_cases_model import TestCase
from ..models.exercise_model import Exercise
from ..models.course_model import Course
from ..schemas.test_cases_schema import TestCaseCreate, TestCasePatch, TestCaseResponse
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User

router = APIRouter(prefix="/test-cases", tags=["Test Cases"])


def check_teacher_owns_course(course, user):
    if user.role == "admin":
        return
    if user.role == "teacher" and course.professor_id == user.id:
        return
    raise HTTPException(403, "Not authorized")


# CREATE
@router.post("/", response_model=TestCaseResponse)
def create(data: TestCaseCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    exercise = db.query(Exercise).filter(Exercise.id == data.exercise_id).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    check_teacher_owns_course(course, user)

    new = TestCase(**data.dict())
    db.add(new)
    db.commit()
    db.refresh(new)

    return new


# GET BY EXERCISE
@router.get("/exercise/{exercise_id}", response_model=list[TestCaseResponse])
def get_by_exercise(exercise_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(TestCase).filter(TestCase.exercise_id == exercise_id).all()


# DELETE
@router.delete("/{id}")
def delete(id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tc = db.query(TestCase).filter(TestCase.id == id).first()

    if not tc:
        raise HTTPException(404, "Not found")

    exercise = db.query(Exercise).filter(Exercise.id == tc.exercise_id).first()
    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    check_teacher_owns_course(course, user)

    db.delete(tc)
    db.commit()

    return {"message": "Deleted"}


@router.patch("/{id}", response_model=TestCaseResponse)
def patch_test_case(
    id: int,
    data: TestCasePatch,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
):
    tc = db.query(TestCase).filter(TestCase.id == id).first()

    if not tc:
        raise HTTPException(404, "Not found")

    exercise = db.query(Exercise).filter(Exercise.id == tc.exercise_id).first()
    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    check_teacher_owns_course(course, user)

    for key, value in data.dict(exclude_unset=True).items():
        setattr(tc, key, value)

    db.commit()
    db.refresh(tc)

    return tc