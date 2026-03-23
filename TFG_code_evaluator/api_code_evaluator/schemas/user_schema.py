from pydantic import BaseModel, EmailStr
from enum import Enum
from pydantic import BaseModel
from typing import Optional

class UserPatch(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None

class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: UserRole

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole

    model_config = {
        "from_attributes": True  # reemplaza "orm_mode=True" en Pydantic v2
    }