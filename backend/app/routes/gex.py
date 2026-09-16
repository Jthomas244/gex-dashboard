import logging
from fastapi import APIRouter, HTTPException, Query
from httpx import HTTPStatusError
from ..config import get_settings
from ..services.data_provider import create_data_provider
from ..services.schwab_client import SchwabAuthError
from ..services.gex_calculator import compute_gex
from ..models.gex import GexResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/api/gex/{symbol}", response_model=GexResponse)
async def get_gex(
    symbol: str,
    expiration_filter: str = Query(default="all", pattern="^(0dte|weekly|monthly|all)$"),
):
    settings = get_settings()

    try:
        provider = create_data_provider(settings.data_source)
    except SchwabAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    try:
        chain = await provider.get_options_chain(symbol.upper())
    except SchwabAuthError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"No data available for {symbol.upper()}")
    except HTTPStatusError as e:
        logger.error(f"Schwab API error: {e.response.status_code} — {e.response.text}")
        raise HTTPException(
            status_code=502,
            detail=f"Schwab API error: {e.response.status_code}"
        )
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    result = compute_gex(chain, expiration_filter)
    result.data_source = settings.data_source
    return result
