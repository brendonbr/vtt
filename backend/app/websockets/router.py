from fastapi import APIRouter
from fastapi.websockets import WebSocket, WebSocketDisconnect

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            # For now, echo back; later handle chat, dice, etc.
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        return
