"""marine API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="marine root")
async def marine_root():
    return {"module": "marine", "status": "stub — implement per plan"}
