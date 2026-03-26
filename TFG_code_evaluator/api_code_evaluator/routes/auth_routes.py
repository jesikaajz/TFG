from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..schemas.user_schema import UserCreate, UserResponse
from ..bd.connection import get_db
from ..models.user_model import User
from ..security.jwt_handler import create_refresh_token, decode_token, hash_password, verify_password, create_access_token
from fastapi.security import OAuth2PasswordBearer
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

# REGISTER
@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()

    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = User(
        email=user.email,
        name=user.name,
        password=hash_password(user.password),
        role="student"  # 🔐 FORZADO SIEMPRE
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    access_token = create_access_token({"user_id": user.id, "role": user.role})
    refresh_token = create_refresh_token({"user_id": user.id, "role": user.role})

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }


@router.post("/refresh")
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    new_access_token = create_access_token({"user_id": user.id, "role": user.role})
    return {"access_token": new_access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):

    payload = decode_token(token)

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["user_id"]).first()

    return user


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/me")
def update_my_profile(
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):

    current_user.name = name

    db.commit()
    db.refresh(current_user)

    return current_user