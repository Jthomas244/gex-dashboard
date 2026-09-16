import logging
import time
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from anthropic import Anthropic
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _text_of(response) -> str:
    """Join the text blocks; adaptive thinking puts a thinking block first."""
    return "".join(b.text for b in response.content if b.type == "text").strip()

# Simple in-memory cache: key -> (timestamp, result)
_cache: dict[str, tuple[float, str]] = {}
CACHE_TTL = 300  # 5 minutes


class StrikeSummary(BaseModel):
    strike: float
    net_gex: float


class InterpretRequest(BaseModel):
    symbol: str
    spot_price: float
    regime: str
    flip_point: float
    total_gex: float
    highest_positive_gex: dict
    highest_negative_gex: dict
    distance_from_flip: float
    expiration_filter: str = "all"
    top_strikes: list[StrikeSummary] = []


class InterpretResponse(BaseModel):
    interpretation: str
    cached: bool = False


SYSTEM_PROMPT = """You are a market structure analyst specializing in gamma exposure (GEX) analysis. You interpret dealer positioning data and explain what it implies for price behavior in clear, educational language.

RULES:
- Output 3-4 paragraphs of plain-English analysis. No jargon without explanation.
- PLAIN TEXT ONLY. No markdown: no headings (#), no bold (**), no bullet lists. Separate paragraphs with a blank line. You may begin each paragraph with its section name followed by a colon (e.g. "Current State: ...").
- NEVER give specific trade recommendations, price targets, or financial advice.
- ALWAYS include the disclaimer that GEX is one analytical lens and should be combined with other analysis.
- Structure your response as:
  1. Current State: What the GEX profile is telling us right now
  2. Key Levels: Which strikes matter most and why
  3. Behavioral Expectation: How price is likely to BEHAVE (not where it will go) given current positioning
  4. Risk Awareness: What could change this picture (regime shift, expiration effects, etc.)
- Use analogies to make concepts accessible. Compare dealer hedging to a thermostat (positive gamma) or a feedback loop (negative gamma).
- Reference specific numbers from the data provided — don't be vague.
- Keep the tone professional but approachable. Think Bloomberg analyst explaining to a smart friend, not a textbook.
- If spot is very close to the flip point (within 0.5%), emphasize that a regime change could be imminent and explain what both scenarios look like."""


@router.post("/api/interpret", response_model=InterpretResponse)
async def interpret_gex(req: InterpretRequest):
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Anthropic API key not configured")

    # Check cache
    cache_key = f"{req.symbol}:{req.expiration_filter}:{req.regime}:{req.flip_point}"
    now = time.time()
    if cache_key in _cache:
        ts, result = _cache[cache_key]
        if now - ts < CACHE_TTL:
            return InterpretResponse(interpretation=result, cached=True)

    user_message = f"""Analyze this GEX data for {req.symbol}:

- Spot Price: ${req.spot_price:.2f}
- Regime: {req.regime} gamma
- Flip Point: ${req.flip_point:.0f}
- Distance from Flip: ${req.distance_from_flip:.2f} ({'above' if req.spot_price >= req.flip_point else 'below'})
- Total GEX: ${req.total_gex:,.0f}
- Highest +GEX: Strike ${req.highest_positive_gex.get('strike', 'N/A')} (GEX: ${req.highest_positive_gex.get('gex', 0):,.0f})
- Highest -GEX: Strike ${req.highest_negative_gex.get('strike', 'N/A')} (GEX: ${req.highest_negative_gex.get('gex', 0):,.0f})
- Expiration Filter: {req.expiration_filter}

Top strikes by GEX:
{chr(10).join(f"  ${s.strike:.0f}: {s.net_gex:,.0f}" for s in req.top_strikes)}"""

    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1500,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
            # SDK 0.52 predates output_config; pass it raw. Low effort — short explanatory prose.
            extra_body={"output_config": {"effort": "low"}},
        )
        interpretation = _text_of(response)
        _cache[cache_key] = (now, interpretation)
        return InterpretResponse(interpretation=interpretation)
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        raise HTTPException(status_code=502, detail=f"LLM service error: {str(e)}")
