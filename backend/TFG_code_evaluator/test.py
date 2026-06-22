# test_logs.py
import os
import sys
from dotenv import load_dotenv

# Cargar .env desde la raíz
load_dotenv()

# Añadir el directorio correcto para importar system_monitor
sys.path.append(os.path.join(os.path.dirname(__file__), 'api_code_evaluator'))

# Ahora importamos
from api_code_evaluator.services.system_monitor import _run_ssh_command, _get_container_logs

# Probar _get_container_logs para postgres_db
print("=== Obteniendo logs de postgres_db ===")
logs = _get_container_logs("postgres_db", 20)
print(logs)

print("\n=== Obteniendo logs de redis_evaluator ===")
logs_redis = _get_container_logs("redis_evaluator", 20)
print(logs_redis)