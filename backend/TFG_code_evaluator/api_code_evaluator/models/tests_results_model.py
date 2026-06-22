from sqlalchemy import Column, Integer, ForeignKey, Boolean, Text, Float
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class TestResult(Base):
    __tablename__ = "test_results"

    id = Column(Integer, primary_key=True, index=True)
    evaluation_id = Column(Integer, ForeignKey("evaluation.id", ondelete="CASCADE"))
    test_case_id = Column(Integer, ForeignKey("test_cases.id", ondelete="RESTRICT"))

    passed = Column(Boolean, nullable=False)
    actual_output = Column(Text)
    error = Column(Text)
    execution_time = Column(Float)

    evaluation = relationship("Evaluation", back_populates="test_results")
    test_case = relationship("TestCase", back_populates="test_results")