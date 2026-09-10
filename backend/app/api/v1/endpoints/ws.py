"""
WebSocket endpoint for real-time bi-directional communication.
"""
import json

import structlog
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = structlog.get_logger()
router = APIRouter()


@router.websocket("/live")
async def websocket_endpoint(websocket: WebSocket):
    """Real-time WebSocket connection for live updates."""
    await websocket.accept()
    logger.info("websocket.connected", client=str(websocket.client))
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            # Echo back with acknowledgement
            await websocket.send_json({
                "type": "ack",
                "message": f"Received: {message.get('type', 'unknown')}",
            })
    except WebSocketDisconnect:
        logger.info("websocket.disconnected", client=str(websocket.client))
    except Exception as e:
        logger.error("websocket.error", error=str(e))
