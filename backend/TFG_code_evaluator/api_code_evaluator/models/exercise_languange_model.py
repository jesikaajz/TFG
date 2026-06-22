from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class ExerciseLanguage(Base):
    __tablename__ = "exercise_language"

    exercise_id = Column(
        Integer,
        ForeignKey("exercises.id", ondelete="CASCADE"),
        primary_key=True
    )

    language_id = Column(
        Integer,
        ForeignKey("programming_languages.id", ondelete="RESTRICT"),
        primary_key=True
    )

    exercise = relationship(
        "Exercise",
        back_populates="exercise_languages"
    )

    language = relationship(
        "ProgrammingLanguage",
        back_populates="exercise_languages"
    )