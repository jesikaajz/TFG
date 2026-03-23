from pydantic import BaseModel
class TestCasePatch(BaseModel):
    input: str | None = None
    expected_output: str | None = None
class TestCaseBase(BaseModel):
    input: str
    expected_output: str
    exercise_id: int

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseResponse(TestCaseBase):
    id: int

    class Config:
        from_attributes = True