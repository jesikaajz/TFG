from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from pydantic import EmailStr
from sqlalchemy.orm import Session
from fastapi import Body
from datetime import datetime, timedelta

import hashlib
from ..security.jwt_handler import create_reset_token, decode_token, create_access_token, create_refresh_token, hash_password, verify_password
from ..security.redis_client import is_blacklisted, blacklist_token, increment_rate_limit
from ..models.user_model import User
from ..services.email_service import send_reset_password_email
from ..bd.connection import get_db
from ..dependencies.auth_dependencies import get_current_user
from ..models.user_model import User
from ..models.usersession_model import UserSession
from ..schemas.auth_schema import LoginRequest, RefreshRequest, TokenResponse
from ..schemas.user_schema import PasswordStr, UserResponse
import os
import logging
logger = logging.getLogger(__name__)
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

from ..security.jwt_handler import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password
)

from ..security.redis_client import is_blacklisted, blacklist_token, increment_rate_limit


router = APIRouter(prefix="/auth", tags=["Auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
# =====================================================
# LOGIN (Swagger OAuth2 form)
# =====================================================
@router.post("/login", response_model=TokenResponse)
def login_swagger(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    ip = request.client.host or "unknown"
    if increment_rate_limit(f"rate:login:ip:{ip}", 10, 300):
        raise HTTPException(status_code=429, detail="Too many login attempts from this IP. Try again later.")

    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Prevent users created via bulk import (temporary passwords) from using normal login
    if getattr(user, "needs_password_change", False):
        raise HTTPException(status_code=403, detail="Account requires initial password change. Use /auth/login-temp to sign in with the temporary password.")

    return _generate_tokens(user, request, db)


# =====================================================
# LOGIN (Frontend JSON)
# =====================================================
@router.post("/login-json", response_model=TokenResponse)
def login_json(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    logger.info(f"Intento de login para email: {data.email} desde IP: {request.client.host}")
    
    ip = request.client.host or "unknown"
    email = data.email.lower()

    if increment_rate_limit(f"rate:login:ip:{ip}", 10, 300):
        logger.warning(f"Demasiados intentos de login desde IP {ip}")
        raise HTTPException(status_code=429, detail="Too many login attempts from this IP. Try again later.")

    if increment_rate_limit(f"rate:login:email:{email}", 5, 300):
        logger.warning(f"Demasiados intentos de login para la cuenta {email}")
        raise HTTPException(status_code=429, detail="Too many login attempts for this account. Try again later.")

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        logger.warning(f"Login fallido para email {data.email} - credenciales inválidas")
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if getattr(user, "needs_password_change", False):
        logger.warning(f"Intento de login normal para usuario con contraseña temporal: {email}")
        raise HTTPException(status_code=403, detail="Account requires initial password change. Use /auth/login-temp to sign in with the temporary password.")

    logger.info(f"Login exitoso para usuario {user.id} ({email})")
    return _generate_tokens(user, request, db)


# =====================================================
# TEMPORARY LOGIN (for users created from Excel)
@router.post("/login-temp", response_model=TokenResponse)
def login_temp(
    data: LoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    ip = request.client.host or "unknown"
    if increment_rate_limit(f"rate:login_temp:ip:{ip}", 10, 300):
        raise HTTPException(status_code=429, detail="Too many login attempts from this IP. Try again later.")

    user = db.query(User).filter(User.email == data.email).first()

    if not user or not verify_password(data.password, user.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Only allow this endpoint for accounts that need a password change
    if not getattr(user, "needs_password_change", False):
        raise HTTPException(status_code=403, detail="This endpoint is only for users with temporary passwords.")

    return _generate_tokens(user, request, db)


# =====================================================
# CORE TOKEN GENERATION
# =====================================================
def _generate_tokens(user: User, request: Request, db: Session):

    device_id = request.headers.get("X-Device-ID", "unknown")
    ip = request.client.host
    user_agent = request.headers.get("User-Agent", "unknown")

    # 🔧 NUEVO: Buscar si ya existe una sesión activa para este dispositivo
    existing_session = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.device_id == device_id,
        UserSession.revoked == False
    ).first()
    
    if existing_session:
        # ✅ MISMO DISPOSITIVO → REUTILIZAR SESIÓN EXISTENTE
        # Actualizar expires_at para extender la sesión
        existing_session.expires_at = datetime.utcnow() + timedelta(days=7)
        existing_session.used = False  # Resetear usado si es necesario
        db.commit()
        
        # Generar NUEVOS tokens (manteniendo la misma sesión)
        access_token = create_access_token({
            "user_id": user.id,
            "role": user.role
        })
        
        refresh_token = create_refresh_token({
            "user_id": user.id,
            "role": user.role
        })
        
        # Actualizar el refresh_token_hash en la sesión existente
        new_refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        existing_session.refresh_token_hash = new_refresh_hash
        db.commit()
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "password_change_required": user.needs_password_change,
        }
    
    # DISPOSITIVO DIFERENTE → CREAR NUEVA SESIÓN
    # Limitar a 5 sesiones activas por usuario 
    MAX_SESSIONS = 5
    
    active_count = db.query(UserSession).filter(
        UserSession.user_id == user.id,
        UserSession.revoked == False
    ).count()
    
    if active_count >= MAX_SESSIONS:
        # Revocar la sesión más antigua (FIFO)
        oldest = db.query(UserSession).filter(
            UserSession.user_id == user.id,
            UserSession.revoked == False
        ).order_by(UserSession.created_at.asc()).first()
        
        if oldest:
            oldest.revoked = True
            db.commit()

    # Crear NUEVA sesión para el nuevo dispositivo
    access_token = create_access_token({
        "user_id": user.id,
        "role": user.role
    })

    refresh_token = create_refresh_token({
        "user_id": user.id,
        "role": user.role
    })

    refresh_hash = hashlib.sha256(refresh_token.encode()).hexdigest()

    session = UserSession(
        user_id=user.id,
        refresh_token_hash=refresh_hash,
        device_id=device_id,
        ip=ip,
        device_name=user_agent,
        expires_at=datetime.utcnow() + timedelta(days=7),
        revoked=False,
        used=False
    )

    db.add(session)
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "password_change_required": user.needs_password_change,
    }


# =====================================================
# REFRESH TOKEN (ROTATION + REUSE DETECTION)
# =====================================================
@router.post("/refresh", response_model=TokenResponse)
def refresh(data: RefreshRequest, request: Request, db: Session = Depends(get_db)):

    ip = request.client.host or "unknown"
    if increment_rate_limit(f"rate:refresh:ip:{ip}", 30, 60):
        raise HTTPException(status_code=429, detail="Too many refresh attempts from this IP. Try again later.")

    payload = decode_token(data.refresh_token, expected_type="refresh")

    if not payload:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()

    session = db.query(UserSession).filter(
        UserSession.refresh_token_hash == token_hash
    ).first()

    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")

    # reuse detection
    if session.used:
        db.query(UserSession).filter(
            UserSession.user_id == session.user_id
        ).update({"revoked": True})
        db.commit()
        raise HTTPException(
            status_code=401,
            detail="Refresh token reuse detected. All sessions revoked."
        )

    if session.revoked:
        raise HTTPException(status_code=401, detail="Session revoked")

    session.used = True
    session.revoked = True

    db.commit()

    clean_payload = {
        "user_id": payload["user_id"],
        "role": payload["role"]
    }

    new_access = create_access_token(clean_payload)
    new_refresh = create_refresh_token(clean_payload)

    new_session = UserSession(
        user_id=payload["user_id"],
        refresh_token_hash=hashlib.sha256(new_refresh.encode()).hexdigest(),
        device_id=session.device_id,
        ip=session.ip,
        device_name=session.device_name,
        expires_at=datetime.utcnow() + timedelta(days=7),
        revoked=False,
        used=False
    )

    db.add(new_session)
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "password_change_required": user.needs_password_change,
    }


# =====================================================
# LOGOUT
# =====================================================
@router.post("/logout")
def logout(
    data: RefreshRequest,
    request: Request,
    db: Session = Depends(get_db)
):

    payload = decode_token(data.refresh_token, expected_type="refresh")

    if payload:
        token_hash = hashlib.sha256(data.refresh_token.encode()).hexdigest()

        session = db.query(UserSession).filter(
            UserSession.refresh_token_hash == token_hash
        ).first()

        if session:
            session.revoked = True
            db.commit()

        blacklist_token(data.refresh_token, payload.get("exp"))

    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        access_token = auth_header.split(" ", 1)[1].strip()
        access_payload = decode_token(access_token, expected_type="access")
        if access_payload:
            blacklist_token(access_token, access_payload.get("exp"))

    return {"message": "Logged out"}


# =====================================================
# LOGOUT ALL SESSIONS
# =====================================================
@router.post("/logout-all")
def logout_all(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).update({"revoked": True}, synchronize_session=False)
    db.commit()

    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        access_token = auth_header.split(" ", 1)[1].strip()
        access_payload = decode_token(access_token, expected_type="access")
        if access_payload:
            blacklist_token(access_token, access_payload.get("exp"))

    return {"message": "All sessions revoked"}


# =====================================================
# CURRENT USER
# =====================================================
@router.get("/me", response_model=UserResponse)
def current_user_profile(
    current_user: User = Depends(get_current_user)
):
    return current_user


@router.post("/verify")
def verify_token(
    current_user: User = Depends(get_current_user)
):
    return {
        "valid": True,
        "user_id": current_user.id,
        "role": current_user.role
    }


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    if is_blacklisted(token):
        raise HTTPException(status_code=401, detail="Token revoked")

    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == payload["user_id"]).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@router.post("/forgot-password")
def forgot_password(
    email: EmailStr,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return {"message": "If email exists, a reset link has been sent"}
    
    # Usar create_token en lugar de create_reset_token
    from ..security.jwt_handler import create_token
    reset_token = create_token(
        data={"user_id": user.id},
        expires_delta=timedelta(hours=1),
        token_type="reset"
    )
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    
    try:
        send_reset_password_email(user.email, reset_link, user.name)
    except Exception as e:
        print(f"Error sending email: {e}")
    
    return {"message": "If email exists, a reset link has been sent"}

@router.post("/reset-password")
def reset_password(
    token: str,
    new_password: str,  # ← Sin Body, viene de query string
    db: Session = Depends(get_db)
):
    print("🔍 Token recibido:", token)
    print("🔍 New password recibida:", new_password)

    payload = decode_token(token)
    if not payload or payload.get("type") != "reset":
        raise HTTPException(401, detail="Invalid or expired token")
    
    if len(new_password) < 8:
        raise HTTPException(400, detail="La contraseña debe tener al menos 8 caracteres")
    if ' ' in new_password:
        raise HTTPException(400, detail="La contraseña no puede contener espacios")
    
    user = db.query(User).filter(User.id == payload["user_id"]).first()
    if not user:
        raise HTTPException(404, detail="User not found")
    
    user.password = hash_password(new_password)
    user.needs_password_change = False
    db.commit()
    
    return {"message": "Password reset successfully"}