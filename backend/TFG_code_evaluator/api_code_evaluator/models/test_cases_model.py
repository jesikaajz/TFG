# models/test_cases_model.py
from sqlalchemy import Column, Integer, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class TestCase(Base):
    __tablename__ = "test_cases"

    id = Column(Integer, primary_key=True, index=True)
    exercise_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"))
    
    # Input/Output como JSON (ahora los nombres coinciden con la BD)
    input_data = Column(JSON, nullable=False)
    expected_output = Column(JSON, nullable=False)  # ← ahora coincide con la BD
    
    # Tests ocultos
    is_hidden = Column(Boolean, default=False)

    exercise = relationship("Exercise", back_populates="test_cases")
    test_results = relationship("TestResult", back_populates="test_case")