from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..models.user_model import User
from ..models.usersession_model import UserSession
from ..dependencies.auth_dependencies import get_current_user
from ..bd.connection import get_db

router = APIRouter(prefix="", tags=["Sessions"])


@router.get("/")
def get_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).all()


@router.get("/me")
def get_my_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).all()

@router.delete("/me")
def revoke_all_sessions(db: Session = Depends(get_db),
                        current_user: User = Depends(get_current_user)):

    db.query(UserSession).filter(
        UserSession.user_id == current_user.id
    ).update(
        {"revoked": True},
        synchronize_session=False
    )

    db.commit()

    return {"message": "all sessions revoked"}

@router.delete("/{session_id}")
def revoke_session(session_id: int,
                   db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):

    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()

    if not session:
        raise HTTPException(status_code=404)

    session.revoked = True
    db.commit()
    db.refresh(session)

    return {"message": "session revoked"}

