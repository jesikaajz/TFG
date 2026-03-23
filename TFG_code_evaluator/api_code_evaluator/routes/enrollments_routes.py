from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import date
from ..models.course_model import Course
from ..models.enrollment_model import Enrollment
from ..schemas.enrollment_schema import EnrollmentCreate, EnrollmentResponse, EnrollmentUpdate
from ..dependencies.auth_dependencies import admin_required, get_current_user
from ..bd.connection import get_db
from ..models.user_model import User

router = APIRouter(
    prefix="/enrollments",
    tags=["Enrollments"]  
)

# Crear inscripción (admin o estudiante que se autoinscribe)
@router.post("/", response_model=EnrollmentResponse)
def create_enrollment(
    enrollment: EnrollmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo admin o el propio estudiante pueden crear
    if current_user.role != "admin" and current_user.id != enrollment.student_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    new_enrollment = Enrollment(
        student_id=enrollment.student_id,
        course_id=enrollment.course_id,
        academic_year_id=enrollment.academic_year_id,
        enrollment_date=enrollment.enrollment_date
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    return new_enrollment

# Listar todas las inscripciones (solo admin)
@router.get("/", response_model=list[EnrollmentResponse])
def get_all_enrollments(
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)  # solo admin
):
    return db.query(Enrollment).all()

# Ver inscripciones de un estudiante (admin o el propio estudiante)
@router.get("/student/{student_id}", response_model=list[EnrollmentResponse])
def get_student_enrollments(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Solo admin o el propio estudiante pueden ver
    if current_user.role != "admin" and current_user.id != student_id:
        raise HTTPException(status_code=403, detail="Not allowed")
    return db.query(Enrollment).filter(Enrollment.student_id == student_id).all()

# Ver inscripciones de un curso (admin o profesores del curso)
@router.get("/course/{course_id}/students", response_model=list[EnrollmentResponse])
def get_course_students(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Obtener todas las inscripciones del curso
    enrollments = db.query(Enrollment).filter(Enrollment.course_id == course_id).all()
    
    if not enrollments:
        raise HTTPException(status_code=404, detail="No enrollments found for this course")

    # Si es teacher, verificar que el curso le pertenece
    if current_user.role == "teacher":
        # Todos los cursos deben pertenecer al profesor
        course_professor_ids = {enrollment.course.professor_id for enrollment in enrollments}
        if current_user.id not in course_professor_ids:
            raise HTTPException(status_code=403, detail="Not allowed")

    # Solo admin o teacher pueden acceder, estudiantes no
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not allowed")

    return enrollments
#actualizar inscripción (admin only)
@router.put("/{enrollment_id}", response_model=EnrollmentResponse)
def update_enrollment(
    enrollment_id: int,
    enrollment_update: EnrollmentCreate,  # puedes crear un EnrollmentUpdate si quieres campos opcionales
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Actualizamos todos los campos de la inscripción
    enrollment.student_id = enrollment_update.student_id
    enrollment.course_id = enrollment_update.course_id
    enrollment.academic_year_id = enrollment_update.academic_year_id
    enrollment.enrollment_date = enrollment_update.enrollment_date

    db.commit()
    db.refresh(enrollment)
    return enrollment

#eliminar inscripción (admin only)
@router.delete("/{enrollment_id}")
def delete_enrollment(
    enrollment_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")
    
    db.delete(enrollment)
    db.commit()
    return {"message": "Enrollment deleted"}

#agregar estudiante en un curso (admin o profesor)
@router.post("/course/{course_id}/students/{student_id}", response_model=EnrollmentResponse)
def add_student_to_course(
    course_id: int,
    student_id: int,
    academic_year_id: int,  # año académico necesario para la inscripción
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Solo admin o profesor del curso
    if current_user.role != "admin" and current_user.id != course.professor_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    # Verificar si ya está inscrito
    existing = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Student already enrolled")

    new_enrollment = Enrollment(
        student_id=student_id,
        course_id=course_id,
        academic_year_id=academic_year_id,
        enrollment_date=date.today()
    )
    db.add(new_enrollment)
    db.commit()
    db.refresh(new_enrollment)
    return new_enrollment

@router.delete("/course/{course_id}/students/{student_id}")
def remove_student_from_course(
    course_id: int,
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    enrollment = db.query(Enrollment).filter(
        Enrollment.course_id == course_id,
        Enrollment.student_id == student_id
    ).first()
    
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    # Solo admin o profesor del curso
    if current_user.role != "admin" and current_user.id != enrollment.course.professor_id:
        raise HTTPException(status_code=403, detail="Not allowed")

    db.delete(enrollment)
    db.commit()
    return {"message": "Student removed from course"}

@router.patch("/{enrollment_id}", response_model=EnrollmentResponse)
def patch_enrollment(
    enrollment_id: int,
    enrollment_update: EnrollmentUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    enrollment = db.query(Enrollment).filter(Enrollment.id == enrollment_id).first()
    if not enrollment:
        raise HTTPException(status_code=404, detail="Enrollment not found")

    for key, value in enrollment_update.dict(exclude_unset=True).items():
        setattr(enrollment, key, value)

    db.commit()
    db.refresh(enrollment)
    return enrollment