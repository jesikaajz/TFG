from pydantic import BaseModel
from typing import Optional


class TestResultResponse(BaseModel):

    id: int

    evaluation_id: int

    test_case_id: int

    passed: bool

    actual_output: Optional[str] = None

    error: Optional[str] = None

    execution_time: Optional[float] = None

    model_config = {
        "from_attributes": True
    }