from pydantic import BaseModel
from typing import Optional, List, Any

class SubjectBase(BaseModel):
    name: str
    description: Optional[str] = None

class SubjectCreate(SubjectBase):
    pass

class SubjectPatch(BaseModel):
    name: str | None = None
    description: str | None = None

class SubjectResponse(SubjectBase):
    id: int

    class Config:
        from_attributes = True

class BulkSubjectResult(BaseModel):
    created_count: int
    created: List[SubjectResponse]
    errors: List[dict[str, Any]]