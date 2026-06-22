from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
    DateTime,
    String
)

from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..bd.connection import Base


class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True, index=True)

    student_id = Column(
        Integer,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    exercise_id = Column(
        Integer,
        ForeignKey("exercises.id", ondelete="RESTRICT"),
        nullable=False
    )

    language_id = Column(
        Integer,
        ForeignKey("programming_languages.id"),
        nullable=True
    )

    code = Column(Text, nullable=False)

    submitted_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    status = Column(
        String(20),
        nullable=False,
        default="pending",
        server_default="pending"
    )

    # RELATIONSHIPS

    student = relationship(
        "User",
        back_populates="submissions"
    )

    exercise = relationship(
        "Exercise",
        back_populates="submissions"
    )

    language = relationship(
        "ProgrammingLanguage",
        back_populates="submissions"
    )

    evaluation = relationship(
        "Evaluation",
        back_populates="submission",
        uselist=False,
        cascade="all, delete"
    )