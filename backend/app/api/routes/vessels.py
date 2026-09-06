"""vessels API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="vessels root")
async def vessels_root():
    return {"module": "vessels", "status": "stub — implement per plan"}
