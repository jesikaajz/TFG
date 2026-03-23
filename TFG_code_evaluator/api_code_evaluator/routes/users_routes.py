from fastapi import HTTPException 
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..schemas.user_schema import UserCreate, UserPatch
from ..security.jwt_handler import hash_password
from ..bd.connection import get_db
from ..models.user_model import User
from ..dependencies.auth_dependencies import admin_required
from .auth_routes import get_current_user

router = APIRouter()

# get all students (admin and teachers)
@router.get("/students")
def get_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    students = db.query(User).filter(User.role == "student").all()

    return students
#get all teachers (admin and teachers)
@router.get("/teachers")
def get_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    teachers = db.query(User).filter(User.role == "teacher").all()

    return teachers

#get all users (admin only)
@router.get("/")
def get_all_users(
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    users = db.query(User).all()

    return users

#create user (admin only)
@router.post("/")
def create(
    user: UserCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)  # SOLO ADMIN
):
    db_user = db.query(User).filter(User.email == user.email).first()

    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        name=user.name,
        password=hash_password(user.password),
        role=user.role  # aquí SÍ permitimos cualquier rol (porque es admin)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

# change user role (admin only)
@router.put("/{user_id}/role")
def change_role(
    user_id: int,
    role: str,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role

    db.commit()
    db.refresh(user)

    return user
#get user by id (admin and the user himself)
@router.get("/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Solo admins o el propio usuario pueden ver info
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return user
#update user (admin only)
@router.put("/{user_id}")
def update_user(
    user_id: int,
    name: str,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    user.name = name

    db.commit()
    db.refresh(user)

    return user

#delete user (admin only)
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(admin_required)
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}



@router.get("/{professor_id}/courses")
def get_professor_courses(
    professor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)  # 🔹 obtenemos el usuario actual
):
    # 🔹 Protegemos el endpoint: solo admin o profesor
    if current_user.role not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Buscar profesor por ID
    professor = db.query(User).filter(User.id == professor_id).first()
    if not professor:
        raise HTTPException(status_code=404, detail="Professor not found")
    
    # Filtrar por rol en caso de que quieras asegurarte
    if professor.role != "teacher":
        raise HTTPException(status_code=400, detail="User is not a teacher")
    
    # Retornar la lista de cursos
    courses = [
        {
            "course_id": course.id,
            "course_name": course.name,
            "description": course.description,
            "year": course.year
        }
        for course in professor.courses
    ]

    return {
        "professor_id": professor.id,
        "professor_name": professor.name,
        "courses": courses
    }



@router.patch("/{user_id}")
def patch_user(
    user_id: int,
    data: UserPatch,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(404, "User not found")

    # 🔐 Solo admin o el propio usuario
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(403, "Not authorized")

    update_data = data.dict(exclude_unset=True)

    # 🔒 hash password si viene
    if "password" in update_data:
        update_data["password"] = hash_password(update_data["password"])

    for key, value in update_data.items():
        setattr(user, key, value)

    db.commit()
    db.refresh(user)

    return user