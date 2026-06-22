# routes/system.py
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from sqlalchemy.orm import Session
from ..bd.connection import get_db
from ..dependencies.auth_dependencies import admin_required
from ..models.user_model import User
from ..services.system_monitor import collect_all_services, read_logs_from_file
from ..schemas.sistema import ServiceStatus, LogsResponse

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/services", response_model=List[ServiceStatus])
async def get_services(current_user: User = Depends(admin_required)):
    """Obtener estado de los servicios del sistema (solo administradores)"""
    services = collect_all_services()
    # Convertir a objetos ServiceStatus
    return [ServiceStatus(**s) for s in services]

@router.get("/logs", response_model=LogsResponse)
async def get_logs(
    level: Optional[str] = Query(None, pattern="^(info|warning|error|debug)$"),
    search: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(admin_required)
):
    """Obtener logs del sistema (solo administradores)"""
    logs, total = read_logs_from_file(
        log_file="logs/app.log",   # Ruta donde se guardan los logs
        limit=limit,
        offset=offset,
        level=level,
        search=search
    )
    return LogsResponse(logs=logs, total=total)