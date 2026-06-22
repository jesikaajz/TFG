from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class ProgrammingLanguage(Base):
    __tablename__ = "programming_languages"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    version = Column(String, nullable=False)

    exercise_languages = relationship(
        "ExerciseLanguage",
        back_populates="language",
        cascade="all, delete"
    )

    submissions = relationship(
        "Submission",
        back_populates="language"
    )