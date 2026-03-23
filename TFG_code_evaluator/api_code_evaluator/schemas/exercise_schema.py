from pydantic import BaseModel
from datetime import date, datetime
class ExercisePatch(BaseModel):
    title: str | None = None
    description: str | None = None
    deadline: date | None = None
    solution: str | None = None

class ExerciseBase(BaseModel):
    title: str
    description: str
    deadline: date | None = None
    course_id: int

class ExerciseCreate(ExerciseBase):
    solution: str | None = None

class ExerciseResponse(ExerciseBase):
    id: int
    solution: str | None = None

    class Config:
        from_attributes = True