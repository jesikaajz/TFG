from pydantic import BaseModel
from typing import Optional, Any


class EvaluationBase(BaseModel):
    submission_id: int
    score: Optional[float] = None
    passed_tests: int
    total_tests: int
    feedback: Optional[str] = None
    reviewed: bool = False
    rubric_scores: Optional[Any] = None


class EvaluationCreate(EvaluationBase):
    pass


class EvaluationPatch(BaseModel):
    score: Optional[float] = None
    passed_tests: Optional[int] = None
    total_tests: Optional[int] = None
    feedback: Optional[str] = None
    reviewed: Optional[bool] = None
    rubric_scores: Optional[Any] = None


class EvaluationResponse(EvaluationBase):
    id: int

    model_config = {
        "from_attributes": True
    }