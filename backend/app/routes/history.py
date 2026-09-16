import logging
from fastapi import APIRouter, HTTPException, Query
from httpx import HTTPStatusError
from pydantic import BaseModel
from ..config import get_settings
from ..services.data_provider import create_data_provider
from ..services.schwab_client import SchwabAuthError
from ..services.gex_calculator import compute_gex
from ..services.history_service import get_history_service

logger = logging.getLogger(__name__)
router = APIRouter()


class SnapshotResponse(BaseModel):
    saved: bool
    message: str


@router.post("/api/gex/{symbol}/snapshot", response_model=SnapshotResponse)
async def save_snapshot(symbol: str):
    """Save today's GEX profile as a historical snapshot."""
    settings = get_settings()
    try:
        provider = create_data_provider(settings.data_source)
        chain = await provider.get_options_chain(symbol.upper())
    except SchwabAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    gex_data = compute_gex(chain)
    gex_data.data_source = settings.data_source

    service = get_history_service()
    is_new = service.save_snapshot(symbol, gex_data)

    if is_new:
        return SnapshotResponse(saved=True, message=f"Snapshot saved for {symbol.upper()}")
    return SnapshotResponse(saved=False, message=f"Snapshot already exists for today")


@router.get("/api/gex/{symbol}/history")
async def get_history_dates(symbol: str):
    """List all available snapshot dates for a symbol."""
    service = get_history_service()
    dates = service.get_available_dates(symbol.upper())
    return {"symbol": symbol.upper(), "dates": dates}


@router.get("/api/gex/{symbol}/history/{snapshot_date}")
async def get_snapshot(symbol: str, snapshot_date: str):
    """Get a specific day's GEX snapshot."""
    service = get_history_service()
    snapshot = service.get_snapshot(symbol.upper(), snapshot_date)
    if not snapshot:
        raise HTTPException(status_code=404, detail=f"No snapshot for {symbol.upper()} on {snapshot_date}")
    return snapshot


@router.get("/api/gex/{symbol}/compare")
async def compare_gex(
    symbol: str,
    date: str = Query(..., description="Historical date to compare against (YYYY-MM-DD)"),
):
    """Compare current GEX data vs. a historical snapshot."""
    settings = get_settings()
    try:
        provider = create_data_provider(settings.data_source)
        chain = await provider.get_options_chain(symbol.upper())
    except SchwabAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

    current_data = compute_gex(chain)
    current_data.data_source = settings.data_source

    service = get_history_service()
    comparison = service.get_comparison(symbol.upper(), current_data, date)

    if not comparison:
        raise HTTPException(status_code=404, detail=f"No snapshot for {symbol.upper()} on {date}")

    return comparison
