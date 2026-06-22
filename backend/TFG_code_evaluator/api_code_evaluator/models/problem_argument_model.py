# models/problem_argument_model.py
from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from ..bd.connection import Base


class ProblemArgument(Base):
    __tablename__ = "problem_arguments"

    id = Column(Integer, primary_key=True, index=True)
    
    problem_id = Column(Integer, ForeignKey("exercises.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(100), nullable=False)
    type_name = Column(String(100), nullable=False)
    position = Column(Integer, nullable=False)

    # Relaciones
    problem = relationship("Exercise", back_populates="arguments")