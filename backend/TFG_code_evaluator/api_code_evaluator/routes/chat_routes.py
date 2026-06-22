# routes/chat_routes.py
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from typing import Dict, Set, List
from datetime import datetime
import json
import asyncio
import os
import mimetypes
import shutil
import uuid

from ..models.chat_attachment_model import ChatAttachment

from ..bd.connection import get_db
from ..models.user_model import User
from ..models.chat_message_model import ChatMessage, ChatConversation
from ..models.course_offerings_model import CourseOffering
from ..models.enrollment_model import Enrollment
from ..models.enrollment_detail_model import EnrollmentDetail
from ..models.teacher_assignments_model import TeacherAssignment
from ..schemas.chat_schema import ChatMessageCreate, ChatMessageResponse, ChatConversationResponse
from ..dependencies.auth_dependencies import get_current_user, admin_required

router = APIRouter(prefix="/chat", tags=["Chat"])

# Configuración de archivos
CHAT_UPLOAD_DIR = "uploads/chat"
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_FILE_TYPES = [
    "image/jpeg", "image/png", "image/gif", "image/webp",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/zip", "application/x-zip-compressed",
    "application/x-rar-compressed"
]

# Asegurar que el directorio existe
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)


# ==========================================
# FUNCIÓN AUXILIAR: Formatear tamaño de archivo
# ==========================================
def format_file_size(size_bytes: int) -> str:
    """Formatea el tamaño de archivo en una cadena legible"""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.1f} KB"
    else:
        return f"{size_bytes / (1024 * 1024):.1f} MB"


# ==========================================
# FUNCIONES AUXILIARES PARA ATTACHMENTS
# ==========================================
async def get_attachments_for_message(db: Session, message_id: int) -> List[dict]:
    """Obtener attachments de un mensaje"""
    attachments = db.query(ChatAttachment).filter(
        ChatAttachment.message_id == message_id
    ).all()
    
    return [
        {
            "id": att.id,
            "filename": att.filename,
            "file_size": att.file_size,
            "file_size_formatted": format_file_size(att.file_size),
            "mime_type": att.mime_type,
            "download_url": f"/chat/download/{att.id}"
        }
        for att in attachments
    ]


# ==========================================
# GESTIÓN DE CONEXIONES WEBSOCKET
# ==========================================
class ChatConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"Chat: User {user_id} connected")
        
        # Notificar presencia online a los contactos
        await self.broadcast_presence(user_id, "online")
    
    def disconnect(self, user_id: int):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            # Notificar presencia offline
            asyncio.create_task(self.broadcast_presence(user_id, "offline"))
            print(f"Chat: User {user_id} disconnected")
    
    async def send_to_user(self, user_id: int, message: dict):
        if user_id in self.active_connections:
            try:
                await self.active_connections[user_id].send_json(message)
                return True
            except:
                self.disconnect(user_id)
        return False
    
    async def broadcast_presence(self, user_id: int, status: str):
        """Notificar cambio de presencia a los contactos del usuario"""
        for conn_id in list(self.active_connections.keys()):
            if conn_id != user_id:
                await self.send_to_user(conn_id, {
                    "type": "presence",
                    "user_id": user_id,
                    "status": status,
                    "timestamp": datetime.now().isoformat()
                })
    
    async def send_notification(self, user_id: int, title: str, body: str, data: dict = None):
        """Enviar notificación push a un usuario específico"""
        await self.send_to_user(user_id, {
            "type": "notification",
            "title": title,
            "body": body,
            "data": data or {},
            "timestamp": datetime.now().isoformat()
        })


chat_manager = ChatConnectionManager()


# ==========================================
# WEB SOCKET ENDPOINT
# ==========================================
@router.websocket("/ws/{token}")
async def chat_websocket(
    websocket: WebSocket,
    token: str,
    db: Session = Depends(get_db)
):
    """Conexión WebSocket para chat en tiempo real"""
    
    # Autenticar usuario
    from ..security.jwt_handler import decode_token
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    user_id = payload["user_id"]
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        await websocket.close(code=1008, reason="User not found")
        return
    
    await chat_manager.connect(websocket, user_id)
    
    # Enviar resumen de mensajes no leídos al conectar
    unread_messages = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == user_id,
        ChatMessage.is_read == False
    ).order_by(ChatMessage.created_at).all()
    
    # Agrupar por remitente
    unread_by_sender = {}
    for msg in unread_messages:
        unread_by_sender[msg.sender_id] = unread_by_sender.get(msg.sender_id, 0) + 1
    
    for sender_id, count in unread_by_sender.items():
        sender = db.query(User).filter(User.id == sender_id).first()
        if sender:
            await websocket.send_json({
                "type": "unread_summary",
                "sender_id": sender_id,
                "sender_name": sender.name,
                "unread_count": count
            })
    
    db.commit()
    
    try:
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # Procesar según tipo de mensaje
            msg_type = message_data.get("type", "message")
            
            if msg_type == "message":
                # Enviar mensaje
                receiver_id = message_data.get("receiver_id")
                course_offering_id = message_data.get("course_offering_id")
                content = message_data.get("message")
                
                if not content or not content.strip():
                    continue
                
                # Guardar en BD
                new_message = ChatMessage(
                    sender_id=user_id,
                    receiver_id=receiver_id,
                    course_offering_id=course_offering_id,
                    message=content.strip(),
                    is_read=False
                )
                db.add(new_message)
                db.flush()
                
                # Crear o actualizar conversación
                if receiver_id:
                    conv = db.query(ChatConversation).filter(
                        or_(
                            and_(ChatConversation.user1_id == user_id, ChatConversation.user2_id == receiver_id),
                            and_(ChatConversation.user1_id == receiver_id, ChatConversation.user2_id == user_id)
                        )
                    ).first()
                    
                    if not conv:
                        conv = ChatConversation(
                            user1_id=min(user_id, receiver_id),
                            user2_id=max(user_id, receiver_id)
                        )
                        db.add(conv)
                        db.flush()
                    
                    conv.last_message = content.strip()
                    conv.last_message_at = datetime.now()
                    conv.last_message_sender_id = user_id
                    
                    # Incrementar contador no leído para el receptor
                    if conv.user1_id == receiver_id:
                        conv.unread_count_user1 += 1
                    else:
                        conv.unread_count_user2 += 1
                
                db.commit()
                db.refresh(new_message)
                
                # Obtener attachments si existen
                attachments_data = await get_attachments_for_message(db, new_message.id)
                
                # Preparar respuesta del mensaje
                response = {
                    "type": "message",
                    "id": new_message.id,
                    "sender_id": user_id,
                    "sender_name": user.name,
                    "sender_role": user.role,
                    "receiver_id": receiver_id,
                    "message": content.strip(),
                    "has_attachment": len(attachments_data) > 0,
                    "attachments": attachments_data,
                    "created_at": new_message.created_at.isoformat()
                }
                
                # Enviar al emisor (confirmación)
                await chat_manager.send_to_user(user_id, response)
                
                # Enviar al receptor si está conectado
                if receiver_id:
                    await chat_manager.send_to_user(receiver_id, response)
                    
                    # ENVIAR NOTIFICACIÓN PUSH al receptor
                    await chat_manager.send_notification(
                        receiver_id,
                        "Nuevo mensaje",
                        f"{user.name} te ha enviado un mensaje",
                        {
                            "message_id": new_message.id,
                            "sender_id": user_id,
                            "sender_name": user.name,
                            "preview": content[:50] + "..." if len(content) > 50 else content,
                            "has_attachment": len(attachments_data) > 0
                        }
                    )
                    
            elif msg_type == "typing":
                # Indicador de escritura
                receiver_id = message_data.get("receiver_id")
                if receiver_id:
                    await chat_manager.send_to_user(receiver_id, {
                        "type": "typing",
                        "sender_id": user_id,
                        "sender_name": user.name,
                        "is_typing": message_data.get("is_typing", True)
                    })
            
            elif msg_type == "mark_read":
                # Marcar mensajes como leídos
                message_id = message_data.get("message_id")
                if message_id:
                    msg = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
                    if msg and msg.receiver_id == user_id:
                        msg.is_read = True
                        db.commit()
                        
                        # Actualizar contador de conversación
                        conversation = db.query(ChatConversation).filter(
                            or_(
                                and_(ChatConversation.user1_id == user_id, ChatConversation.user2_id == msg.sender_id),
                                and_(ChatConversation.user1_id == msg.sender_id, ChatConversation.user2_id == user_id)
                            )
                        ).first()
                        if conversation:
                            if conversation.user1_id == user_id:
                                conversation.unread_count_user1 = max(0, conversation.unread_count_user1 - 1)
                            else:
                                conversation.unread_count_user2 = max(0, conversation.unread_count_user2 - 1)
                            db.commit()
                            
                            # Notificar al remitente que su mensaje fue leído
                            await chat_manager.send_to_user(msg.sender_id, {
                                "type": "read_receipt",
                                "message_id": message_id,
                                "read_by": user_id
                            })
            
    except WebSocketDisconnect:
        chat_manager.disconnect(user_id)
    except Exception as e:
        print(f"WebSocket error: {e}")
        chat_manager.disconnect(user_id)


# ==========================================
# REST ENDPOINTS
# ==========================================
@router.get("/conversations", response_model=list[ChatConversationResponse])
def get_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener lista de conversaciones del usuario"""
    
    conversations = db.query(ChatConversation).filter(
        or_(
            ChatConversation.user1_id == current_user.id,
            ChatConversation.user2_id == current_user.id
        ),
        ChatConversation.is_active == True
    ).order_by(ChatConversation.last_message_at.desc()).all()
    
    result = []
    for conv in conversations:
        other_user_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        other_user = db.query(User).filter(User.id == other_user_id).first()
        
        unread_count = conv.unread_count_user1 if conv.user1_id == current_user.id else conv.unread_count_user2
        
        result.append({
            "id": conv.id,
            "user_id": other_user.id,
            "user_name": other_user.name,
            "user_role": other_user.role or "pending",
            "last_message": conv.last_message,
            "last_message_at": conv.last_message_at,
            "unread_count": unread_count
        })
    
    return result


@router.get("/messages/{other_user_id}", response_model=list[ChatMessageResponse])
def get_messages(
    other_user_id: int,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener mensajes entre el usuario actual y otro usuario"""
    
    messages = db.query(ChatMessage).filter(
        or_(
            and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == other_user_id),
            and_(ChatMessage.sender_id == other_user_id, ChatMessage.receiver_id == current_user.id)
        )
    ).order_by(ChatMessage.created_at.desc()).offset(offset).limit(limit).all()
    
    # Marcar como leídos
    unread = [m for m in messages if m.receiver_id == current_user.id and not m.is_read]
    for msg in unread:
        msg.is_read = True
    
    # Actualizar contador de conversación
    conv = db.query(ChatConversation).filter(
        or_(
            and_(ChatConversation.user1_id == current_user.id, ChatConversation.user2_id == other_user_id),
            and_(ChatConversation.user1_id == other_user_id, ChatConversation.user2_id == current_user.id)
        )
    ).first()
    
    if conv:
        if conv.user1_id == current_user.id:
            conv.unread_count_user1 = 0
        else:
            conv.unread_count_user2 = 0
    
    db.commit()
    
    result = []
    for msg in messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        
        # Obtener attachments
        attachments = db.query(ChatAttachment).filter(
            ChatAttachment.message_id == msg.id
        ).all()
        
        attachments_data = [
            {
                "id": att.id,
                "filename": att.filename,
                "file_size": att.file_size,
                "file_size_formatted": format_file_size(att.file_size),
                "mime_type": att.mime_type
            }
            for att in attachments
        ]
        
        result.append({
            "id": msg.id,
            "sender_id": msg.sender_id,
            "sender_name": sender.name,
            "sender_role": sender.role or "pending",
            "receiver_id": msg.receiver_id,
            "message": msg.message,
            "is_read": msg.is_read,
            "is_edited": msg.is_edited,
            "has_attachment": len(attachments_data) > 0,
            "attachments": attachments_data,
            "created_at": msg.created_at,
            "edited_at": msg.edited_at
        })
    
    return list(reversed(result))


@router.get("/students")
def get_available_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener estudiantes disponibles para chatear (para profesores)"""
    
    if current_user.role == "student":
        teachers = db.query(User).join(
            TeacherAssignment, User.id == TeacherAssignment.professor_id
        ).join(
            CourseOffering, TeacherAssignment.course_offering_id == CourseOffering.id
        ).join(
            EnrollmentDetail, CourseOffering.id == EnrollmentDetail.offering_id
        ).join(
            Enrollment, EnrollmentDetail.enrollment_id == Enrollment.id
        ).filter(
            Enrollment.student_id == current_user.id,
            User.role == "teacher"
        ).distinct().all()
        
        return [{"id": t.id, "name": t.name, "role": t.role} for t in teachers]
    
    elif current_user.role == "teacher":
        students = db.query(User).join(
            Enrollment, User.id == Enrollment.student_id
        ).join(
            EnrollmentDetail, Enrollment.id == EnrollmentDetail.enrollment_id
        ).join(
            CourseOffering, EnrollmentDetail.offering_id == CourseOffering.id
        ).join(
            TeacherAssignment, CourseOffering.id == TeacherAssignment.course_offering_id
        ).filter(
            TeacherAssignment.professor_id == current_user.id,
            User.role == "student"
        ).distinct().all()
        
        return [{"id": s.id, "name": s.name, "role": s.role} for s in students]
    
    elif current_user.role == "admin":
        users = db.query(User).filter(User.id != current_user.id).all()
        return [{"id": u.id, "name": u.name, "role": u.role or "pending"} for u in users]
    
    return []


@router.get("/teachers")
def get_available_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener profesores disponibles para chatear (para estudiantes)"""
    
    if current_user.role == "student":
        teachers = db.query(User).join(
            TeacherAssignment, User.id == TeacherAssignment.professor_id
        ).join(
            CourseOffering, TeacherAssignment.course_offering_id == CourseOffering.id
        ).join(
            EnrollmentDetail, CourseOffering.id == EnrollmentDetail.offering_id
        ).join(
            Enrollment, EnrollmentDetail.enrollment_id == Enrollment.id
        ).filter(
            Enrollment.student_id == current_user.id,
            User.role == "teacher"
        ).distinct().all()
        
        return [{"id": t.id, "name": t.name, "role": t.role} for t in teachers]
    
    elif current_user.role == "admin":
        teachers = db.query(User).filter(User.role == "teacher").all()
        return [{"id": t.id, "name": t.name, "role": t.role} for t in teachers]
    
    return []


@router.delete("/messages/{message_id}")
async def delete_message(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Eliminar un mensaje (solo el emisor puede hacerlo)"""
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    if message.sender_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "Not authorized")
    
    # Guardar información antes de eliminar
    sender_id = message.sender_id
    receiver_id = message.receiver_id
    message_id_to_delete = message.id
    
    # Eliminar attachments del disco
    attachments = db.query(ChatAttachment).filter(
        ChatAttachment.message_id == message_id
    ).all()
    
    for att in attachments:
        file_path = os.path.join(CHAT_UPLOAD_DIR, att.file_path)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    db.delete(message)
    db.commit()
    
    # NOTIFICAR A LOS PARTICIPANTES POR WEBSOCKET
    # Notificar al emisor
    await chat_manager.send_to_user(sender_id, {
        "type": "message_deleted",
        "message_id": message_id_to_delete
    })
    
    # Notificar al receptor si existe
    if receiver_id:
        await chat_manager.send_to_user(receiver_id, {
            "type": "message_deleted",
            "message_id": message_id_to_delete
        })
    
    return {"message": "Message deleted"}


@router.get("/unread-count")
def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener número total de mensajes no leídos"""
    
    count = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).count()
    
    return {"unread_count": count}


# ==========================================
# NOTIFICACIONES Y PRESENCIA
# ==========================================


@router.get("/notifications/unread")
def get_unread_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener TODOS los mensajes no leídos (sin agrupar)"""
    
    unread_messages = db.query(ChatMessage).filter(
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).order_by(ChatMessage.created_at.desc()).all()
    
    notifications = []
    for msg in unread_messages:
        sender = db.query(User).filter(User.id == msg.sender_id).first()
        if sender:
            notifications.append({
                "id": msg.id,  # ← ID del mensaje
                "sender_id": msg.sender_id,
                "sender_name": sender.name,
                "sender_role": sender.role,
                "message_id": msg.id,
                "message": msg.message[:100] + "..." if len(msg.message) > 100 else msg.message,
                "created_at": msg.created_at.isoformat(),
                "is_read": msg.is_read
            })
    
    return {
        "total_unread": len(unread_messages),
        "notifications": notifications  # ← Ahora es un array plano
    }


@router.post("/notifications/mark-read/{sender_id}")
def mark_conversation_read(
    sender_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar todos los mensajes de una conversación como leídos"""
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.sender_id == sender_id,
        ChatMessage.receiver_id == current_user.id,
        ChatMessage.is_read == False
    ).all()
    
    for msg in messages:
        msg.is_read = True
    
    conv = db.query(ChatConversation).filter(
        or_(
            and_(ChatConversation.user1_id == current_user.id, ChatConversation.user2_id == sender_id),
            and_(ChatConversation.user1_id == sender_id, ChatConversation.user2_id == current_user.id)
        )
    ).first()
    
    if conv:
        if conv.user1_id == current_user.id:
            conv.unread_count_user1 = 0
        else:
            conv.unread_count_user2 = 0
    
    db.commit()
    
    return {"message": f"Marked {len(messages)} messages as read"}

@router.post("/messages/{message_id}/read")
def mark_message_as_read(
    message_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Marcar un mensaje específico como leído"""
    
    message = db.query(ChatMessage).filter(ChatMessage.id == message_id).first()
    if not message:
        raise HTTPException(404, "Message not found")
    
    # Solo el receptor puede marcar como leído
    if message.receiver_id != current_user.id:
        raise HTTPException(403, "Not authorized")
    
    message.is_read = True
    db.commit()
    
    return {"message": "Message marked as read"}

@router.get("/presence")
def get_presence(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Obtener qué usuarios están actualmente conectados"""
    
    online_users = list(chat_manager.active_connections.keys())
    
    user_contacts = []
    
    conversations = db.query(ChatConversation).filter(
        or_(
            ChatConversation.user1_id == current_user.id,
            ChatConversation.user2_id == current_user.id
        ),
        ChatConversation.is_active == True
    ).all()
    
    for conv in conversations:
        contact_id = conv.user2_id if conv.user1_id == current_user.id else conv.user1_id
        contact = db.query(User).filter(User.id == contact_id).first()
        if contact:
            user_contacts.append({
                "user_id": contact.id,
                "name": contact.name,
                "role": contact.role,
                "is_online": contact.id in online_users
            })
    
    return user_contacts


# ==========================================
# SUBIR ARCHIVO ADJUNTO AL CHAT
# ==========================================
@router.post("/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    receiver_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Subir un archivo adjunto para enviar en el chat.
    Se crea un mensaje automático con el archivo adjunto.
    """
    
    # Validar tamaño del archivo
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if file_size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"Archivo demasiado grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
        )
    
    # Validar tipo de archivo
    mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
    
    if mime_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Tipos permitidos: {', '.join(ALLOWED_FILE_TYPES)}"
        )
    
    # Verificar que el receptor existe
    receiver = db.query(User).filter(User.id == receiver_id).first()
    if not receiver:
        raise HTTPException(404, "Receptor no encontrado")
    
    # Generar nombre único para el archivo
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    safe_filename = f"{timestamp}_{unique_id}_{file.filename.replace(' ', '_')}"
    file_path = os.path.join(CHAT_UPLOAD_DIR, safe_filename)
    
    # Guardar archivo
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(500, f"Error al guardar el archivo: {str(e)}")
    
    # Crear mensaje con referencia al archivo
    file_type_emoji = {
        "image/jpeg": "🖼️",
        "image/png": "🖼️",
        "image/gif": "🎬",
        "image/webp": "🖼️",
        "application/pdf": "📄",
        "text/plain": "📝",
        "application/msword": "📘",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📘",
        "application/vnd.ms-excel": "📊",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "📊",
        "application/zip": "📦",
        "application/x-zip-compressed": "📦"
    }.get(mime_type, "📎")
    
    message_content = f"{file_type_emoji} {file.filename} ({format_file_size(file_size)})"
    
    # Crear mensaje
    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message=message_content,
        is_read=False
    )
    db.add(new_message)
    db.flush()
    
    # Crear attachment
    attachment = ChatAttachment(
        message_id=new_message.id,
        filename=file.filename,
        file_path=safe_filename,
        file_size=file_size,
        mime_type=mime_type
    )
    db.add(attachment)
    db.commit()
    db.refresh(new_message)
    
    # Crear o actualizar conversación
    user1, user2 = sorted([current_user.id, receiver_id])
    conv = db.query(ChatConversation).filter(
        ChatConversation.user1_id == user1,
        ChatConversation.user2_id == user2
    ).first()
    
    if not conv:
        conv = ChatConversation(
            user1_id=user1,
            user2_id=user2
        )
        db.add(conv)
        db.flush()
    
    conv.last_message = message_content
    conv.last_message_at = datetime.now()
    conv.last_message_sender_id = current_user.id
    
    if conv.user1_id == receiver_id:
        conv.unread_count_user1 += 1
    else:
        conv.unread_count_user2 += 1
    
    db.commit()
    
    # Preparar respuesta con attachment
    attachments_data = await get_attachments_for_message(db, new_message.id)
    
    response = {
        "type": "message",
        "id": new_message.id,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "sender_role": current_user.role,
        "receiver_id": receiver_id,
        "message": message_content,
        "has_attachment": True,
        "attachments": attachments_data,
        "created_at": new_message.created_at.isoformat()
    }
    
    # Enviar al emisor
    await chat_manager.send_to_user(current_user.id, response)
    
    # Enviar al receptor
    await chat_manager.send_to_user(receiver_id, response)
    
    # Enviar notificación push
    await chat_manager.send_notification(
        receiver_id,
        "Nuevo archivo",
        f"{current_user.name} te ha enviado un archivo: {file.filename}",
        {
            "message_id": new_message.id,
            "sender_id": current_user.id,
            "sender_name": current_user.name,
            "filename": file.filename,
            "file_size": file_size
        }
    )
    
    return {
        "message_id": new_message.id,
        "attachment_id": attachment.id,
        "filename": file.filename,
        "file_size": file_size,
        "file_size_formatted": format_file_size(file_size),
        "mime_type": mime_type,
        "download_url": f"/chat/download/{attachment.id}"
    }


# ==========================================
# SUBIR MÚLTIPLES ARCHIVOS
# ==========================================
@router.post("/upload-multiple")
async def upload_multiple_files(
    files: List[UploadFile] = File(...),
    receiver_id: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Subir múltiples archivos adjuntos en un solo mensaje.
    """
    
    if len(files) > 5:
        raise HTTPException(400, "Máximo 5 archivos por mensaje")
    
    attachments_created = []
    file_names = []
    
    for file in files:
        # Validar tamaño
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(400, f"Archivo {file.filename} excede el tamaño máximo")
        
        # Validar tipo
        mime_type = file.content_type or mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        if mime_type not in ALLOWED_FILE_TYPES:
            raise HTTPException(400, f"Tipo de archivo no permitido: {file.filename}")
        
        # Guardar archivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        unique_id = str(uuid.uuid4())[:8]
        safe_filename = f"{timestamp}_{unique_id}_{file.filename.replace(' ', '_')}"
        file_path = os.path.join(CHAT_UPLOAD_DIR, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_names.append(file.filename)
        attachments_created.append({
            "original_name": file.filename,
            "saved_name": safe_filename,
            "size": file_size,
            "mime_type": mime_type
        })
    
    # Crear mensaje con múltiples archivos
    file_list = "\n".join([f"  • {name}" for name in file_names])
    message_content = f"📎 {len(files)} archivo(s) adjunto(s):\n{file_list}"
    
    # Crear mensaje
    new_message = ChatMessage(
        sender_id=current_user.id,
        receiver_id=receiver_id,
        message=message_content,
        is_read=False
    )
    db.add(new_message)
    db.flush()
    
    # Crear attachments
    attachments_result = []
    for att in attachments_created:
        attachment = ChatAttachment(
            message_id=new_message.id,
            filename=att["original_name"],
            file_path=att["saved_name"],
            file_size=att["size"],
            mime_type=att["mime_type"]
        )
        db.add(attachment)
        attachments_result.append({
            "id": attachment.id,
            "filename": attachment.filename,
            "file_size": attachment.file_size,
            "file_size_formatted": format_file_size(attachment.file_size),
            "mime_type": attachment.mime_type
        })
    
    # Actualizar conversación
    user1, user2 = sorted([current_user.id, receiver_id])
    conv = db.query(ChatConversation).filter(
        ChatConversation.user1_id == user1,
        ChatConversation.user2_id == user2
    ).first()
    
    if not conv:
        conv = ChatConversation(
            user1_id=user1,
            user2_id=user2
        )
        db.add(conv)
        db.flush()
    
    conv.last_message = f"📎 {len(files)} archivo(s) adjunto(s)"
    conv.last_message_at = datetime.now()
    conv.last_message_sender_id = current_user.id
    
    if conv.user1_id == receiver_id:
        conv.unread_count_user1 += 1
    else:
        conv.unread_count_user2 += 1
    
    db.commit()
    db.refresh(new_message)
    
    # Respuesta WebSocket
    attachments_data = await get_attachments_for_message(db, new_message.id)
    
    response = {
        "type": "message",
        "id": new_message.id,
        "sender_id": current_user.id,
        "sender_name": current_user.name,
        "receiver_id": receiver_id,
        "message": message_content,
        "has_attachment": True,
        "attachments": attachments_data,
        "created_at": new_message.created_at.isoformat()
    }
    
    await chat_manager.send_to_user(current_user.id, response)
    await chat_manager.send_to_user(receiver_id, response)
    
    return {
        "message_id": new_message.id,
        "attachments_count": len(attachments_result),
        "attachments": attachments_result
    }


# ==========================================
# DESCARGAR ARCHIVO ADJUNTO
# ==========================================
@router.get("/download/{attachment_id}")
def download_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Descargar un archivo adjunto.
    Solo el emisor o el receptor pueden descargar.
    """
    
    attachment = db.query(ChatAttachment).filter(
        ChatAttachment.id == attachment_id
    ).first()
    
    if not attachment:
        raise HTTPException(404, "Archivo no encontrado")
    
    # Verificar que el usuario tiene acceso (es emisor o receptor)
    message = db.query(ChatMessage).filter(
        ChatMessage.id == attachment.message_id
    ).first()
    
    if not message:
        raise HTTPException(404, "Mensaje no encontrado")
    
    if message.sender_id != current_user.id and message.receiver_id != current_user.id:
        raise HTTPException(403, "No tienes permiso para descargar este archivo")
    
    file_path = os.path.join(CHAT_UPLOAD_DIR, attachment.file_path)
    
    if not os.path.exists(file_path):
        raise HTTPException(404, "Archivo no encontrado en el servidor")
    
    return FileResponse(
        path=file_path,
        filename=attachment.filename,
        media_type=attachment.mime_type
    )

# ==========================================
# ELIMINAR ARCHIVO ADJUNTO
# ==========================================
@router.delete("/attachment/{attachment_id}")
async def delete_attachment(
    attachment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Eliminar un archivo adjunto.
    Solo el emisor o admin pueden eliminar.
    """
    
    attachment = db.query(ChatAttachment).filter(
        ChatAttachment.id == attachment_id
    ).first()
    
    if not attachment:
        raise HTTPException(404, "Archivo no encontrado")
    
    message = db.query(ChatMessage).filter(
        ChatMessage.id == attachment.message_id
    ).first()
    
    if not message:
        raise HTTPException(404, "Mensaje no encontrado")
    
    if message.sender_id != current_user.id and current_user.role != "admin":
        raise HTTPException(403, "No tienes permiso para eliminar este archivo")
    
    # Eliminar archivo del disco
    file_path = os.path.join(CHAT_UPLOAD_DIR, attachment.file_path)
    if os.path.exists(file_path):
        os.remove(file_path)
    
    db.delete(attachment)
    
    # Verificar si el mensaje tiene más attachments
    remaining = db.query(ChatAttachment).filter(
        ChatAttachment.message_id == message.id
    ).count()
    
    if remaining == 0:
        # Si no quedan attachments, actualizar el mensaje
        message.message = "[Archivo eliminado]"
    
    db.commit()
    
    # Notificar a los participantes
    await chat_manager.send_to_user(message.sender_id, {
        "type": "attachment_deleted",
        "attachment_id": attachment_id,
        "message_id": message.id
    })
    
    if message.receiver_id:
        await chat_manager.send_to_user(message.receiver_id, {
            "type": "attachment_deleted",
            "attachment_id": attachment_id,
            "message_id": message.id
        })
    
    return {"message": "Archivo eliminado correctamente"}