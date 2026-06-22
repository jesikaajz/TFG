# services/system_monitor.py
import os
import psutil
import redis
from datetime import timedelta, datetime
from typing import Dict, Any, List
import requests
import psycopg2
import logging
import paramiko
import time
import re

logger = logging.getLogger(__name__)

# ===================== FUNCIONES AUXILIARES SSH =====================

def _run_ssh_command(cmd: str) -> str:
    """Ejecuta un comando SSH en el servidor remoto y devuelve la salida (stripped)"""
    host = os.getenv("VM_HOST_FINAL")
    user = os.getenv("VM_USER_FINAL")
    password = os.getenv("VM_PASS_FINAL")
    try:
        ssh = paramiko.SSHClient()
        ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        ssh.connect(host, username=user, password=password, timeout=5)
        stdin, stdout, stderr = ssh.exec_command(cmd)
        exit_code = stdout.channel.recv_exit_status()
        out = stdout.read().decode().strip()
        ssh.close()
        return out if exit_code == 0 else ""
    except Exception as e:
        logger.warning(f"Error ejecutando comando SSH '{cmd}': {e}")
        return ""

def _parse_ps_time(etime_str: str) -> str:
    """Convierte el formato de tiempo de 'ps -o etime' ([[DD-]hh:]mm:ss) a timedelta legible"""
    if not etime_str:
        return None
    etime_str = etime_str.strip()
    pattern = r'^(?:(\d+)-)?(?:(\d+):)?(\d+):(\d+)$'
    match = re.match(pattern, etime_str)
    if match:
        days = int(match.group(1) or 0)
        hours = int(match.group(2) or 0)
        mins = int(match.group(3) or 0)
        secs = int(match.group(4) or 0)
        total_seconds = days*86400 + hours*3600 + mins*60 + secs
        return str(timedelta(seconds=total_seconds))
    return etime_str

# ===================== MONITOREO DE SERVICIOS =====================

def get_docker_status() -> Dict[str, Any]:
    host = os.getenv("VM_HOST_FINAL")
    user = os.getenv("VM_USER_FINAL")
    password = os.getenv("VM_PASS_FINAL")
    if not host or not user or not password:
        return {"status": "stopped"}
    
    try:
        status = _run_ssh_command("systemctl is-active docker")
        if status != "active":
            return {"status": "stopped"}
        
        pid = _run_ssh_command("pgrep -f 'dockerd|docker daemon'")
        uptime_str = None
        mem_mb = None
        cpu_percent = None
        
        if pid:
            etime = _run_ssh_command(f"ps -p {pid} -o etime= --no-headers")
            if etime:
                uptime_str = _parse_ps_time(etime)
            mem_kb = _run_ssh_command(f"ps -p {pid} -o rss= --no-headers")
            if mem_kb:
                mem_mb = f"{int(mem_kb)/1024:.1f} MB"
            cpu = _run_ssh_command(f"ps -p {pid} -o %cpu= --no-headers")
            if cpu:
                cpu_percent = f"{float(cpu):.1f}%"
        
        return {
            "status": "running",
            "uptime": uptime_str,
            "memory": mem_mb,
            "cpu": cpu_percent,
            "port": None,
            "version": _run_ssh_command("docker version --format '{{.Server.Version}}'")
        }
    except Exception as e:
        logger.warning(f"Error en get_docker_status: {e}")
        return {"status": "stopped"}

def get_redis_status() -> Dict[str, Any]:
    try:
        r = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            password=os.getenv("REDIS_PASSWORD", None),
            decode_responses=True,
            socket_connect_timeout=2
        )
        info = r.info()
        uptime_seconds = info.get('uptime_in_seconds', 0)
        uptime = str(timedelta(seconds=uptime_seconds))
        return {
            "status": "running",
            "uptime": uptime,
            "memory": info.get('used_memory_human', 'N/A'),
            "cpu": f"{info.get('instantaneous_ops_per_sec', 0)} ops/sec",
            "port": int(os.getenv("REDIS_PORT", 6379))
        }
    except Exception as e:
        logger.warning(f"No se pudo conectar a Redis: {e}")
        return {"status": "stopped"}

def get_celery_status() -> Dict[str, Any]:
    for proc in psutil.process_iter(['pid', 'name', 'cmdline', 'create_time']):
        try:
            cmdline = ' '.join(proc.info['cmdline'] or [])
            if 'celery' in cmdline.lower() and 'worker' in cmdline.lower():
                p = psutil.Process(proc.info['pid'])
                create_time = p.create_time()
                uptime_seconds = time.time() - create_time
                uptime = str(timedelta(seconds=uptime_seconds))
                mem = p.memory_info().rss / (1024 * 1024)
                cpu_percent = p.cpu_percent(interval=0.1)
                return {
                    "status": "running",
                    "uptime": uptime,
                    "memory": f"{mem:.1f} MB",
                    "cpu": f"{cpu_percent:.1f}%",
                    "port": None
                }
        except (psutil.NoSuchProcess, psutil.AccessDenied, KeyError):
            continue
    return {"status": "stopped"}

def get_ollama_status() -> Dict[str, Any]:
    try:
        ollama_host = os.getenv("OLLAMA_HOST", "localhost")
        ollama_port = int(os.getenv("OLLAMA_PORT", 11434))
        resp = requests.get(f"http://{ollama_host}:{ollama_port}/api/tags", timeout=2)
        if resp.status_code != 200:
            return {"status": "degraded"}
        
        pid = _run_ssh_command("pgrep -x ollama")
        uptime_str = None
        mem_mb = None
        cpu_percent = None
        if pid:
            etime = _run_ssh_command(f"ps -p {pid} -o etime= --no-headers")
            if etime:
                uptime_str = _parse_ps_time(etime)
            mem_kb = _run_ssh_command(f"ps -p {pid} -o rss= --no-headers")
            if mem_kb:
                mem_mb = f"{int(mem_kb)/1024:.1f} MB"
            cpu = _run_ssh_command(f"ps -p {pid} -o %cpu= --no-headers")
            if cpu:
                cpu_percent = f"{float(cpu):.1f}%"
        
        return {
            "status": "running",
            "uptime": uptime_str,
            "memory": mem_mb,
            "cpu": cpu_percent,
            "port": ollama_port
        }
    except Exception as e:
        logger.warning(f"Error en get_ollama_status: {e}")
        return {"status": "stopped"}

def get_postgres_status() -> Dict[str, Any]:
    # Conexión TCP directa (más rápida y da uptime)
    try:
        conn = psycopg2.connect(
            host=os.getenv("DB_HOST", "localhost"),
            port=os.getenv("DB_PORT", "5432"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            dbname=os.getenv("DB_NAME", "postgres"),
            connect_timeout=2
        )
        cursor = conn.cursor()
        cursor.execute("SELECT extract(epoch from now() - pg_postmaster_start_time())")
        uptime_seconds = cursor.fetchone()[0]
        uptime = str(timedelta(seconds=uptime_seconds))
        cursor.close()
        conn.close()
        return {
            "status": "running",
            "uptime": uptime,
            "memory": None,
            "cpu": None,
            "port": int(os.getenv("DB_PORT", 5432))
        }
    except Exception as e:
        logger.warning(f"No se pudo conectar a PostgreSQL vía TCP: {e}")
        return {"status": "stopped"}

# ===================== RECOLECCIÓN DE SERVICIOS =====================

def collect_all_services() -> List[Dict[str, Any]]:
    services = [
        {"name": "Docker", "status_info": get_docker_status()},
        {"name": "Redis", "status_info": get_redis_status()},
        {"name": "Celery", "status_info": get_celery_status()},
        {"name": "Ollama", "status_info": get_ollama_status()},
        {"name": "Postgres", "status_info": get_postgres_status()},
    ]
    result = []
    for s in services:
        item = {"name": s["name"], **s["status_info"]}
        item.setdefault("status", "unknown")
        item.setdefault("uptime", None)
        item.setdefault("memory", None)
        item.setdefault("cpu", None)
        item.setdefault("port", None)
        result.append(item)
    return result

# ===================== LECTURA DE LOGS DESDE CONTENEDORES =====================

def _get_container_logs(container_name: str, lines: int = 200) -> str:
    """Devuelve las últimas líneas del log de un contenedor Docker vía SSH"""
    cmd = f"docker logs --tail {lines} {container_name} 2>&1"
    return _run_ssh_command(cmd)

def _get_postgres_logs_from_container(limit=200) -> List[Dict]:
    """Obtiene logs del contenedor postgres_db y los parsea"""
    raw = _get_container_logs("postgres_db", limit)
    logs = []
    for line in raw.split('\n'):
        if not line.strip():
            continue
        # Formato típico: "2026-06-14 12:32:00.123 UTC [1234] LOG:  mensaje"
        pattern = r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\.\d+ UTC \[\d+\] (\w+):\s+(.*)'
        match = re.match(pattern, line)
        if match:
            ts_str, level_raw, msg = match.groups()
            level = level_raw.lower()
            if level == 'log':
                level = 'info'
            logs.append({
                "timestamp": datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S"),
                "level": level,
                "source": "Postgres",
                "message": msg.strip()
            })
        else:
            # Si no coincide, lo añadimos como mensaje genérico con timestamp actual
            logs.append({
                "timestamp": datetime.now(),
                "level": "info",
                "source": "Postgres",
                "message": line[:200]
            })
    return logs

def _get_redis_logs_from_container(limit=200) -> List[Dict]:
    """Obtiene logs del contenedor redis_evaluator y los parsea"""
    raw = _get_container_logs("redis_evaluator", limit)
    logs = []
    for line in raw.split('\n'):
        if not line.strip():
            continue
        # Para simplificar, usamos timestamp actual (puedes mejorar el parseo)
        logs.append({
            "timestamp": datetime.now(),
            "level": "info",
            "source": "Redis",
            "message": line[:200]
        })
    return logs

# ===================== FUNCIÓN PRINCIPAL DE LOGS =====================

def read_logs_from_file(log_file: str = "logs/app.log", limit: int = 100, offset: int = 0,
                        level: str = None, search: str = None):
    import glob
    import re
    from datetime import datetime
    import os

    all_logs = []

    # 1. Logs locales de la aplicación (FastAPI + Celery)
    abs_log_file = os.path.abspath(log_file)
    log_files = sorted(glob.glob(abs_log_file + "*"), reverse=True)
    pattern = re.compile(r'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}) - (\w+) - (\w+) - (.+)')
    for filepath in log_files:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    match = pattern.match(line.strip())
                    if match:
                        ts_str, lvl, src, msg = match.groups()
                        all_logs.append({
                            "timestamp": datetime.strptime(ts_str, "%Y-%m-%d %H:%M:%S"),
                            "level": lvl.lower(),
                            "source": src,
                            "message": msg
                        })
        except Exception:
            pass

    # 2. Logs de contenedores remotos (PostgreSQL y Redis)
    all_logs.extend(_get_postgres_logs_from_container(200))
    all_logs.extend(_get_redis_logs_from_container(200))

    # 3. Ordenar todos por timestamp descendente
    all_logs.sort(key=lambda x: x["timestamp"], reverse=True)

    # 4. Filtrar
    if level:
        all_logs = [log for log in all_logs if log["level"] == level.lower()]
    if search:
        all_logs = [log for log in all_logs if search.lower() in log["message"].lower()]

    total = len(all_logs)
    paginated = all_logs[offset:offset+limit]
    return paginated, total