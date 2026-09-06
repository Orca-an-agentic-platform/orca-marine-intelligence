"""auth API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="auth root")
async def auth_root():
    return {"module": "auth", "status": "stub — implement per plan"}
