"""
Auth API — Registration, Login, JWT tokens.
Works with DB when available, falls back to in-memory store for dev.
"""
import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional

import structlog
from fastapi import APIRouter, HTTPException, status, Request
from pydantic import BaseModel, Field, EmailStr

from app.core.config import settings

logger = structlog.get_logger()
router = APIRouter()

# ── In-memory user store (dev fallback when DB is unavailable) ────────────────
_users_store: dict[str, dict] = {}


# ── Schemas ───────────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., min_length=5, max_length=100)
    phone: str = Field(default="", max_length=20)
    password: str = Field(..., min_length=4, max_length=100)
    role: str = Field(default="fisherman")
    aadhaar_hash: Optional[str] = None
    organization: Optional[str] = None
    port_of_origin: Optional[str] = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── JWT helpers ───────────────────────────────────────────────────────────────

def _create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    from jose import jwt
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def _hash_password(password: str) -> str:
    import bcrypt
    pwd_bytes = password.encode("utf-8")[:72]
    return bcrypt.hashpw(pwd_bytes, bcrypt.gensalt()).decode("utf-8")


def _verify_password(plain_password: str, hashed_password: str) -> bool:
    import bcrypt
    pwd_bytes = plain_password.encode("utf-8")[:72]
    return bcrypt.checkpw(pwd_bytes, hashed_password.encode("utf-8"))


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", summary="Register a new user", response_model=AuthResponse)
async def register(req: RegisterRequest):
    logger.info("auth.register", email=req.email, role=req.role)

    # Check if email already exists
    if req.email.lower() in _users_store:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists. Please login instead."
        )

    # Create user record
    user_id = str(uuid.uuid4())
    hashed_pw = _hash_password(req.password)

    user_record = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "phone": req.phone,
        "role": req.role,
        "password_hash": hashed_pw,
        "aadhaar_hash": req.aadhaar_hash,
        "organization": req.organization,
        "port_of_origin": req.port_of_origin,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    # Store (in-memory for dev; DB insert when available)
    _users_store[req.email.lower()] = user_record

    # Also try to persist to DB if available
    try:
        from app.db.session import async_session_factory
        if async_session_factory:
            from sqlalchemy import text
            async with async_session_factory() as session:
                await session.execute(
                    text("""
                        INSERT INTO users (id, full_name, email, phone, role, hashed_password, created_at)
                        VALUES (:id, :name, :email, :phone, :role, :pw, NOW())
                        ON CONFLICT (email) DO NOTHING
                    """),
                    {"id": user_id, "name": req.name, "email": req.email.lower(),
                     "phone": req.phone, "role": req.role, "pw": hashed_pw}
                )
                await session.commit()
                logger.info("auth.register.db_persisted", user_id=user_id)
    except Exception as e:
        logger.warning("auth.register.db_fallback", error=str(e))
        # Continue — in-memory store is fine for dev

    # Generate JWT
    token = _create_access_token({"sub": user_id, "email": req.email.lower(), "role": req.role})

    return AuthResponse(
        access_token=token,
        user={"name": req.name, "email": req.email.lower(), "role": req.role}
    )


@router.post("/login", summary="Login with email + password", response_model=AuthResponse)
async def login(req: LoginRequest):
    logger.info("auth.login", email=req.email)

    email_lower = req.email.lower()
    user = _users_store.get(email_lower)

    # If not in memory, try DB
    if not user:
        try:
            from app.db.session import async_session_factory
            if async_session_factory:
                from sqlalchemy import text
                async with async_session_factory() as session:
                    result = await session.execute(
                        text("SELECT id, full_name as name, email, role, hashed_password as password_hash FROM users WHERE email = :email"),
                        {"email": email_lower}
                    )
                    row = result.mappings().first()
                    if row:
                        user = dict(row)
        except Exception as e:
            logger.warning("auth.login.db_error", error=str(e))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. If you're new, please register first."
        )

    # Verify password
    if not _verify_password(req.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    # Generate JWT
    token = _create_access_token({
        "sub": user["id"],
        "email": user["email"],
        "role": user["role"],
    })

    return AuthResponse(
        access_token=token,
        user={"name": user["name"], "email": user["email"], "role": user["role"]}
    )


@router.get("/me", summary="Get current user info")
async def get_me(request: Request):
    from jose import jwt, JWTError
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or invalid token")
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role"),
        }
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token is invalid or expired")


@router.get("/", summary="Auth module status")
async def auth_root():
    return {"module": "auth", "status": "active", "endpoints": ["/auth/register", "/auth/login", "/auth/me"]}
