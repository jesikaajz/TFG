from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text)

    course_offerings = relationship("CourseOffering", back_populates="subject")