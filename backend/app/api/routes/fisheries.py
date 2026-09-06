"""fisheries API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="fisheries root")
async def fisheries_root():
    return {"module": "fisheries", "status": "stub — implement per plan"}
