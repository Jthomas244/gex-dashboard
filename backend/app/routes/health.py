from fastapi import APIRouter
from ..config import get_settings

router = APIRouter()


@router.get("/api/health")
async def health_check():
    settings = get_settings()
    return {"status": "ok", "data_source": settings.data_source}
