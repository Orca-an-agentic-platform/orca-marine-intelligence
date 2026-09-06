"""marketplace API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="marketplace root")
async def marketplace_root():
    return {"module": "marketplace", "status": "stub — implement per plan"}
