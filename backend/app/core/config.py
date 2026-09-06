"""
ORCA Application Configuration — Pydantic Settings v2
"""
from functools import lru_cache
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # ── App ──────────────────────────────────────────────────────────────────
    APP_NAME: str = "ORCA"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "change-me-in-production"
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # ── Database ─────────────────────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://orca:orca_secret@localhost:5432/orca"
    POSTGRES_HOST: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_DB: str = "orca"
    POSTGRES_USER: str = "orca"
    POSTGRES_PASSWORD: str = "orca_secret"

    # ── Redis ─────────────────────────────────────────────────────────────────
    REDIS_URL: str = "redis://localhost:6379/0"

    # ── LLM ──────────────────────────────────────────────────────────────────
    LLM_PROVIDER: str = "ollama"          # ollama | vllm
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "gemma2:12b"      # Primary: Gemma 4 12B
    OLLAMA_MODEL_FALLBACK: str = "qwen:8b"  # Fallback: Qwen3-8B
    VLLM_BASE_URL: str = "http://localhost:8000"
    VLLM_MODEL: str = "google/gemma-4-12b"

    # ── Embeddings ────────────────────────────────────────────────────────────
    EMBEDDING_MODEL: str = "BAAI/bge-m3"
    EMBEDDING_DIM: int = 1024

    # ── Auth / JWT ────────────────────────────────────────────────────────────
    JWT_SECRET_KEY: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # ── External APIs ─────────────────────────────────────────────────────────
    INCOIS_API_KEY: str = ""
    INCOIS_BASE_URL: str = "https://incois.gov.in"
    MOSDAC_API_KEY: str = ""
    MOSDAC_BASE_URL: str = "https://mosdac.gov.in"
    IMD_API_KEY: str = ""
    IMD_BASE_URL: str = "https://imdpune.gov.in"
    COPERNICUS_USERNAME: str = ""
    COPERNICUS_PASSWORD: str = ""
    COPERNICUS_BASE_URL: str = "https://marine.copernicus.eu"

    # ── Notifications ─────────────────────────────────────────────────────────
    FCM_SERVER_KEY: str = ""
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMS_API_KEY: str = ""
    SMS_API_URL: str = ""

    # ── Rate limiting ─────────────────────────────────────────────────────────
    RATE_LIMIT_PER_MINUTE: int = 60
    RATE_LIMIT_BURST: int = 10

    # ── Scheduler ────────────────────────────────────────────────────────────
    ALERT_CHECK_INTERVAL_MINUTES: int = 15
    DATA_FRESHNESS_WARN_MULTIPLIER: float = 2.0  # warn if age > 2× update_interval


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
