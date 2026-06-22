from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from ..bd.connection import get_db
from ..security.jwt_handler import  decode_token
from ..models.user_model import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

from ..security.redis_client import is_blacklisted

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):

    if is_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token revoked")

    payload = decode_token(token, expected_type="access")

    if not payload:
        raise HTTPException(status_code=401)

    user = db.query(User).filter(User.id == payload["user_id"]).first()

    return user

def admin_required(current_user: User = Depends(get_current_user)):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin privileges required"
        )

    return current_user