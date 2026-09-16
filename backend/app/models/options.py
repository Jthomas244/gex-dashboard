from pydantic import BaseModel


class OptionContract(BaseModel):
    strike: float
    expiration: str
    call_oi: int
    put_oi: int
    call_gamma: float
    put_gamma: float
    call_delta: float = 0.0
    put_delta: float = 0.0
    call_iv: float = 0.0
    put_iv: float = 0.0


class OptionsChain(BaseModel):
    symbol: str
    spot_price: float
    timestamp: str
    contracts: list[OptionContract]
