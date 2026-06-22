from pydantic import BaseModel

class CourseOfferingBase(BaseModel):
    subject_id: int
    academic_year_id: int

class CourseOfferingCreate(CourseOfferingBase):
    pass

class CourseOfferingPatch(BaseModel):
    subject_id: int | None = None
    academic_year_id: int | None = None

class CourseOfferingResponse(CourseOfferingBase):
    id: int

    class Config:
        from_attributes = True


class BulkCourseOfferingResult(BaseModel):
    created_count: int
    created: list[CourseOfferingResponse]
    errors: list[dict]