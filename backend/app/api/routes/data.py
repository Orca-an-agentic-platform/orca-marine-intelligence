"""data API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="data root")
async def data_root():
    return {"module": "data", "status": "stub — implement per plan"}
