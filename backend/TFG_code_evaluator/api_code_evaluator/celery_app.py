# celery_app.py - Versión optimizada
from celery import Celery
from kombu import Queue, Exchange

REDIS_URL = "redis://:drpnll00@10.5.160.165:6380/0"

celery = Celery(
    "code_evaluator",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["api_code_evaluator.tasks"]
)

# Colas
celery.conf.task_queues = (
    Queue('default', Exchange('default'), routing_key='default'),
    Queue('execution', Exchange('execution'), routing_key='execution'),
    Queue('llm', Exchange('llm'), routing_key='llm'),
    Queue('pdf', Exchange('pdf'), routing_key='pdf'),
    Queue('security', Exchange('security'), routing_key='security'),
    Queue('notifications', Exchange('notifications'), routing_key='notifications'),
)

# ROUTING
celery.conf.task_routes = {
    'api_code_evaluator.tasks.process_submission_task': {'queue': 'default'},
    'api_code_evaluator.tasks.process_submission_function_task': {'queue': 'default'},
    'api_code_evaluator.tasks.run_single_test': {'queue': 'execution'},
    'api_code_evaluator.tasks.finalize_evaluation': {'queue': 'default'},
    'api_code_evaluator.tasks.evaluate_rubric_parallel': {'queue': 'default'},
    'api_code_evaluator.tasks.evaluate_single_criterion': {'queue': 'llm'},
    'api_code_evaluator.tasks.combine_criteria_results': {'queue': 'default'},
    'api_code_evaluator.tasks.generate_pdf_task': {'queue': 'pdf'},
    'api_code_evaluator.tasks.security_alert_task': {'queue': 'security'},
    'api_code_evaluator.tasks.send_notification_task': {'queue': 'notifications'},
}

# Configuración de tiempo
celery.conf.task_time_limit = 120  # 2 minutos máximos
celery.conf.task_soft_time_limit = 90  # 90 segundos para soft timeout
celery.conf.task_track_started = True
celery.conf.task_send_sent_event = True
celery.conf.worker_prefetch_multiplier = 1  # Un worker, una tarea a la vez
celery.conf.task_acks_late = True
celery.conf.task_reject_on_worker_lost = True

# Workers
celery.conf.worker_max_tasks_per_child = 50  # Reiniciar después de 50 tareas
celery.conf.worker_max_memory_per_child = 150000  # 150MB máximos

# Redis - BAJAR visibility_timeout!
celery.conf.broker_transport_options = {
    'visibility_timeout': 180,  # 3 minutos (NO 1 hora!)
    'socket_timeout': 10,
    'socket_connect_timeout': 10,
    'retry_on_timeout': True,
    'max_connections': 50,
}

# Resultados
celery.conf.result_backend = REDIS_URL
celery.conf.result_expires = 1800  # 30 minutos
celery.conf.result_extended = True

# Conexión
celery.conf.broker_connection_retry_on_startup = True
celery.conf.broker_connection_retry = True
celery.conf.broker_connection_max_retries = 5

print("=" * 60)
print("✅ [CELERY] Configuración optimizada")
print("📋 Timeouts: 120s/90s | Visibility: 180s")
print("=" * 60)