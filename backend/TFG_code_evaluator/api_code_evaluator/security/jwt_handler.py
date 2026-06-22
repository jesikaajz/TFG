from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext
import os

# -------------------------
# CONFIG
# -------------------------

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY environment variable is required")

ALGORITHM = "HS256"
ACCESS_EXPIRE_MINUTES = int(os.getenv("ACCESS_EXPIRE_MINUTES", 30))
REFRESH_EXPIRE_DAYS = int(os.getenv("REFRESH_EXPIRE_DAYS", 7))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# -------------------------
# PASSWORDS
# -------------------------

def hash_password(password: str) -> str:
    # bcrypt limita a 72 bytes
    password = password[:72]
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    # mismo recorte para comparar correctamente
    plain_password = plain_password[:72]
    return pwd_context.verify(plain_password, hashed_password)


# -------------------------
# TOKENS
# -------------------------

def create_token(data: dict, expires_delta: timedelta, token_type: str):
    payload = data.copy()
    payload.update({
        "exp": datetime.utcnow() + expires_delta,
        "type": token_type
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def create_access_token(data: dict):
    return create_token(
        data,
        timedelta(minutes=ACCESS_EXPIRE_MINUTES),
        "access"
    )


def create_refresh_token(data: dict):
    return create_token(
        data,
        timedelta(days=REFRESH_EXPIRE_DAYS),
        "refresh"
    )


def decode_token(token: str, expected_type: str = None):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
            options={"require": ["exp", "type"]}
        )

        if expected_type and payload.get("type") != expected_type:
            return None

        return payload
    except JWTError:
        return None

def create_reset_token(data: dict, expires_minutes: int = 60):
    """Crea un token específico para reset de contraseña"""
    payload = data.copy()
    payload.update({
        "exp": datetime.utcnow() + timedelta(minutes=expires_minutes),
        "type": "reset"
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)