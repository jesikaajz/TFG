# models/chat_message_model.py
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..bd.connection import Base

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    
    # Quién envía
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Quién recibe (si es null, es mensaje de grupo/broadcast)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Para chats de curso (opcional)
    course_offering_id = Column(Integer, ForeignKey("course_offerings.id", ondelete="CASCADE"), nullable=True)
    
    # Contenido
    message = Column(Text, nullable=False)
    
    # Metadatos
    is_read = Column(Boolean, default=False)
    is_edited = Column(Boolean, default=False)
    edited_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, server_default=func.now())
    
    # Relaciones
    sender = relationship("User", foreign_keys=[sender_id], backref="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], backref="received_messages")
    course_offering = relationship("CourseOffering", backref="chat_messages")
    attachments = relationship("ChatAttachment", back_populates="message", cascade="all, delete-orphan")
    
    # Índices para búsqueda rápida
    __table_args__ = (
        Index('idx_chat_sender_receiver', 'sender_id', 'receiver_id'),
        Index('idx_chat_course', 'course_offering_id'),
        Index('idx_chat_created', 'created_at'),
    )


class ChatConversation(Base):
    """Resumen de conversaciones para mostrar en el panel"""
    __tablename__ = "chat_conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    
    user1_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user2_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    last_message = Column(Text, nullable=True)
    last_message_at = Column(DateTime, server_default=func.now())
    last_message_sender_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    unread_count_user1 = Column(Integer, default=0)
    unread_count_user2 = Column(Integer, default=0)
    
    is_active = Column(Boolean, default=True)
    
    __table_args__ = (
        Index('idx_conversation_users', 'user1_id', 'user2_id'),
    )

