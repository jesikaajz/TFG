from sqlalchemy import Column, Integer, Text, ForeignKey
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"))
    input = Column(Text, nullable=False)
    expected_output = Column(Text, nullable=False)

    exercise = relationship("Exercise", back_populates="test_cases")