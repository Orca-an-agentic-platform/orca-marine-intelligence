"""
Health & Readiness Endpoints
GET /health        → liveness
GET /health/ready  → readiness (DB, Redis, LLM)
"""
from fastapi import APIRouter
from app.core.config import settings
from app.core.llm import llm

router = APIRouter()


@router.get("", summary="Liveness probe")
async def health():
    return {"status": "ok", "app": settings.APP_NAME, "env": settings.APP_ENV}


@router.get("/ready", summary="Readiness probe — DB, Redis, LLM")
async def readiness():
    checks = {}

    # LLM
    try:
        checks["llm"] = "ok" if await llm.health_check() else "degraded"
    except Exception as e:
        checks["llm"] = f"error: {e}"

    # Redis
    try:
        import redis.asyncio as aioredis
        r = aioredis.from_url(settings.REDIS_URL)
        await r.ping()
        await r.aclose()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    # DB
    try:
        from app.db.session import async_session_factory
        from sqlalchemy import text
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        checks["db"] = "ok"
    except Exception as e:
        checks["db"] = f"error: {e}"

    overall = "ok" if all(v == "ok" for v in checks.values()) else "degraded"
    return {"status": overall, "checks": checks}
