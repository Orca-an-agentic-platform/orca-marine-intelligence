"""advisory API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="advisory root")
async def advisory_root():
    return {"module": "advisory", "status": "stub — implement per plan"}
