from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, text
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class Enrollment(Base):
    __tablename__ = "enrollment"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", onupdate="CASCADE"),
        nullable=False
    )

    academic_year_id = Column(
        Integer,
        ForeignKey(
            "academic_years.id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    enrollment_date = Column(
        TIMESTAMP,
        server_default=text("CURRENT_TIMESTAMP")
    )

    student = relationship(
        "User",
        back_populates="enrollments"
    )

    academic_year = relationship(
        "AcademicYear",
        back_populates="enrollments"
    )

    enrollment_details = relationship(
        "EnrollmentDetail",
        back_populates="enrollment",
        cascade="all, delete"
    )