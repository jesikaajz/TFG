from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..bd.connection import Base  # Base compartido

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False)
    professor_id = Column(Integer, ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    description = Column(Text, nullable=False)
    year = Column(Integer, nullable=False)

    # 🔹 Relación con User
    professor = relationship("User", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course", cascade="all, delete")
    exercises = relationship("Exercise", back_populates="course", cascade="all, delete")