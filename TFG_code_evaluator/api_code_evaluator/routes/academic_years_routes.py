from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db
from ..models.academic_year_model import AcademicYear
from ..schemas.academic_year_schema import AcademicYearCreate, AcademicYearPatch, AcademicYearResponse
from ..dependencies.auth_dependencies import admin_required, get_current_user
from ..models.user_model import User

router = APIRouter(
    prefix="/academic-years",
    tags=["Academic Years"]  
)

# 🔹 GET ALL (cualquier usuario autenticado)
@router.get("/", response_model=list[AcademicYearResponse])
def get_all(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(AcademicYear).all()


# 🔹 GET BY ID
@router.get("/{year_id}", response_model=AcademicYearResponse)
def get_one(year_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()

    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    return year


# 🔹 CREATE (solo admin)
@router.post("/", response_model=AcademicYearResponse)
def create(
    year: AcademicYearCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    new_year = AcademicYear(
        start_year=year.start_year,
        end_year=year.end_year
    )

    db.add(new_year)
    db.commit()
    db.refresh(new_year)

    return new_year


# 🔹 UPDATE (solo admin)
@router.put("/{year_id}", response_model=AcademicYearResponse)
def update(
    year_id: int,
    data: AcademicYearCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()

    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    year.start_year = data.start_year
    year.end_year = data.end_year

    db.commit()
    db.refresh(year)

    return year


# 🔹 DELETE (solo admin)
@router.delete("/{year_id}")
def delete(
    year_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()

    if not year:
        raise HTTPException(status_code=404, detail="Academic year not found")

    db.delete(year)
    db.commit()

    return {"message": "Academic year deleted"}

@router.patch("/{year_id}", response_model=AcademicYearResponse)
def patch_year(
    year_id: int,
    data: AcademicYearPatch,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    year = db.query(AcademicYear).filter(AcademicYear.id == year_id).first()

    if not year:
        raise HTTPException(404, "Academic year not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(year, key, value)

    db.commit()
    db.refresh(year)

    return year