from datetime import datetime
import redis
import os
from dotenv import load_dotenv

load_dotenv() 

# Configuración Redis desde variables de entorno
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_KEY_PREFIX = os.getenv("REDIS_KEY_PREFIX", "blacklist:")

if not REDIS_PASSWORD:
    raise RuntimeError("REDIS_PASSWORD environment variable is required")

# Crear conexión Redis
r = redis.Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    db=REDIS_DB,
    decode_responses=True,
    socket_connect_timeout=5,
    socket_timeout=5,
    retry_on_timeout=True
)

def blacklist_token(token: str, exp=None):
    ttl = int(exp) - int(datetime.utcnow().timestamp()) if exp is not None else 1
    if ttl <= 0:
        ttl = 1

    redis_key = f"{REDIS_KEY_PREFIX}{token}"
    r.setex(redis_key, ttl, "revoked")


def is_blacklisted(token: str):
    redis_key = f"{REDIS_KEY_PREFIX}{token}"
    return r.get(redis_key) is not None

def add_to_blacklist(token: str, expires_in: int = 3600):
    """Añadir token a la blacklist"""
    try:
        r.setex(f"{REDIS_KEY_PREFIX}{token}", expires_in, "true")
    except redis.ConnectionError:
        print("⚠️ Error conectando a Redis para añadir a blacklist")


def increment_rate_limit(key: str, limit: int, window_seconds: int) -> bool:
    """Incrementa un contador en Redis y devuelve true si se excede el límite."""
    try:
        count = r.incr(key)
        if count == 1:
            r.expire(key, window_seconds)
        return count > limit
    except redis.ConnectionError:
        # Fallback seguro: no bloquear si Redis no está disponible.
        return False