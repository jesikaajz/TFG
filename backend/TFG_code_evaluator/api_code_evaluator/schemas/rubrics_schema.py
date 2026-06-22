from pydantic import BaseModel
from typing import Dict


class RubricBase(BaseModel):
    exercise_id: int
    criteria: Dict


class RubricCreate(RubricBase):
    pass


class RubricPatch(BaseModel):
    criteria: Dict | None = None


class RubricResponse(RubricBase):
    id: int

    model_config = {
        "from_attributes": True
    }