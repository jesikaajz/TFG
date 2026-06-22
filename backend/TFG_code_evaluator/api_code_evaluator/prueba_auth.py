import requests
import time
from datetime import datetime

BASE_URL = "http://localhost:8000"  # Ajusta tu puerto

# Datos de prueba
email = "jvjp3107@gmail.com"
password = "drpnll00"

def test_full_auth_flow():
    print("=" * 60)
    print("🔐 INICIANDO PRUEBA COMPLETA DE AUTENTICACIÓN")
    print("=" * 60)
    
    # 1. LOGIN
    print("\n1️⃣ LOGIN")
    print("-" * 40)
    login_response = requests.post(
        f"{BASE_URL}/auth/login-json",
        json={"email": email, "password": password}
    )
    
    assert login_response.status_code == 200, f"Login falló: {login_response.status_code}"
    tokens = login_response.json()
    
    print(f"✅ Login exitoso")
    print(f"   Access Token: {tokens['access_token'][:50]}...")
    print(f"   Refresh Token: {tokens['refresh_token'][:50]}...")
    print(f"   Token Type: {tokens['token_type']}")
    print(f"   Password change required: {tokens.get('password_change_required', False)}")
    
    access_token = tokens['access_token']
    refresh_token = tokens['refresh_token']
    
    # 2. VERIFICAR TOKEN (endpoint protegido)
    print("\n2️⃣ VERIFICAR TOKEN")
    print("-" * 40)
    verify_response = requests.post(
        f"{BASE_URL}/auth/verify",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert verify_response.status_code == 200
    print(f"✅ Token válido")
    print(f"   Usuario ID: {verify_response.json()['user_id']}")
    print(f"   Rol: {verify_response.json()['role']}")
    
    # 3. OBTENER PERFIL
    print("\n3️⃣ OBTENER PERFIL")
    print("-" * 40)
    me_response = requests.get(
        f"{BASE_URL}/auth/me",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    assert me_response.status_code == 200
    print(f"✅ Perfil obtenido")
    print(f"   Nombre: {me_response.json().get('name', 'N/A')}")
    print(f"   Email: {me_response.json().get('email', 'N/A')}")
    
    # 4. REFRESH TOKEN
    print("\n4️⃣ REFRESH TOKEN")
    print("-" * 40)
    refresh_response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    
    assert refresh_response.status_code == 200
    new_tokens = refresh_response.json()
    
    print(f"✅ Refresh exitoso")
    print(f"   Nuevo Access Token: {new_tokens['access_token'][:50]}...")
    print(f"   Nuevo Refresh Token: {new_tokens['refresh_token'][:50]}...")
    
    # 5. PROBAR QUE EL REFRESH TOKEN VIEJO YA NO FUNCIONA (reuse detection)
    print("\n5️⃣ PROBAR REUSE DETECTION")
    print("-" * 40)
    reuse_response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": refresh_token}  # Token viejo
    )
    
    print(f"   Status code: {reuse_response.status_code}")
    if reuse_response.status_code == 401:
        print(f"✅ Reuse detection funcionando: {reuse_response.json()}")
    else:
        print(f"⚠️ Se esperaba 401, pero llegó {reuse_response.status_code}")
    
    # 6. PROBAR CON NUEVO TOKEN
    print("\n6️⃣ PROBAR CON NUEVO TOKEN")
    print("-" * 40)
    verify_new_response = requests.post(
        f"{BASE_URL}/auth/verify",
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
    )
    
    assert verify_new_response.status_code == 200
    print(f"✅ Nuevo token funciona correctamente")
    
    # 7. LOGOUT
    print("\n7️⃣ LOGOUT")
    print("-" * 40)
    logout_response = requests.post(
        f"{BASE_URL}/auth/logout",
        json={"refresh_token": new_tokens['refresh_token']},
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
    )
    
    assert logout_response.status_code == 200
    print(f"✅ Logout exitoso")
    
    # 8. PROBAR TOKEN DESPUÉS DE LOGOUT
    print("\n8️⃣ PROBAR TOKEN DESPUÉS DE LOGOUT")
    print("-" * 40)
    after_logout_response = requests.post(
        f"{BASE_URL}/auth/verify",
        headers={"Authorization": f"Bearer {new_tokens['access_token']}"}
    )
    
    print(f"   Status code: {after_logout_response.status_code}")
    if after_logout_response.status_code == 401:
        print(f"✅ Token correctamente invalidado después de logout")
    else:
        print(f"⚠️ El token aún es válido (esperaba 401)")
    
    print("\n" + "=" * 60)
    print("🎉 PRUEBA COMPLETADA EXITOSAMENTE")
    print("=" * 60)

def test_token_expiration():
    """Prueba que el token expire correctamente"""
    print("\n" + "=" * 60)
    print("⏰ PRUEBA DE EXPIRACIÓN DE TOKEN")
    print("=" * 60)
    
    # Login
    login_response = requests.post(
        f"{BASE_URL}/auth/login-json",
        json={"email": email, "password": password}
    )
    
    access_token = login_response.json()['access_token']
    print(f"✅ Token obtenido (válido por ~15-30 minutos)")
    
    # Esperar a que expire (solo si quieres probar, normalmente se espera)
    # time.sleep(1800)  # 30 minutos
    
    # Verificar
    verify_response = requests.post(
        f"{BASE_URL}/auth/verify",
        headers={"Authorization": f"Bearer {access_token}"}
    )
    
    if verify_response.status_code == 401:
        print(f"✅ Token expirado correctamente")
    else:
        print(f"⚠️ Token aún válido (status: {verify_response.status_code})")

def test_invalid_tokens():
    """Prueba el manejo de tokens inválidos"""
    print("\n" + "=" * 60)
    print("❌ PRUEBA DE TOKENS INVÁLIDOS")
    print("=" * 60)
    
    # Token mal formado
    print("\n📝 Token mal formado:")
    response = requests.post(
        f"{BASE_URL}/auth/verify",
        headers={"Authorization": "Bearer token_invalido"}
    )
    print(f"   Status: {response.status_code} - {'✅' if response.status_code == 401 else '❌'}")
    
    # Sin token
    print("\n📝 Sin token:")
    response = requests.post(f"{BASE_URL}/auth/verify")
    print(f"   Status: {response.status_code} - {'✅' if response.status_code == 401 else '❌'}")
    
    # Refresh token inválido
    print("\n📝 Refresh token inválido:")
    response = requests.post(
        f"{BASE_URL}/auth/refresh",
        json={"refresh_token": "token_invalido"}
    )
    print(f"   Status: {response.status_code} - {'✅' if response.status_code == 401 else '❌'}")

if __name__ == "__main__":
    # Ejecutar todas las pruebas
    try:
        test_full_auth_flow()
        test_invalid_tokens()
        # test_token_expiration()  # Descomentar si quieres probar expiración real
    except AssertionError as e:
        print(f"\n❌ Prueba fallida: {e}")
    except Exception as e:
        print(f"\n❌ Error inesperado: {e}")