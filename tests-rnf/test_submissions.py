"""
test_submissions.py - Envía múltiples submissions en paralelo y mide tiempos.
Uso: python test_submissions.py [rol] [concurrentes]
Ejemplo: python test_submissions.py student 30
"""

import requests
import concurrent.futures
import time
import statistics
import sys

BASE = "http://localhost:8000"

# =====================================================
# 🔧 AJUSTA ESTOS VALORES SEGÚN TU BASE DE DATOS
# =====================================================
EXERCISE_ID = 170     # ID de un ejercicio que exista
LANGUAGE_ID = 2      # ID de un lenguaje permitido para ese ejercicio
CODE = "return 'hola mundo'"  # Código de ejemplo

def load_token(role):
    try:
        with open(f"token_{role}.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"❌ No se encontró token_{role}.txt. Ejecuta: python get_token.py {role}")
        sys.exit(1)

def submit(role):
    token = load_token(role)
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = {
        "exercise_id": EXERCISE_ID,
        "language_id": LANGUAGE_ID,
        "code": CODE
    }
    t0 = time.perf_counter()
    try:
        r = requests.post(f"{BASE}/submissions/submissions", json=payload, headers=headers, timeout=30)
        t = time.perf_counter() - t0
        if r.status_code == 200:
            data = r.json()
            return data.get("id"), t, None
        else:
            return None, t, f"HTTP {r.status_code} - {r.text[:200]}"
    except Exception as e:
        return None, 0, str(e)

def run_submissions(role="student", concurrent_workers=20):
    print(f"🚀 Enviando {concurrent_workers} submissions en paralelo...")
    results = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrent_workers) as executor:
        futures = [executor.submit(submit, role) for _ in range(concurrent_workers)]
        for f in concurrent.futures.as_completed(futures):
            results.append(f.result())
    return results

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "student"
    concurrent_workers = int(sys.argv[2]) if len(sys.argv) > 2 else 20
    
    results = run_submissions(role, concurrent_workers)
    
    ok = [r for r in results if r[0] is not None]
    errors = [r for r in results if r[0] is None]
    
    print(f"\n📊 RESULTADOS:")
    print(f"✅ Envíos exitosos: {len(ok)}/{len(results)}")
    print(f"❌ Errores: {len(errors)}")
    
    if errors:
        print("   Últimos errores:")
        for err in errors[:3]:
            print(f"   - {err[2]}")
    
    if ok:
        submission_ids = [r[0] for r in ok]
        times = [r[1] for r in ok]
        print(f"\n📊 Tiempo de respuesta del endpoint POST /submissions/submissions")
        print(f"📊 Media: {statistics.mean(times):.3f}s")
        print(f"📊 Máx:   {max(times):.3f}s")
        print(f"📊 Mín:   {min(times):.3f}s")
        print(f"📊 IDs de submissions creadas: {submission_ids[:5]}{'...' if len(submission_ids)>5 else ''}")