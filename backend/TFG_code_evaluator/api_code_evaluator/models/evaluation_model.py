# models/evaluation_model.py - Agregar el campo feedback_pdf

from sqlalchemy import Column, Integer, ForeignKey, Numeric, Boolean, Text, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class Evaluation(Base):
    __tablename__ = "evaluation"

    id = Column(Integer, primary_key=True, index=True)

    submission_id = Column(
        Integer,
        ForeignKey("submissions.id", onupdate="CASCADE", ondelete="CASCADE"),
        nullable=False
    )

    score = Column(Numeric, nullable=True)

    passed_tests = Column(Integer, nullable=False)
    total_tests = Column(Integer, nullable=False)

    feedback = Column(Text, nullable=True)

    reviewed = Column(Boolean, default=False)

    rubric_scores = Column(JSONB, nullable=True)
    
    # 🆕 AGREGAR ESTE CAMPO
    feedback_pdf = Column(String(500), nullable=True)  # Ruta del PDF generado

    # RELATIONS
    submission = relationship("Submission", back_populates="evaluation")

    test_results = relationship(
        "TestResult",
        back_populates="evaluation",
        cascade="all, delete"
    )