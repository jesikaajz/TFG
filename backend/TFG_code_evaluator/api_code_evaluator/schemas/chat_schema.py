# schemas/chat_schema.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

# Añadir este schema para los attachments
class ChatAttachmentResponse(BaseModel):
    id: int
    filename: str
    file_size: int
    file_size_formatted: Optional[str] = None
    mime_type: str
    download_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class ChatMessageCreate(BaseModel):
    receiver_id: Optional[int] = None
    course_offering_id: Optional[int] = None
    message: str
    
    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    sender_name: str
    sender_role: str
    receiver_id: Optional[int] = None
    receiver_name: Optional[str] = None
    course_offering_id: Optional[int] = None
    course_name: Optional[str] = None
    message: str
    is_read: bool
    is_edited: bool
    has_attachment: bool = False          # <-- CAMPO NUEVO
    attachments: List[ChatAttachmentResponse] = []  # <-- CAMPO NUEVO
    created_at: datetime
    edited_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True


class ChatConversationResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    user_role: str
    last_message: Optional[str] = None
    last_message_at: datetime
    unread_count: int
    
    class Config:
        from_attributes = True