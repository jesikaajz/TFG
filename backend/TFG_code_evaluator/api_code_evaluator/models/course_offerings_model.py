from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class CourseOffering(Base):
    __tablename__ = "course_offerings"

    id = Column(Integer, primary_key=True, index=True)

    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="RESTRICT"), nullable=False)
    academic_year_id = Column(Integer, ForeignKey("academic_years.id", ondelete="RESTRICT"), nullable=False)

    subject = relationship("Subject", back_populates="course_offerings")
    academic_year = relationship("AcademicYear", back_populates="course_offerings")

    teacher_assignments = relationship("TeacherAssignment", back_populates="course_offering", cascade="all, delete")

    subject = relationship(
    "Subject",
    back_populates="course_offerings"
    )

    academic_year = relationship(
    "AcademicYear",
    back_populates="course_offerings"
    )

    enrollment_details = relationship(
        "EnrollmentDetail",
        back_populates="course_offering"
    )

    exercises = relationship(
        "Exercise", 
        back_populates="course_offering",
        cascade="all, delete"
    )