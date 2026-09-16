from __future__ import annotations

import json
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from pathlib import Path

from ..models.options import OptionsChain, OptionContract
from .schwab_client import SchwabClient, SchwabAuthError, REAUTH_HINT

logger = logging.getLogger(__name__)


class DataProvider(ABC):
    @abstractmethod
    async def get_options_chain(self, symbol: str) -> OptionsChain:
        """Returns options chain from either live API or static data."""
        pass


class SampleDataProvider(DataProvider):
    """Static sample data for development."""

    def __init__(self):
        data_dir = Path(__file__).parent.parent / "data"
        self._data_files = {
            "SPY": data_dir / "sample_chain.json",
        }

    async def get_options_chain(self, symbol: str) -> OptionsChain:
        symbol = symbol.upper()
        data_file = self._data_files.get(symbol)

        if not data_file or not data_file.exists():
            data_file = self._data_files["SPY"]
            if not data_file.exists():
                raise FileNotFoundError(f"Sample data file not found: {data_file}")

        with open(data_file) as f:
            raw = json.load(f)

        contracts = [OptionContract(**c) for c in raw["contracts"]]
        return OptionsChain(
            symbol=raw.get("symbol", symbol),
            spot_price=raw["spot_price"],
            timestamp=raw["timestamp"],
            contracts=contracts,
        )


class SchwabDataProvider(DataProvider):
    """Live data from Schwab API."""

    def __init__(self, client: SchwabClient):
        self._client = client

    async def get_options_chain(self, symbol: str) -> OptionsChain:
        symbol = symbol.upper()
        raw = await self._client.get_options_chain(symbol)
        return self._parse_chain(symbol, raw)

    def _parse_chain(self, symbol: str, raw: dict) -> OptionsChain:
        """Parse Schwab API response into our OptionsChain model.

        Schwab returns options grouped by expiration date, then by strike.
        Structure:
          callExpDateMap: { "2026-03-14:5": { "590.0": [contract], ... }, ... }
          putExpDateMap:  { "2026-03-14:5": { "590.0": [contract], ... }, ... }
          underlyingPrice: 590.45
        """
        spot = raw.get("underlyingPrice") or raw.get("underlying", {}).get("last", 0)
        timestamp = datetime.now(timezone.utc).isoformat()

        call_map = raw.get("callExpDateMap", {})
        put_map = raw.get("putExpDateMap", {})

        # Schwab keeps same-day contracts in the chain after the 4pm ET close
        # with stale OI/greeks. Drop any expiration whose settlement time has passed.
        now = datetime.now(timezone.utc)
        call_map = {k: v for k, v in call_map.items() if not _is_expired(v, now)}
        put_map = {k: v for k, v in put_map.items() if not _is_expired(v, now)}

        # Build a lookup: (expiration, strike) -> {call_data, put_data}
        merged: dict[tuple[str, float], dict] = {}

        for exp_key, strikes_data in call_map.items():
            exp_date = exp_key.split(":")[0]  # "2026-03-14:5" -> "2026-03-14"
            for strike_str, contracts in strikes_data.items():
                strike = float(strike_str)
                c = contracts[0]  # First contract at this strike
                key = (exp_date, strike)
                if key not in merged:
                    merged[key] = {}
                merged[key]["call_oi"] = c.get("openInterest", 0)
                merged[key]["call_gamma"] = c.get("gamma", 0.0)
                merged[key]["call_delta"] = c.get("delta", 0.0)
                merged[key]["call_iv"] = c.get("volatility", 0.0) / 100  # Schwab returns as pct

        for exp_key, strikes_data in put_map.items():
            exp_date = exp_key.split(":")[0]
            for strike_str, contracts in strikes_data.items():
                strike = float(strike_str)
                c = contracts[0]
                key = (exp_date, strike)
                if key not in merged:
                    merged[key] = {}
                merged[key]["put_oi"] = c.get("openInterest", 0)
                merged[key]["put_gamma"] = abs(c.get("gamma", 0.0))  # Put gamma from API can be negative
                merged[key]["put_delta"] = c.get("delta", 0.0)
                merged[key]["put_iv"] = c.get("volatility", 0.0) / 100

        contracts = []
        for (exp_date, strike), data in sorted(merged.items()):
            contracts.append(OptionContract(
                strike=strike,
                expiration=exp_date,
                call_oi=data.get("call_oi", 0),
                put_oi=data.get("put_oi", 0),
                call_gamma=data.get("call_gamma", 0.0),
                put_gamma=data.get("put_gamma", 0.0),
                call_delta=data.get("call_delta", 0.0),
                put_delta=data.get("put_delta", 0.0),
                call_iv=data.get("call_iv", 0.0),
                put_iv=data.get("put_iv", 0.0),
            ))

        logger.info(f"Parsed {len(contracts)} contracts for {symbol} at spot ${spot:.2f}")

        # Schwab's chain endpoint reports openInterest=0 for index options (e.g. $SPX),
        # so GEX would be identically zero. Fail loudly rather than render a fake profile.
        if contracts and not any(c.call_oi or c.put_oi for c in contracts):
            raise ValueError(
                f"Schwab returned zero open interest for every {symbol} contract, so GEX "
                f"cannot be computed. Schwab does not supply OI for index options — "
                f"use the ETF proxy instead (SPY for SPX, QQQ for NDX, IWM for RUT)."
            )

        return OptionsChain(
            symbol=symbol,
            spot_price=spot,
            timestamp=timestamp,
            contracts=contracts,
        )


def _is_expired(strikes_data: dict, now: datetime) -> bool:
    """True if this expiration's contracts have already settled."""
    for contracts in strikes_data.values():
        exp = contracts[0].get("expirationDate") if contracts else None
        if not exp:
            return False
        try:
            return datetime.fromisoformat(exp.replace("Z", "+00:00")) <= now
        except ValueError:
            return False
    return False


# Singleton client instance for the app lifetime
_schwab_client: SchwabClient | None = None


def create_data_provider(data_source: str) -> DataProvider:
    global _schwab_client

    if data_source == "sample":
        return SampleDataProvider()
    elif data_source == "schwab":
        if _schwab_client is None:
            from ..config import get_settings
            settings = get_settings()
            if not settings.schwab_app_key or not settings.schwab_app_secret:
                raise RuntimeError("SCHWAB_APP_KEY and SCHWAB_APP_SECRET required for live data")
            _schwab_client = SchwabClient(settings.schwab_app_key, settings.schwab_app_secret)
            _schwab_client.access_token = settings.schwab_access_token or None
            _schwab_client.refresh_token = settings.schwab_refresh_token or None
            if not _schwab_client.refresh_token:
                raise SchwabAuthError(f"No Schwab tokens set. {REAUTH_HINT}")
        return SchwabDataProvider(_schwab_client)
    else:
        raise ValueError(f"Unknown data source: {data_source}")
