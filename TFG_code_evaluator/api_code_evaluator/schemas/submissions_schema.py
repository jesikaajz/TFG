from pydantic import BaseModel
from datetime import datetime


class SubmissionCreate(BaseModel):
    exercise_id: int
    code: str


class SubmissionResponse(BaseModel):
    id: int
    exercise_id: int
    status: str
    submitted_at: datetime

    class Config:
        from_attributes = True