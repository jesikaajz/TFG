"""
test_rnf3_usabilidad.py - Validación de RNF-3 (Usabilidad)
Uso: python test_rnf3_usabilidad.py [rol] [--headless]
Ejemplo: python test_rnf3_usabilidad.py admin --headless
"""

import asyncio
import sys
import time
from playwright.async_api import async_playwright

# =====================================================
# CONFIGURACIÓN
# =====================================================
BASE_URL = "http://localhost:5173"
CREDENTIALS = {
    "admin": {"email": "admin@admin.com", "password": "admin123"},
    "teacher": {"email": "javier@upc.edu", "password": "javier12"},
    "student": {"email": "jvjp3107@gmail.com", "password": "drpnll00"},
}

MAX_STEPS = 10

# =====================================================
# DEFINICIÓN DE TAREAS POR ROL
# =====================================================
TASKS = {
    "admin": [
        {
            "name": "Login como administrador",
            "steps": [
                ("goto", BASE_URL + "/login.html"),
                ("fill", "#email", CREDENTIALS["admin"]["email"]),
                ("fill", "#password", CREDENTIALS["admin"]["password"]),
                ("click", "#admin"),
                ("click", ".login-btn"),
                ("wait_for", "text=Admin Dashboard"),
            ]
        },
        {
            "name": "Ir a la gestión de usuarios",
            "steps": [
                ("wait_for", ".menu-item", 15000),
                ("click", "aside .menu-item:has-text('Users')", 15000),
                ("wait_for_load", None),
                ("wait_for", "h1:has-text('User Management')", 15000),
            ]
        },
        {
            "name": "Crear una nueva asignatura",
            "steps": [
                ("click", "text=Academic Structure"),
                ("wait_for", "text=Academic Structure"),
                ("wait_for", "#createSubjectBtn"),
                ("click", "#createSubjectBtn"),
                ("wait_for", "#modalSubjectName"),
                ("fill", "#modalSubjectName", "Prueba Usabilidad"),
                ("fill", "#modalSubjectDescription", "Descripción de prueba"),
                ("click", "#confirmCreateSubjectBtn"),
                ("wait_for", "text=creada exitosamente", 15000),
            ]
        }
    ],
    "teacher": [
        {
            "name": "Login como profesor",
            "steps": [
                ("goto", BASE_URL + "/login.html"),
                ("fill", "#email", CREDENTIALS["teacher"]["email"]),
                ("fill", "#password", CREDENTIALS["teacher"]["password"]),
                ("click", "#teacher"),
                ("click", ".login-btn"),
                ("wait_for", ".menu-item", 15000),  # Esperar menú lateral
            ]
        },
        {
            "name": "Ver estudiantes de un curso",
            "steps": [
                ("click", "text=Courses"),
                ("wait_for", "text=My Courses"),
                ("wait_for", ".course-card", 15000),
                ("click", ".course-card:first-child .btn-details", 15000),
                ("wait_for", "text=Students"),
                ("click", "text=Students"),
                ("wait_for", "text=Enrolled students"),
            ]
        }
    ],
    "student": [
        {
            "name": "Login como estudiante",
            "steps": [
                ("goto", BASE_URL + "/login.html"),
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
                ("wait_for", ".course-card", 15000),
                ("click", ".course-card:first-child .btn-details", 15000),
                ("wait_for", "text=Complete your assigned exercises"),
            ]
        }
    ]
}

# =====================================================
# FUNCIÓN AUXILIAR PARA EJECUTAR UNA TAREA
# =====================================================
async def run_task(page, task):
    start = time.perf_counter()
    step_count = 0
    try:
        for step in task["steps"]:
            step_count += 1
            action = step[0]
            if len(step) == 1:
                selector = None
                timeout = None
            elif len(step) == 2:
                selector = step[1]
                timeout = None
            else:
                selector = step[1]
                timeout = step[2] if isinstance(step[2], int) else None

            if action == "goto":
                await page.goto(selector, timeout=15000)
            elif action == "fill":
                await page.fill(selector, step[2], timeout=5000)
            elif action == "click":
                t = timeout if timeout is not None else 10000
                await page.locator(selector).scroll_into_view_if_needed()
                await page.click(selector, timeout=t, force=True)
            elif action == "wait_for_load":
                await page.wait_for_load_state("networkidle", timeout=15000)
            elif action == "wait_for":
                t = timeout if timeout is not None else 10000
                await page.wait_for_selector(selector, state="visible", timeout=t)
        elapsed = time.perf_counter() - start
        return {"success": True, "steps": step_count, "time": elapsed, "error": None}
    except Exception as e:
        elapsed = time.perf_counter() - start
        current_url = page.url
        print(f"❌ Error en la tarea '{task['name']}' en el paso {step_count}: {e}")
        print(f"   URL actual: {current_url}")
        return {"success": False, "steps": step_count, "time": elapsed, "error": str(e)}

# =====================================================
# PRUEBA PRINCIPAL
# =====================================================
async def main(role="admin", headless=True):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless, slow_mo=300)
        context = await browser.new_context()
        page = await context.new_page()

        tasks = TASKS.get(role, [])
        if not tasks:
            print(f"❌ Rol '{role}' no tiene tareas definidas.")
            return

        results = []
        for task in tasks:
            print(f"🔄 Ejecutando tarea: {task['name']}...")
            result = await run_task(page, task)
            results.append({
                "task": task["name"],
                **result
            })
            if not result["success"]:
                screenshot = f"screenshot_{role}_{task['name'].replace(' ', '_')}.png"
                await page.screenshot(path=screenshot)
                print(f"📸 Captura guardada en {screenshot}")

        await browser.close()

        total_tasks = len(results)
        success_tasks = sum(1 for r in results if r["success"])
        success_rate = success_tasks / total_tasks if total_tasks else 0

        steps_success = [r["steps"] for r in results if r["success"]]
        avg_steps = sum(steps_success) / len(steps_success) if steps_success else 0
        max_steps = max(steps_success) if steps_success else 0

        print("\n📊 RESULTADOS DE USABILIDAD")
        print(f"Rol: {role}")
        print(f"Tareas completadas: {success_tasks}/{total_tasks} ({success_rate*100:.1f}%)")
        print(f"Pasos promedio (tareas exitosas): {avg_steps:.1f}")
        print(f"Pasos máximos: {max_steps}")

        if success_tasks == 0:
            cumple_pasos = False
            print("❌ RNF-3.2: No se completó ninguna tarea, no se puede evaluar.")
        else:
            cumple_pasos = max_steps <= MAX_STEPS
            if cumple_pasos:
                print(f"✅ RNF-3.2 (Navegación sencilla): Todos los pasos ≤ {MAX_STEPS} (máximo {max_steps}).")
            else:
                print(f"❌ RNF-3.2 (Navegación sencilla): Se superó el umbral de {MAX_STEPS} pasos (máximo {max_steps}).")

        cumple_exito = success_rate == 1.0

        print("\n🔎 VEREDICTO:")
        if cumple_exito:
            print("✅ RNF-3.1 (Interfaz intuitiva): Todas las tareas se completaron con éxito.")
        else:
            print("❌ RNF-3.1 (Interfaz intuitiva): Fallaron algunas tareas (consulta los errores).")

        if cumple_exito and cumple_pasos:
            print("\n🎉 **CUMPLE CON RNF-3**")
        else:
            print("\n⚠️ **NO CUMPLE TOTALMENTE CON RNF-3**")

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "admin"
    headless = "--headless" not in sys.argv

    print(f"🚀 Iniciando prueba de usabilidad para rol: {role}")
    asyncio.run(main(role, headless))