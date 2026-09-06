"""knowledge API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="knowledge root")
async def knowledge_root():
    return {"module": "knowledge", "status": "stub — implement per plan"}
