from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..bd.connection import get_db
from ..models.course_model import Course
from ..schemas.course_schema import CourseCreate, CourseResponse, CourseUpdate
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User

router = APIRouter(prefix="/courses", tags=["Courses"])

#  Get all courses (any authenticated user)
@router.get("/", response_model=list[CourseResponse])
def get_courses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(Course).all()

#  Get single course by id (any authenticated user)
@router.get("/{course_id}", response_model=CourseResponse)
def get_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course

#  Create course (admin and teacher)
@router.post("/", response_model=CourseResponse)
def create_course(course: CourseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    new_course = Course(**course.dict())
    db.add(new_course)
    db.commit()
    db.refresh(new_course)
    return new_course

#  Update course (admin and teacher)
@router.put("/{course_id}", response_model=CourseResponse)
def update_course(course_id: int, course_update: CourseUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    for key, value in course_update.dict(exclude_unset=True).items():
        setattr(course, key, value)
    db.commit()
    db.refresh(course)
    return course

#  Delete course (admin only)
@router.delete("/{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(course)
    db.commit()
    return {"message": "Course deleted"}

#  Get professor of a course (all roles)
@router.get("/{course_id}/professor")
def get_course_professor(course_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role not in ["admin", "teacher", "student"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    professor = course.professor
    return {
        "course_id": course.id,
        "course_name": course.name,
        "professor_id": professor.id,
        "professor_name": professor.name,
        "professor_email": professor.email
    }

@router.patch("/{course_id}", response_model=CourseResponse)
def patch_course(
    course_id: int,
    data: CourseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(404, "Course not found")

    # 🔐 permisos
    if current_user.role == "admin":
        pass
    elif current_user.role == "teacher":
        if course.professor_id != current_user.id:
            raise HTTPException(403, "Not your course")
    else:
        raise HTTPException(403, "Not authorized")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(course, key, value)

    db.commit()
    db.refresh(course)

    return course