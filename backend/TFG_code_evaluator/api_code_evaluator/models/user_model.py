# models/user_model.py
from sqlalchemy import Column, Integer, String, Boolean
from sqlalchemy.orm import relationship
from passlib.context import CryptContext
from ..bd.connection import Base

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=True)  # 'student', 'teacher', 'admin' o None
    needs_password_change = Column(Boolean, default=False, nullable=False)  # ← AGREGADO

    # Relaciones
    enrollments = relationship(
        "Enrollment",
        back_populates="student",
        cascade="all, delete"
    )

    teacher_assignments = relationship(
        "TeacherAssignment",
        back_populates="professor"
    )

    submissions = relationship(
        "Submission",
        back_populates="student",
        cascade="all, delete"
    )

    def set_password(self, plain_password: str):
        self.password = pwd_context.hash(plain_password)

    def verify_password(self, plain_password: str) -> bool:
        return pwd_context.verify(plain_password, self.password)