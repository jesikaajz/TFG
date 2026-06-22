import asyncio
from playwright.async_api import async_playwright
import time
import sys

BASE_URL = "http://localhost:5173"   # tu frontend (ajusta si es otro puerto)
API_URL = "http://localhost:8000"    # backend

# Credenciales de prueba (deben existir en tu BD)
CREDENTIALS = {
    "admin": {"email": "admin@admin.com", "password": "admin123"},
    "teacher": {"email": "javier@upc.edu", "password": "javier12"},
    "student": {"email": "jvjp3107@gmail.com", "password": "drpnll00"},
}

async def run_task(page, task_name, steps):
    """Ejecuta una tarea con sus pasos y mide tiempo y pasos."""
    start = time.perf_counter()
    step_count = 0
    try:
        for action, selector, *value in steps:
            step_count += 1
            if action == "goto":
                await page.goto(selector, timeout=15000)
            elif action == "fill":
                await page.fill(selector, value[0], timeout=5000)
            elif action == "click":
                await page.click(selector, timeout=5000)
            elif action == "wait_for":
                await page.wait_for_selector(selector, state="visible", timeout=10000)
        elapsed = time.perf_counter() - start
        return {"success": True, "time": elapsed, "steps": step_count, "error": None}
    except Exception as e:
        elapsed = time.perf_counter() - start
        return {"success": False, "time": elapsed, "steps": step_count, "error": str(e)}

async def main(role="admin", headless=True):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)  # slow_mo para ver qué pasa
        context = await browser.new_context()
        page = await context.new_page()
        
        # Definir tareas según el rol
        tasks = []
        if role == "admin":
            tasks = [
                {
                    "name": "Login como admin",
                    "steps": [
                        ("goto", f"{BASE_URL}/login.html"),
                        ("fill", "#email", CREDENTIALS["admin"]["email"]),
                        ("fill", "#password", CREDENTIALS["admin"]["password"]),
                        # Seleccionar el botón de rol admin (en login.html hay botones con id "admin")
                        ("click", "#admin"),
                        ("click", ".login-btn"),
                        ("wait_for", "text=Admin Dashboard"),  # Título que aparece en el dashboard admin
                    ]
                },
                {
                    "name": "Ir a Usuarios",
                    "steps": [
                        ("click", "text=Users"),  # En el menú lateral (sidebar) hay un item "Users"
                        ("wait_for", "text=User Management"),  # Título de la página de usuarios
                    ]
                },
                {
                    "name": "Crear asignatura (Academic Structure)",
                    "steps": [
                        ("click", "text=Academic Structure"),  # Item del menú admin
                        ("wait_for", "text=Academic Structure"),  # Título
                        ("click", "text=+ Create Subject"),  # Botón en la pestaña Subjects
                        ("wait_for", "input#modalSubjectName"),  # Input del modal
                        ("fill", "#modalSubjectName", "Prueba Playwright"),
                        ("fill", "#modalSubjectDescription", "Descripción de prueba"),
                        ("click", "#confirmCreateSubjectBtn"),
                        ("wait_for", "text=Subject created successfully"),  # Notificación (opcional)
                    ]
                }
            ]
        elif role == "teacher":
            tasks = [
                {
                    "name": "Login como profesor",
                    "steps": [
                        ("goto", f"{BASE_URL}/login.html"),
                        ("fill", "#email", CREDENTIALS["teacher"]["email"]),
                        ("fill", "#password", CREDENTIALS["teacher"]["password"]),
                        ("click", "#teacher"),
                        ("click", ".login-btn"),
                        ("wait_for", "text=Professor Dashboard"),
                    ]
                },
                {
                    "name": "Ver estudiantes de un curso",
                    "steps": [
                        ("click", "text=Courses"),
                        ("wait_for", "text=My Courses"),
                        ("click", ".btn-details:first-child"),  # Primer curso
                        ("wait_for", "text=Students"),
                        ("click", "text=Students"),
                        ("wait_for", "text=Enrolled students"),
                    ]
                }
            ]
        elif role == "student":
            tasks = [
                {
                    "name": "Login como estudiante",
                    "steps": [
                        ("goto", f"{BASE_URL}/login.html"),
                        ("fill", "#email", CREDENTIALS["student"]["email"]),
                        ("fill", "#password", CREDENTIALS["student"]["password"]),
                        ("click", "#student"),
                        ("click", ".login-btn"),
                        ("wait_for", "text=Student Dashboard"),
                    ]
                },
                {
                    "name": "Ver ejercicios de una asignatura",
                    "steps": [
                        ("click", "text=Courses"),
                        ("wait_for", "text=My Subjects"),
                        ("click", ".course-item:first-child"),  # Primer curso
                        ("wait_for", "text=Complete your assigned exercises"),
                    ]
                }
            ]
        
        results = []
        for task in tasks:
            print(f"🔄 Ejecutando tarea: {task['name']}...")
            result = await run_task(page, task["name"], task["steps"])
            results.append({
                "role": role,
                "task": task["name"],
                "success": result["success"],
                "time": result["time"],
                "steps": result["steps"],
                "error": result["error"],
            })
            if not result["success"]:
                # Tomar captura de pantalla para depurar
                screenshot_path = f"screenshot_{role}_{task['name'].replace(' ', '_')}.png"
                await page.screenshot(path=screenshot_path)
                print(f"📸 Captura guardada en {screenshot_path}")
        
        await browser.close()
        return results

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "admin"
    headless = "--headless" not in sys.argv
    print(f"🚀 Ejecutando pruebas de usabilidad para rol: {role}")
    results = asyncio.run(main(role, headless))
    
    print("\n📊 RESULTADOS:")
    success_count = 0
    total_time = 0
    total_steps = 0
    for r in results:
        status = "✅" if r["success"] else "❌"
        print(f"{status} {r['task']} - Tiempo: {r['time']:.2f}s - Pasos: {r['steps']}")
        if not r["success"]:
            print(f"   Error: {r['error']}")
        else:
            success_count += 1
            total_time += r["time"]
            total_steps += r["steps"]
    
    print(f"\n📈 Resumen para rol '{role}':")
    print(f"   Tasa de éxito: {success_count}/{len(results)} ({success_count/len(results)*100:.1f}%)")
    if success_count > 0:
        print(f"   Tiempo medio por tarea: {total_time/success_count:.2f}s")
        print(f"   Pasos medios por tarea: {total_steps/success_count:.1f}")