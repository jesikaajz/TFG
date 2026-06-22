"""
test_error_handling_v2.py - Pruebas de gestión de errores (RNF-5.2)
Uso: python test_error_handling_v2.py [admin|student|teacher]
"""

import requests
import sys
import json

# =====================================================
# 🔧 AJUSTA SEGÚN TU API (si tienes prefijo, ej. /api)
# =====================================================
BASE_URL = "http://localhost:8000"
API_PREFIX = ""  # ej. "/api" si tus rutas empiezan con /api

def load_token(role):
    try:
        with open(f"token_{role}.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"❌ No se encontró token_{role}.txt. Ejecuta: python get_token.py {role}")
        sys.exit(1)

def get_headers(role):
    token = load_token(role)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def test_404(role):
    print("\n🔍 Prueba 404 (recurso no encontrado)")
    url = f"{BASE_URL}{API_PREFIX}/users/99999"
    r = requests.get(url, headers=get_headers(role))
    print(f"   GET /users/99999 -> {r.status_code}")
    if r.status_code == 404:
        print(f"   Mensaje: {r.json().get('detail', 'No detail')}")
    else:
        print(f"   ❌ Esperado 404, obtuve {r.status_code}")

def test_403(role):
    print("\n🔍 Prueba 403 (acceso denegado por rol)")
    # Intentar crear usuario con rol que no es admin
    url = f"{BASE_URL}{API_PREFIX}/users/"
    payload = {"email": "nuevo@test.com", "name": "Nuevo", "password": "123"}
    r = requests.post(url, json=payload, headers=get_headers(role))
    print(f"   POST /users/ con rol {role} -> {r.status_code}")
    if r.status_code == 403:
        print(f"   ✅ Acceso denegado correctamente")
    else:
        print(f"   ❌ Esperado 403, obtuve {r.status_code}")

def test_422_submissions(role):
    print("\n🔍 Prueba 422 (validación fallida en submissions)")
    # Código vacío (falta code)
    url = f"{BASE_URL}{API_PREFIX}/submissions/"
    payload = {"exercise_id": 1, "language_id": 1, "code": ""}  # code vacío
    r = requests.post(url, json=payload, headers=get_headers(role))
    print(f"   POST /submissions/ con code vacío -> {r.status_code}")
    if r.status_code == 422:
        print("   ✅ Validación fallida correcta")
    elif r.status_code == 404:
        print("   ❌ 404 - Verifica la URL de submissions (puede ser /api/submissions/)")
        print(f"      Respuesta: {r.text[:200]}")
    else:
        print(f"   ⚠️ Código inesperado: {r.status_code}")

def test_409_duplicate_email(role):
    print("\n🔍 Prueba 409/422 (email duplicado)")
    # Crear usuario con email que ya existe (usa el mismo que usaste para login)
    url = f"{BASE_URL}{API_PREFIX}/users/"
    payload = {"email": "admin@admin.com", "name": "Admin Dup", "password": "123"}
    r = requests.post(url, json=payload, headers=get_headers(role))
    print(f"   POST /users/ con email duplicado -> {r.status_code}")
    if r.status_code in [400, 409, 422]:
        print(f"   ✅ Error de duplicado capturado: {r.text[:100]}")
    else:
        print(f"   ⚠️ Código inesperado: {r.status_code}")

def test_delete_with_dependencies(role):
    print("\n🔍 Prueba de eliminación con dependencias (opcional)")
    # Puedes probar eliminar un usuario que tiene submissions o un ejercicio con submissions
    # Ejemplo: eliminar ejercicio 1 (si existe y tiene submissions)
    url = f"{BASE_URL}{API_PREFIX}/exercises/170"
    r = requests.delete(url, headers=get_headers(role))
    print(f"   DELETE /exercises/1 -> {r.status_code}")
    if r.status_code == 409:
        print("   ✅ No se puede eliminar porque tiene dependencias")
    elif r.status_code == 404:
        print("   ℹ️ El ejercicio no existe o no tiene dependencias")
    else:
        print(f"   ⚠️ Código: {r.status_code}")

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "admin"
    print(f"🧪 Probando gestión de errores con rol: {role}")
    test_404(role)
    test_403(role)
    test_422_submissions(role)
    test_409_duplicate_email(role)
    test_delete_with_dependencies(role)
    print("\n✅ Pruebas de errores completadas.")