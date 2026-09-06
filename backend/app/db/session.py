"""Database session factory — async SQLAlchemy.
Fails gracefully if PostgreSQL is not running (dev without Docker).
"""
from app.core.config import settings

engine = None
async_session_factory = None

try:
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True)
    async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
except Exception:
    pass  # DB not available — app runs in limited mode


async def init_db():
    """Create all tables — no-op if DB not available."""
    if engine is None:
        return
    try:
        from app.db.models.models import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        import structlog
        structlog.get_logger().warning("db.init_failed", error=str(e))


async def get_db():
    if async_session_factory is None:
        yield None
        return
    from sqlalchemy.ext.asyncio import AsyncSession
    async with async_session_factory() as session:
        yield session
