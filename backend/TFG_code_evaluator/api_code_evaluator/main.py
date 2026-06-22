from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
import logging
import sys
import time
from logging.handlers import RotatingFileHandler

# Load environment variables from .env file
load_dotenv()

from .bd.connection import Base, engine

# ---------------- MODELOS (IMPORTANTE ORDEN) ----------------

from .models.subjects_model import Subject
from .models.academic_year_model import AcademicYear
from .models.exercise_model import Exercise
from .models.test_cases_model import TestCase
from .models.submissions_model import Submission
from .models.evaluation_model import Evaluation
from .models.tests_results_model import TestResult
from .models.rubric_model import Rubric

# NUEVOS MODELOS IMPORTANTES

# ---------------- ROUTERS ----------------
from .routes.auth_routes import router as auth_router
from .routes.users_routes import router as users_router
from .routes.subjects_routes import router as courses_router
from .routes.academic_years_routes import router as academic_years_router

from .routes.enrollments_routes import router as enrollments_router
from .routes.enrollment_details_routes import router as enrollment_detail_router

from .routes.teacher_assignment_routes import router as teacher_assignments_router
from .routes.course_offerings_routes import router as course_offerings_router

from .routes.exercises_routes import router as exercises_router
from .routes.test_cases_routes import router as test_cases_router

from .routes.submissions_routes import router as submissions_router
from .routes.evaluation_routes import router as evaluation_router
from .routes.tests_results_routes import router as tests_results_router
from .routes.rubrics_router import router as rubrics_router

from .routes.programmin_language_routes import router as languages_router
from .routes.exercise_language_routes import router as exercise_language_router

from .routes.usersession_routes import router as sessions_router
from .routes.chat_routes import router as chat_router
from .routes.problem_argument_routes import router as problem_arguments_router
from .routes.system import router as system_router

# Asegurar que el directorio logs existe
os.makedirs("logs", exist_ok=True)

# Configuración de logging
log_format = '%(asctime)s - %(levelname)s - %(name)s - %(message)s'
# Usamos un formato sin milisegundos para simplificar (o con milisegundos pero consistente)
datefmt = '%Y-%m-%d %H:%M:%S'

# Handler para archivo rotativo
file_handler = RotatingFileHandler(
    'logs/app.log', maxBytes=10*1024*1024, backupCount=5, encoding='utf-8'
)
file_handler.setFormatter(logging.Formatter(log_format, datefmt=datefmt))
file_handler.setLevel(logging.INFO)

# Handler para consola (opcional, para ver logs en la terminal)
console_handler = logging.StreamHandler(sys.stdout)
console_handler.setFormatter(logging.Formatter(log_format, datefmt=datefmt))
console_handler.setLevel(logging.INFO)

# Configurar el logger raíz
logging.basicConfig(
    level=logging.INFO,
    handlers=[file_handler, console_handler]
)

# Log de prueba para verificar que se escribe
logging.info("🚀 Aplicación iniciada - Sistema de logs activo")

# ---------------- CREATE TABLES ----------------
Base.metadata.create_all(bind=engine)

app = FastAPI(title="TFG Backend")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Request validation failed",
            "errors": exc.errors(),
            "body": exc.body,
        },
    )

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Strict-Transport-Security"] = "max-age=63072000; includeSubDomains; preload"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "same-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), microphone=()"
    return response

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    process_time = time.time() - start
    # Usa el logger ya configurado (importado como logging, pero ya tienes el logger raíz)
    logging.info(f"{request.method} {request.url.path} - {response.status_code} - {process_time:.3f}s")
    return response

# ---------------- ROUTES ----------------
app.include_router(auth_router)
app.include_router(users_router, prefix="/users")

app.include_router(courses_router, prefix="/courses")
app.include_router(academic_years_router, prefix="/academic-years")

app.include_router(enrollments_router)
app.include_router(enrollment_detail_router, prefix="/enrollment-detail")

app.include_router(teacher_assignments_router, prefix="/teacher-assignments")

app.include_router(exercises_router, prefix="/exercises")
app.include_router(test_cases_router, prefix="/test-cases")

app.include_router(submissions_router, prefix="/submissions")
app.include_router(evaluation_router, prefix="/evaluations")
app.include_router(tests_results_router, prefix="/test-results")
app.include_router(rubrics_router, prefix="/rubrics")

app.include_router(languages_router, prefix="/programming-languages")
app.include_router(exercise_language_router, prefix="/exercise-language")

app.include_router(sessions_router, prefix="/sessions")
app.include_router(course_offerings_router, prefix="/course-offerings")
app.include_router(chat_router)
app.include_router(problem_arguments_router, prefix="/problem-arguments")
app.include_router(system_router)
# settings.py o en main.py
import os

# Directorio para archivos subidos al chat
CHAT_UPLOAD_DIR = "uploads/chat"
os.makedirs(CHAT_UPLOAD_DIR, exist_ok=True)

# Configuración de archivos
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
# ---------------- CORS ----------------
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOW_ORIGINS", "http://localhost:5173, http://localhost:3000").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# ---------------- OPENAPI BEARER ----------------
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=app.title,
        version=app.version,
        routes=app.routes,
    )

    schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer"
        }
    }

    for path in schema["paths"].values():
        for method in path.values():
            method["security"] = [{"BearerAuth": []}]

    app.openapi_schema = schema
    return app.openapi_schema

app.openapi = custom_openapi