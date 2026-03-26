from pydantic import BaseModel

class CourseBase(BaseModel):
    name: str
    professor_id: int
    description: str
    year: int

class CourseCreate(CourseBase):
    pass

class CourseUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    year: int | None = None

class CourseResponse(CourseBase):
    id: int

    class Config:
        from_attributes = True