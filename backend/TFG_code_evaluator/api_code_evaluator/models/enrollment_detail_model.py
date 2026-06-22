from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class EnrollmentDetail(Base):
    __tablename__ = "enrollment_detail"

    enrollment_id = Column(
        Integer,
        ForeignKey(
            "enrollment.id",
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        primary_key=True
    )

    offering_id = Column(
        Integer,
        ForeignKey(
            "course_offerings.id",
            onupdate="CASCADE",
            ondelete="CASCADE"
        ),
        primary_key=True
    )

    enrollment = relationship(
        "Enrollment",
        back_populates="enrollment_details"
    )

    course_offering = relationship(
        "CourseOffering",
        back_populates="enrollment_details"
    )