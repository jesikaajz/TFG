from pydantic import BaseModel
from datetime import datetime


class SubmissionCreate(BaseModel):
    exercise_id: int
    language_id: int
    code: str


class SubmissionPatch(BaseModel):
    status: str | None = None
    code: str | None = None
    language_id: int | None = None


class SubmissionResponse(BaseModel):
    id: int
    student_id: int
    exercise_id: int
    language_id: int | None
    code: str
    status: str
    submitted_at: datetime

    model_config = {
        "from_attributes": True
    }