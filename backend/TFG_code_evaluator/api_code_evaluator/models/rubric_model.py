from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class Rubric(Base):
    __tablename__ = "rubrics"

    id = Column(Integer, primary_key=True, index=True)

    exercise_id = Column(
        Integer,
        ForeignKey(
            "exercises.id",
            ondelete="CASCADE"
        ),
        unique=True,
        nullable=False
    )

    criteria = Column(JSONB, nullable=False)

    exercise = relationship(
        "Exercise",
        back_populates="rubric"
    )