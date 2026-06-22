# models/exercise_model.py - COMPLETO Y CORREGIDO
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, Boolean, ForeignKey
from sqlalchemy.orm import relationship

from ..bd.connection import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    description = Column(Text, nullable=False)

    deadline = Column(TIMESTAMP, nullable=True)

    course_offering_id = Column(
        Integer,
        ForeignKey(
            "course_offerings.id",
            onupdate="CASCADE",
            ondelete="RESTRICT"
        ),
        nullable=False
    )

    solution = Column(Text, nullable=True)

    visibility = Column(Boolean, default=True)

    evaluation_mode = Column(String, default="function")  # "function" o "legacy_stdin"
    
    # NUEVOS CAMPOS (ya existen en BD)
    function_name = Column(String(100), default="solution")
    return_type = Column(String(100), default="json")
    comparator = Column(String(50), default="exact")
    time_limit_ms = Column(Integer, default=2000)
    memory_limit_mb = Column(Integer, default=1024)

    # RELACIONES EXISTENTES
    course_offering = relationship(
        "CourseOffering",
        back_populates="exercises"
    )

    submissions = relationship(
        "Submission",
        back_populates="exercise"
    )

    test_cases = relationship(
        "TestCase",
        back_populates="exercise",
        cascade="all, delete"
    )

    rubric = relationship(
        "Rubric",
        back_populates="exercise",
        uselist=False,
        cascade="all, delete"
    )

    exercise_languages = relationship(
        "ExerciseLanguage",
        back_populates="exercise",
        cascade="all, delete"
    )

    # 🆕 NUEVA RELACIÓN - ¡ESTA ES LA QUE FALTA!
    arguments = relationship(
        "ProblemArgument",
        back_populates="problem",
        cascade="all, delete-orphan",
        lazy="selectin"  # Para cargar automáticamente
    )