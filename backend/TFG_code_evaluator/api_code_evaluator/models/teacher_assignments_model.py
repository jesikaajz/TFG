# models/teacher_assignments_model.py
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from ..bd.connection import Base


class TeacherAssignment(Base):
    __tablename__ = "teacher_assignments"

    id = Column(Integer, primary_key=True, index=True)

    professor_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    course_offering_id = Column(
        Integer,
        ForeignKey("course_offerings.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # NUEVO: Indica si el profesor es TUTOR de esta course offering
    # Los tutores pueden crear enrollments (matrículas)
    is_tutor = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        UniqueConstraint(
            "professor_id",
            "course_offering_id",
            name="teacher_assignments_professor_id_course_offering_id_key"
        ),
    )

    professor = relationship(
        "User",
        back_populates="teacher_assignments"
    )

    course_offering = relationship(
        "CourseOffering",
        back_populates="teacher_assignments"
    )