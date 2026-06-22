from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..bd.connection import get_db

from ..models.programming_languages_model import ProgrammingLanguage
from ..models.user_model import User

from ..schemas.programming_language_schema import (
    ProgrammingLanguageCreate,
    ProgrammingLanguagePatch,
    ProgrammingLanguageResponse
)

from ..dependencies.auth_dependencies import (
    admin_required,
    get_current_user
)

router = APIRouter(
    prefix="/programming-languages",
    tags=["Programming Languages"]
)


@router.get("/", response_model=list[ProgrammingLanguageResponse])
def get_all(
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    return db.query(ProgrammingLanguage).all()


@router.get("/{language_id}", response_model=ProgrammingLanguageResponse)
def get_one(
    language_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user)
):
    language = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.id == language_id
    ).first()

    if not language:
        raise HTTPException(404, "Language not found")

    return language


@router.post("/", response_model=ProgrammingLanguageResponse)
def create(
    data: ProgrammingLanguageCreate,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    exists = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.name == data.name,
        ProgrammingLanguage.version == data.version
    ).first()

    if exists:
        raise HTTPException(400, "Language already exists")

    new_language = ProgrammingLanguage(**data.dict())

    db.add(new_language)
    db.commit()
    db.refresh(new_language)

    return new_language


@router.patch("/{language_id}", response_model=ProgrammingLanguageResponse)
def patch(
    language_id: int,
    data: ProgrammingLanguagePatch,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    language = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.id == language_id
    ).first()

    if not language:
        raise HTTPException(404, "Language not found")

    for key, value in data.dict(exclude_unset=True).items():
        setattr(language, key, value)

    db.commit()
    db.refresh(language)

    return language


@router.delete("/{language_id}")
def delete(
    language_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(admin_required)
):
    language = db.query(ProgrammingLanguage).filter(
        ProgrammingLanguage.id == language_id
    ).first()

    if not language:
        raise HTTPException(404, "Language not found")

    db.delete(language)
    db.commit()

    return {"message": "Language deleted"}