# schemas/user_schema.py
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from enum import Enum

# Forma correcta para Pydantic v2
PasswordStr = str

class UserRole(str, Enum):
    student = "student"
    teacher = "teacher"
    admin = "admin"

# Schema para creación de usuarios (admin) - con rol obligatorio
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(..., min_length=8, pattern=r"^\S+$")
    role: UserRole  # Rol obligatorio

# Schema para registro público - SIN rol
class UserPublicRegister(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(..., min_length=8, pattern=r"^\S+$")
    # No tiene campo role

# Schema para actualización parcial
class UserPatch(BaseModel):
    name: Optional[str] = None
    password: Optional[str] = Field(None, min_length=8, pattern=r"^\S+$")
    role: Optional[UserRole] = None

# Schema para cambio de contraseña (sin verificación - simple)
class PasswordChange(BaseModel):
    password: str = Field(..., min_length=8, pattern=r"^\S+$")
    
    @field_validator('password')
    @classmethod
    def password_must_be_strong(cls, value: str) -> str:
        if ' ' in value:
            raise ValueError('La contraseña no puede contener espacios')
        return value

# NUEVO SCHEMA: Cambio de contraseña con verificación de contraseña actual
class PasswordChangeWithCurrent(BaseModel):
    current_password: str = Field(..., min_length=8, pattern=r"^\S+$")
    new_password: str = Field(..., min_length=8, pattern=r"^\S+$")
    
    @field_validator('new_password')
    @classmethod
    def password_must_be_different(cls, value: str, info) -> str:
        current = info.data.get('current_password')
        if current and value == current:
            raise ValueError('La nueva contraseña debe ser diferente a la actual')
        if ' ' in value:
            raise ValueError('La contraseña no puede contener espacios')
        return value

# Schema para bulk create
class UserBulkCreate(BaseModel):
    email: EmailStr
    name: str
    password: Optional[str] = Field(None, min_length=8, pattern=r"^\S+$")
    role: Optional[UserRole] = None
    
    @field_validator('password')
    @classmethod
    def password_must_be_strong(cls, value: Optional[str]) -> Optional[str]:
        if value is None:
            return value
        if ' ' in value:
            raise ValueError('La contraseña no puede contener espacios')
        return value

# Schema para respuesta
class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: Optional[str] = None  # Puede ser null
    needs_password_change: Optional[bool] = False  # Campo para saber si necesita cambiar contraseña
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

    model_config = {
        "from_attributes": True
    }

# Schema para resultado de bulk upload
class BulkUploadResult(BaseModel):
    created_count: int
    created: list[UserResponse]
    errors: list[dict]