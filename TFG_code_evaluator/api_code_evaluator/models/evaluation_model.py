from sqlalchemy import Column, Integer, ForeignKey, Numeric, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from ..bd.connection import Base

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("submissions.id", ondelete="CASCADE"), nullable=False)

    score = Column(Numeric, nullable=True)
    passed_tests = Column(Integer, nullable=False)
    total_tests = Column(Integer, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # relaciones
    submission = relationship("Submission", back_populates="evaluation")
    test_results = relationship("TestResult", back_populates="evaluation")