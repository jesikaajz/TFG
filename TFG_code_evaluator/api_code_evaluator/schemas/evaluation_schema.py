from pydantic import BaseModel
from datetime import datetime


class EvaluationResponse(BaseModel):
    id: int
    submission_id: int
    score: float | None
    passed_tests: int
    total_tests: int
    created_at: datetime

    class Config:
        from_attributes = True