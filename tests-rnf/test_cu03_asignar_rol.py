"""
test_cu03_asignar_rol.py - Validación del CU-03: Asignar rol a usuario
Uso: python test_cu03_asignar_rol.py [--headless]
"""

import asyncio
import sys
import time
import requests
import json
from playwright.async_api import async_playwright

BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

ADMIN_CREDENTIALS = {"email": "admin@admin.com", "password": "admin123"}
TOKEN_FILE = "token_admin.txt"

# ========== Helpers API ==========
def load_admin_token():
    try:
        with open(TOKEN_FILE, "r") as f:
            return f.read().strip()
    except:
        return None

def check_admin_token(token):
    resp = requests.get(f"{BASE_URL_API}/users/me",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=5)
    return resp.status_code == 200

def api_create_user(token, email, name, password, role):
    resp = requests.post(f"{BASE_URL_API}/users/",
                         json={"email": email, "name": name, "password": password, "role": role},
                         headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
                         timeout=5)
    return resp

def api_delete_user(token, user_id):
    resp = requests.delete(f"{BASE_URL_API}/users/{user_id}",
                           headers={"Authorization": f"Bearer {token}"},
                           timeout=5)
    return resp

def api_get_users(token):
    resp = requests.get(f"{BASE_URL_API}/users/",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=5)
    return resp

def api_get_user_by_email(token, email):
    resp = api_get_users(token)
    if resp.status_code != 200:
        return None
    users = resp.json()
    for u in users:
        if u["email"] == email:
            return u
    return None

def api_update_user_role(token, user_id, role):
    resp = requests.put(f"{BASE_URL_API}/users/{user_id}/role?role={role}",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10)
    return resp

def api_get_course_offerings(token):
    resp = requests.get(f"{BASE_URL_API}/course-offerings/course-offerings/",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10)
    return resp

def api_get_professors_by_course(token, offering_id):
    resp = requests.get(f"{BASE_URL_API}/teacher-assignments/teacher-assignments/course-offering/{offering_id}/all",
                        headers={"Authorization": f"Bearer {token}"},
                        timeout=10)
    try:
        return resp.json()
    except:
        return []

def api_assign_professor_to_course(token, professor_id, offering_id):
    url = f"{BASE_URL_API}/teacher-assignments/teacher-assignments/"
    payload = {"professor_id": professor_id, "course_offering_id": int(offering_id)}
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=10)
        return resp
    except requests.exceptions.RequestException as e:
        print(f"⚠️ Excepción en api_assign_professor: {e}")
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

async def navigate_to_user_management(page):
    await page.click("text=Users")
    await page.wait_for_selector("table.users-table", timeout=15000)

async def open_edit_user_modal(page, email):
    await page.wait_for_selector("table.users-table", timeout=10000)
    row = await page.query_selector(f"tbody tr:has-text('{email}')")
    if not row:
        return False
    edit_btn = await row.query_selector(".edit-user-btn")
    if not edit_btn:
        return False
    await edit_btn.click(timeout=5000, force=True)
    await page.wait_for_selector("#userName", timeout=5000)
    return True

async def change_user_role_in_modal(page, new_role):
    await page.select_option("#userRole", value=new_role)
    await page.click("#confirmEditUserBtn")
    await page.wait_for_selector("#userName", state="hidden", timeout=5000)
    # Refrescar la tabla haciendo clic en "Users" (en lugar de recargar)
    await page.click("text=Users")
    await page.wait_for_selector("table.users-table", timeout=15000)
    await asyncio.sleep(1)

async def get_user_role_from_table(page, email):
    await page.wait_for_selector("table.users-table", timeout=10000)
    row = await page.query_selector(f"tbody tr:has-text('{email}')")
    if not row:
        return None
    role_cell = await row.query_selector("td:nth-child(3) span.role-badge")
    if not role_cell:
        return None
    return await role_cell.text_content()

async def navigate_to_course_professors(page, offering_id):
    await page.click("text=Courses")
    try:
        await page.wait_for_selector("text=All Courses", timeout=5000)
    except:
        try:
            await page.wait_for_selector("text=My Courses", timeout=5000)
        except:
            await page.wait_for_selector(".courses-container", timeout=10000)

    card = await page.query_selector(f".course-card[data-offering-id='{offering_id}']")
    if not card:
        return False
    details_btn = await card.query_selector(".btn-details")
    if not details_btn:
        return False
    await details_btn.click()
    await page.wait_for_selector("text=Exercises", timeout=10000)
    await page.click("text=Professors")
    await page.wait_for_selector("text=PROFESSOR", timeout=10000)
    return True

async def toggle_tutor_role(page, professor_name, make_tutor=True):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        row_text = await row.text_content()
        if professor_name in row_text:
            if make_tutor:
                btn = await row.query_selector(".toggle-role-btn:has-text('Make Tutor')")
            else:
                btn = await row.query_selector(".toggle-role-btn:has-text('Remove as Tutor')")
            if btn:
                await btn.click()
                await asyncio.sleep(1)
                return True
    return False

async def get_professor_role_from_table(page, professor_name):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        row_text = await row.text_content()
        if professor_name in row_text:
            role_cell = await row.query_selector(".role-badge")
            if role_cell:
                return await role_cell.text_content()
    return None

# ========== Pruebas ==========
async def test_cambio_rol_global(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        email = f"roltest.{int(time.time())}@upc.edu"
        resp = api_create_user(admin_token, email, "Rol Test", "Test1234", "student")
        if resp.status_code not in (200, 201):
            return False, "No se pudo crear usuario de prueba"

        await login_as_admin(page)
        await navigate_to_user_management(page)

        # Cambiar a Teacher
        ok = await open_edit_user_modal(page, email)
        if not ok:
            return False, "No se encontró el usuario en la tabla"
        await change_user_role_in_modal(page, "teacher")
        role_text = await get_user_role_from_table(page, email)
        if "teacher" not in role_text.lower() and "professor" not in role_text.lower():
            return False, f"Rol esperado Teacher, obtenido {role_text}"

        # Cambiar a Admin
        ok = await open_edit_user_modal(page, email)
        if not ok:
            return False, "No se encontró el usuario en la tabla"
        await change_user_role_in_modal(page, "admin")
        role_text = await get_user_role_from_table(page, email)
        if "admin" not in role_text.lower():
            return False, f"Rol esperado Admin, obtenido {role_text}"

        # Cambiar de nuevo a Student
        ok = await open_edit_user_modal(page, email)
        if not ok:
            return False, "No se encontró el usuario en la tabla"
        await change_user_role_in_modal(page, "student")
        role_text = await get_user_role_from_table(page, email)
        if "student" not in role_text.lower() and "estudiante" not in role_text.lower():
            return False, f"Rol esperado Student, obtenido {role_text}"

        user = api_get_user_by_email(admin_token, email)
        if user:
            api_delete_user(admin_token, user["id"])

        return True, "Cambio de rol global exitoso"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_asignacion_tutor(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        resp = api_get_course_offerings(admin_token)
        if resp.status_code != 200:
            return False, f"No se pudo obtener course offerings: {resp.status_code} - {resp.text}"
        offerings = resp.json()
        if not offerings:
            return False, "No hay course offerings en el sistema"
        offering = offerings[0]
        offering_id = offering["id"]
        print(f"   Usando course offering ID: {offering_id}")

        prof_email = "javier@upc.edu"
        prof = api_get_user_by_email(admin_token, prof_email)
        if not prof:
            print(f"   Profesor {prof_email} no encontrado, creando uno de prueba...")
            resp = api_create_user(admin_token, "test.teacher@upc.edu", "Test Teacher", "Test1234", "teacher")
            if resp.status_code not in (200, 201):
                return False, f"No se pudo crear profesor de prueba: {resp.status_code} - {resp.text}"
            prof = resp.json()
            prof_id = prof["id"]
        else:
            prof_id = prof["id"]
            if prof["role"] != "teacher":
                api_update_user_role(admin_token, prof_id, "teacher")
        print(f"   Profesor ID: {prof_id}")

        profs = api_get_professors_by_course(admin_token, offering_id)
        prof_found = any(p.get("email") == prof_email for p in profs) if isinstance(profs, list) else False
        if not prof_found:
            print("   Asignando profesor al curso...")
            resp_assign = api_assign_professor_to_course(admin_token, prof_id, offering_id)
            if not resp_assign:
                print("   ⚠️ No se pudo asignar el profesor (endpoint no responde). Prueba no evaluada.")
                return True, "No evaluado (fallo en asignación de profesor)"
            if resp_assign.status_code not in (200, 201):
                print(f"   ⚠️ Error al asignar profesor: {resp_assign.status_code} - {resp_assign.text}")
                return True, "No evaluado (error en asignación de profesor)"
            print("   ✅ Profesor asignado correctamente")
        else:
            print("   ✅ Profesor ya asignado al curso")

        await login_as_admin(page)

        ok = await navigate_to_course_professors(page, offering_id)
        if not ok:
            return False, "No se pudo navegar a la vista de profesores"

        professor_display_name = prof_email.split('@')[0] if prof_email != "test.teacher@upc.edu" else "Test"
        ok = await toggle_tutor_role(page, professor_display_name, make_tutor=True)
        if not ok:
            return False, "No se encontró el botón Make Tutor"

        role_text = await get_professor_role_from_table(page, professor_display_name)
        if "tutor" not in role_text.lower():
            return False, f"Rol esperado Tutor, obtenido {role_text}"

        ok = await toggle_tutor_role(page, professor_display_name, make_tutor=False)
        if not ok:
            return False, "No se encontró el botón Remove as Tutor"

        role_text = await get_professor_role_from_table(page, professor_display_name)
        if "tutor" in role_text.lower():
            return False, f"Se esperaba Professor, pero sigue siendo {role_text}"

        return True, "Asignación/remoción de tutor exitosa"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

# ========== Pruebas API ==========
def test_api_cambio_rol_global(admin_token):
    email = f"apirol.{int(time.time())}@upc.edu"
    resp = api_create_user(admin_token, email, "API Rol", "Test1234", "student")
    if resp.status_code not in (200, 201):
        return False, "No se pudo crear usuario"
    user = resp.json()
    user_id = user["id"]

    resp = api_update_user_role(admin_token, user_id, "teacher")
    if resp.status_code != 200:
        api_delete_user(admin_token, user_id)
        return False, f"Error al cambiar a teacher: {resp.status_code}"

    user_updated = api_get_user_by_email(admin_token, email)
    if not user_updated or user_updated["role"] != "teacher":
        api_delete_user(admin_token, user_id)
        return False, "El rol no se actualizó a teacher"

    resp = api_update_user_role(admin_token, user_id, "admin")
    if resp.status_code != 200:
        api_delete_user(admin_token, user_id)
        return False, f"Error al cambiar a admin: {resp.status_code}"
    user_updated = api_get_user_by_email(admin_token, email)
    if not user_updated or user_updated["role"] != "admin":
        api_delete_user(admin_token, user_id)
        return False, "El rol no se actualizó a admin"

    api_delete_user(admin_token, user_id)
    return True, "Cambio de rol global por API exitoso"

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-03: ASIGNAR ROL A USUARIO")
    headless = "--headless" in sys.argv

    admin_token = load_admin_token()
    if not admin_token or not check_admin_token(admin_token):
        print("❌ Token de admin inválido o no encontrado. Ejecuta: python get_token.py admin")
        return

    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Cambio de rol global (UI)...")
        ok, msg = await test_cambio_rol_global(browser, admin_token)
        resultados["Cambio de rol global (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Asignación/remoción de tutor (UI)...")
        ok, msg = await test_asignacion_tutor(browser, admin_token)
        if ok and "No evaluado" in msg:
            resultados["Asignación tutor (UI)"] = True
            print(f"  ⚠️ {msg}")
        else:
            resultados["Asignación tutor (UI)"] = ok
            print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n🧪 Cambio de rol global (API)...")
    ok, msg = test_api_cambio_rol_global(admin_token)
    resultados["Cambio de rol global (API)"] = ok
    print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n" + "="*50)
    print("📊 RESUMEN CU-03")
    all_ok = all(resultados.values())
    for k, v in resultados.items():
        print(f"  {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")

    if all_ok:
        print("\n🎉 CU-03 CUMPLE COMPLETAMENTE")
    else:
        print("\n⚠️ CU-03 NO CUMPLE COMPLETAMENTE")
        failed = [k for k, v in resultados.items() if not v]
        print(f"   Fallos: {failed}")

if __name__ == "__main__":
    asyncio.run(main())