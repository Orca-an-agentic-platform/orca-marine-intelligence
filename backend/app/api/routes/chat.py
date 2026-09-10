"""
Chat API — Main SSE streaming entry point for all user roles.
POST /chat/query  → streams advisory response via Server-Sent Events
GET  /chat/history/{session_id}
"""
import json
import uuid
from typing import AsyncGenerator

import structlog
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse, Response

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

        # Stream intent
        intent = result.get("intent", {})
        if intent:
            yield f"data: {json.dumps({'type': 'intent', 'data': intent})}\n\n"

        # Stream risk
        risk = result.get("risk_assessment", {})
        if risk:
            yield f"data: {json.dumps({'type': 'risk', 'data': risk})}\n\n"

        # Stream advisory (primary synthesized response)
        advisory = result.get("advisory", {})
        yield f"data: {json.dumps({'type': 'advisory', 'data': advisory})}\n\n"

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


def split_text_into_chunks(text: str, max_chars: int = 180) -> list[str]:
    """Split text into sentence-aware chunks safe for Google TTS synthesis."""
    import re
    cleaned = re.sub(r'[*#_•\-]+', ' ', text)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    if not cleaned:
        return []

    # Split by sentence boundaries (. ? ! । ॥ etc.)
    sentences = re.split(r'(?<=[.!?।॥\n])\s+', cleaned)
    chunks = []
    curr = ""
    for s in sentences:
        s = s.strip()
        if not s:
            continue
        if len(curr) + len(s) + 1 <= max_chars:
            curr = f"{curr} {s}".strip()
        else:
            if curr:
                chunks.append(curr)
            if len(s) > max_chars:
                sub_parts = re.split(r'(?<=[,،;])\s+', s)
                sub_curr = ""
                for p in sub_parts:
                    if len(sub_curr) + len(p) + 1 <= max_chars:
                        sub_curr = f"{sub_curr} {p}".strip()
                    else:
                        if sub_curr:
                            chunks.append(sub_curr)
                        sub_curr = p[:max_chars]
                if sub_curr:
                    chunks.append(sub_curr)
            else:
                curr = s
    if curr:
        chunks.append(curr)
    return chunks[:6]  # Up to 6 chunks for responsive TTS audio


async def generate_tts_stream(text: str, lang: str) -> Response:
    """Generate audio/mpeg stream for any Indian/foreign language using Google TTS."""
    import httpx
    chunks = split_text_into_chunks(text)
    if not chunks:
        return Response(status_code=204)

    lang_code = lang.lower().split("-")[0]
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://translate.google.com/",
    }

    all_audio = bytearray()
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            for idx, chunk in enumerate(chunks):
                params = {
                    "ie": "UTF-8",
                    "q": chunk,
                    "tl": lang_code,
                    "total": str(len(chunks)),
                    "idx": str(idx),
                    "textlen": str(len(chunk)),
                    "client": "tw-ob",
                    "prev": "input",
                }
                resp = await client.get("https://translate.google.com/translate_tts", params=params, headers=headers)
                if resp.status_code == 200 and len(resp.content) > 50:
                    all_audio.extend(resp.content)

        if len(all_audio) > 100:
            return Response(
                content=bytes(all_audio),
                media_type="audio/mpeg",
                headers={
                    "Cache-Control": "public, max-age=86400",
                    "Accept-Ranges": "bytes",
                    "Content-Disposition": "inline",
                }
            )
    except Exception as e:
        logger.warning("tts.stream.error", error=str(e), lang=lang)

    return Response(status_code=204)


@router.get("/tts", summary="Native Text-to-Speech audio streaming in any language")
async def text_to_speech_get(text: str = Query(..., max_length=2000), lang: str = Query("mr")):
    return await generate_tts_stream(text, lang)


@router.post("/tts", summary="Native Text-to-Speech audio streaming (POST)")
async def text_to_speech_post(payload: dict):
    text = payload.get("text", "")
    lang = payload.get("lang", "mr")
    return await generate_tts_stream(text, lang)

