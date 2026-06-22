"""
test_security.py - Prueba autenticación y control de acceso por roles.
Uso: python test_security.py
"""

import requests
import os

BASE = "http://localhost:8000"

# Endpoints a probar para cada rol (esperado: 200 para admin, 403 para otros)
TEST_ENDPOINTS = {
    "GET": [
        ("/users/", ["admin"]),           # solo admin
        ("/courses/subjects", ["admin", "teacher", "student"]),  # cualquier autenticado
        ("/submissions/submissions/me", ["student"]), # solo estudiante
        ("/enrollments/my-enrollments", ["student"]), # solo estudiante
    ]
}

def load_token(role):
    try:
        with open(f"token_{role}.txt", "r") as f:
            return f.read().strip()
    except FileNotFoundError:
        print(f"❌ No se encontró token_{role}.txt. Ejecuta: python get_token.py {role}")
        return None

def test_auth():
    print("🔐 PRUEBAS DE AUTENTICACIÓN Y ROLES\n")
    
    # 1. Sin token
    print("1. Sin token:")
    r = requests.get(BASE + "/courses/subjects")
    print(f"   /courses/subjects -> {r.status_code} (esperado 401)")
    
    # 2. Token inválido
    print("\n2. Token inválido:")
    headers = {"Authorization": "Bearer token_falso"}
    r = requests.get(BASE + "/courses/subjects", headers=headers)
    print(f"   /courses/subjects -> {r.status_code} (esperado 401)")
    
    # 3. Probar cada endpoint con cada rol
    print("\n3. Control de acceso por roles:")
    for method, endpoints in TEST_ENDPOINTS.items():
        for path, roles_allowed in endpoints:
            for role in ["admin", "teacher", "student"]:
                token = load_token(role)
                if not token:
                    continue
                headers = {"Authorization": f"Bearer {token}"}
                r = requests.request(method, BASE + path, headers=headers)
                expected = 200 if role in roles_allowed else 403
                status = "✅" if r.status_code == expected else "❌"
                print(f"   {status} {role} -> {method} {path} -> {r.status_code} (esperado {expected})")

if __name__ == "__main__":
    test_auth()