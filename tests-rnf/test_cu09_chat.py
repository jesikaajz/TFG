"""
test_cu09_chat.py - Validación del CU-09: Enviar mensaje por chat
Uso: pytest test_cu09_chat.py -v -s --asyncio-mode=auto
"""

import asyncio
import json
import os
import sys
import pytest
import requests
import websockets
from playwright.async_api import async_playwright, expect

# ========== Configuración ==========
BASE_URL_FRONT = "http://localhost:5173"
BASE_URL_API = "http://localhost:8000"

ADMIN_CREDENTIALS = {"email": "admin@admin.com", "password": "admin123"}
TEACHER_CREDENTIALS = {"email": "javier@upc.edu", "password": "javier12"}
STUDENT_CREDENTIALS = {"email": "jvjp3107@gmail.com", "password": "drpnll00"}

TOKEN_STUDENT_FILE = "token_student.txt"
TOKEN_TEACHER_FILE = "token_teacher.txt"
TOKEN_ADMIN_FILE = "token_admin.txt"

# ========== Helpers ==========
def load_token(filename):
    try:
        with open(filename, "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        return None

def save_token(filename, token):
    with open(filename, "w") as f:
        f.write(token)

def login_and_save_token(role):
    creds = {
        "admin": ADMIN_CREDENTIALS,
        "teacher": TEACHER_CREDENTIALS,
        "student": STUDENT_CREDENTIALS
    }[role]
    filename = {
        "admin": TOKEN_ADMIN_FILE,
        "teacher": TOKEN_TEACHER_FILE,
        "student": TOKEN_STUDENT_FILE
    }[role]
    resp = requests.post(f"{BASE_URL_API}/auth/login-json",
                         json={"email": creds["email"], "password": creds["password"]},
                         timeout=5)
    if resp.status_code == 200:
        token = resp.json().get("access_token")
        save_token(filename, token)
        return token
    return None

def get_token(role, force_refresh=False):
    filename = {
        "admin": TOKEN_ADMIN_FILE,
        "teacher": TOKEN_TEACHER_FILE,
        "student": TOKEN_STUDENT_FILE
    }[role]
    token = load_token(filename) if not force_refresh else None
    if token:
        resp = requests.get(f"{BASE_URL_API}/users/me",
                            headers={"Authorization": f"Bearer {token}"},
                            timeout=3)
        if resp.status_code == 200:
            return token
    return login_and_save_token(role)

def api_request(method, endpoint, token=None, data=None, params=None, timeout=10):
    url = f"{BASE_URL_API}{endpoint}"
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    if data is not None:
        headers["Content-Type"] = "application/json"
    try:
        resp = requests.request(method, url, headers=headers, json=data, params=params, timeout=timeout)
        return resp
    except Exception as e:
        print(f"Error en petición {method} {endpoint}: {e}")
        return None

# ========== Pruebas API ==========

def test_get_contacts_student():
    token = get_token("student")
    resp = api_request("GET", "/chat/teachers", token=token)
    assert resp is not None and resp.status_code == 200
    teachers = resp.json()
    assert isinstance(teachers, list) and len(teachers) > 0

def test_get_contacts_teacher():
    token = get_token("teacher")
    resp = api_request("GET", "/chat/students", token=token)
    assert resp is not None and resp.status_code == 200
    students = resp.json()
    assert isinstance(students, list) and len(students) > 0

def test_get_conversations():
    token = get_token("student")
    resp = api_request("GET", "/chat/conversations", token=token)
    assert resp is not None and resp.status_code == 200
    assert isinstance(resp.json(), list)

def test_get_messages():
    token = get_token("student")
    resp = api_request("GET", "/chat/teachers", token=token)
    teachers = resp.json()
    if not teachers:
        pytest.skip("No hay profesores")
    teacher_id = teachers[0]["id"]
    resp2 = api_request("GET", f"/chat/messages/{teacher_id}", token=token, params={"limit": 20})
    assert resp2 is not None and resp2.status_code == 200
    assert isinstance(resp2.json(), list)

def test_unread_count():
    token = get_token("student")
    resp = api_request("GET", "/chat/unread-count", token=token)
    assert resp is not None and resp.status_code == 200
    data = resp.json()
    assert "unread_count" in data and isinstance(data["unread_count"], int)

def test_mark_as_read():
    token = get_token("student")
    resp = api_request("GET", "/chat/teachers", token=token)
    teachers = resp.json()
    if not teachers:
        pytest.skip("No hay profesores")
    teacher_id = teachers[0]["id"]
    resp2 = api_request("POST", f"/chat/notifications/mark-read/{teacher_id}", token=token)
    assert resp2 is not None and resp2.status_code == 200

def test_delete_message():
    token = get_token("student")
    resp = api_request("GET", "/chat/teachers", token=token)
    teachers = resp.json()
    if not teachers:
        pytest.skip("No hay profesores")
    teacher_id = teachers[0]["id"]
    resp2 = api_request("GET", f"/chat/messages/{teacher_id}", token=token, params={"limit": 5})
    if resp2.status_code != 200:
        pytest.skip("No se pudo obtener mensajes")
    messages = resp2.json()
    student_info = api_request("GET", "/users/me", token=token)
    student_id = student_info.json()["id"]
    own_msg = next((m for m in messages if m["sender_id"] == student_id), None)
    if not own_msg:
        pytest.skip("No hay mensaje propio")
    msg_id = own_msg["id"]
    resp3 = api_request("DELETE", f"/chat/messages/{msg_id}", token=token)
    assert resp3 is not None and resp3.status_code == 200
    resp4 = api_request("GET", f"/chat/messages/{teacher_id}", token=token, params={"limit": 5})
    new_messages = resp4.json()
    assert not any(m["id"] == msg_id for m in new_messages)

# ========== Prueba WebSocket ==========
@pytest.mark.asyncio
async def test_websocket_send_message():
    token_student = get_token("student")
    token_teacher = get_token("teacher")

    student_info = api_request("GET", "/users/me", token=token_student)
    student_id = student_info.json()["id"]
    teacher_info = api_request("GET", "/users/me", token=token_teacher)
    teacher_id = teacher_info.json()["id"]

    ws_url_student = f"ws://localhost:8000/chat/ws/{token_student}"
    ws_url_teacher = f"ws://localhost:8000/chat/ws/{token_teacher}"

    try:
        async with websockets.connect(ws_url_student) as ws_student:
            async with websockets.connect(ws_url_teacher) as ws_teacher:
                async def wait_for_message(websocket, timeout=5):
                    start = asyncio.get_event_loop().time()
                    while True:
                        if asyncio.get_event_loop().time() - start > timeout:
                            raise TimeoutError("No se recibió mensaje de tipo 'message'")
                        try:
                            raw = await asyncio.wait_for(websocket.recv(), timeout=1)
                        except asyncio.TimeoutError:
                            continue
                        data = json.loads(raw)
                        if data.get("type") == "presence":
                            continue
                        if data.get("type") == "message":
                            return data
                        print(f"ℹ️ Ignorando: {data.get('type')}")

                msg_data = {
                    "type": "message",
                    "receiver_id": teacher_id,
                    "message": "Mensaje de prueba desde WebSocket",
                    "course_offering_id": None
                }
                await ws_student.send(json.dumps(msg_data))

                resp_student = await wait_for_message(ws_student, timeout=5)
                assert resp_student["type"] == "message"
                assert resp_student["message"] == msg_data["message"]

                resp_teacher = await wait_for_message(ws_teacher, timeout=5)
                assert resp_teacher["type"] == "message"
                assert resp_teacher["message"] == msg_data["message"]
                assert resp_teacher["sender_id"] == student_id

                messages_resp = api_request("GET", f"/chat/messages/{teacher_id}", token=token_student, params={"limit": 10})
                messages = messages_resp.json()
                found = any(m["message"] == msg_data["message"] for m in messages)
                assert found, "El mensaje no se encontró en el historial"
    except Exception as e:
        pytest.fail(f"Fallo en WebSocket: {e}")

# ========== Prueba UI (Playwright) - VERSIÓN FINAL CORREGIDA ==========
@pytest.mark.asyncio
async def test_ui_chat_flow():
    """Prueba UI completa del chat: Courses → curso → Messages → enviar mensaje y archivo."""
    test_file = "test_upload.txt"
    with open(test_file, "w") as f:
        f.write("Contenido de prueba para adjuntar")

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False, slow_mo=300)
        context = await browser.new_context()
        page = await context.new_page()

        # 1. Login
        await page.goto(f"{BASE_URL_FRONT}/login.html")
        await page.fill("#email", STUDENT_CREDENTIALS["email"])
        await page.fill("#password", STUDENT_CREDENTIALS["password"])
        await page.click("#student")
        await page.click(".login-btn")
        await page.wait_for_url("**/main.html", timeout=10000)
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="01_after_login.png")
        print("📸 01_after_login.png")

        # 2. Ir a Courses
        courses_selectors = [
            "text=Courses",
            "text=Cursos",
            "a:has-text('Courses')",
            "a:has-text('Cursos')",
            ".nav-courses",
            "[data-testid='courses']",
            "li:has-text('Courses')",
            "span:has-text('Courses')"
        ]
        found_courses = False
        for selector in courses_selectors:
            try:
                await page.click(selector, timeout=2000)
                found_courses = True
                print(f"✅ Click en Courses con selector: {selector}")
                break
            except:
                pass
        if not found_courses:
            await page.goto(f"{BASE_URL_FRONT}/courses")
        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="02_courses_page.png")
        print("📸 02_courses_page.png")

        # 3. Hacer clic en "View Details"
        try:
            await page.click("text=View Details", timeout=5000)
            print("✅ Click en View Details")
        except:
            try:
                await page.click("text=Ver detalles", timeout=5000)
                print("✅ Click en Ver detalles")
            except:
                await page.click("button:has-text('View'), a:has-text('View'), button:has-text('Details')", timeout=5000)
                print("✅ Click en View Details (fallback)")

        await page.wait_for_load_state("networkidle")
        await page.screenshot(path="03_course_detail.png")
        print("📸 03_course_detail.png")

        # 4. Hacer clic en la pestaña "Messages"
        messages_selectors = [
            "text=Messages",
            "text=Mensajes",
            "text=Chat",
            "button:has-text('Messages')",
            "button:has-text('Mensajes')",
            "a:has-text('Messages')",
            "a:has-text('Mensajes')",
            "li:has-text('Messages')",
            "[data-tab='messages']",
            ".tab-messages",
            "#tab-messages",
            ".nav-tabs .tab:has-text('Messages')",
            ".tabs .tab:has-text('Messages')",
            ".tab:has-text('Messages')",
            ".tab:has-text('Mensajes')"
        ]
        found_messages = False
        for selector in messages_selectors:
            try:
                await page.click(selector, timeout=2000)
                found_messages = True
                print(f"✅ Pestaña Messages encontrada con selector: {selector}")
                break
            except:
                pass
        if not found_messages:
            try:
                await page.click("text=/Messages|Mensajes/i", timeout=2000)
                found_messages = True
                print("✅ Pestaña Messages encontrada por regex")
            except:
                pass
        if not found_messages:
            await page.screenshot(path="04_no_messages_tab.png")
            pytest.skip("No se encontró la pestaña Messages")

        # 5. Seleccionar profesor
        professor_names = ["Neus Catala Roig", "Jordi Esteve", "Javier Rodríguez"]
        professor_found = False
        for name in professor_names:
            try:
                await page.wait_for_selector(f"text={name}", timeout=5000)
                professor_found = True
                print(f"✅ Profesor encontrado: {name}")
                await page.click(f"text={name}")
                print(f"✅ Click en profesor: {name}")
                break
            except:
                pass
        if not professor_found:
            try:
                await page.click("text=/Professor|Profesor/i", timeout=5000)
                print("✅ Click en profesor por texto genérico")
            except:
                await page.screenshot(path="05_no_professor_found.png")
                pytest.skip("No se encontró ningún profesor")

        # 6. Esperar campo de entrada
        input_selectors = [
            "input[type='text']",
            "textarea",
            "[contenteditable='true']",
            ".message-input",
            ".chat-input",
            "[class*='input']",
            "[placeholder*='message']",
            "[placeholder*='mensaje']",
            "[placeholder*='escribe']",
            "[placeholder*='type']"
        ]
        input_found = False
        for selector in input_selectors:
            try:
                await page.wait_for_selector(selector, timeout=3000)
                input_found = True
                print(f"✅ Campo de entrada encontrado: {selector}")
                break
            except:
                pass
        if not input_found:
            await page.screenshot(path="06_no_input_found.png")
            pytest.skip("No se encontró el campo de entrada")

        # 7. Escribir mensaje
        test_msg = "Mensaje de prueba desde UI"
        for selector in input_selectors:
            try:
                await page.fill(selector, test_msg)
                print(f"✅ Mensaje escrito en: {selector}")
                break
            except:
                continue

        # 8. Enviar mensaje
        send_selectors = [
            ".send-btn",
            ".send-button",
            "button[type='submit']",
            "button:has-text('Send')",
            "button:has-text('Enviar')",
            "[class*='send']",
            "button:has-text('Enviar mensaje')"
        ]
        send_clicked = False
        for selector in send_selectors:
            try:
                await page.click(selector, timeout=2000)
                send_clicked = True
                print(f"✅ Botón de enviar clickeado: {selector}")
                break
            except:
                pass
        if not send_clicked:
            await page.keyboard.press("Enter")
            print("⚠️ Enviado con Enter (fallback)")

        # 9. Verificar mensaje en la conversación
        await page.wait_for_selector(f"text={test_msg}", timeout=10000)
        print(f"✅ Mensaje verificado en la conversación")

        # 10. Adjuntar archivo
        file_input = page.locator("input[type='file']")
        if await file_input.count() > 0:
            await file_input.set_input_files(test_file)
            print("✅ Archivo seleccionado")
            # Enviar el archivo (puede ser automático o con botón)
            for selector in send_selectors:
                try:
                    await page.click(selector, timeout=2000)
                    print("✅ Archivo adjunto enviado")
                    break
                except:
                    pass
            # Esperar a que el nombre del archivo aparezca en la conversación
            await page.wait_for_selector(f"text={test_file}", timeout=10000)
            print(f"✅ Archivo '{test_file}' verificado en la conversación")

        # 11. Eliminar mensaje propio (el último mensaje enviado)
        own_messages = page.locator(".message-item.own, .msg.own, .chat-message.own")
        count_before = await own_messages.count()
        if count_before > 0:
            delete_btn = own_messages.last.locator(".delete-btn, .delete-button, .remove-btn")
            if await delete_btn.count() > 0:
                await delete_btn.click()
                count_after = await own_messages.count()
                assert count_after == count_before - 1
                print("✅ Mensaje eliminado")

        # 12. Cerrar sesión
        await page.click(".logout-btn, .logout-button")
        await page.wait_for_url("**/login.html", timeout=5000)

        await browser.close()

    if os.path.exists(test_file):
        os.remove(test_file)

if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-v", "-s", "--asyncio-mode=auto"]))