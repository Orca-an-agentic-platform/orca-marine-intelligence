"""
Chat API — Main SSE streaming entry point for all user roles.
POST /chat/query  → streams advisory response via Server-Sent Events
GET  /chat/history/{session_id}
"""
import json
import uuid
from typing import AsyncGenerator

import structlog
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from app.agents.orchestrator import run_orca
from app.schemas.core import ChatQueryRequest, UserRole

logger = structlog.get_logger()
router = APIRouter()


async def sse_stream(query: str, session_id: str, user_role: str, language: str) -> AsyncGenerator[str, None]:
    """Stream ORCA agent pipeline results as Server-Sent Events."""
    try:
        yield f"data: {json.dumps({'type': 'status', 'message': 'Processing your query...'})}\n\n"

        yield f"data: {json.dumps({'type': 'status', 'message': 'Understanding intent...'})}\n\n"

        result = await run_orca(
            query=query,
            session_id=session_id,
            user_role=user_role,
            language=language,
        )

        # Stream advisory
        advisory = result.get("advisory", {})
        yield f"data: {json.dumps({'type': 'advisory', 'data': advisory})}\n\n"

        # Stream risk
        risk = result.get("risk_assessment", {})
        yield f"data: {json.dumps({'type': 'risk', 'data': risk})}\n\n"

        # Stream intent
        intent = result.get("intent", {})
        yield f"data: {json.dumps({'type': 'intent', 'data': intent})}\n\n"

        # Done
        yield f"data: {json.dumps({'type': 'done', 'session_id': session_id})}\n\n"

    except Exception as e:
        logger.error("chat.stream.error", error=str(e))
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/query", summary="Main conversational query — SSE streaming")
async def chat_query(request: ChatQueryRequest):
    session_id = request.session_id or str(uuid.uuid4())
    logger.info("chat.query", role=request.user_role, lang=request.language, session=session_id)

    return StreamingResponse(
        sse_stream(
            query=request.query,
            session_id=session_id,
            user_role=request.user_role.value,
            language=request.language,
        ),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/history/{session_id}", summary="Chat session history")
async def chat_history(session_id: str):
    # TODO: retrieve from chat_sessions table
    return {"session_id": session_id, "messages": [], "note": "Connect to chat_sessions DB table"}
