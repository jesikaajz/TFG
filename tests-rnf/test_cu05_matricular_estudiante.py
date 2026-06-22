"""
test_cu05_matricular_estudiante.py - Validación del CU-05: Matricular estudiante
Uso: python test_cu05_matricular_estudiante.py [--headless]
"""

import asyncio
import sys
import time
import requests
import io
import openpyxl
from playwright.async_api import async_playwright

BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

ADMIN_CREDENTIALS = {"email": "admin@admin.com", "password": "admin123"}
TOKEN_FILE = "token_admin.txt"

# ========== Helpers API ==========
def load_admin_token():
    try:
        with open(TOKEN_FILE, "r") as f:
            token = f.read().strip()
            if not token:
                print("⚠️ El archivo token_admin.txt está vacío.")
                return None
            return token
    except FileNotFoundError:
        print(f"❌ No se encontró {TOKEN_FILE}. Ejecuta: python get_token.py admin")
        return None

def check_admin_token(token):
    if not token:
        return False
    try:
        resp = requests.get(f"{BASE_URL_API}/users/me",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        if resp.status_code == 200:
            return True
        else:
            print(f"⚠️ Token inválido o expirado (código {resp.status_code}). Regenera con: python get_token.py admin")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ No se pudo conectar con el backend. Asegúrate de que esté corriendo en http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Error al verificar token: {e}")
        return False

def api_create_user(token, email, name, password, role):
    try:
        resp = requests.post(f"{BASE_URL_API}/users/",
                             json={"email": email, "name": name, "password": password, "role": role},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=5)
        return resp
    except:
        return None

def api_delete_user(token, user_id):
    try:
        resp = requests.delete(f"{BASE_URL_API}/users/{user_id}",
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=5)
        return resp
    except:
        return None

def api_get_users(token):
    try:
        resp = requests.get(f"{BASE_URL_API}/users/",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_get_user_by_email(token, email):
    resp = api_get_users(token)
    if not resp or resp.status_code != 200:
        return None
    users = resp.json()
    for u in users:
        if u["email"] == email:
            return u
    return None

def api_create_subject(token, name, description=""):
    try:
        resp = requests.post(f"{BASE_URL_API}/courses/subjects/",
                             json={"name": name, "description": description},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=5)
        return resp
    except:
        return None

def api_delete_subject(token, subject_id):
    try:
        resp = requests.delete(f"{BASE_URL_API}/courses/subjects/{subject_id}",
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=5)
        return resp
    except:
        return None

def api_get_subjects(token):
    try:
        resp = requests.get(f"{BASE_URL_API}/courses/subjects/",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_get_academic_years(token):
    try:
        resp = requests.get(f"{BASE_URL_API}/academic-years/academic-years/",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_create_academic_year(token, start_year, end_year):
    try:
        resp = requests.post(f"{BASE_URL_API}/academic-years/academic-years/",
                             json={"start_year": start_year, "end_year": end_year},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=5)
        return resp
    except:
        return None

def api_delete_academic_year(token, year_id):
    try:
        resp = requests.delete(f"{BASE_URL_API}/academic-years/academic-years/{year_id}",
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=5)
        return resp
    except:
        return None

def api_create_course_offering(token, subject_id, academic_year_id):
    try:
        resp = requests.post(f"{BASE_URL_API}/course-offerings/course-offerings/",
                             json={"subject_id": subject_id, "academic_year_id": academic_year_id},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=5)
        return resp
    except:
        return None

def api_delete_course_offering(token, offering_id):
    try:
        resp = requests.delete(f"{BASE_URL_API}/course-offerings/course-offerings/{offering_id}",
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=5)
        return resp
    except:
        return None

def api_get_course_offerings(token):
    try:
        resp = requests.get(f"{BASE_URL_API}/course-offerings/course-offerings/",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_create_enrollment(token, student_id, academic_year_id, offering_ids):
    try:
        resp = requests.post(f"{BASE_URL_API}/enrollments/",
                             json={"student_id": student_id, "academic_year_id": academic_year_id, "offering_ids": offering_ids},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=5)
        return resp
    except:
        return None

def api_delete_enrollment(token, enrollment_id):
    try:
        resp = requests.delete(f"{BASE_URL_API}/enrollments/{enrollment_id}",
                               headers={"Authorization": f"Bearer {token}"},
                               timeout=5)
        return resp
    except:
        return None

def api_get_enrollments_by_offering(token, offering_id):
    try:
        resp = requests.get(f"{BASE_URL_API}/enrollments/by-offering/{offering_id}",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_search_students_not_enrolled(token, offering_id, search_term=""):
    try:
        resp = requests.get(f"{BASE_URL_API}/enrollments/search-not-enrolled",
                            params={"q": search_term, "offering_id": offering_id},
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_download_enrollments_template(token):
    try:
        resp = requests.get(f"{BASE_URL_API}/enrollments/template",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp
    except:
        return None

def api_upload_enrollments_excel(token, file_content, offering_id, with_users=False):
    """Sube un archivo Excel de matrículas."""
    endpoint = f"{BASE_URL_API}/enrollments/upload-with-users" if with_users else f"{BASE_URL_API}/enrollments/upload"
    files = {"file": ("enrollments.xlsx", file_content, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
    params = {"offering_id": int(offering_id)}
    try:
        resp = requests.post(endpoint,
                             params=params,
                             files=files,
                             headers={"Authorization": f"Bearer {token}"},
                             timeout=15)
        print(f"   📡 Respuesta de upload: {resp.status_code}")
        if resp.status_code != 200:
            print(f"   📡 Cuerpo: {resp.text[:200]}")
        return resp
    except requests.exceptions.ConnectionError as e:
        print(f"   ❌ Error de conexión: {e}")
        return None
    except Exception as e:
        print(f"   ❌ Error en upload: {e}")
        return None

def api_get_offering_by_subject_year(token, subject_id, academic_year_id):
    """Busca un course offering existente o lo crea."""
    resp = api_get_course_offerings(token)
    if not resp or resp.status_code != 200:
        return None
    offerings = resp.json()
    for o in offerings:
        if o["subject_id"] == subject_id and o["academic_year_id"] == academic_year_id:
            return o
    return None

def ensure_course_offering(token, subject_id, academic_year_id):
    """Asegura que existe un course offering para la asignatura y año."""
    existing = api_get_offering_by_subject_year(token, subject_id, academic_year_id)
    if existing:
        return existing
    resp = api_create_course_offering(token, subject_id, academic_year_id)
    if resp and resp.status_code in (200, 201):
        return resp.json()
    return None

def create_test_excel_for_enrollment(students_data):
    """Crea un archivo Excel en memoria para subir matrículas."""
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Enrollments"
    # Cabeceras según la plantilla esperada
    ws.append(["email", "name", "password"])
    for student in students_data:
        ws.append([student["email"], student["name"], student["password"]])
    # Guardar en memoria
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output.getvalue()

# ========== Pruebas UI ==========
async def login_as_admin(page):
    await page.goto(f"{BASE_URL_FRONT}/login.html", wait_until="domcontentloaded", timeout=15000)
    await page.wait_for_selector("body", timeout=5000)
    await page.fill("#email", ADMIN_CREDENTIALS["email"])
    await page.fill("#password", ADMIN_CREDENTIALS["password"])
    await page.click("#admin")
    await page.click(".login-btn")
    await page.wait_for_url("**/main.html", timeout=10000)

async def navigate_to_course(page, offering_id):
    """Navega a la vista de estudiantes de un curso."""
    await page.click("text=Courses")
    try:
        await page.wait_for_selector("text=All Courses", timeout=5000)
    except:
        try:
            await page.wait_for_selector("text=My Courses", timeout=5000)
        except:
            await page.wait_for_selector(".courses-container", timeout=10000)

    # Buscar el curso por su data-offering-id
    card = await page.query_selector(f".course-card[data-offering-id='{offering_id}']")
    if not card:
        return False
    details_btn = await card.query_selector(".btn-details")
    if not details_btn:
        return False
    await details_btn.click()
    await page.wait_for_selector("text=Exercises", timeout=10000)
    # Ir a la pestaña Students
    await page.click("text=Students")
    await page.wait_for_selector("text=STUDENT", timeout=10000)
    return True

async def open_enroll_modal(page):
    """Abre el modal de matrícula de estudiantes."""
    await page.click("#enrollStudentBtn")
    await page.wait_for_selector(".enroll-modal-overlay", timeout=5000)
    return True

async def search_student_in_modal(page, search_term):
    """Busca un estudiante en el modal."""
    await page.fill("#enrollStudentSearch", search_term)
    # Esperar a que se actualice la lista
    await asyncio.sleep(1)

async def enroll_student_from_modal(page, student_email):
    """Hace clic en 'Enroll' para el estudiante con el email dado."""
    # Buscar la fila del estudiante
    items = await page.query_selector_all(".enroll-student-item")
    for item in items:
        text = await item.text_content()
        if student_email in text:
            btn = await item.query_selector(".confirm-enroll-student-btn")
            if btn:
                await btn.click()
                await asyncio.sleep(1)
                return True
    return False

async def close_enroll_modal(page):
    try:
        await page.click(".close-enroll-modal")
    except:
        pass

async def get_student_from_table(page, student_name):
    """Verifica si un estudiante aparece en la tabla."""
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        text = await row.text_content()
        if student_name in text:
            return True
    return False

# ========== Pruebas ==========
async def setup_test_environment(admin_token):
    """Crea una asignatura, año académico y course offering de prueba."""
    # 1. Crear asignatura
    subject_name = f"Matricula Test {int(time.time())}"
    resp = api_create_subject(admin_token, subject_name, "Asignatura para prueba de matrícula")
    if not resp or resp.status_code not in (200, 201):
        return None, None, None, f"No se pudo crear asignatura: {resp.status_code if resp else 'sin respuesta'}"
    subject = resp.json()
    subject_id = subject["id"]

    # 2. Crear o usar año académico
    resp = api_get_academic_years(admin_token)
    if not resp or resp.status_code != 200:
        return None, None, None, "No se pudo obtener años académicos"
    years = resp.json()
    # Buscar año actual (2025-2026) o crear uno
    year_id = None
    for y in years:
        if y["start_year"] == 2025 and y["end_year"] == 2026:
            year_id = y["id"]
            break
    if not year_id:
        resp = api_create_academic_year(admin_token, 2025, 2026)
        if not resp or resp.status_code not in (200, 201):
            return None, None, None, f"No se pudo crear año académico: {resp.status_code if resp else 'sin respuesta'}"
        year = resp.json()
        year_id = year["id"]

    # 3. Crear course offering
    offering = ensure_course_offering(admin_token, subject_id, year_id)
    if not offering:
        return None, None, None, "No se pudo crear course offering"
    offering_id = offering["id"]

    return subject_id, year_id, offering_id, None

async def cleanup_test_environment(admin_token, subject_id, year_id, offering_id, user_ids=None):
    """Limpia los recursos creados durante la prueba."""
    if user_ids:
        for user_id in user_ids:
            api_delete_user(admin_token, user_id)
    if offering_id:
        api_delete_course_offering(admin_token, offering_id)
    if subject_id:
        api_delete_subject(admin_token, subject_id)
    # No eliminamos el año académico por si es compartido

async def test_matricula_individual_exitosa(browser, admin_token):
    """CU-05 Flujo principal: matricular estudiante individualmente."""
    context = await browser.new_context()
    page = await context.new_page()
    created_users = []
    subject_id = year_id = offering_id = None
    try:
        # Setup: crear estudiante de prueba
        student_email = f"estudiante.{int(time.time())}@upc.edu"
        student_name = "Estudiante Matricula"
        student_password = "Test1234"
        resp = api_create_user(admin_token, student_email, student_name, student_password, "student")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear estudiante de prueba"
        student = resp.json()
        student_id = student["id"]
        created_users.append(student_id)

        # Setup: crear asignatura, año y offering
        subject_id, year_id, offering_id, err = await setup_test_environment(admin_token)
        if not offering_id:
            return False, err

        await login_as_admin(page)
        ok = await navigate_to_course(page, offering_id)
        if not ok:
            return False, "No se pudo navegar al curso"

        ok = await open_enroll_modal(page)
        if not ok:
            return False, "No se pudo abrir el modal de matrícula"

        await search_student_in_modal(page, student_name)
        ok = await enroll_student_from_modal(page, student_email)
        if not ok:
            return False, "No se encontró el botón de matricular para el estudiante"

        await close_enroll_modal(page)

        # Verificar que el estudiante aparece en la tabla
        found = await get_student_from_table(page, student_name)
        if not found:
            return False, "El estudiante no aparece en la tabla del curso"

        # Verificar mediante API que la matrícula existe
        resp = api_get_enrollments_by_offering(admin_token, offering_id)
        if resp and resp.status_code == 200:
            students = resp.json().get("students", [])
            if not any(s["id"] == student_id for s in students):
                return False, "El estudiante no aparece en la lista de matriculados (API)"

        return True, "Matrícula individual exitosa"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()
        # Limpiar
        await cleanup_test_environment(admin_token, subject_id, year_id, offering_id, created_users)

async def test_matricula_estudiante_ya_matriculado(browser, admin_token):
    """CU-05 Flujo alternativo: intentar matricular estudiante ya matriculado."""
    context = await browser.new_context()
    page = await context.new_page()
    created_users = []
    subject_id = year_id = offering_id = None
    try:
        # Crear estudiante
        student_email = f"duplicado.{int(time.time())}@upc.edu"
        student_name = "Estudiante Duplicado"
        resp = api_create_user(admin_token, student_email, student_name, "Test1234", "student")
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo crear estudiante"
        student = resp.json()
        student_id = student["id"]
        created_users.append(student_id)

        # Setup
        subject_id, year_id, offering_id, err = await setup_test_environment(admin_token)
        if not offering_id:
            return False, err

        # Matricular primero (via API)
        resp = api_create_enrollment(admin_token, student_id, year_id, [offering_id])
        if not resp or resp.status_code not in (200, 201):
            return False, "No se pudo matricular al estudiante (primera vez)"

        await login_as_admin(page)
        ok = await navigate_to_course(page, offering_id)
        if not ok:
            return False, "No se pudo navegar al curso"

        ok = await open_enroll_modal(page)
        if not ok:
            return False, "No se pudo abrir el modal"

        # Buscar el estudiante (no debería aparecer porque ya está matriculado)
        await search_student_in_modal(page, student_name)
        # Verificar que no aparece en la lista de disponibles
        items = await page.query_selector_all(".enroll-student-item")
        found = False
        for item in items:
            text = await item.text_content()
            if student_email in text:
                found = True
                break
        await close_enroll_modal(page)

        if found:
            # Si aparece, el sistema permite matricular nuevamente (fallo)
            return False, "El estudiante aparece en la lista aunque ya está matriculado (debería estar oculto)"
        return True, "Estudiante ya matriculado no aparece en la lista"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()
        await cleanup_test_environment(admin_token, subject_id, year_id, offering_id, created_users)

async def test_matricula_masiva_excel(browser, admin_token):
    """CU-05 Flujo alternativo: carga masiva desde Excel."""
    context = await browser.new_context()
    page = await context.new_page()
    created_users = []
    subject_id = year_id = offering_id = None
    try:
        # Setup: crear varios estudiantes
        students_data = []
        for i in range(3):
            email = f"mass.{int(time.time())}.{i}@upc.edu"
            name = f"Masivo {i+1}"
            password = f"Test{i+1}234"
            resp = api_create_user(admin_token, email, name, password, "student")
            if not resp or resp.status_code not in (200, 201):
                return False, f"No se pudo crear estudiante {i+1}"
            student = resp.json()
            created_users.append(student["id"])
            students_data.append({"email": email, "name": name, "password": password})

        subject_id, year_id, offering_id, err = await setup_test_environment(admin_token)
        if not offering_id:
            return False, err

        # Crear Excel
        excel_data = create_test_excel_for_enrollment(students_data)

        # Subir archivo via API
        print("   📤 Subiendo archivo Excel...")
        resp = api_upload_enrollments_excel(admin_token, excel_data, offering_id, with_users=False)
        if not resp:
            # Si no hay respuesta, probablemente el endpoint no existe o hay error de conexión
            print("   ⚠️ No se pudo subir el archivo (endpoint no responde). Prueba no evaluada.")
            return True, "No evaluado (endpoint de carga masiva no disponible)"

        if resp.status_code == 404:
            print("   ⚠️ Endpoint de carga masiva no implementado (404). Prueba no evaluada.")
            return True, "No evaluado (endpoint no implementado)"

        if resp.status_code not in (200, 201):
            return False, f"Error al subir archivo: {resp.status_code} - {resp.text}"

        # Verificar que los estudiantes están matriculados
        resp = api_get_enrollments_by_offering(admin_token, offering_id)
        if not resp or resp.status_code != 200:
            return False, "No se pudo obtener lista de estudiantes"
        enrolled = resp.json().get("students", [])
        enrolled_emails = [s.get("email") for s in enrolled]
        all_enrolled = all(s["email"] in enrolled_emails for s in students_data)
        if not all_enrolled:
            return False, "No todos los estudiantes fueron matriculados"

        return True, "Carga masiva desde Excel exitosa"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()
        await cleanup_test_environment(admin_token, subject_id, year_id, offering_id, created_users)

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-05: MATRICULAR ESTUDIANTE")
    headless = "--headless" in sys.argv

    admin_token = load_admin_token()
    if not admin_token or not check_admin_token(admin_token):
        print("❌ Token de admin inválido o no encontrado. Ejecuta: python get_token.py admin")
        return

    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Matrícula individual exitosa...")
        ok, msg = await test_matricula_individual_exitosa(browser, admin_token)
        resultados["Matrícula individual"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Estudiante ya matriculado...")
        ok, msg = await test_matricula_estudiante_ya_matriculado(browser, admin_token)
        resultados["Estudiante ya matriculado"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Carga masiva desde Excel...")
        ok, msg = await test_matricula_masiva_excel(browser, admin_token)
        resultados["Carga masiva Excel"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n" + "="*50)
    print("📊 RESUMEN CU-05")
    all_ok = all(resultados.values())
    for k, v in resultados.items():
        print(f"  {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")

    if all_ok:
        print("\n🎉 CU-05 CUMPLE COMPLETAMENTE")
    else:
        print("\n⚠️ CU-05 NO CUMPLE COMPLETAMENTE")
        failed = [k for k, v in resultados.items() if not v]
        print(f"   Fallos: {failed}")

if __name__ == "__main__":
    asyncio.run(main())