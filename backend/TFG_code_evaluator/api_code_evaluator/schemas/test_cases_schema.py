# schemas/test_cases_schema.py
from pydantic import BaseModel
from typing import Any, Optional

class TestCaseCreate(BaseModel):
    exercise_id: int
    input_data: Any  # Puede ser int, float, str, list, dict
    expected_output: Any
    is_hidden: Optional[bool] = False

class TestCasePatch(BaseModel):
    input_data: Optional[Any] = None
    expected_output: Optional[Any] = None
    is_hidden: Optional[bool] = None

class TestCaseResponse(TestCaseCreate):
    id: int