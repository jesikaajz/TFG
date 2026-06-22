from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ServiceStatus(BaseModel):
    name: str
    status: str          # "running", "degraded", "stopped"
    uptime: Optional[str] = None
    memory: Optional[str] = None
    cpu: Optional[str] = None
    port: Optional[int] = None

class LogEntry(BaseModel):
    timestamp: datetime
    level: str           # "info", "warning", "error", "debug"
    source: str
    message: str

class LogsResponse(BaseModel):
    logs: List[LogEntry]
    total: int