# =====================================================
# ADMIN: LISTAR SESIONES DE UN USUARIO
# =====================================================
@router.get("/sessions/{user_id}")
def get_user_sessions(
    user_id: int,
    current_user: User = Depends(admin_required),  # Solo admins
    db: Session = Depends(get_db)
):
    """Obtener todas las sesiones de un usuario (solo admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    sessions = db.query(UserSession).filter(
        UserSession.user_id == user_id
    ).order_by(UserSession.expires_at.desc()).all()
    
    return {
        "user_id": user_id,
        "user_email": user.email,
        "total_sessions": len(sessions),
        "active_sessions": sum(1 for s in sessions if not s.revoked and s.expires_at > datetime.utcnow()),
        "sessions": [
            {
                "id": s.id,
                "device_id": s.device_id,
                "device_name": s.device_name,
                "ip": s.ip,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "expires_at": s.expires_at.isoformat() if s.expires_at else None,
                "revoked": s.revoked,
                "used": s.used
            }
            for s in sessions
        ]
    }


# =====================================================
# USER: MIS PROPIAS SESIONES
# =====================================================
@router.get("/my-sessions")
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Obtener las sesiones del usuario actual"""
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).order_by(UserSession.expires_at.desc()).all()
    
    return {
        "total_sessions": len(sessions),
        "active_sessions": sum(1 for s in sessions if not s.revoked and s.expires_at > datetime.utcnow()),
        "sessions": [
            {
                "id": s.id,
                "device_id": s.device_id,
                "device_name": s.device_name,
                "ip": s.ip,
                "created_at": s.created_at.isoformat() if s.created_at else None,
                "expires_at": s.expires_at.isoformat() s.expires_at else None,
                "is_active": not s.revoked and s.expires_at > datetime.utcnow()
            }
            for s in sessions
        ]
    }


# =====================================================
# ADMIN: REVOCAR SESIÓN ESPECÍFICA
# =====================================================
@router.delete("/sessions/{session_id}")
def revoke_session(
    session_id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Revocar una sesión específica (solo admin)"""
    session = db.query(UserSession).filter(UserSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.revoked = True
    db.commit()
    
    return {"message": f"Session {session_id} revoked successfully"}


# =====================================================
# ADMIN: LIMPIAR SESIONES EXPIRADAS
# =====================================================
@router.delete("/sessions/cleanup")
def cleanup_expired_sessions(
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Eliminar todas las sesiones expiradas (solo admin)"""
    now = datetime.utcnow()
    
    # Marcar como revocadas las expiradas
    expired = db.query(UserSession).filter(
        UserSession.expires_at < now,
        UserSession.revoked == False
    ).update({"revoked": True}, synchronize_session=False)
    
    # Opcional: Eliminar físicamente las muy antiguas (más de 30 días)
    old_date = now - timedelta(days=30)
    deleted = db.query(UserSession).filter(
        UserSession.expires_at < old_date
    ).delete(synchronize_session=False)
    
    db.commit()
    
    return {
        "message": "Cleanup completed",
        "expired_revoked": expired,
        "old_deleted": deleted
    }


# =====================================================
# ADMIN: REVOCAR TODAS LAS SESIONES DE UN USUARIO
# =====================================================
@router.post("/sessions/revoke-all/{user_id}")
def revoke_all_user_sessions(
    user_id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """Revocar todas las sesiones de un usuario (solo admin)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    result = db.query(UserSession).filter(
        UserSession.user_id == user_id,
        UserSession.revoked == False
    ).update({"revoked": True}, synchronize_session=False)
    
    db.commit()
    
    return {
        "message": f"All sessions revoked for user {user_id}",
        "sessions_revoked": result
    }


# =====================================================
# ADMIN: LIMPIAR SESIONES DUPLICADAS POR DEVICE_ID
# =====================================================
@router.post("/sessions/cleanup-duplicates/{user_id}")
def cleanup_duplicate_sessions(
    user_id: int,
    current_user: User = Depends(admin_required),
    db: Session = Depends(get_db)
):
    """
    Mantener solo la sesión más reciente por device_id
    Útil cuando hay muchas sesiones del mismo dispositivo
    """
    from sqlalchemy import func
    
    # Obtener la sesión más reciente por device_id
    subquery = db.query(
        UserSession.device_id,
        func.max(UserSession.created_at).label('max_created')
    ).filter(
        UserSession.user_id == user_id,
        UserSession.revoked == False
    ).group_by(UserSession.device_id).subquery()
    
    # Revocar sesiones más antiguas
    sessions_to_revoke = db.query(UserSession).join(
        subquery,
        (UserSession.device_id == subquery.c.device_id) &
        (UserSession.created_at < subquery.c.max_created)
    ).filter(
        UserSession.user_id == user_id,
        UserSession.revoked == False
    ).all()
    
    revoked_count = 0
    for session in sessions_to_revoke:
        session.revoked = True
        revoked_count += 1
    
    db.commit()
    
    return {
        "message": f"Duplicate sessions cleaned for user {user_id}",
        "sessions_revoked": revoked_count
    }