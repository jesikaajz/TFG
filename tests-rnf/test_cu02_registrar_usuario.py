"""
test_cu02_registrar_usuario.py - Validación del CU-02: Registrar usuario (gestión de usuarios)
Uso: python test_cu02_registrar_usuario.py [--headless]
"""

import asyncio
import sys
import time
import requests
from playwright.async_api import async_playwright

BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

ADMIN_CREDENTIALS = {"email": "admin@admin.com", "password": "admin123"}
TOKEN_FILE = "token_admin.txt"

# ========== Helpers ==========
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
    await page.wait_for_selector("text=User Management", timeout=10000)

async def open_create_user_modal(page):
    await page.click("#createUserBtn")
    await page.wait_for_selector("#userName", timeout=5000)

async def fill_user_form(page, name, email, password, role):
    await page.fill("#userName", name)
    await page.fill("#userEmail", email)
    await page.fill("#userPassword", password)
    await page.select_option("#userRole", value=role)

async def submit_user_form(page):
    await page.click("#confirmCreateUserBtn")

async def close_user_modal(page):
    try:
        await page.click(".close-user-modal")
    except:
        pass

async def get_user_from_table(page, email):
    rows = await page.query_selector_all("tbody tr")
    for row in rows:
        row_text = await row.text_content()
        if email in row_text:
            return row
    return None

# ---- Pruebas UI ----
async def test_crear_usuario_exitoso(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        await login_as_admin(page)
        await navigate_to_user_management(page)

        email = f"test.{int(time.time())}@upc.edu"
        name = "Test User"
        password = "Test1234"
        role = "student"

        await open_create_user_modal(page)
        await fill_user_form(page, name, email, password, role)
        await submit_user_form(page)

        try:
            await page.wait_for_selector("text=Usuario creado exitosamente", timeout=5000)
        except:
            pass

        await close_user_modal(page)

        user_row = await get_user_from_table(page, email)
        if user_row is None:
            return False, f"El usuario {email} no apareció en la tabla"

        role_cell = await user_row.query_selector("td:nth-child(3) span.role-badge")
        role_text = await role_cell.text_content() if role_cell else ""
        if "student" not in role_text.lower() and "estudiante" not in role_text.lower():
            return False, f"Rol incorrecto: {role_text}"

        # Limpiar
        users_resp = api_get_users(admin_token)
        if users_resp.status_code == 200:
            users = users_resp.json()
            for u in users:
                if u["email"] == email:
                    api_delete_user(admin_token, u["id"])
                    break

        return True, "Usuario creado correctamente"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_crear_usuario_email_duplicado(browser, admin_token):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        email = f"dup.{int(time.time())}@upc.edu"
        resp = api_create_user(admin_token, email, "Dup User", "Test1234", "student")
        if resp.status_code not in (200, 201):
            return False, "No se pudo crear usuario base"

        await login_as_admin(page)
        await navigate_to_user_management(page)
        await open_create_user_modal(page)

        await fill_user_form(page, "Dup User 2", email, "Test1234", "student")
        await submit_user_form(page)

        error = False
        # Buscar cualquier notificación de error
        try:
            await page.wait_for_selector("[class*='notification'], [class*='toast'], .error, .alert", timeout=5000)
            error = True
        except:
            # Buscar textos comunes de error
            body_text = await page.text_content("body") or ""
            if "already exists" in body_text.lower() or "registrado" in body_text.lower() or "duplicado" in body_text.lower():
                error = True

        await close_user_modal(page)

        # Limpiar
        users_resp = api_get_users(admin_token)
        if users_resp.status_code == 200:
            users = users_resp.json()
            for u in users:
                if u["email"] == email:
                    api_delete_user(admin_token, u["id"])
                    break

        return error, "Error de email duplicado mostrado" if error else "No se detectó mensaje de error"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_crear_usuario_sin_email(browser):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        await login_as_admin(page)
        await navigate_to_user_management(page)
        await open_create_user_modal(page)

        await fill_user_form(page, "Sin Email", "", "Test1234", "student")
        await submit_user_form(page)

        # Verificar si el modal sigue abierto (frontend bloqueó el envío)
        modal_visible = await page.is_visible("#userName")
        if modal_visible:
            error = True  # El frontend impidió el envío
        else:
            # Si el modal se cerró, buscar mensaje de error en la página
            body_text = await page.text_content("body") or ""
            if "email" in body_text.lower() and ("requerido" in body_text.lower() or "required" in body_text.lower()):
                error = True
            else:
                error = False

        await close_user_modal(page)
        return error, "Validación de campo email vacío" if error else "No se detectó validación"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

async def test_crear_usuario_contrasena_corta(browser):
    context = await browser.new_context()
    page = await context.new_page()
    try:
        await login_as_admin(page)
        await navigate_to_user_management(page)
        await open_create_user_modal(page)

        email = f"short.{int(time.time())}@upc.edu"
        await fill_user_form(page, "Short Pass", email, "123", "student")
        await submit_user_form(page)

        try:
            await page.wait_for_selector("text=8 caracteres", timeout=5000)
            error = True
        except:
            error_text = await page.text_content("body") or ""
            if "8" in error_text and "caracteres" in error_text:
                error = True
            else:
                error = False

        await close_user_modal(page)
        return error, "Validación de contraseña corta" if error else "No se detectó validación"

    except Exception as e:
        return False, f"Error: {str(e)}"
    finally:
        await page.close()
        await context.close()

# ========== Pruebas API ==========
def test_api_crear_usuario_exitoso(admin_token):
    email = f"api.{int(time.time())}@upc.edu"
    resp = api_create_user(admin_token, email, "API User", "Api12345", "teacher")
    if resp.status_code not in (200, 201):
        return False, f"Error al crear via API: {resp.status_code} - {resp.text}"

    user = resp.json()
    user_id = user["id"]

    resp_list = api_get_users(admin_token)
    if resp_list.status_code != 200:
        return False, "No se pudo obtener lista de usuarios"

    users = resp_list.json()
    found = any(u["id"] == user_id for u in users)
    api_delete_user(admin_token, user_id)
    if found:
        return True, "Usuario creado y encontrado via API"
    else:
        return False, "Usuario no encontrado en lista"

def test_api_crear_usuario_email_duplicado(admin_token):
    email = f"dupapi.{int(time.time())}@upc.edu"
    resp1 = api_create_user(admin_token, email, "First", "Test1234", "student")
    if resp1.status_code not in (200, 201):
        return False, "No se pudo crear usuario base"

    resp2 = api_create_user(admin_token, email, "Second", "Test1234", "student")
    user1 = resp1.json()
    api_delete_user(admin_token, user1["id"])

    if resp2.status_code in (400, 409, 422):
        detail = resp2.json().get("detail", "")
        if "exist" in detail.lower() or "duplicate" in detail.lower() or "registered" in detail.lower():
            return True, f"Error de duplicado capturado por API: {detail}"
        else:
            return True, f"Error de duplicado (código {resp2.status_code})"
    else:
        return False, f"Se esperaba error 400/409/422, obtuvo {resp2.status_code}"

def test_api_crear_usuario_sin_email(admin_token):
    resp = requests.post(f"{BASE_URL_API}/users/",
                         json={"name": "No Email", "password": "Test1234", "role": "student"},
                         headers={"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"},
                         timeout=5)
    if resp.status_code in (400, 422):
        return True, "Error de validación (email requerido)"
    else:
        return False, f"Se esperaba error 400/422, obtuvo {resp.status_code}"

# ========== Main ==========
async def main():
    print("🔍 INICIANDO PRUEBAS DEL CU-02: REGISTRAR USUARIO")
    headless = "--headless" in sys.argv

    admin_token = load_admin_token()
    if not admin_token or not check_admin_token(admin_token):
        print("❌ Token de admin inválido o no encontrado. Ejecuta: python get_token.py admin")
        return

    resultados = {}

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)

        print("\n🧪 Creación exitosa de usuario (UI)...")
        ok, msg = await test_crear_usuario_exitoso(browser, admin_token)
        resultados["Creación exitosa (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Email duplicado (UI)...")
        ok, msg = await test_crear_usuario_email_duplicado(browser, admin_token)
        resultados["Email duplicado (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Email vacío (UI)...")
        ok, msg = await test_crear_usuario_sin_email(browser)
        resultados["Email vacío (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        print("\n🧪 Contraseña corta (UI)...")
        ok, msg = await test_crear_usuario_contrasena_corta(browser)
        resultados["Contraseña corta (UI)"] = ok
        print(f"  {'✅' if ok else '❌'} {msg}")

        await browser.close()

    print("\n🧪 Creación exitosa vía API...")
    ok, msg = test_api_crear_usuario_exitoso(admin_token)
    resultados["Creación exitosa (API)"] = ok
    print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n🧪 Email duplicado vía API...")
    ok, msg = test_api_crear_usuario_email_duplicado(admin_token)
    resultados["Email duplicado (API)"] = ok
    print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n🧪 Sin email vía API...")
    ok, msg = test_api_crear_usuario_sin_email(admin_token)
    resultados["Sin email (API)"] = ok
    print(f"  {'✅' if ok else '❌'} {msg}")

    print("\n" + "="*50)
    print("📊 RESUMEN CU-02")
    all_ok = all(resultados.values())
    for k, v in resultados.items():
        print(f"  {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")

    if all_ok:
        print("\n🎉 CU-02 CUMPLE COMPLETAMENTE")
    else:
        print("\n⚠️ CU-02 NO CUMPLE COMPLETAMENTE")
        failed = [k for k, v in resultados.items() if not v]
        print(f"   Fallos: {failed}")

if __name__ == "__main__":
    asyncio.run(main())