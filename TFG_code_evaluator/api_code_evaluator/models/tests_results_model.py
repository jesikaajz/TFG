from sqlalchemy import Column, Integer, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluations.id", ondelete="CASCADE"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="RESTRICT"), nullable=False)

    passed = Column(Boolean, nullable=False)
    actual_output = Column(Text, nullable=True)
    error = Column(Text, nullable=True)
    execution_time = Column(Float, nullable=True)

    # relaciones
    evaluation = relationship("Evaluation", back_populates="test_results")