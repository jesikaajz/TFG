from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..bd.connection import Base

class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    deadline = Column(Date, nullable=True)
    course_id = Column(Integer, ForeignKey("courses.id", ondelete="CASCADE"))
    solution = Column(Text, nullable=True)

    course = relationship("Course", back_populates="exercises")
    submissions = relationship("Submission", back_populates="exercise") 
    test_cases = relationship("TestCase", back_populates="exercise", cascade="all, delete")