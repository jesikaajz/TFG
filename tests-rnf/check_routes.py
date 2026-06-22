"""
check_routes.py - Lista todas las rutas registradas en la API.
Uso: python check_routes.py [token_file]
Ejemplo: python check_routes.py token_admin.txt
"""
import requests
import sys
import json

BASE_URL = "http://localhost:8000"

def load_token(token_file=None):
    if token_file:
        try:
            with open(token_file, "r") as f:
                return f.read().strip()
        except FileNotFoundError:
            print(f"❌ Archivo {token_file} no encontrado.")
            return None
    return None

def main():
    token_file = sys.argv[1] if len(sys.argv) > 1 else None
    token = load_token(token_file)
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    resp = requests.get(f"{BASE_URL}/openapi.json", headers=headers)
    if resp.status_code != 200:
        print(f"❌ Error {resp.status_code}: {resp.text}")
        return
    
    data = resp.json()
    paths = data.get("paths", {})
    print("\n📌 RUTAS DISPONIBLES:")
    for path in sorted(paths.keys()):
        methods = ", ".join(paths[path].keys())
        print(f"  {path}  [{methods}]")
    
    # Guardar en archivo para referencia
    with open("rutas.txt", "w") as f:
        for path in sorted(paths.keys()):
            f.write(f"{path}\n")
    print(f"\n✅ Lista de rutas guardada en 'rutas.txt'.")

if __name__ == "__main__":
    main()