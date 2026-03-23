from pydantic import BaseModel


class TestResultResponse(BaseModel):
    id: int
    test_case_id: int
    passed: bool
    actual_output: str | None
    error: str | None
    execution_time: float | None

    class Config:
        from_attributes = True