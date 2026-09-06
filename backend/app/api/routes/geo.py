"""geo API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="geo root")
async def geo_root():
    return {"module": "geo", "status": "stub — implement per plan"}
