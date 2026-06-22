# usuario23.py
import asyncio
import json
import websockets

async def usuario23():
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoyMywicm9sZSI6InN0dWRlbnQiLCJleHAiOjE3Nzk2NDc3MTIsInR5cGUiOiJhY2Nlc3MifQ.GcQYAL4qfgCLdIdpf8g6d36yBOmWj7lGoBEqhy6OByQ"
    uri = f"ws://localhost:8000/chat/ws/{token}"
    
    async with websockets.connect(uri) as websocket:
        print("✅ Usuario 23 conectado")
        
        # Enviar mensaje al usuario 24
        await websocket.send(json.dumps({
            "type": "message",
            "receiver_id": 36,
            "message": "Hola usuario 24!"
        }))
        print("📤 Mensaje enviado al usuario 24")
        
        # Escuchar respuestas
        while True:
            msg = await websocket.recv()
            print(f"📨 Usuario 23 recibe: {json.loads(msg)}")

asyncio.run(usuario23())