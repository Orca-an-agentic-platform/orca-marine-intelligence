"""risk API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="risk root")
async def risk_root():
    return {"module": "risk", "status": "stub — implement per plan"}
