from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.enrollment_detail_model import EnrollmentDetail
from ..models.user_model import User
from ..schemas.enrollment_detail_schema import (
    EnrollmentDetailCreate,
    EnrollmentDetailResponse
)
from ..dependencies.auth_dependencies import (
    admin_required,
    get_current_user
)

router = APIRouter(
    prefix="/enrollment-details",
    tags=["Enrollment Details"]
)


@router.get("/", response_model=list[EnrollmentDetailResponse])
def get_all(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return db.query(EnrollmentDetail).all()


@router.post("/", response_model=EnrollmentDetailResponse)
def create(
    data: EnrollmentDetailCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    exists = db.query(EnrollmentDetail).filter(
        EnrollmentDetail.enrollment_id == data.enrollment_id,
        EnrollmentDetail.offering_id == data.offering_id
    ).first()

    if exists:
        raise HTTPException(400, "Enrollment detail already exists")

    detail = EnrollmentDetail(**data.model_dump())

    db.add(detail)
    db.commit()
    db.refresh(detail)

    return detail


@router.delete("/")
def delete(
    enrollment_id: int,
    offering_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    detail = db.query(EnrollmentDetail).filter(
        EnrollmentDetail.enrollment_id == enrollment_id,
        EnrollmentDetail.offering_id == offering_id
    ).first()

    if not detail:
        raise HTTPException(404, "Enrollment detail not found")

    db.delete(detail)
    db.commit()

    return {"message": "Enrollment detail deleted"}