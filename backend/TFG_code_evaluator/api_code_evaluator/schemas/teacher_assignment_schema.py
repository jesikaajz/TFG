# schemas/teacher_assignment_schema.py
from pydantic import BaseModel

class TeacherAssignmentBase(BaseModel):
    professor_id: int
    course_offering_id: int
    is_tutor: bool = False  # NUEVO

class TeacherAssignmentCreate(TeacherAssignmentBase):
    pass

class TeacherAssignmentPatch(BaseModel):
    professor_id: int | None = None
    course_offering_id: int | None = None
    is_tutor: bool | None = None  # NUEVO

class TeacherAssignmentResponse(TeacherAssignmentBase):
    id: int

    model_config = {
        "from_attributes": True
    }

class BulkTeacherAssignmentResult(BaseModel):
    created_count: int
    created: list[TeacherAssignmentResponse]
    errors: list[dict]

class TeacherAssignmentBulkCreate(BaseModel):
    assignments: list[TeacherAssignmentCreate]