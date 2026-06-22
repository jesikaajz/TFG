# models/chat_attachment_model.py
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class ChatAttachment(Base):
    __tablename__ = "chat_attachments"

    id = Column(Integer, primary_key=True, index=True)
    
    message_id = Column(
        Integer,
        ForeignKey("chat_messages.id", ondelete="CASCADE"),
        nullable=False
    )
    
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, nullable=False)
    mime_type = Column(String, nullable=False)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    message = relationship("ChatMessage", back_populates="attachments")


# Actualizar ChatMessage para incluir attachments
# En models/chat_message_model.py, agregar:
# attachments = relationship("ChatAttachment", back_populates="message", cascade="all, delete-orphan")