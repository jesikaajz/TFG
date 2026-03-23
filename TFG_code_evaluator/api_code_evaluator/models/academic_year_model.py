from sqlalchemy import Column, Integer
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class AcademicYear(Base):
    __tablename__ = "academic_years"

    id = Column(Integer, primary_key=True, index=True)
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)

    enrollments = relationship("Enrollment", back_populates="academic_year")