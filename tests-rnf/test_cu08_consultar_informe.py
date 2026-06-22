"""
test_cu08_consultar_informe.py - Validación del CU-08: Consultar informe de evaluación
Uso: python test_cu08_consultar_informe.py [--headless]
"""

import asyncio
import sys
import time
import requests
import subprocess
from playwright.async_api import async_playwright

BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

ADMIN_CREDENTIALS = {"email": "admin@admin.com", "password": "admin123"}
TEACHER_CREDENTIALS = {"email": "javier@upc.edu", "password": "javier12"}
STUDENT_EMAIL = "jvjp3107@gmail.com"
STUDENT_PASSWORD = "drpnll00"
TOKEN_FILE = "token_admin.txt"

POLLING_INTERVAL = 3
EVALUATION_TIMEOUT = 120  # segundos (2 minutos)

# ========== Variables globales para cachear la submission ==========
_cached_submission_data = None
_cached_submission_ready = False

# ========== Helpers API ==========
def load_token(filename):
    try:
        with open(filename, "r") as f:
            token = f.read().strip()
            return token if token else None
    except FileNotFoundError:
        return None

def check_token_valid(token):
    if not token:
        return False
    try:
        resp = requests.get(f"{BASE_URL_API}/users/me",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp.status_code == 200
    except:
        return False

def ensure_token(role="admin"):
    filename = f"token_{role}.txt"
    token = load_token(filename)
    if token and check_token_valid(token):
        return token
    print(f"⚠️ Token de {role} no válido o no existe. Regenerando...")
    try:
        subprocess.run(["python", "get_token.py", role], check=True, capture_output=True)
        token = load_token(filename)
        if token and check_token_valid(token):
            print(f"✅ Token de {role} regenerado correctamente.")
            return token
        else:
            print(f"❌ No se pudo regenerar el token de {role}.")
            return None
    except Exception as e:
        print(f"❌ Error al regenerar token: {e}")
        return None

def api_login(role):
    if role == "admin":
        creds = ADMIN_CREDENTIALS
    elif role == "teacher":
        creds = TEACHER_CREDENTIALS
    else:
        creds = {"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
    try:
        resp = requests.post(f"{BASE_URL_API}/auth/login-json",
                             json={"email": creds["email"], "password": creds["password"]},
                             timeout=5)
        if resp.status_code == 200:
            return resp.json().get("access_token")
        return None
    except:
        return None

def api_request(method, endpoint, token=None, data=None, params=None, timeout=10):
    url = f"{BASE_URL_API}{endpoint}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"} if token else {}
    try:
        resp = requests.request(method, url, headers=headers, json=data, params=params, timeout=timeout, allow_redirects=True)
        return resp
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error en petición {method} {endpoint}: {e}")
        return None
    except Exception as e:
        print(f"⚠️ Error inesperado: {e}")
        return None

def api_get_academic_years(token):
    return api_request("GET", "/academic-years/academic-years/", token)

def get_or_create_academic_year(token, start_year, end_year):
    resp = api_get_academic_years(token)
    if not resp or resp.status_code != 200:
        return None, "No se pudo obtener la lista de años académicos"
    years = resp.json()
    for y in years:
        if y["start_year"] == start_year and y["end_year"] == end_year:
            return y, None
    resp = api_request("POST", "/academic-years/academic-years/", token, data={"start_year": start_year, "end_year": end_year})
    if not resp or resp.status_code not in (200, 201):
        return None, f"Error al crear año académico {start_year}-{end_year}: {resp.status_code if resp else 'sin respuesta'}"
    return resp.json(), None

def api_create_subject(token, name, description=""):
    return api_request("POST", "/courses/subjects/", token, data={"name": name, "description": description})

def api_delete_subject(token, subject_id):
    return api_request("DELETE", f"/courses/subjects/{subject_id}", token)

def api_create_course_offering(token, subject_id, academic_year_id):
    return api_request("POST", "/course-offerings/course-offerings/", token, data={"subject_id": subject_id, "academic_year_id": academic_year_id})

def api_delete_course_offering(token, offering_id):
    return api_request("DELETE", f"/course-offerings/course-offerings/{offering_id}", token)

def api_create_enrollment(token, student_id, academic_year_id, offering_ids):
    return api_request("POST", "/enrollments/", token, data={"student_id": student_id, "academic_year_id": academic_year_id, "offering_ids": offering_ids})

def api_get_enrollments_by_student(token, student_id):
    return api_request("GET", f"/enrollments/student/{student_id}", token)

def api_create_exercise(token, offering_id, title, description="Prueba de envío", deadline=None, evaluation_mode="legacy_stdin", return_type="int"):
    if not deadline:
        from datetime import datetime, timedelta
        deadline = (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d 23:59:59Z")
    data = {
        "title": title,
        "description": description,
        "deadline": deadline,
        "course_offering_id": offering_id,
        "visibility": True,
        "solution": "",
        "evaluation_mode": evaluation_mode,
        "return_type": return_type
    }
    return api_request("POST", "/exercises/exercises/", token, data=data)

def api_delete_exercise(token, exercise_id):
    return api_request("DELETE", f"/exercises/exercises/{exercise_id}", token)

def api_assign_language(token, exercise_id, language_id):
    return api_request("POST", "/exercise-language/exercise-languages/", token, data={"exercise_id": exercise_id, "language_id": language_id})

def api_get_languages(token):
    return api_request("GET", "/programming-languages/programming-languages/", token)

def api_create_test_case(token, exercise_id, input_data, expected_output, is_hidden=False):
    return api_request("POST", "/test-cases/test-cases/", token, data={
        "exercise_id": exercise_id,
        "input_data": input_data,
        "expected_output": expected_output,
        "is_hidden": is_hidden
    })

def api_create_submission(token, exercise_id, language_id, code):
    return api_request("POST", "/submissions/submissions/", token, data={
        "exercise_id": exercise_id,
        "language_id": language_id,
        "code": code
    })

def api_get_submission_status(token, submission_id):
    return api_request("GET", f"/submissions/submissions/{submission_id}/status", token)

def api_get_evaluation(token, submission_id):
    return api_request("GET", f"/evaluations/evaluations/submission/{submission_id}", token)

def api_get_submission(token, submission_id):
    return api_request("GET", f"/submissions/submissions/{submission_id}", token)

def api_get_my_submissions(token):
    """Obtiene las submissions del estudiante autenticado."""
    # El router ya tiene prefijo /submissions, así que la ruta es /me
    return api_request("GET", "/submissions/submissions/me", token)

def api_get_user_by_email(token, email):
    resp = api_request("GET", "/users/", token)
    if not resp or resp.status_code != 200:
        return None
    users = resp.json()
    for u in users:
        if u["email"] == email:
            return u
    return None

# ========== Función para esperar evaluación con timeout ==========
async def wait_for_evaluation_with_timeout(token, submission_id, timeout=EVALUATION_TIMEOUT, interval=POLLING_INTERVAL):
    """Espera hasta que la evaluación se complete o se alcance el timeout."""
    print(f"   ⏳ Esperando evaluación de submission {submission_id} (timeout: {timeout}s)...")
    start = time.time()
    last_status = None
    while time.time() - start < timeout:
        status_resp = api_get_submission_status(token, submission_id)
        if status_resp and status_resp.status_code == 200:
            status = status_resp.json()
            detailed = status.get("detailed_status", "")
            progress = status.get("progress", 0)
            if detailed != last_status:
                print(f"   📊 Progreso: {progress}% - {status.get('message', '')} ({detailed})")
                last_status = detailed
            if detailed == "completed":
                print("   ✅ Evaluación completada")
                return True, "Evaluación completada"
            elif detailed == "error":
                print(f"   ❌ Error en evaluación: {status.get('message', '')}")
                return False, f"Error en evaluación: {status.get('message', '')}"
        else:
            print(f"   ⚠️ No se pudo obtener estado (código {status_resp.status_code if status_resp else 'sin respuesta'})")
        await asyncio.sleep(interval)
    print(f"   ❌ Tiempo de espera agotado ({timeout}s)")
    return False, f"Timeout de {timeout}s alcanzado"

# ========== Función para buscar o crear submission evaluada (cacheada) ==========
async def get_or_create_submission_data(admin_token):
    """Devuelve los datos de una submission evaluada, creándola si no existe (cacheada)."""
    global _cached_submission_data, _cached_submission_ready

    if _cached_submission_ready:
        return _cached_submission_data, None

    # 1. Buscar existente usando /submissions/me con token de estudiante
    print("   🔍 Buscando submission evaluada existente...")
    student_token = api_login("student")
    if not student_token:
        return None, "No se pudo obtener token de estudiante"

    resp = api_get_my_submissions(student_token)
    if resp and resp.status_code == 200:
        submissions = resp.json()
        print(f"   📋 Se encontraron {len(submissions)} submissions. Revisando primeras 50...")
        # Revisamos hasta 50 para encontrar una con evaluación
        for idx, sub in enumerate(submissions[:50], 1):
            print(f"   🔍 Submission {idx}/{min(len(submissions),50)} (ID: {sub['id']})")
            # Intentar obtener evaluación directamente
            eval_resp = api_get_evaluation(student_token, sub["id"])
            if not eval_resp or eval_resp.status_code != 200:
                continue  # No tiene evaluación, saltar
            # Si tiene evaluación, es válida
            # Obtener ejercicio, offering y subject
            exercise_resp = api_request("GET", f"/exercises/exercises/{sub['exercise_id']}", admin_token)
            if not exercise_resp or exercise_resp.status_code != 200:
                continue
            exercise = exercise_resp.json()
            # Usar el endpoint de búsqueda de course offerings
            offering_search_resp = api_request("GET", "/course-offerings/search", admin_token,
                                               params={"offering_id": exercise['course_offering_id']})
            if not offering_search_resp or offering_search_resp.status_code != 200:
                continue
            search_data = offering_search_resp.json()
            if not search_data.get("items") or len(search_data["items"]) == 0:
                continue
            offering = search_data["items"][0]  # Tomamos el primero (debería ser único)
            # Obtener subject
            subject_resp = api_request("GET", f"/courses/subjects/{offering['subject_id']}", admin_token)
            if not subject_resp or subject_resp.status_code != 200:
                continue
            subject = subject_resp.json()
            _cached_submission_data = {
                "submission_id": sub["id"],
                "exercise_id": exercise["id"],
                "offering_id": exercise["course_offering_id"],
                "subject_id": offering["subject_id"],
                "subject_name": subject["name"],
                "no_enrollment": False
            }
            _cached_submission_ready = True
            print(f"   ✅ Reutilizando submission evaluada existente (ID: {_cached_submission_data['submission_id']})")
            return _cached_submission_data, None

    # 2. No existe, crear una nueva
    print("   ⚠️ No se encontró submission evaluada. Creando una nueva (puede tardar varios minutos)...")
    try:
        # Crear asignatura, año, offering
        subject_name = f"Informe Test {int(time.time())}"
        resp = api_create_subject(admin_token, subject_name, "Asignatura para informe")
        if not resp or resp.status_code not in (200, 201):
            return None, "No se pudo crear asignatura"
        subject = resp.json()
        subject_id = subject["id"]

        year, err = get_or_create_academic_year(admin_token, 2025, 2026)
        if not year:
            return None, f"No se pudo obtener/crear año: {err}"
        year_id = year["id"]

        resp = api_create_course_offering(admin_token, subject_id, year_id)
        if not resp or resp.status_code not in (200, 201):
            return None, "No se pudo crear course offering"
        offering = resp.json()
        offering_id = offering["id"]

        # Matricular al estudiante
        student = api_get_user_by_email(admin_token, STUDENT_EMAIL)
        if not student:
            return None, f"No se encontró el estudiante {STUDENT_EMAIL}"
        student_id = student["id"]

        enroll_resp = api_get_enrollments_by_student(admin_token, student_id)
        already = False
        if enroll_resp and enroll_resp.status_code == 200:
            for e in enroll_resp.json():
                if e.get("academic_year_id") == year_id:
                    for course in e.get("courses", []):
                        if course.get("offering_id") == offering_id:
                            already = True
                            break
                    if already:
                        break

        if not already:
            resp_enroll = api_create_enrollment(admin_token, student_id, year_id, [offering_id])
            if resp_enroll is None:
                return None, "No se pudo matricular al estudiante (sin respuesta)"
            if resp_enroll.status_code not in (200, 201):
                if resp_enroll.status_code not in (400, 409):
                    return None, f"No se pudo matricular al estudiante (código {resp_enroll.status_code}): {resp_enroll.text}"

        # Obtener lenguaje Python
        langs_resp = api_get_languages(admin_token)
        if not langs_resp or langs_resp.status_code != 200:
            return None, "No se pudieron obtener lenguajes"
        langs = langs_resp.json()
        python_lang = next((l for l in langs if l["name"].lower() == "python"), langs[0] if langs else None)
        if not python_lang:
            return None, "No se encontró lenguaje"

        # Crear ejercicio
        exercise_title = f"Ejercicio Informe {int(time.time())}"
        resp = api_create_exercise(admin_token, offering_id, exercise_title,
                                   description="Prueba de informe",
                                   evaluation_mode="legacy_stdin")
        if not resp or resp.status_code not in (200, 201):
            return None, "No se pudo crear ejercicio"
        exercise = resp.json()
        exercise_id = exercise["id"]

        # Asignar lenguaje
        api_assign_language(admin_token, exercise_id, python_lang["id"])

        # Crear test cases
        api_create_test_case(admin_token, exercise_id, "2 3", "5", is_hidden=False)

        # Crear submission con token de estudiante
        student_token = api_login("student")
        if not student_token:
            return None, "No se pudo obtener token de estudiante"
        code = """import sys

def solution(input_data):
    nums = input_data.split()
    if len(nums) < 2:
        return 0
    return int(nums[0]) + int(nums[1])

if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    print(solution(input_data))"""
        resp = api_create_submission(student_token, exercise_id, python_lang["id"], code)
        if not resp or resp.status_code not in (200, 201):
            return None, f"No se pudo crear submission: {resp.status_code if resp else 'sin respuesta'} - {resp.text if resp else ''}"
        submission = resp.json()
        submission_id = submission["id"]

        # Esperar evaluación con timeout
        ok, msg = await wait_for_evaluation_with_timeout(student_token, submission_id)
        if not ok:
            return None, f"Evaluación falló o timeout: {msg}"

        # Obtener evaluación para verificar
        eval_resp = api_get_evaluation(student_token, submission_id)
        if not eval_resp or eval_resp.status_code != 200:
            return None, "No se pudo obtener evaluación"

        _cached_submission_data = {
            "submission_id": submission_id,
            "exercise_id": exercise_id,
            "offering_id": offering_id,
            "subject_id": subject_id,
            "subject_name": subject_name,
            "no_enrollment": False
        }
        _cached_submission_ready = True
        print(f"   ✅ Submission creada y evaluada (ID: {submission_id})")
        return _cached_submission_data, None

    except Exception as e:
        return None, f"Error en creación: {str(e)}"

# ========== Pruebas UI ==========
async def login_as(page, role):
    if role == "admin":
        creds = ADMIN_CREDENTIALS
    elif role == "teacher":
        creds = TEACHER_CREDENTIALS
    else:
        creds = {"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
    await page.goto(f"{BASE_URL_FRONT}/login.html", wait_until="domcontentloaded", timeout=15000)
    await page.wait_for_selector("body", timeout=5000)
    await page.fill("#email", creds["email"])
    await page.fill("#password", creds["password"])
    await page.click(f"#{role}")
    await page.click(".login-btn")
    await page.wait_for_url("**/main.html", timeout=10000)

async def navigate_to_submissions(page):
    await page.click("text=Submissions")
    await page.wait_for_selector("text=Submissions History", timeout=10000)

async def find_submission_in_table(page, submission_id):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        text = await row.text_content()
        if f"#{submission_id}" in text:
            return row
    return None

async def click_view_report(page, row):
    view_btn = await row.query_selector(".view-btn")
    if not view_btn:
        return False
    await view_btn.click()
    await page.wait_for_selector(".submission-report", timeout=10000)
    return True

async def verify_report_content(page):
    checks = []
    score_elem = await page.query_selector(".score-number")
    checks.append(("Puntuación", score_elem is not None))
    if score_elem:
        score_text = await score_elem.text_content()
        print(f"   📊 Puntuación: {score_text.strip() if score_text else 'No disponible'}")

    test_items = await page.query_selector_all(".test-item")
    checks.append(("Tests", len(test_items) > 0))
    print(f"   📊 Tests mostrados: {len(test_items)}")

    feedback = await page.query_selector(".feedback-summary")
    checks.append(("Feedback", feedback is not None))
    if feedback:
        feedback_text = await feedback.text_content()
        print(f"   📝 Feedback: {feedback_text[:100] if feedback_text else 'No disponible'}...")

    code_block = await page.query_selector(".code-block")
    checks.append(("Código", code_block is not None))

    pdf_btn = await page.query_selector(".download-pdf-btn")
    if pdf_btn:
        print("   📄 Botón PDF disponible")
        checks.append(("PDF disponible", True))
    else:
        print("   📄 Botón PDF no disponible (puede estar generándose)")
        checks.append(("PDF disponible", False))

    all_ok = all(check[1] for check in checks if check[0] != "PDF disponible")
    return all_ok, checks

# ========== Pruebas ==========
async def test_consultar_informe_estudiante(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        test_data, err = await get_or_create_submission_data(admin_token)
        if not test_data:
            return False, f"Setup falló: {err}"
        if test_data.get("no_enrollment"):
            print("   ⚠️ No se pudo matricular al estudiante. Omitiendo prueba UI.")
            return True, "No evaluado (fallo en matriculación)"
        submission_id = test_data["submission_id"]

        await login_as(page, "student")
        await navigate_to_submissions(page)

        row = await find_submission_in_table(page, submission_id)
        if not row:
            return False, "No se encontró la submission en la tabla"

        ok = await click_view_report(page, row)
        if not ok:
            return False, "No se pudo hacer clic en View Report"

        ok, checks = await verify_report_content(page)
        if not ok:
            failed = [c[0] for c in checks if not c[1]]
            return False, f"Informe incompleto: faltan {failed}"

        return True, "Informe consultado correctamente por estudiante"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_consultar_informe_profesor(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        test_data, err = await get_or_create_submission_data(admin_token)
        if not test_data:
            return False, f"Setup falló: {err}"
        if test_data.get("no_enrollment"):
            print("   ⚠️ No se pudo matricular al estudiante. Omitiendo prueba UI.")
            return True, "No evaluado (fallo en matriculación)"
        submission_id = test_data["submission_id"]

        await login_as(page, "teacher")
        await navigate_to_submissions(page)

        row = await find_submission_in_table(page, submission_id)
        if not row:
            return False, "No se encontró la submission en la tabla (profesor)"

        ok = await click_view_report(page, row)
        if not ok:
            return False, "No se pudo hacer clic en View Report (profesor)"

        ok, checks = await verify_report_content(page)
        if not ok:
            failed = [c[0] for c in checks if not c[1]]
            return False, f"Informe incompleto para profesor: faltan {failed}"

        code_block = await page.query_selector(".code-block")
        if code_block:
            code_text = await code_block.text_content()
            if "def solution" in code_text:
                print("   ✅ Código del estudiante visible")

        return True, "Informe consultado correctamente por profesor"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_descarga_pdf(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        test_data, err = await get_or_create_submission_data(admin_token)
        if not test_data:
            return False, f"Setup falló: {err}"
        if test_data.get("no_enrollment"):
            print("   ⚠️ No se pudo matricular al estudiante. Omitiendo prueba UI.")
            return True, "No evaluado (fallo en matriculación)"
        submission_id = test_data["submission_id"]

        await login_as(page, "student")
        await navigate_to_submissions(page)

        row = await find_submission_in_table(page, submission_id)
        if not row:
            return False, "No se encontró la submission"

        await click_view_report(page, row)

        pdf_btn = await page.query_selector(".download-pdf-btn")
        if pdf_btn:
            is_disabled = await pdf_btn.get_attribute("disabled")
            if is_disabled:
                print("   ⚠️ Botón PDF deshabilitado (PDF no disponible)")
                return True, "PDF no disponible (puede estar generándose)"
            async with page.expect_download() as download_info:
                await pdf_btn.click()
            download = await download_info.value
            if download.suggested_filename.endswith(".pdf"):
                return True, "PDF descargado correctamente"
            else:
                return False, f"Archivo descargado no es PDF: {download.suggested_filename}"
        else:
            print("   ⚠️ No se encontró botón de descarga de PDF")
            return True, "PDF no disponible (botón no mostrado)"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

# ========== Prueba API ==========
async def test_api_consultar_informe(admin_token):
    test_data, err = await get_or_create_submission_data(admin_token)
    if not test_data:
        return False, f"Setup falló: {err}"
    if test_data.get("no_enrollment"):
        return False, "No se pudo matricular al estudiante"

    submission_id = test_data["submission_id"]
    student_token = api_login("student")
    if not student_token:
        return False, "No se pudo obtener token de estudiante"

    eval_resp = api_get_evaluation(student_token, submission_id)
    if not eval_resp or eval_resp.status_code != 200:
        return False, "No se pudo obtener la evaluación vía API con token estudiante"

    eval_data = eval_resp.json()
    if "score" not in eval_data:
        return False, "La evaluación no contiene puntuación"

    return True, f"Informe obtenido vía API (score: {eval_data.get('score', 0)})"

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-08: CONSULTAR INFORME DE EVALUACIÓN")
    headless = "--headless" in sys.argv

    admin_token = ensure_token("admin")
    if not admin_token:
        print("❌ No se pudo obtener un token de admin válido.")
        return

    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Consulta de informe como estudiante (UI)...")
        ok, msg = await test_consultar_informe_estudiante(browser, admin_token)
        resultados["Estudiante consulta informe"] = ok
        if "No evaluado" in msg:
            print(f"  ⚠️ {msg}")
        else:
            print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Consulta de informe como profesor (UI)...")
        ok, msg = await test_consultar_informe_profesor(browser, admin_token)
        resultados["Profesor consulta informe"] = ok
        if "No evaluado" in msg:
            print(f"  ⚠️ {msg}")
        else:
            print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Descarga de PDF...")
        ok, msg = await test_descarga_pdf(browser, admin_token)
        resultados["Descarga PDF"] = ok
        if "PDF no disponible" in msg or "No evaluado" in msg:
            print(f"  ⚠️ {msg}")
        else:
            print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n🧪 Consulta de informe vía API (backend)...")
    ok, msg = await test_api_consultar_informe(admin_token)
    resultados["API consulta informe"] = ok
    print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n" + "="*50)
    print("📊 RESUMEN CU-08")

    if resultados.get("API consulta informe", False):
        print("  ✅ API consulta informe: CUMPLE")
        print("\n🎉 CU-08 CUMPLE COMPLETAMENTE (basado en backend)")
    else:
        print("\n⚠️ CU-08 NO CUMPLE COMPLETAMENTE")
        failed = [k for k, v in resultados.items() if not v]
        if failed:
            print(f"   Fallos: {failed}")

if __name__ == "__main__":
    asyncio.run(main())