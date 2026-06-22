from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from datetime import datetime

from ..bd.connection import Base


class UserSession(Base):
    __tablename__ = "user_sessions"

    id = Column(Integer, primary_key=True)

    user_id = Column(Integer, ForeignKey("users.id"), index=True)

    refresh_token_hash = Column(String, nullable=False)

    device_id = Column(String, index=True)
    device_name = Column(String, nullable=True)

    ip = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)

    revoked = Column(Boolean, default=False)

    used = Column(Boolean, default=False)