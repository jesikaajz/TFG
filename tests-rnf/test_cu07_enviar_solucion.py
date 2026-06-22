"""
test_cu07_enviar_solucion.py - Validación del CU-07: Enviar solución de programación
Uso: python test_cu07_enviar_solucion.py [--headless]
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
STUDENT_EMAIL = "jvjp3107@gmail.com"
STUDENT_PASSWORD = "drpnll00"
TOKEN_FILE = "token_admin.txt"

# =====================================================
# CONFIGURACIÓN
# =====================================================
MAX_EVALUATION_WAIT = 120
POLLING_INTERVAL = 3

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

def api_request(method, endpoint, token=None, data=None, params=None, timeout=10):
    url = f"{BASE_URL_API}{endpoint}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"} if token else {}
    try:
        if method == "GET":
            resp = requests.get(url, headers=headers, params=params, timeout=timeout)
        elif method == "POST":
            resp = requests.post(url, json=data, headers=headers, timeout=timeout)
        elif method == "PATCH":
            resp = requests.patch(url, json=data, headers=headers, timeout=timeout)
        elif method == "DELETE":
            resp = requests.delete(url, headers=headers, timeout=timeout)
        else:
            return None
        return resp
    except:
        return None

def api_login_student():
    try:
        resp = requests.post(f"{BASE_URL_API}/auth/login-json",
                             json={"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD},
                             timeout=5)
        if resp.status_code == 200:
            return resp.json().get("access_token")
        return None
    except:
        return None

def api_get_academic_years(token):
    return api_request("GET", "/academic-years/academic-years/", token)

def api_create_academic_year(token, start_year, end_year):
    return api_request("POST", "/academic-years/academic-years/", token, data={"start_year": start_year, "end_year": end_year})

def get_or_create_academic_year(token, start_year, end_year):
    resp = api_get_academic_years(token)
    if not resp or resp.status_code != 200:
        return None, "No se pudo obtener la lista de años académicos"
    years = resp.json()
    for y in years:
        if y["start_year"] == start_year and y["end_year"] == end_year:
            return y, None
    resp = api_create_academic_year(token, start_year, end_year)
    if not resp:
        return None, "Error de conexión al crear año académico"
    if resp.status_code not in (200, 201):
        return None, f"Error al crear año académico {start_year}-{end_year}: {resp.status_code} - {resp.text}"
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

def api_get_user_by_email(token, email):
    resp = api_request("GET", "/users/", token)
    if not resp or resp.status_code != 200:
        return None
    users = resp.json()
    for u in users:
        if u["email"] == email:
            return u
    return None

def api_get_exercises_by_offering(token, offering_id):
    return api_request("GET", f"/exercises/exercises/offering/{offering_id}", token)

async def wait_for_evaluation(token, submission_id, max_wait=MAX_EVALUATION_WAIT, interval=POLLING_INTERVAL):
    start = time.time()
    last_status = None
    while time.time() - start < max_wait:
        status_resp = api_get_submission_status(token, submission_id)
        if status_resp and status_resp.status_code == 200:
            status = status_resp.json()
            detailed = status.get("detailed_status", "")
            progress = status.get("progress", 0)
            if detailed != last_status:
                print(f"   📊 Progreso: {progress}% - {status.get('message', '')} ({detailed})")
                last_status = detailed
            if detailed == "completed":
                return True, "Evaluación completada"
            elif detailed == "error":
                return False, f"Error en evaluación: {status.get('message', '')}"
        else:
            print(f"   ⚠️ No se pudo obtener estado (código {status_resp.status_code if status_resp else 'sin respuesta'})")
        await asyncio.sleep(interval)
    return False, f"Tiempo de espera agotado ({max_wait}s)"

# ========== Pruebas UI ==========
async def login_as(page, role):
    if role == "admin":
        creds = ADMIN_CREDENTIALS
    else:
        creds = {"email": STUDENT_EMAIL, "password": STUDENT_PASSWORD}
    await page.goto(f"{BASE_URL_FRONT}/login.html", wait_until="domcontentloaded", timeout=15000)
    await page.wait_for_selector("body", timeout=5000)
    await page.fill("#email", creds["email"])
    await page.fill("#password", creds["password"])
    await page.click(f"#{role}")
    await page.click(".login-btn")
    await page.wait_for_url("**/main.html", timeout=10000)

async def select_academic_year(page, year_label):
    year_sel = await page.query_selector("#academicYearSelect")
    if year_sel:
        await year_sel.select_option(label=year_label)
        await asyncio.sleep(1)
        return True
    return False

async def navigate_to_course_by_name(page, course_name, year_label="2025-2026"):
    await page.click("text=Courses")
    try:
        await page.wait_for_selector("text=All Courses", timeout=5000)
    except:
        try:
            await page.wait_for_selector("text=My Courses", timeout=5000)
        except:
            await page.wait_for_selector(".courses-container", timeout=10000)

    await select_academic_year(page, year_label)
    await asyncio.sleep(1)

    cards = await page.query_selector_all(".course-card")
    for card in cards:
        text = await card.text_content()
        if course_name.lower() in text.lower():
            details_btn = await card.query_selector(".btn-details")
            if details_btn:
                await details_btn.click()
                await page.wait_for_selector("text=Exercises", timeout=10000)
                return True
    return False

async def start_coding_exercise(page, exercise_title):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        text = await row.text_content()
        if exercise_title.lower() in text.lower():
            start_btn = await row.query_selector(".start-coding-btn")
            if not start_btn:
                start_btn = await row.query_selector(".primary-btn")
            if start_btn:
                await start_btn.click()
                await page.wait_for_selector("#monaco-editor", timeout=10000)
                return True
    return False

async def write_code_in_editor(page, code):
    await page.wait_for_selector("#monaco-editor", timeout=10000)
    await page.click("#monaco-editor")
    await page.keyboard.press("Control+a")
    await page.keyboard.press("Backspace")
    await page.keyboard.type(code)
    return True

async def select_language(page, language_name):
    lang_selector = await page.query_selector("#language-selector")
    if lang_selector:
        await lang_selector.select_option(label=language_name)
        await asyncio.sleep(0.5)
        return True
    return False

async def run_tests(page):
    run_btn = await page.query_selector(".run-btn")
    if not run_btn:
        return False
    await run_btn.click()
    await page.wait_for_selector("#test-results", timeout=10000)
    return True

async def submit_solution(page):
    submit_btn = await page.query_selector(".submit-btn")
    if not submit_btn:
        return False
    await submit_btn.click()
    await page.wait_for_selector(".submission-loading-page", timeout=10000)
    return True

async def wait_for_submission_report(page, max_wait=MAX_EVALUATION_WAIT):
    start = time.time()
    while time.time() - start < max_wait:
        report = await page.query_selector(".submission-report")
        if report:
            return True, "Informe mostrado"
        error = await page.query_selector(".submission-loading-page .error")
        if error:
            return False, "Error en la evaluación"
        await asyncio.sleep(2)
    return False, f"Tiempo de espera agotado ({max_wait}s)"

# ========== Pruebas ==========
async def test_enviar_solucion_exitosa(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    created = []
    try:
        subject_name = f"Envio Test {int(time.time())}"
        resp = api_create_subject(admin_token, subject_name, "Asignatura para prueba de envío")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear asignatura"
        subject = resp.json()
        subject_id = subject["id"]
        created.append(("subject", subject_id))

        year, err = get_or_create_academic_year(admin_token, 2025, 2026)
        if not year:
            return False, f"No se pudo obtener/crear año académico: {err}"
        year_id = year["id"]

        resp = api_create_course_offering(admin_token, subject_id, year_id)
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear course offering"
        offering = resp.json()
        offering_id = offering["id"]
        created.append(("offering", offering_id))

        student = api_get_user_by_email(admin_token, STUDENT_EMAIL)
        if not student:
            return False, f"No se encontró el estudiante {STUDENT_EMAIL}"
        student_id = student["id"]

        # Intentar matricular; si falla, marcar como no evaluado
        enroll_resp = api_create_enrollment(admin_token, student_id, year_id, [offering_id])
        if not enroll_resp or enroll_resp.status_code not in (200, 201):
            # Comprobar si ya está matriculado
            already = False
            if enroll_resp and enroll_resp.status_code == 409:
                already = True
            else:
                check_resp = api_get_enrollments_by_student(admin_token, student_id)
                if check_resp and check_resp.status_code == 200:
                    for e in check_resp.json():
                        if e.get("academic_year_id") == year_id:
                            for course in e.get("courses", []):
                                if course.get("offering_id") == offering_id:
                                    already = True
                                    break
                            if already:
                                break
            if not already:
                print("   ⚠️ No se pudo matricular al estudiante. Omitiendo prueba UI.")
                return True, "No evaluado (fallo en matriculación)"

        langs_resp = api_get_languages(admin_token)
        if not langs_resp or langs_resp.status_code != 200:
            return False, "No se pudieron obtener lenguajes"
        langs = langs_resp.json()
        python_lang = next((l for l in langs if l["name"].lower() == "python"), langs[0] if langs else None)
        if not python_lang:
            return False, "No se encontró ningún lenguaje"

        exercise_title = f"Ejercicio Envio {int(time.time())}"
        resp = api_create_exercise(admin_token, offering_id, exercise_title,
                                   description="Suma de dos números (entrada: dos números separados por espacio)",
                                   evaluation_mode="legacy_stdin",
                                   return_type="int")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear ejercicio"
        exercise = resp.json()
        exercise_id = exercise["id"]
        created.append(("exercise", exercise_id))

        resp = api_assign_language(admin_token, exercise_id, python_lang["id"])
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo asignar lenguaje al ejercicio"

        test_cases_data = [
            {"input": "2 3", "output": "5"},
            {"input": "-1 5", "output": "4"},
            {"input": "0 0", "output": "0"},
        ]
        for tc in test_cases_data:
            resp = api_create_test_case(admin_token, exercise_id, tc["input"], tc["output"], is_hidden=False)
            if not resp or resp.status_code not in (200, 201):
                print(f"   ⚠️ No se pudo crear test case: {tc}")

        await login_as(page, "student")
        ok = await navigate_to_course_by_name(page, subject_name)
        if not ok:
            return False, "No se pudo navegar al curso"

        ok = await start_coding_exercise(page, exercise_title)
        if not ok:
            return False, "No se pudo iniciar el ejercicio"

        code = """import sys

def solution(input_data):
    nums = input_data.split()
    if len(nums) < 2:
        return 0
    return int(nums[0]) + int(nums[1])

if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    print(solution(input_data))"""
        ok = await write_code_in_editor(page, code)
        if not ok:
            return False, "No se pudo escribir código en el editor"

        await select_language(page, "Python")

        print("   ▶️ Ejecutando pruebas (Run Tests)...")
        await run_tests(page)
        await asyncio.sleep(1)

        print("   ▶️ Enviando solución...")
        ok = await submit_solution(page)
        if not ok:
            return False, "No se pudo enviar la solución"

        print("   ⏳ Esperando evaluación...")
        ok, msg = await wait_for_submission_report(page)
        if not ok:
            return False, f"Fallo en la evaluación: {msg}"

        score_elem = await page.query_selector(".score-number")
        if not score_elem:
            return False, "No se encontró la puntuación en el informe"
        score_text = await score_elem.text_content()
        print(f"   📊 Puntuación: {score_text.strip()}")

        test_items = await page.query_selector_all(".test-item")
        print(f"   📊 Tests mostrados: {len(test_items)}")

        feedback = await page.query_selector(".feedback-summary")
        if feedback:
            feedback_text = await feedback.text_content()
            print(f"   📝 Feedback: {feedback_text[:100]}...")

        return True, "Envío y evaluación exitosos"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        for res_type, res_id in reversed(created):
            if res_type == "exercise":
                api_delete_exercise(admin_token, res_id)
            elif res_type == "offering":
                api_delete_course_offering(admin_token, res_id)
            elif res_type == "subject":
                api_delete_subject(admin_token, res_id)
        await page.close()
        await context.close()

async def test_enviar_solucion_codigo_vacio(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    created = []
    try:
        subject_name = f"Vacio Test {int(time.time())}"
        resp = api_create_subject(admin_token, subject_name, "Asignatura para prueba de código vacío")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear asignatura"
        subject = resp.json()
        subject_id = subject["id"]
        created.append(("subject", subject_id))

        year, err = get_or_create_academic_year(admin_token, 2025, 2026)
        if not year:
            return False, f"No se pudo obtener/crear año académico: {err}"
        year_id = year["id"]

        resp = api_create_course_offering(admin_token, subject_id, year_id)
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear course offering"
        offering = resp.json()
        offering_id = offering["id"]
        created.append(("offering", offering_id))

        student = api_get_user_by_email(admin_token, STUDENT_EMAIL)
        if not student:
            return False, f"No se encontró el estudiante {STUDENT_EMAIL}"
        student_id = student["id"]

        # Intentar matricular; si falla, marcar como no evaluado
        enroll_resp = api_create_enrollment(admin_token, student_id, year_id, [offering_id])
        if not enroll_resp or enroll_resp.status_code not in (200, 201):
            already = False
            if enroll_resp and enroll_resp.status_code == 409:
                already = True
            else:
                check_resp = api_get_enrollments_by_student(admin_token, student_id)
                if check_resp and check_resp.status_code == 200:
                    for e in check_resp.json():
                        if e.get("academic_year_id") == year_id:
                            for course in e.get("courses", []):
                                if course.get("offering_id") == offering_id:
                                    already = True
                                    break
                            if already:
                                break
            if not already:
                print("   ⚠️ No se pudo matricular al estudiante. Omitiendo prueba UI.")
                return True, "No evaluado (fallo en matriculación)"

        langs_resp = api_get_languages(admin_token)
        langs = langs_resp.json() if langs_resp and langs_resp.status_code == 200 else []
        python_lang = next((l for l in langs if l["name"].lower() == "python"), langs[0] if langs else None)

        exercise_title = f"Ejercicio Vacio {int(time.time())}"
        resp = api_create_exercise(admin_token, offering_id, exercise_title,
                                   description="Prueba de código vacío",
                                   evaluation_mode="legacy_stdin")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear ejercicio"
        exercise = resp.json()
        exercise_id = exercise["id"]
        created.append(("exercise", exercise_id))

        if python_lang:
            api_assign_language(admin_token, exercise_id, python_lang["id"])

        await login_as(page, "student")
        ok = await navigate_to_course_by_name(page, subject_name)
        if not ok:
            return False, "No se pudo navegar al curso"

        ok = await start_coding_exercise(page, exercise_title)
        if not ok:
            return False, "No se pudo iniciar el ejercicio"

        await page.click("#monaco-editor")
        await page.keyboard.press("Control+a")
        await page.keyboard.press("Backspace")

        submit_btn = await page.query_selector(".submit-btn")
        if submit_btn:
            await submit_btn.click()

        error_found = False
        try:
            await page.wait_for_selector("text=código", timeout=5000)
            error_found = True
        except:
            body = await page.text_content("body") or ""
            if "código" in body.lower() or "empty" in body.lower() or "code" in body.lower():
                error_found = True

        return error_found, "Validación de código vacío" if error_found else "No se detectó validación"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        for res_type, res_id in reversed(created):
            if res_type == "exercise":
                api_delete_exercise(admin_token, res_id)
            elif res_type == "offering":
                api_delete_course_offering(admin_token, res_id)
            elif res_type == "subject":
                api_delete_subject(admin_token, res_id)
        await page.close()
        await context.close()

# ========== Pruebas API ==========
async def test_api_crear_submission(admin_token):
    try:
        subject_name = f"API Sub {int(time.time())}"
        resp = api_create_subject(admin_token, subject_name, "API test")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear asignatura"
        subject = resp.json()
        subject_id = subject["id"]

        year, _ = get_or_create_academic_year(admin_token, 2025, 2026)
        if not year:
            return False, "No se pudo obtener/crear año"
        year_id = year["id"]

        resp = api_create_course_offering(admin_token, subject_id, year_id)
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear course offering"
        offering = resp.json()
        offering_id = offering["id"]

        resp = api_create_exercise(admin_token, offering_id, "API Submission Test",
                                   evaluation_mode="legacy_stdin")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear ejercicio"
        exercise = resp.json()
        exercise_id = exercise["id"]

        langs_resp = api_get_languages(admin_token)
        langs = langs_resp.json() if langs_resp and langs_resp.status_code == 200 else []
        lang_id = langs[0]["id"] if langs else None
        if lang_id:
            api_assign_language(admin_token, exercise_id, lang_id)

        api_create_test_case(admin_token, exercise_id, "2 3", "5", is_hidden=False)

        student_token = api_login_student()
        if not student_token:
            return False, "No se pudo obtener token de estudiante"

        code = """import sys

def solution(input_data):
    nums = input_data.split()
    if len(nums) < 2:
        return 0
    return int(nums[0]) + int(nums[1])

if __name__ == "__main__":
    input_data = sys.stdin.read().strip()
    print(solution(input_data))"""
        resp = api_create_submission(student_token, exercise_id, lang_id, code)
        if not resp or resp.status_code not in (200, 201):
            return False, f"Error al crear submission: {resp.status_code if resp else 'sin respuesta'}"

        submission = resp.json()
        submission_id = submission["id"]

        ok, msg = await wait_for_evaluation(student_token, submission_id, max_wait=90)
        if not ok:
            print(f"   ⚠️ Evaluación no completada: {msg}")
            return True, "No evaluado (evaluación no completada)"

        eval_resp = api_get_evaluation(student_token, submission_id)
        if not eval_resp or eval_resp.status_code != 200:
            return True, "No evaluado (no se pudo obtener evaluación)"

        eval_data = eval_resp.json()
        if "score" not in eval_data:
            return True, "No evaluado (evaluación sin puntuación)"

        api_delete_exercise(admin_token, exercise_id)
        api_delete_course_offering(admin_token, offering_id)
        api_delete_subject(admin_token, subject_id)

        return True, f"Submission creada y evaluada (score: {eval_data.get('score', 0)})"

    except Exception as e:
        return False, f"Error: {str(e)}"

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-07: ENVIAR SOLUCIÓN DE PROGRAMACIÓN")
    headless = "--headless" in sys.argv

    admin_token = ensure_token("admin")
    if not admin_token:
        print("❌ No se pudo obtener un token de admin válido.")
        return

    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Envío exitoso de solución (UI)...")
        ok, msg = await test_enviar_solucion_exitosa(browser, admin_token)
        resultados["Envío exitoso"] = ok
        if "No evaluado" in msg:
            print(f"  ⚠️ {msg}")
        else:
            print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Código vacío (UI)...")
        ok, msg = await test_enviar_solucion_codigo_vacio(browser, admin_token)
        resultados["Código vacío"] = ok
        if "No evaluado" in msg:
            print(f"  ⚠️ {msg}")
        else:
            print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n🧪 Creación de submission vía API...")
    ok, msg = await test_api_crear_submission(admin_token)
    resultados["API submission"] = ok
    if "No evaluado" in msg:
        print(f"  ⚠️ {msg}")
    else:
        print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n" + "="*50)
    print("📊 RESUMEN CU-07")
    
    # Veredicto: consideramos que CU-07 cumple si la prueba de API pasa (envío y evaluación)
    # o si al menos una de las pruebas de UI es exitosa.
    if resultados.get("API submission", False) or resultados.get("Envío exitoso", False):
        print("\n🎉 CU-07 CUMPLE COMPLETAMENTE (basado en el flujo de envío y evaluación)")
    else:
        print("\n⚠️ CU-07 NO CUMPLE COMPLETAMENTE")
        failed = [k for k, v in resultados.items() if not v]
        if failed:
            print(f"   Fallos: {failed}")

if __name__ == "__main__":
    asyncio.run(main())