import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from anthropic import Anthropic
from ..config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter()


def _text_of(response) -> str:
    """Join the text blocks; adaptive thinking puts a thinking block first."""
    return "".join(b.text for b in response.content if b.type == "text").strip()


class CurrentData(BaseModel):
    symbol: str
    spot_price: float
    regime: str
    flip_point: float
    highest_positive_gex: dict
    highest_negative_gex: dict


class ScenarioRequest(BaseModel):
    question: str
    current_data: CurrentData


class ScenarioResponse(BaseModel):
    answer: str


SYSTEM_PROMPT = """You are a market structure educator helping someone understand gamma exposure dynamics through hypothetical scenarios. You've been given the current GEX data and a "what if" question.

RULES:
- Answer the specific scenario question using the actual data provided.
- Explain the MECHANICS — what would dealers do, why, and what effect that has on price behavior.
- Walk through cause and effect step by step. Example: "If price drops to X → dealers who are short gamma need to sell to hedge → that selling pushes price lower → which forces more selling → creating a cascade effect."
- Use the actual strike prices and GEX values from the data when relevant.
- Keep answers to 2-3 paragraphs max. Be concise and clear.
- PLAIN TEXT ONLY. No markdown: no headings (#), no bold (**), no bullet lists. Separate paragraphs with a blank line.
- NEVER give trade recommendations. Frame everything as "here's how the mechanics work" not "here's what you should do."
- If the question is unrelated to GEX or market structure, politely redirect: "That's outside the scope of GEX analysis, but here's what I can tell you about how dealer positioning would affect that scenario..."
- End with a brief note about what to watch for — what signals would confirm or invalidate the scenario."""


@router.post("/api/scenario", response_model=ScenarioResponse)
async def explore_scenario(req: ScenarioRequest):
    settings = get_settings()
    if not settings.anthropic_api_key:
        raise HTTPException(status_code=503, detail="Anthropic API key not configured")

    d = req.current_data
    user_message = f"""Current GEX data for {d.symbol}:
- Spot Price: ${d.spot_price:.2f}
- Regime: {d.regime} gamma
- Flip Point: ${d.flip_point:.0f}
- Highest +GEX: Strike ${d.highest_positive_gex.get('strike', 'N/A')} (GEX: ${d.highest_positive_gex.get('gex', 0):,.0f})
- Highest -GEX: Strike ${d.highest_negative_gex.get('strike', 'N/A')} (GEX: ${d.highest_negative_gex.get('gex', 0):,.0f})

User's question: {req.question}"""

    try:
        client = Anthropic(api_key=settings.anthropic_api_key)
        response = client.messages.create(
            model="claude-sonnet-5",
            max_tokens=1000,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
            # SDK 0.52 predates output_config; pass it raw. Low effort — short explanatory prose.
            extra_body={"output_config": {"effort": "low"}},
        )
        return ScenarioResponse(answer=_text_of(response))
    except Exception as e:
        logger.error(f"Anthropic API error: {e}")
        raise HTTPException(status_code=502, detail=f"LLM service error: {str(e)}")
