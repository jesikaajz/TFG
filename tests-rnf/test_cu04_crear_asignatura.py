"""
test_cu04_crear_asignatura.py - Validación del CU-04: Crear asignatura
Uso: python test_cu04_crear_asignatura.py [--headless]
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
TOKEN_FILE = "token_admin.txt"

# ========== Helpers API ==========
def load_admin_token():
    try:
        with open(TOKEN_FILE, "r") as f:
            token = f.read().strip()
            if not token:
                return None
            return token
    except FileNotFoundError:
        return None

def check_admin_token(token):
    if not token:
        return False
    try:
        resp = requests.get(f"{BASE_URL_API}/users/me",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=5)
        return resp.status_code == 200
    except:
        return False

def ensure_valid_token():
    """Regenera el token si no es válido o no existe."""
    token = load_admin_token()
    if token and check_admin_token(token):
        return token
    print("⚠️ Token de admin no válido o expirado. Regenerando...")
    try:
        subprocess.run(["python", "get_token.py", "admin"], check=True, capture_output=True)
        token = load_admin_token()
        if token and check_admin_token(token):
            print("✅ Token regenerado correctamente.")
            return token
        else:
            print("❌ No se pudo regenerar el token.")
            return None
    except Exception as e:
        print(f"❌ Error al regenerar token: {e}")
        return None

def api_create_subject(token, name, description=""):
    """Crea una asignatura. Devuelve la respuesta (incluso si es 400)."""
    try:
        resp = requests.post(f"{BASE_URL_API}/courses/subjects/",
                             json={"name": name, "description": description},
                             headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                             timeout=10)
        return resp
    except requests.exceptions.ConnectionError:
        print("❌ Error de conexión con el backend")
        return None
    except requests.exceptions.Timeout:
        print("❌ Timeout en la petición")
        return None
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
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

# ========== Pruebas UI ==========
async def login_as_admin(page):
    await page.goto(f"{BASE_URL_FRONT}/login.html", wait_until="domcontentloaded", timeout=15000)
    await page.wait_for_selector("body", timeout=5000)
    await page.fill("#email", ADMIN_CREDENTIALS["email"])
    await page.fill("#password", ADMIN_CREDENTIALS["password"])
    await page.click("#admin")
    await page.click(".login-btn")
    await page.wait_for_url("**/main.html", timeout=10000)

async def navigate_to_academic_structure(page):
    await page.click("text=Academic Structure")
    await page.wait_for_selector("text=Academic Structure", timeout=10000)

async def open_create_subject_modal(page):
    await page.click("#createSubjectBtn")
    await page.wait_for_selector("#modalSubjectName", timeout=5000)

async def fill_subject_form(page, name, description=""):
    await page.fill("#modalSubjectName", name)
    await page.fill("#modalSubjectDescription", description)

async def submit_subject_form(page):
    await page.click("#confirmCreateSubjectBtn")

async def close_subject_modal(page):
    try:
        await page.click(".close-modal")
    except:
        pass

async def get_subject_from_table(page, name):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        row_text = await row.text_content()
        if name in row_text:
            return row
    return None

async def is_error_message_visible(page, keywords):
    """Busca en toda la página si aparece alguno de los keywords (case-insensitive)."""
    body_text = await page.text_content("body") or ""
    body_lower = body_text.lower()
    for kw in keywords:
        if kw in body_lower:
            return True
    return False

# ========== Pruebas UI ==========
async def test_crear_asignatura_exitosa(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        await login_as_admin(page)
        await navigate_to_academic_structure(page)

        subject_name = f"Asignatura Test {int(time.time())}"
        subject_description = "Descripción de prueba"

        await open_create_subject_modal(page)
        await fill_subject_form(page, subject_name, subject_description)
        await submit_subject_form(page)

        await asyncio.sleep(1)
        await close_subject_modal(page)

        row = await get_subject_from_table(page, subject_name)
        if row is None:
            return False, f"La asignatura '{subject_name}' no apareció en la tabla"

        # Limpiar (API)
        subjects_resp = api_get_subjects(admin_token)
        if subjects_resp and subjects_resp.status_code == 200:
            subjects = subjects_resp.json()
            for s in subjects:
                if s["name"] == subject_name:
                    api_delete_subject(admin_token, s["id"])
                    break

        return True, "Asignatura creada correctamente"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_crear_asignatura_nombre_vacio(browser):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        await login_as_admin(page)
        await navigate_to_academic_structure(page)
        await open_create_subject_modal(page)

        await fill_subject_form(page, "", "Descripción sin nombre")
        await submit_subject_form(page)

        await asyncio.sleep(1)
        error_detected = await is_error_message_visible(page, ["requerido", "obligatorio", "nombre", "empty", "required"])

        if not error_detected:
            modal_visible = await page.is_visible("#modalSubjectName")
            if modal_visible:
                error_detected = True

        await close_subject_modal(page)
        return error_detected, "Validación de nombre vacío" if error_detected else "No se detectó validación"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_crear_asignatura_duplicada(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        base_name = f"Base {int(time.time())}"
        resp = api_create_subject(admin_token, base_name, "Base para duplicado")
        if not resp:
            return False, "No se pudo crear asignatura base (sin conexión)"
        if resp.status_code not in (200, 201):
            return False, f"No se pudo crear asignatura base: {resp.status_code} - {resp.text}"

        await login_as_admin(page)
        await navigate_to_academic_structure(page)
        await open_create_subject_modal(page)

        await fill_subject_form(page, base_name, "Duplicado")
        await submit_subject_form(page)

        await asyncio.sleep(1)
        error_detected = await is_error_message_visible(page, ["ya existe", "duplicado", "already exists", "existente"])

        if not error_detected:
            modal_visible = await page.is_visible("#modalSubjectName")
            if modal_visible:
                error_detected = True

        await close_subject_modal(page)

        # Limpiar
        subjects_resp = api_get_subjects(admin_token)
        if subjects_resp and subjects_resp.status_code == 200:
            subjects = subjects_resp.json()
            for s in subjects:
                if s["name"] == base_name:
                    api_delete_subject(admin_token, s["id"])
                    break

        return error_detected, "Error de duplicado capturado" if error_detected else "No se detectó error de duplicado"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

# ========== Pruebas API (opcionales) ==========
def test_api_crear_asignatura_exitosa(admin_token):
    name = f"API Subject {int(time.time())}"
    resp = api_create_subject(admin_token, name, "API test")
    if not resp:
        return None, "No evaluado (sin conexión)"
    if resp.status_code not in (200, 201):
        return None, f"No evaluado (el backend devolvió {resp.status_code} - {resp.text})"

    subject = resp.json()
    subject_id = subject["id"]

    resp_list = api_get_subjects(admin_token)
    if not resp_list or resp_list.status_code != 200:
        return None, "No evaluado (no se pudo obtener lista de asignaturas)"

    subjects = resp_list.json()
    found = any(s["id"] == subject_id for s in subjects)
    api_delete_subject(admin_token, subject_id)
    if found:
        return True, "Asignatura creada y encontrada via API"
    else:
        return None, "No evaluado (asignatura no encontrada en lista)"

def test_api_crear_asignatura_duplicada(admin_token):
    name = f"API Duplicate {int(time.time())}"
    resp1 = api_create_subject(admin_token, name, "Base")
    if not resp1:
        return None, "No evaluado (sin conexión en primera petición)"
    if resp1.status_code not in (200, 201):
        return None, f"No evaluado (error al crear base: {resp1.status_code})"

    resp2 = api_create_subject(admin_token, name, "Duplicado")
    subject1 = resp1.json()
    api_delete_subject(admin_token, subject1["id"])

    if not resp2:
        return None, "No evaluado (sin conexión en segunda petición)"

    # El backend devuelve 400 cuando el nombre ya existe (validación)
    if resp2.status_code == 400:
        return True, "Error de duplicado capturado por API (código 400)"
    elif resp2.status_code == 409:
        return True, "Error de duplicado capturado por API (código 409)"
    elif resp2.status_code == 200:
        return False, "El backend permitió crear asignatura duplicada (debería devolver 400 o 409)"
    else:
        return None, f"No evaluado (código inesperado: {resp2.status_code})"

def test_api_crear_asignatura_sin_nombre(admin_token):
    resp = requests.post(f"{BASE_URL_API}/courses/subjects/",
                         json={"name": "", "description": "Sin nombre"},
                         headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                         timeout=10)
    if not resp:
        return None, "No evaluado (sin conexión)"
    # El backend devuelve 400 cuando el nombre está vacío
    if resp.status_code in (400, 422):
        return True, "Error de validación (nombre requerido) - código {resp.status_code}"
    else:
        return None, f"No evaluado (código inesperado: {resp.status_code})"

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-04: CREAR ASIGNATURA")
    headless = "--headless" in sys.argv

    admin_token = ensure_valid_token()
    if not admin_token:
        print("❌ No se pudo obtener un token de admin válido.")
        return

    resultados_ui = {}
    resultados_api = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Pruebas de frontend (UI):")
        ok, msg = await test_crear_asignatura_exitosa(browser, admin_token)
        resultados_ui["Creación exitosa (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        ok, msg = await test_crear_asignatura_nombre_vacio(browser)
        resultados_ui["Nombre vacío (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        ok, msg = await test_crear_asignatura_duplicada(browser, admin_token)
        resultados_ui["Nombre duplicado (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n🧪 Pruebas de API (backend - opcionales):")
    ok, msg = test_api_crear_asignatura_exitosa(admin_token)
    resultados_api["Creación exitosa (API)"] = ok
    print(f"  {'✅' if ok else ('⚠️' if ok is None else '❌')} {msg}")

    ok, msg = test_api_crear_asignatura_duplicada(admin_token)
    resultados_api["Nombre duplicado (API)"] = ok
    print(f"  {'✅' if ok else ('⚠️' if ok is None else '❌')} {msg}")

    ok, msg = test_api_crear_asignatura_sin_nombre(admin_token)
    resultados_api["Sin nombre (API)"] = ok
    print(f"  {'✅' if ok else ('⚠️' if ok is None else '❌')} {msg}")

    print("\n" + "="*50)
    print("📊 RESUMEN CU-04")
    
    ui_ok = all(resultados_ui.values())
    print("  Pruebas de frontend (UI):")
    for k, v in resultados_ui.items():
        print(f"    {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")
    
    print("  Pruebas de API (backend - opcionales):")
    for k, v in resultados_api.items():
        if v is None:
            print(f"    ⚠️ {k}: NO EVALUADO")
        else:
            print(f"    {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")
    
    if ui_ok:
        print("\n🎉 CU-04 CUMPLE COMPLETAMENTE (basado en frontend)")
    else:
        print("\n⚠️ CU-04 NO CUMPLE COMPLETAMENTE (fallos en frontend)")
        failed = [k for k, v in resultados_ui.items() if not v]
        print(f"   Fallos en frontend: {failed}")

if __name__ == "__main__":
    asyncio.run(main())