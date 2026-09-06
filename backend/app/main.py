"""
ORCA Backend — FastAPI Application Entry Point
"""
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from app.api.routes import auth, chat, marine, weather, geo, risk, advisory, alerts, data, knowledge, vessels, health
from app.core.config import settings
from app.db.session import init_db

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("ORCA backend starting up", env=settings.APP_ENV)
    # await init_db()  # disabled until PostgreSQL is running
    yield
    logger.info("ORCA backend shutting down")


app = FastAPI(
    title="ORCA — Marine Intelligence Platform",
    description="Marine EcOsystem Reasoning with Collaborative Agents. SIH26176.",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Prometheus metrics ─────────────────────────────────────────────────────────
Instrumentator().instrument(app).expose(app)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(health.router,    prefix="/health",       tags=["Health"])
app.include_router(auth.router,      prefix="/auth",         tags=["Auth"])
app.include_router(chat.router,      prefix="/chat",         tags=["Chat"])
app.include_router(marine.router,    prefix="/marine",       tags=["Marine"])
app.include_router(weather.router,   prefix="/weather",      tags=["Weather"])
app.include_router(geo.router,       prefix="/geo",          tags=["Geo"])
app.include_router(risk.router,      prefix="/risk",         tags=["Risk"])
app.include_router(advisory.router,  prefix="/advisory",     tags=["Advisory"])
app.include_router(alerts.router,    prefix="/alerts",       tags=["Alerts"])
app.include_router(data.router,      prefix="/data",         tags=["Data"])
app.include_router(knowledge.router, prefix="/knowledge",    tags=["Knowledge"])
app.include_router(vessels.router,   prefix="/vessels",      tags=["Vessels"])
