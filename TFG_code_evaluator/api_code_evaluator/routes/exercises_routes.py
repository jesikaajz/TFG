from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.exercise_model import Exercise
from ..models.course_model import Course
from ..schemas.exercise_schema import ExerciseCreate, ExercisePatch, ExerciseResponse
from ..dependencies.auth_dependencies import get_current_user, admin_required
from ..models.user_model import User

router = APIRouter(
    prefix="/exercises",
    tags=["Exercises"]
)

# GET ALL (solo admin)
@router.get("/", response_model=list[ExerciseResponse])
def get_all(
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    return db.query(Exercise).all()


# GET BY ID (todos)
@router.get("/{exercise_id}", response_model=ExerciseResponse)
def get_one(
    exercise_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    return exercise


# GET exercises by course
@router.get("/course/{course_id}", response_model=list[ExerciseResponse])
def get_by_course(
    course_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    exercises = db.query(Exercise).filter(Exercise.course_id == course_id).all()
    return exercises


# CREATE
@router.post("/", response_model=ExerciseResponse)
def create(
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == data.course_id).first()

    if not course:
        raise HTTPException(404, "Course not found")

    # ADMIN puede todo
    if current_user.role == "admin":
        pass

    # TEACHER solo su curso
    elif current_user.role == "teacher":
        if course.professor_id != current_user.id:
            raise HTTPException(403, "Not your course")

    else:
        raise HTTPException(403, "Not authorized")

    new_exercise = Exercise(**data.dict())

    db.add(new_exercise)
    db.commit()
    db.refresh(new_exercise)

    return new_exercise


#  UPDATE
@router.put("/{exercise_id}", response_model=ExerciseResponse)
def update(
    exercise_id: int,
    data: ExerciseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    #  ADMIN
    if current_user.role == "admin":
        pass

    # TEACHER
    elif current_user.role == "teacher":
        if course.professor_id != current_user.id:
            raise HTTPException(403, "Not your course")

    else:
        raise HTTPException(403, "Not authorized")

    for key, value in data.dict().items():
        setattr(exercise, key, value)

    db.commit()
    db.refresh(exercise)

    return exercise


#  DELETE
@router.delete("/{exercise_id}")
def delete(
    exercise_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    # ADMIN
    if current_user.role == "admin":
        pass

    # TEACHER
    elif current_user.role == "teacher":
        if course.professor_id != current_user.id:
            raise HTTPException(403, "Not your course")

    else:
        raise HTTPException(403, "Not authorized")

    db.delete(exercise)
    db.commit()

    return {"message": "Exercise deleted"}

@router.patch("/{exercise_id}", response_model=ExerciseResponse)
def patch_exercise(
    exercise_id: int,
    data: ExercisePatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exercise = db.query(Exercise).filter(Exercise.id == exercise_id).first()

    if not exercise:
        raise HTTPException(404, "Exercise not found")

    course = db.query(Course).filter(Course.id == exercise.course_id).first()

    #  permisos
    if current_user.role == "admin":
        pass
    elif current_user.role == "teacher":
        if course.professor_id != current_user.id:
            raise HTTPException(403, "Not your course")
    else:
        raise HTTPException(403, "Not authorized")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(exercise, key, value)

    db.commit()
    db.refresh(exercise)

    return exercise