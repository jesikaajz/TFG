from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import submissions_routes
from .routes import evaluation_routes
from .routes import tests_results_routes

# Import routers
from .routes.auth_routes import router as auth_router
from .routes.users_routes import router as users_router
from .routes.courses_routes import router as courses_router

# Importar todos los modelos para que SQLAlchemy los conozca
from .models.user_model import User
from .models.course_model import Course  #  IMPORTANTE: Course debe importarse antes de create_all
from .bd.connection import Base, engine
from .routes import enrollments_routes
from .routes import academic_years_routes
from .models.academic_year_model import AcademicYear
from .routes import exercises_routes
from .models.exercise_model import Exercise
from .routes import test_cases_routes
from .models.test_cases_model import TestCase
from .models.exercise_model import Exercise

# Crear tablas
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(auth_router)
app.include_router(users_router, prefix="/users")
app.include_router(courses_router, prefix="/courses")
app.include_router(enrollments_routes.router)  # ya incluye /enrollments
app.include_router(academic_years_routes.router, prefix="/academic-years")
app.include_router(exercises_routes.router, prefix="/exercises")
app.include_router(test_cases_routes.router, prefix="/test-cases")
app.include_router(submissions_routes.router, prefix="/submissions")
app.include_router(evaluation_routes.router, prefix="/evaluations")
app.include_router(tests_results_routes.router, prefix="/test-results")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)