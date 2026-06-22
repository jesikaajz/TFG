"""
test_rendimiento.py - Mide tiempos de respuesta de endpoints clave para cada rol.
Uso: python test_rendimiento.py [rol] [concurrentes] [iteraciones]
Ejemplo: python test_rendimiento.py admin 10 40
"""

import time
import requests
import statistics
from concurrent.futures import ThreadPoolExecutor
import sys

BASE_URL = "http://localhost:8000"

def load_token(role):
    try:
        with open(f"token_{role}.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"❌ No se encontró token_{role}.txt. Ejecuta: python get_token.py {role}")
        sys.exit(1)

def get_endpoints(role):
    """Define los endpoints a probar según el rol (usa rutas que sabemos que existen)"""
    if role == "admin":
        return [
            ("GET", "/users/"),                    # ✅ funciona con admin
            ("GET", "/courses/subjects"),          # ✅ funciona con admin
            ("GET", "/auth/me"),                   # ✅ cualquier autenticado
        ]
    elif role == "student":
        return [
            ("GET", "/submissions/submissions/me"),# ✅ solo estudiantes
            ("GET", "/enrollments/my-enrollments"),# ✅ solo estudiantes
            ("GET", "/courses/subjects"),          # ✅ estudiantes también pueden
            ("GET", "/auth/me"),                   # ✅ cualquier autenticado
        ]
    else:  # teacher
        return [
            ("GET", "/auth/me"),                   # ✅ cualquier autenticado
            ("GET", "/courses/subjects"),          # ✅ profesores también
            ("GET", "/teacher-assignments/teacher-assignments"),      # ✅ (si existe el router)
        ]

def call_endpoint(endpoint, headers):
    method, path = endpoint
    t0 = time.perf_counter()
    try:
        r = requests.request(method, BASE_URL + path, headers=headers, timeout=10)
        r.raise_for_status()
        return time.perf_counter() - t0
    except Exception as e:
        print(f"❌ Error en {method} {path}: {e}")
        return None

def run_load(role="admin", concurrent=10, iterations=20):
    token = load_token(role)
    headers = {"Authorization": f"Bearer {token}"}
    endpoints = get_endpoints(role)
    print(f"🚀 Rol: {role} | Concurrentes: {concurrent} | Iteraciones: {iterations} | Endpoints: {len(endpoints)}")
    print(f"📍 Endpoints: {[p for _,p in endpoints]}")
    
    all_times = []
    with ThreadPoolExecutor(max_workers=concurrent) as executor:
        for _ in range(iterations):
            futures = [executor.submit(call_endpoint, ep, headers) for ep in endpoints]
            for f in futures:
                result = f.result()
                if result is not None:
                    all_times.append(result)
    
    return all_times

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "admin"
    concurrent = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    iterations = int(sys.argv[3]) if len(sys.argv) > 3 else 40
    
    times = run_load(role, concurrent, iterations)
    
    if not times:
        print("❌ No se obtuvieron resultados. Verifica los endpoints y el token.")
        sys.exit(1)
    
    print(f"\n📊 RESULTADOS para rol '{role}' con {concurrent} concurrentes y {iterations} iteraciones:")
    print(f"📊 Media: {statistics.mean(times):.3f}s")
    
    if len(times) >= 100:
        p95 = statistics.quantiles(times, n=100)[94]
        print(f"📊 P95:   {p95:.3f}s")
    else:
        print(f"⚠️  Solo {len(times)} muestras (<100). P95 no disponible.")
    
    print(f"📊 Máx:   {max(times):.3f}s")
    print(f"📊 Mín:   {min(times):.3f}s")
    print(f"📊 Muestras: {len(times)}")
    
    # Evaluación del requisito RNF‑1.1 (tiempo < 3s)
    if statistics.mean(times) < 3.0:
        print("✅ Media < 3s: CUMPLE RNF‑1.1")
    else:
        print("❌ Media >= 3s: NO CUMPLE RNF‑1.1")
    
    if len(times) >= 100 and p95 < 3.0:
        print("✅ P95 < 3s: CUMPLE RNF‑1.1")
    elif len(times) >= 100:
        print("❌ P95 >= 3s: NO CUMPLE RNF‑1.1")