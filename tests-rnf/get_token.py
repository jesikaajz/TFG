"""
get_token.py - Obtiene token de acceso para un rol específico y lo guarda en token_{rol}.txt
Uso: python get_token.py [admin|teacher|student]
Ejemplo: python get_token.py student
"""

import requests
import sys

# ============================================
# 🔑 AJUSTA ESTAS CREDENCIALES CON LAS TUYAS
# ============================================
CREDENTIALS = {
    "admin": {"email": "admin@admin.com", "password": "admin123"},
    "teacher": {"email": "javier@upc.edu", "password": "javier12"},
    "student": {"email": "jvjp3107@gmail.com", "password": "drpnll00"},
}

def get_token(role="admin"):
    if role not in CREDENTIALS:
        print(f"❌ Rol '{role}' no reconocido. Usa: admin, teacher, student")
        sys.exit(1)
    
    url = "http://localhost:8000/auth/login-json"
    payload = CREDENTIALS[role]
    headers = {"Content-Type": "application/json"}
    
    try:
        resp = requests.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
        token = data["access_token"]
        # Guardar en archivo específico para cada rol
        filename = f"token_{role}.txt"
        with open(filename, "w") as f:
            f.write(token)
        print(f"✅ Token para {role} guardado en {filename}")
        print(f"🔑 Token: {token[:30]}...")
        return token
    except requests.exceptions.RequestException as e:
        print(f"❌ Error al obtener token: {e}")
        if hasattr(e, 'response') and e.response:
            print(f"   Detalle: {e.response.text}")
        sys.exit(1)

if __name__ == "__main__":
    role = sys.argv[1] if len(sys.argv) > 1 else "admin"
    get_token(role)