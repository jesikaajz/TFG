from pydantic import BaseModel


class EnrollmentDetailBase(BaseModel):
    enrollment_id: int
    offering_id: int


class EnrollmentDetailCreate(EnrollmentDetailBase):
    pass


class EnrollmentDetailPatch(BaseModel):
    offering_id: int | None = None


class EnrollmentDetailResponse(EnrollmentDetailBase):

    model_config = {
        "from_attributes": True
    }