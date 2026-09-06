"""alerts API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="alerts root")
async def alerts_root():
    return {"module": "alerts", "status": "stub — implement per plan"}
