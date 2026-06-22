# usuario24.py
import asyncio
import json
import websockets

# Primero, obtén el token del usuario 24 haciendo login
# O usa el que ya tienes si es el correcto

async def usuario24():
    # Reemplaza con el token del usuario 24
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozNiwicm9sZSI6InRlYWNoZXIiLCJleHAiOjE3Nzk2NDY1NDEsInR5cGUiOiJhY2Nlc3MifQ.741y61UKHnl_eCYWbAWNAiwuqSJmoKXBL2kHYyIAs_0"
    uri = f"ws://localhost:8000/chat/ws/{token}"
    
    async with websockets.connect(uri) as websocket:
        print("✅ Usuario 24 conectado")
        
        # Escuchar mensajes
        while True:
            msg = await websocket.recv()
            data = json.loads(msg)
            print(f"📨 Usuario 24 recibe de {data.get('sender_name')}: {data.get('message')}")
            
            # Responder automáticamente
            if data.get('type') == 'message':
                await websocket.send(json.dumps({
                    "type": "message",
                    "receiver_id": data['sender_id'],
                    "message": "Recibido! Gracias por tu mensaje."
                }))
                print("📤 Respuesta enviada")

asyncio.run(usuario24())