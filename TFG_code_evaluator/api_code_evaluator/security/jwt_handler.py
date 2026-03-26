from datetime import datetime, timedelta
from jose import jwt, JWTError
from passlib.context import CryptContext

SECRET_KEY = "tu_clave_super_secreta"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7  # refresh token más largo

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Hashing y verificación de password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# JWT genérico
def create_token(data: dict, expires_delta: timedelta):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Access token
def create_access_token(data: dict):
    return create_token(data, timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))

# Refresh token
def create_refresh_token(data: dict):
    return create_token(data, timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))

# Decodificar token (devuelve payload o None)
def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None