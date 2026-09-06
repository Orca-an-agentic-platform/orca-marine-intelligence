"""weather API routes — stub, expand per implementation plan."""
from fastapi import APIRouter
router = APIRouter()

@router.get("/", summary="weather root")
async def weather_root():
    return {"module": "weather", "status": "stub — implement per plan"}
