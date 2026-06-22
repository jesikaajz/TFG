from pydantic import BaseModel

class AcademicYearBase(BaseModel):
    start_year: int
    end_year: int

class AcademicYearCreate(AcademicYearBase):
    pass

class AcademicYearPatch(BaseModel):
    start_year: int | None = None
    end_year: int | None = None

class AcademicYearResponse(AcademicYearBase):
    id: int

    class Config:
        from_attributes = True