import os
import sys
import re
from collections import defaultdict

# =====================================================
# CONFIGURACIÓN
# =====================================================
RUTAS_FILE = "rutas.txt"

# Módulos esperados según RNF-5.1
EXPECTED_MODULES = {
    "usuarios": ["/users", "/auth"],
    "asignaturas": ["/courses/subjects", "/academic-years", "/course-offerings"],
    "ejercicios": ["/exercises"],
    "entregas": ["/submissions"],
    "evaluacion_automatica": ["/evaluations", "/test-results"],
}

# Archivos de prueba de regresión (evidencia para RNF-5.2)
REGRESSION_TESTS = [
    "test_rnf3_usabilidad.py",
    "test_rnf4_fiabilidad.py",
]

# =====================================================
# FUNCIONES AUXILIARES
# =====================================================

def find_frontend_files(dirs_to_check=None):
    """
    Busca los archivos view.js, controller.js, model.js en los directorios indicados.
    Ignora node_modules y directorios que no contengan código de la aplicación.
    """
    if dirs_to_check is None:
        # Por defecto, buscar en el directorio actual, en ../frontend-vite/src/js, ../frontend-vite/src, ../src
        dirs_to_check = [
            ".",
            "..",
            "../frontend-vite/src/js",
            "../frontend-vite/src",
            "../src",
            "../frontend"
        ]

    required = ["view.js", "controller.js", "model.js"]
    found = {}

    # Expresión para evitar node_modules y otros directorios de dependencias
    ignore_pattern = re.compile(r"(node_modules|\.git|__pycache__)")

    for base_dir in dirs_to_check:
        if not os.path.exists(base_dir):
            continue
        # Buscar en el directorio base
        for f in required:
            if f not in found:
                path = os.path.join(base_dir, f)
                if os.path.isfile(path):
                    found[f] = path
        # Buscar recursivamente (hasta 2 niveles) ignorando node_modules
        if len(found) < len(required):
            for root, dirs, files in os.walk(base_dir):
                # Saltar si el directorio contiene node_modules
                if ignore_pattern.search(root):
                    continue
                # No bajar más de 2 niveles
                depth = root.replace(base_dir, "").count(os.sep)
                if depth > 2:
                    continue
                for f in required:
                    if f not in found and f in files:
                        found[f] = os.path.join(root, f)
                if len(found) == len(required):
                    break

    # Verificar que los archivos encontrados parecen ser de la aplicación (contenido mínimo)
    # Para view.js, comprobar que contiene "renderMainStudent" o "renderCourses"
    # Para controller.js, comprobar "loadDashboard" o "login"
    # Para model.js, comprobar "apiFetch" o "loginUser"
    valid = True
    for f, path in found.items():
        try:
            with open(path, "r", encoding="utf-8") as file:
                content = file.read()
                if f == "view.js" and not re.search(r"renderMainStudent|renderCourses|setActiveMenu", content):
                    print(f"⚠️ {path} no parece ser el view.js de la aplicación (faltan funciones clave)")
                    valid = False
                elif f == "controller.js" and not re.search(r"loadDashboard|login|loadMainStudent", content):
                    print(f"⚠️ {path} no parece ser el controller.js de la aplicación")
                    valid = False
                elif f == "model.js" and not re.search(r"apiFetch|loginUser|getMyProfile", content):
                    print(f"⚠️ {path} no parece ser el model.js de la aplicación")
                    valid = False
        except:
            pass

    if not valid:
        missing = [f for f in required if f not in found]
        if missing:
            print(f"⚠️ Faltan archivos de frontend: {missing}")
        return False

    if len(found) < len(required):
        missing = [f for f in required if f not in found]
        print(f"⚠️ Faltan archivos de frontend: {missing}")
        return False

    print("✅ Frontend: view.js, controller.js, model.js presentes (archivos válidos)")
    for f, path in found.items():
        print(f"   {f} -> {path}")
    return True

def load_routes():
    if not os.path.exists(RUTAS_FILE):
        print(f"❌ No se encontró {RUTAS_FILE}. Ejecuta primero: python check_routes.py")
        return []
    with open(RUTAS_FILE, "r") as f:
        return [line.strip() for line in f if line.strip()]

def classify_routes(routes):
    modules = defaultdict(list)
    for route in routes:
        assigned = False
        for module, prefixes in EXPECTED_MODULES.items():
            for prefix in prefixes:
                if route.startswith(prefix):
                    modules[module].append(route)
                    assigned = True
                    break
            if assigned:
                break
        if not assigned:
            modules["otros"].append(route)
    return modules

def check_regression_tests():
    missing = []
    for test_file in REGRESSION_TESTS:
        if not os.path.exists(test_file):
            missing.append(test_file)
    if missing:
        print(f"⚠️ Faltan pruebas de regresión: {missing}")
        return False
    print("✅ Pruebas de regresión (RNF-3 y RNF-4) encontradas")
    return True

def parse_args():
    frontend_dirs = None
    for i, arg in enumerate(sys.argv):
        if arg == "--frontend-dir" and i+1 < len(sys.argv):
            frontend_dirs = [sys.argv[i+1]]
            break
    return frontend_dirs

# =====================================================
# PRUEBA PRINCIPAL
# =====================================================

def main():
    frontend_dirs = parse_args()
    print("🔍 INICIANDO PRUEBAS DE RNF-5 (MANTENIBILIDAD)")
    resultados = {}

    # --- RNF-5.1: Modularidad ---
    print("\n🧪 [RNF-5.1] Análisis de modularidad")
    routes = load_routes()
    if not routes:
        print("❌ No se pudieron cargar las rutas. Asegúrate de haber ejecutado check_routes.py")
        return

    modules = classify_routes(routes)
    print(f"📌 Total de rutas analizadas: {len(routes)}")
    print("📌 Módulos identificados:")
    for module, module_routes in modules.items():
        print(f"  - {module}: {len(module_routes)} endpoints")

    missing_modules = []
    for module in EXPECTED_MODULES:
        if module not in modules or not modules[module]:
            missing_modules.append(module)
    if missing_modules:
        print(f"⚠️ Módulos sin endpoints: {missing_modules}")
        mod_ok = False
    else:
        print("✅ Todos los módulos esperados tienen endpoints")
        mod_ok = True

    # Buscar archivos frontend
    frontend_ok = find_frontend_files(frontend_dirs)
    modularidad_ok = mod_ok and frontend_ok
    resultados["RNF-5.1 Modularidad"] = modularidad_ok

    # --- RNF-5.2: Facilidad de actualización ---
    print("\n🧪 [RNF-5.2] Evaluación de facilidad de actualización")
    regression_ok = check_regression_tests()
    actualizacion_ok = regression_ok
    resultados["RNF-5.2 Facilidad de actualización"] = actualizacion_ok

    # --- Veredicto final ---
    print("\n" + "="*50)
    print("📊 RESUMEN DE RESULTADOS")
    for k, v in resultados.items():
        print(f"  {'✅' if v else '❌'} {k}: {'CUMPLE' if v else 'NO CUMPLE'}")

    if mod_ok and frontend_ok and regression_ok:
        print("\n🎉 **RNF-5 (Mantenibilidad) CUMPLE COMPLETAMENTE**")
    else:
        print("\n⚠️ **RNF-5 (Mantenibilidad) NO CUMPLE COMPLETAMENTE**")
        if not mod_ok:
            print("   - RNF-5.1: Faltan módulos o separación de capas")
        if not frontend_ok:
            print("   - RNF-5.1: Estructura frontend no modular (busca view.js, controller.js, model.js)")
        if not regression_ok:
            print("   - RNF-5.2: Faltan pruebas de regresión (RNF-3, RNF-4)")

if __name__ == "__main__":
    main()