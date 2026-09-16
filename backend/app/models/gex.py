from pydantic import BaseModel


class StrikeGex(BaseModel):
    strike: float
    call_gex: float
    put_gex: float
    net_gex: float
    call_oi: int
    put_oi: int
    call_gamma: float
    put_gamma: float


class KeyLevel(BaseModel):
    strike: float
    gex: float = 0.0
    interpretation: str


class Regime(BaseModel):
    type: str  # "positive" or "negative"
    description: str


class KeyLevels(BaseModel):
    highest_positive_gex: KeyLevel
    highest_negative_gex: KeyLevel
    flip_point: KeyLevel


class GexResponse(BaseModel):
    symbol: str
    spot_price: float
    timestamp: str
    data_source: str
    regime: Regime
    flip_point: float
    total_gex: float
    key_levels: KeyLevels
    strikes: list[StrikeGex]
