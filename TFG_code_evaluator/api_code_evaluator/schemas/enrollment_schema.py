from pydantic import BaseModel
from datetime import date

class EnrollmentBase(BaseModel):
    student_id: int
    course_id: int
    academic_year_id: int
    enrollment_date: date

class EnrollmentCreate(EnrollmentBase):
    pass

class EnrollmentResponse(EnrollmentBase):
    id: int

    class Config:
        orm_mode = True
        
class EnrollmentUpdate(BaseModel):
    student_id: int | None
    course_id: int | None
    academic_year_id: int | None
    enrollment_date: date | None

    class Config:
        from_attributes = True