# schemas/enrollment_schema.py
from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional, List

class EnrollmentCreate(BaseModel):
    student_id: int
    academic_year_id: int
    offering_ids: List[int]

class EnrollmentUpdate(BaseModel):
    status: Optional[str] = None
    academic_year_id: Optional[int] = None

class EnrollmentResponse(BaseModel):
    id: int
    student_id: int
    academic_year_id: int
    enrollment_date: date
    status: Optional[str] = None

    class Config:
        from_attributes = True


class EnrollmentBulkCreate(BaseModel):
    student_id: int
    academic_year_id: int
    offering_ids: Optional[str] = None  # Comma-separated list of offering IDs


class BulkEnrollmentResult(BaseModel):
    created_count: int
    created: list[EnrollmentResponse]
    errors: list[dict]

class CourseInfo(BaseModel):
    offering_id: int
    course_id: int
    course_name: str
    course_description: str
    teachers: List[str] = []
    teacher_ids: List[int] = []
    academic_year: Optional[str] = None

class EnrollmentWithCoursesResponse(BaseModel):
    id: int
    student_id: int
    academic_year_id: int
    academic_year: Optional[str] = None
    enrollment_date: date
    status: str
    courses: List[CourseInfo]

    class Config:
        from_attributes = True