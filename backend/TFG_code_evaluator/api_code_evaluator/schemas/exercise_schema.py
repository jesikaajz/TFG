from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExerciseBase(BaseModel):
    title: str
    description: str
    deadline: Optional[datetime] = None
    course_offering_id: int
    solution: Optional[str] = None
    visibility: Optional[bool] = True
    evaluation_mode: Optional[str] = "function"
    return_type: Optional[str] = "json"          # ← AÑADE ESTO

class ExerciseCreate(ExerciseBase):
    pass

class ExercisePatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    deadline: Optional[datetime] = None
    course_offering_id: Optional[int] = None
    solution: Optional[str] = None
    visibility: Optional[bool] = None
    evaluation_mode: Optional[str] = None
    return_type: Optional[str] = None            # ← AÑADE ESTO

class ExerciseResponse(ExerciseBase):
    id: int
    # Los demás campos ya los hereda de ExerciseBase

    class Config:
        from_attributes = True