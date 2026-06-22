"""
test_rnf4_fiabilidad.py - Validación de RNF-4 (Fiabilidad)
Uso: python test_rnf4_fiabilidad.py [--headless]
Ejemplo: python test_rnf4_fiabilidad.py
"""

import asyncio
import sys
import time
import json
import requests
from concurrent.futures import ThreadPoolExecutor
from playwright.async_api import async_playwright

# =====================================================
# CONFIGURACIÓN
# =====================================================
BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

CREDENTIALS = {
    "admin": {"email": "admin@admin.com", "password": "admin123"},
}

TOKEN_FILE = "token_admin.txt"

def load_token():
    try:
        with open(TOKEN_FILE, "r") as f:
            token = f.read().strip()
            if not token:
                raise ValueError("Token vacío")
            return token
    except FileNotFoundError:
        print(f"❌ No se encontró {TOKEN_FILE}. Ejecuta: python get_token.py admin")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error al leer token: {e}")
        sys.exit(1)

def api_headers(token=None):
    if token:
        return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    return {"Content-Type": "application/json"}

def api_request(method, endpoint, token=None, data=None, params=None, timeout=15):
    url = f"{BASE_URL_API}{endpoint}"
    headers = api_headers(token)
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, params=params, timeout=timeout)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers, timeout=timeout)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=headers, timeout=timeout)
        elif method == "PUT":
            resp = requests.put(url, json=data, headers=headers, timeout=timeout)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=timeout)
        else:
            raise ValueError(f"Método no soportado: {method}")
        return resp
    except requests.exceptions.Timeout:
        print(f"⏰ Timeout en {method} {endpoint}")
        return None
    except requests.exceptions.ConnectionError:
        print(f"🔌 Error de conexión en {method} {endpoint} - ¿El backend está corriendo?")
        return None
    except Exception as e:
        print(f"❌ Error en petición {method} {endpoint}: {e}")
        return None

def check_token_valid(token):
    resp = api_request("GET", "/users/me", token)
    if resp and resp.status_code == 200:
        return True
    print("❌ El token de admin no es válido o ha expirado. Regenera con: python get_token.py admin")
    return False

def find_resource_by_field(resource_list, field, value):
    for item in resource_list:
        if item.get(field) == value:
            return item
    return None

def register_student_user(email, name, password):
    """Crea un usuario estudiante usando el endpoint de registro público."""
    resp = requests.post(
        f"{BASE_URL_API}/users/register",
        json={"email": email, "name": name, "password": password},
        timeout=10
    )
    if resp.status_code in (200, 201):
        return resp.json()
    return None

def login_user(email, password):
    """Obtiene token de acceso para un usuario."""
    resp = requests.post(
        f"{BASE_URL_API}/auth/login-json",
        json={"email": email, "password": password},
        timeout=10
    )
    if resp.status_code == 200:
        return resp.json().get("access_token")
    return None

def get_or_create_student(token_admin, email, name, password):
    """Busca un estudiante por email; si no existe, lo crea via registro público y asigna rol (si es necesario)."""
    # Buscar si ya existe
    resp = api_request("GET", "/users/", token_admin)
    if resp and resp.status_code == 200:
        users = resp.json()
        existing = find_resource_by_field(users, "email", email)
        if existing:
            return existing
    # Crear via registro público
    user = register_student_user(email, name, password)
    if not user:
        return None
    # Si el registro devuelve usuario sin rol, asignarle rol student via admin
    if not user.get("role"):
        user_id = user["id"]
        resp = api_request("PUT", f"/users/{user_id}/role?role=student", token_admin)
        if resp and resp.status_code == 200:
            user["role"] = "student"
        else:
            print(f"⚠️ No se pudo asignar rol student al usuario {email}")
    return user

# =====================================================
# PRUEBA 4.1: INTEGRIDAD DE DATOS
# =====================================================

async def test_integridad_datos():
    print("\n🧪 [RNF-4.1] Prueba de Integridad de Datos")
    token = load_token()
    if not check_token_valid(token):
        return False

    created = {}
    student_token = None

    try:
        # 1. Crear usuario estudiante (o reutilizar)
        email = f"test.integridad.{int(time.time())}@upc.edu"
        password = "Test1234"
        print("  ➤ Preparando usuario de prueba...")
        user = get_or_create_student(token, email, "Usuario Integridad", password)
        if not user:
            print("    ❌ No se pudo crear/obtener usuario")
            return False
        user_id = user["id"]
        created["user"] = user_id
        print(f"    ✅ Usuario ID={user_id}")

        # 2. Obtener token del estudiante (login)
        print("  ➤ Obteniendo token del estudiante...")
        student_token = login_user(email, password)
        if not student_token:
            # Si falla, intentar forzar cambio de contraseña (como fallback)
            print("    ⚠️ Login fallido, forzando cambio de contraseña...")
            resp_force = api_request("PATCH", f"/users/{user_id}/force-password-change", token)
            if resp_force and resp_force.status_code == 200:
                student_token = login_user(email, password)
        if not student_token:
            print("    ❌ No se pudo obtener token del estudiante")
            return False
        print("    ✅ Token de estudiante obtenido")

        # 3. Recuperar usuario y verificar datos (con admin)
        resp = api_request("GET", f"/users/{user_id}", token)
        if not resp or resp.status_code != 200:
            print("    ❌ No se pudo recuperar el usuario")
            return False
        retrieved = resp.json()
        if retrieved["email"] != email or retrieved["name"] != "Usuario Integridad":
            print("    ❌ Los datos recuperados no coinciden")
            return False
        print("    ✅ Datos del usuario recuperados correctamente")

        # 4. Crear asignatura (con nombre único)
        subject_name = f"Asignatura Integridad {int(time.time())}"
        print("  ➤ Creando asignatura de prueba...")
        resp = api_request("POST", "/courses/subjects/", token, data={
            "name": subject_name,
            "description": "Prueba de integridad de datos"
        })
        if resp and resp.status_code in (200, 201):
            subject = resp.json()
            subject_id = subject["id"]
            created["subject"] = subject_id
            print(f"    ✅ Asignatura creada ID={subject_id}")
        else:
            print("    ❌ No se pudo crear asignatura")
            return False

        # 5. Obtener/Crear año académico 2025-2026
        print("  ➤ Preparando año académico...")
        resp = api_request("GET", "/academic-years/academic-years/", token)
        years = resp.json() if resp and resp.status_code == 200 else []
        year_id = None
        for y in years:
            if y["start_year"] == 2025 and y["end_year"] == 2026:
                year_id = y["id"]
                break
        if not year_id:
            resp = api_request("POST", "/academic-years/academic-years/", token,
                               data={"start_year": 2025, "end_year": 2026})
            if resp and resp.status_code in (200, 201):
                year_data = resp.json()
                year_id = year_data["id"]
                created["year"] = year_id
                print(f"    ✅ Año académico creado ID={year_id}")
            else:
                print("    ❌ No se pudo crear año académico")
                return False
        else:
            print(f"    ✅ Usando año académico existente ID={year_id}")

        # 6. Crear course offering
        print("  ➤ Creando course offering...")
        resp = api_request("POST", "/course-offerings/course-offerings/", token,
                           data={"subject_id": subject_id, "academic_year_id": year_id})
        if resp and resp.status_code in (200, 201):
            offering = resp.json()
            offering_id = offering["id"]
            created["offering"] = offering_id
            print(f"    ✅ Course offering creado ID={offering_id}")
        else:
            print("    ❌ Error al crear course offering")
            return False

        # 7. Matricular al usuario
        print("  ➤ Matriculando al usuario en el curso...")
        resp = api_request("POST", "/enrollments/", token,
                           data={"student_id": user_id, "academic_year_id": year_id, "offering_ids": [offering_id]})
        if resp and resp.status_code in (200, 201):
            enrollment = resp.json()
            created["enrollment"] = enrollment["id"]
            print(f"    ✅ Matrícula creada ID={enrollment['id']}")
        else:
            print("    ❌ Error al matricular usuario")
            return False

        # 8. Verificar lista de estudiantes
        resp = api_request("GET", f"/enrollments/by-offering/{offering_id}", token)
        if not resp or resp.status_code != 200:
            print("    ❌ No se pudo obtener lista de estudiantes")
            return False
        students = resp.json().get("students", [])
        if not any(s["id"] == user_id for s in students):
            print("    ❌ El usuario no aparece en la lista")
            return False
        print("    ✅ Usuario aparece en la lista de estudiantes")

        # 9. Crear ejercicio
        print("  ➤ Creando ejercicio de prueba...")
        resp = api_request("POST", "/exercises/exercises/", token,
                           data={
                               "title": "Ejercicio Integridad",
                               "description": "Prueba de integridad",
                               "deadline": "2026-01-01 00:00:00Z",
                               "course_offering_id": offering_id,
                               "visibility": True,
                               "solution": "def solution(): return 42",
                               "evaluation_mode": "legacy_stdin",
                               "return_type": "int"
                           })
        if resp and resp.status_code in (200, 201):
            exercise = resp.json()
            exercise_id = exercise["id"]
            created["exercise"] = exercise_id
            print(f"    ✅ Ejercicio creado ID={exercise_id}")
        else:
            print("    ❌ Error al crear ejercicio")
            return False

        # 10. Asignar lenguaje (Python)
        print("  ➤ Asignando lenguaje al ejercicio...")
        resp_langs = api_request("GET", "/programming-languages/programming-languages/", token)
        langs = resp_langs.json() if resp_langs and resp_langs.status_code == 200 else []
        lang_id = None
        for lang in langs:
            if lang["name"].lower() == "python":
                lang_id = lang["id"]
                break
        if not lang_id and langs:
            lang_id = langs[0]["id"]
        if lang_id:
            resp_assign = api_request("POST", "/exercise-language/exercise-languages/", token,
                                       data={"exercise_id": exercise_id, "language_id": lang_id})
            if resp_assign and resp_assign.status_code in (200, 201):
                print(f"    ✅ Lenguaje asignado (ID {lang_id})")
            else:
                print("    ⚠️ No se pudo asignar lenguaje")
        else:
            print("    ⚠️ No se encontró lenguaje para asignar")

        # 11. Crear submission usando token del estudiante
        print("  ➤ Creando submission de prueba...")
        # Obtener lenguajes del ejercicio (con token estudiante)
        resp = api_request("GET", f"/exercise-language/exercise-languages/exercise/{exercise_id}", student_token)
        langs = resp.json() if resp and resp.status_code == 200 else []
        if not langs:
            print("    ❌ El ejercicio no tiene lenguajes asignados")
            return False
        lang_id = langs[0]["language_id"]

        sub_data = {
            "exercise_id": exercise_id,
            "language_id": lang_id,
            "code": "def solution(): return 42"
        }
        resp = api_request("POST", "/submissions/submissions/", student_token, data=sub_data)
        if resp and resp.status_code in (200, 201):
            submission = resp.json()
            submission_id = submission["id"]
            created["submission"] = submission_id
            print(f"    ✅ Submission creada ID={submission_id}")
        else:
            print("    ❌ Error al crear submission")
            return False

        # 12. Recuperar submission y verificar código
        print("  ➤ Recuperando submission...")
        resp = api_request("GET", f"/submissions/submissions/{submission_id}", student_token)
        if not resp or resp.status_code != 200:
            print("    ❌ No se pudo recuperar submission")
            return False
        retrieved_sub = resp.json()
        if retrieved_sub["code"] != sub_data["code"]:
            print("    ❌ El código recuperado no coincide")
            return False
        print("    ✅ Submission recuperada y verificada")

        # 13. Editar ejercicio (actualización)
        print("  ➤ Probando actualización de datos (editar ejercicio)...")
        resp = api_request("PATCH", f"/exercises/exercises/{exercise_id}", token,
                           data={"title": "Ejercicio Integridad Editado"})
        if resp and resp.status_code == 200:
            print("    ✅ Ejercicio actualizado")
        else:
            print("    ❌ Error al editar ejercicio")
            return False

        # 14. Limpieza (opcional)
        # print("  ➤ Limpiando datos de prueba...")
        # if created.get("submission"):
        #     api_request("DELETE", f"/submissions/submissions/{created['submission']}", student_token)
        # if created.get("exercise"):
        #     api_request("DELETE", f"/exercises/exercises/{created['exercise']}", token)
        # if created.get("enrollment"):
        #     api_request("DELETE", f"/enrollments/{created['enrollment']}", token)
        # if created.get("offering"):
        #     api_request("DELETE", f"/course-offerings/course-offerings/{created['offering']}", token)
        # if created.get("subject"):
        #     api_request("DELETE", f"/courses/subjects/{created['subject']}", token)
        # if created.get("user"):
        #     api_request("DELETE", f"/users/{created['user']}", token)
        # if created.get("year"):
        #     api_request("DELETE", f"/academic-years/academic-years/{created['year']}", token)

        print("✅ [RNF-4.1] Prueba de integridad de datos: EXITOSA")
        return True

    except Exception as e:
        print(f"❌ Error en prueba de integridad: {e}")
        return False

# =====================================================
# PRUEBA 4.1 EXTRA: CONCURRENCIA
# =====================================================

def submit_task(exercise_id, lang_id, token, code_suffix):
    try:
        resp = requests.post(
            f"{BASE_URL_API}/submissions/submissions/",
            json={"exercise_id": exercise_id, "language_id": lang_id, "code": f"def solution(): return {code_suffix}"},
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
            timeout=10
        )
        if resp.status_code in (200, 201):
            return resp.json()["id"]
        return None
    except:
        return None

async def test_integridad_concurrencia():
    print("\n🧪 [RNF-4.1 extra] Prueba de concurrencia (submissions paralelas)")
    token = load_token()
    if not check_token_valid(token):
        return False

    created = {}
    student_token = None

    try:
        # 1. Crear estudiante
        email = f"student.concurrencia.{int(time.time())}@upc.edu"
        password = "Test1234"
        print("  ➤ Preparando estudiante...")
        user = get_or_create_student(token, email, "Student Concurrencia", password)
        if not user:
            print("    ❌ No se pudo crear estudiante")
            return False
        student_id = user["id"]
        created["student"] = student_id
        print(f"    ✅ Estudiante ID={student_id}")

        # 2. Obtener token del estudiante
        print("  ➤ Obteniendo token del estudiante...")
        student_token = login_user(email, password)
        if not student_token:
            print("    ⚠️ Login fallido, forzando cambio de contraseña...")
            resp_force = api_request("PATCH", f"/users/{student_id}/force-password-change", token)
            if resp_force and resp_force.status_code == 200:
                student_token = login_user(email, password)
        if not student_token:
            print("    ❌ No se pudo obtener token del estudiante")
            return False
        print("    ✅ Token de estudiante obtenido")

        # 3. Crear asignatura
        subject_name = f"Concurrencia {int(time.time())}"
        resp = api_request("POST", "/courses/subjects/", token,
                           data={"name": subject_name, "description": "Prueba concurrencia"})
        if resp and resp.status_code in (200, 201):
            subject = resp.json()
            subject_id = subject["id"]
            created["subject"] = subject_id
            print(f"    ✅ Asignatura creada ID={subject_id}")
        else:
            print("    ❌ No se pudo crear asignatura")
            return False

        # 4. Año académico
        resp = api_request("GET", "/academic-years/academic-years/", token)
        years = resp.json() if resp and resp.status_code == 200 else []
        year_id = None
        for y in years:
            if y["start_year"] == 2025 and y["end_year"] == 2026:
                year_id = y["id"]
                break
        if not year_id:
            resp = api_request("POST", "/academic-years/academic-years/", token,
                               data={"start_year": 2025, "end_year": 2026})
            if resp and resp.status_code in (200, 201):
                year_data = resp.json()
                year_id = year_data["id"]
                created["year"] = year_id
                print(f"    ✅ Año académico creado ID={year_id}")
            else:
                print("    ❌ No se pudo crear año académico")
                return False
        else:
            print(f"    ✅ Usando año académico existente ID={year_id}")

        # 5. Course offering
        resp = api_request("POST", "/course-offerings/course-offerings/", token,
                           data={"subject_id": subject_id, "academic_year_id": year_id})
        if resp and resp.status_code in (200, 201):
            offering = resp.json()
            offering_id = offering["id"]
            created["offering"] = offering_id
            print(f"    ✅ Course offering creado ID={offering_id}")
        else:
            print("    ❌ No se pudo crear course offering")
            return False

        # 6. Matricular al estudiante
        resp = api_request("POST", "/enrollments/", token,
                           data={"student_id": student_id, "academic_year_id": year_id, "offering_ids": [offering_id]})
        if resp and resp.status_code in (200, 201):
            enrollment = resp.json()
            created["enrollment"] = enrollment["id"]
            print("    ✅ Estudiante matriculado")
        else:
            print("    ❌ No se pudo matricular estudiante")
            return False

        # 7. Crear ejercicio específico para concurrencia
        exercise_title = f"Ejercicio Concurrencia {int(time.time())}"
        resp = api_request("POST", "/exercises/exercises/", token,
                           data={
                               "title": exercise_title,
                               "description": "Prueba concurrencia",
                               "deadline": "2026-01-01 00:00:00Z",
                               "course_offering_id": offering_id,
                               "visibility": True,
                               "solution": "def solution(): return 1",
                               "evaluation_mode": "legacy_stdin",
                               "return_type": "int"
                           })
        if resp and resp.status_code in (200, 201):
            exercise = resp.json()
            exercise_id = exercise["id"]
            created["exercise"] = exercise_id
            print(f"    ✅ Ejercicio creado ID={exercise_id}")
        else:
            print("    ❌ No se pudo crear ejercicio")
            return False

        # 8. Asignar lenguaje
        resp_langs = api_request("GET", "/programming-languages/programming-languages/", token)
        langs = resp_langs.json() if resp_langs and resp_langs.status_code == 200 else []
        lang_id = None
        for lang in langs:
            if lang["name"].lower() == "python":
                lang_id = lang["id"]
                break
        if not lang_id and langs:
            lang_id = langs[0]["id"]
        if lang_id:
            api_request("POST", "/exercise-language/exercise-languages/", token,
                        data={"exercise_id": exercise_id, "language_id": lang_id})
            print(f"    ✅ Lenguaje asignado (ID {lang_id})")
        else:
            print("    ⚠️ No se encontró lenguaje, se usará el primero")

        # 9. Enviar submissions en paralelo
        NUM_SUBMISSIONS = 20
        print(f"  ➤ Enviando {NUM_SUBMISSIONS} submissions en paralelo (con token estudiante)...")
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(submit_task, exercise_id, lang_id, student_token, i) for i in range(NUM_SUBMISSIONS)]
            results = [f.result() for f in futures]

        successful = [r for r in results if r is not None]
        print(f"    ✅ Submissions exitosas: {len(successful)}/{NUM_SUBMISSIONS}")

        if len(successful) < NUM_SUBMISSIONS:
            print("    ❌ No se completaron todas las submissions")
            return False

        # 10. Verificar recuperación
        print("  ➤ Verificando integridad de las submissions guardadas...")
        all_ok = True
        for sub_id in successful:
            resp = api_request("GET", f"/submissions/submissions/{sub_id}", student_token)
            if resp.status_code != 200:
                print(f"    ❌ No se pudo recuperar submission {sub_id}")
                all_ok = False
                break
        if all_ok:
            print("    ✅ Todas las submissions recuperadas correctamente")
        else:
            print("    ❌ Falló la recuperación de alguna submission")

        # Limpieza (opcional)
        # for sub_id in successful:
        #     api_request("DELETE", f"/submissions/submissions/{sub_id}", student_token)
        # if created.get("student"):
        #     api_request("DELETE", f"/users/{created['student']}", token)
        # if created.get("exercise"):
        #     api_request("DELETE", f"/exercises/exercises/{created['exercise']}", token)
        # if created.get("offering"):
        #     api_request("DELETE", f"/course-offerings/course-offerings/{created['offering']}", token)
        # if created.get("subject"):
        #     api_request("DELETE", f"/courses/subjects/{created['subject']}", token)
        # if created.get("year") and year_id not in [y["id"] for y in years]:
        #     api_request("DELETE", f"/academic-years/academic-years/{created['year']}", token)

        if all_ok and len(successful) == NUM_SUBMISSIONS:
            print("✅ [RNF-4.1 extra] Prueba de concurrencia: EXITOSA")
            return True
        else:
            print("❌ [RNF-4.1 extra] Prueba de concurrencia: FALLIDA")
            return False

    except Exception as e:
        print(f"❌ Error en concurrencia: {e}")
        return False

# =====================================================
# PRUEBA 4.2: GESTIÓN DE ERRORES (BACKEND)
# =====================================================

def test_gestion_errores_backend():
    print("\n🧪 [RNF-4.2] Prueba de gestión de errores (backend)")
    token = load_token()
    if not check_token_valid(token):
        return False

    errors_ok = 0
    total = 0

    # 1. Crear usuario sin email
    print("  ➤ Intentar crear usuario sin email...")
    resp = api_request("POST", "/users/", token, data={"name": "Sin Email", "password": "123"})
    total += 1
    if resp is None:
        print("    ❌ Sin respuesta")
    elif resp.status_code in (400, 422):
        detail = resp.json().get("detail", "")
        if detail and len(detail) > 0:
            print(f"    ✅ Error con mensaje (código {resp.status_code})")
            errors_ok += 1
        else:
            print(f"    ❌ Mensaje vacío o ausente")
    else:
        print(f"    ❌ Se esperaba 400/422, obtuvo {resp.status_code}")

    # 2. Acceder sin token (401)
    print("  ➤ Intentar acceder a /users/ sin token...")
    resp = requests.get(f"{BASE_URL_API}/users/")
    total += 1
    if resp.status_code == 401:
        detail = resp.json().get("detail", "")
        if detail and len(detail) > 0:
            print("    ✅ Error 401 con mensaje")
            errors_ok += 1
        else:
            print("    ❌ Mensaje vacío")
    else:
        print(f"    ❌ Se esperaba 401, obtuvo {resp.status_code}")

    # 3. Eliminar usuario inexistente (404)
    print("  ➤ Intentar eliminar usuario inexistente...")
    resp = api_request("DELETE", "/users/999999", token)
    total += 1
    if resp is None:
        print("    ❌ Sin respuesta")
    elif resp.status_code in (404, 204, 200):
        if resp.status_code == 404:
            detail = resp.json().get("detail", "")
            if detail and len(detail) > 0:
                print("    ✅ Error 404 con mensaje")
                errors_ok += 1
            else:
                print("    ❌ Mensaje vacío")
        else:
            print(f"    ✅ Código {resp.status_code} (aceptable)")
            errors_ok += 1
    else:
        print(f"    ❌ Se esperaba 404/204, obtuvo {resp.status_code}")

    # 4. Submission con código vacío (debe dar 400/422)
    print("  ➤ Intentar crear submission con código vacío...")
    resp = api_request("GET", "/exercises/exercises/", token)
    if resp and resp.status_code == 200:
        exercises = resp.json()
        if exercises:
            ex_id = exercises[0]["id"]
            resp_langs = api_request("GET", f"/exercise-language/exercise-languages/exercise/{ex_id}", token)
            if resp_langs and resp_langs.status_code == 200:
                langs = resp_langs.json()
                if langs:
                    lang_id = langs[0]["language_id"]
                    resp_sub = api_request("POST", "/submissions/submissions/", token,
                                           data={"exercise_id": ex_id, "language_id": lang_id, "code": ""})
                    total += 1
                    if resp_sub is None:
                        print("    ❌ Sin respuesta")
                    elif resp_sub.status_code in (400, 422):
                        detail = resp_sub.json().get("detail", "")
                        if detail and len(detail) > 0:
                            print("    ✅ Error de validación con mensaje")
                            errors_ok += 1
                        else:
                            print("    ❌ Mensaje vacío")
                    else:
                        print(f"    ❌ Se esperaba 400/422, obtuvo {resp_sub.status_code}")
                else:
                    print("    ⚠️ No hay lenguajes, se omite")
            else:
                print("    ⚠️ No se pudo obtener lenguajes, se omite")
        else:
            print("    ⚠️ No hay ejercicios, se omite")
    else:
        print("    ⚠️ No se pudieron obtener ejercicios, se omite")

    if total == 0:
        print("⚠️ No se pudo ejecutar ninguna prueba de errores")
        return False
    rate = errors_ok / total
    print(f"  ➤ Errores bien gestionados: {errors_ok}/{total} ({rate*100:.0f}%)")
    if rate >= 0.75:
        print("✅ [RNF-4.2] Gestión de errores en backend: ACEPTABLE")
        return True
    else:
        print("❌ [RNF-4.2] Gestión de errores en backend: INSUFICIENTE")
        return False

# =====================================================
# PRUEBA 4.2: GESTIÓN DE ERRORES (FRONTEND)
# =====================================================

async def test_gestion_errores_frontend():
    print("\n🧪 [RNF-4.2] Prueba de gestión de errores (frontend)")
    headless = "--headless" not in sys.argv
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)
        context = await browser.new_context()
        page = await context.new_page()

        await page.goto(f"{BASE_URL_FRONT}/login.html")
        await page.fill("#email", CREDENTIALS["admin"]["email"])
        await page.fill("#password", CREDENTIALS["admin"]["password"])
        await page.click("#admin")
        await page.click(".login-btn")
        await page.wait_for_selector("text=Admin Dashboard", timeout=10000)

        print("  ➤ Intentar crear asignatura sin nombre en frontend...")
        await page.click("text=Academic Structure")
        await page.wait_for_selector("text=Academic Structure", timeout=5000)
        await page.click("#createSubjectBtn")
        await page.wait_for_selector("#modalSubjectName", timeout=5000)
        await page.fill("#modalSubjectDescription", "Descripción sin nombre")
        await page.click("#confirmCreateSubjectBtn")

        try:
            await page.wait_for_selector("[class*='notification'], [class*='toast'], .alert, .error", timeout=5000)
            print("    ✅ Se mostró mensaje de error (clase genérica)")
            error_seen = True
        except:
            try:
                await page.wait_for_selector("text=requerido", timeout=3000)
                print("    ✅ Se mostró mensaje de error (texto 'requerido')")
                error_seen = True
            except:
                try:
                    await page.wait_for_selector("text=nombre", timeout=3000)
                    print("    ✅ Se mostró mensaje de error (texto 'nombre')")
                    error_seen = True
                except:
                    print("    ❌ No se detectó mensaje de error visible")
                    error_seen = False

        try:
            await page.click(".close-modal")
        except:
            pass

        await browser.close()
        return error_seen

# =====================================================
# PRUEBA PRINCIPAL
# =====================================================

async def main():
    print("🔍 INICIANDO PRUEBAS DE RNF-4 (FIABILIDAD)")
    resultados = {}

    integridad_ok = await test_integridad_datos()
    resultados["RNF-4.1 Integridad de datos"] = integridad_ok

    concurrencia_ok = await test_integridad_concurrencia()
    resultados["RNF-4.1 Concurrencia"] = concurrencia_ok

    errores_backend_ok = test_gestion_errores_backend()
    resultados["RNF-4.2 Gestión de errores (backend)"] = errores_backend_ok

    errores_frontend_ok = await test_gestion_errores_frontend()
    resultados["RNF-4.2 Gestión de errores (frontend)"] = errores_frontend_ok

    print("\n" + "="*50)
    print("📊 RESUMEN DE RESULTADOS")
    for k, v in resultados.items():
        print(f"  {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")

    cumple_4_1 = integridad_ok and concurrencia_ok
    cumple_4_2 = errores_backend_ok and errores_frontend_ok

    print("\n🔎 VEREDICTO FINAL:")
    print(f"  RNF-4.1 (Integridad de datos): {'✅ CUMPLE' if cumple_4_1 else '❌ NO CUMPLE'}")
    print(f"  RNF-4.2 (Gestión de errores): {'✅ CUMPLE' if cumple_4_2 else '❌ NO CUMPLE'}")

    if cumple_4_1 and cumple_4_2:
        print("\n🎉 **RNF-4 (Fiabilidad) CUMPLE COMPLETAMENTE**")
    else:
        print("\n⚠️ **RNF-4 (Fiabilidad) NO CUMPLE COMPLETAMENTE**")

if __name__ == "__main__":
    asyncio.run(main())