import numpy as np
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo
from ..models.options import OptionsChain
from ..models.gex import StrikeGex, GexResponse, Regime, KeyLevels, KeyLevel


def compute_gex(chain: OptionsChain, expiration_filter: str = "all") -> GexResponse:
    """Compute Gamma Exposure (GEX) from an options chain.

    For each strike:
      call_gex = call_gamma * call_OI * 100 * spot_price
      put_gex  = put_gamma  * put_OI  * 100 * spot_price * (-1)
      net_gex  = call_gex + put_gex
    """
    spot = chain.spot_price
    contracts = chain.contracts

    if expiration_filter != "all":
        contracts = _filter_expirations(contracts, expiration_filter)

    # Aggregate by strike across expirations
    strike_map: dict[float, dict] = {}
    for c in contracts:
        k = c.strike
        if k not in strike_map:
            strike_map[k] = {
                "call_oi": 0, "put_oi": 0,
                "call_gamma_sum": 0.0, "put_gamma_sum": 0.0,
                "call_gex": 0.0, "put_gex": 0.0,
            }
        entry = strike_map[k]
        c_gex = c.call_gamma * c.call_oi * 100 * spot
        p_gex = c.put_gamma * c.put_oi * 100 * spot * (-1)

        entry["call_oi"] += c.call_oi
        entry["put_oi"] += c.put_oi
        entry["call_gamma_sum"] += c.call_gamma
        entry["put_gamma_sum"] += c.put_gamma
        entry["call_gex"] += c_gex
        entry["put_gex"] += p_gex

    strikes_data: list[StrikeGex] = []
    for strike in sorted(strike_map.keys()):
        e = strike_map[strike]
        net = e["call_gex"] + e["put_gex"]
        strikes_data.append(StrikeGex(
            strike=strike,
            call_gex=round(e["call_gex"], 2),
            put_gex=round(e["put_gex"], 2),
            net_gex=round(net, 2),
            call_oi=e["call_oi"],
            put_oi=e["put_oi"],
            call_gamma=round(e["call_gamma_sum"], 6),
            put_gamma=round(e["put_gamma_sum"], 6),
        ))

    total_gex = sum(s.net_gex for s in strikes_data)

    # Find flip point: strike where cumulative GEX crosses zero (scanning low to high)
    flip_strike = _find_flip_point(strikes_data, spot)

    # Key levels
    max_pos = max(strikes_data, key=lambda s: s.net_gex)
    max_neg = min(strikes_data, key=lambda s: s.net_gex)

    # Regime
    if spot >= flip_strike:
        regime = Regime(
            type="positive",
            description=(
                f"Dealers are long gamma. Expect mean-reversion and lower volatility. "
                f"Price tends to pin near high-GEX strikes."
            ),
        )
    else:
        regime = Regime(
            type="negative",
            description=(
                f"Dealers are short gamma. Expect trending moves and elevated volatility."
            ),
        )

    key_levels = KeyLevels(
        highest_positive_gex=KeyLevel(
            strike=max_pos.strike,
            gex=max_pos.net_gex,
            interpretation="Strong dealer magnet / support",
        ),
        highest_negative_gex=KeyLevel(
            strike=max_neg.strike,
            gex=max_neg.net_gex,
            interpretation="Potential acceleration zone",
        ),
        flip_point=KeyLevel(
            strike=flip_strike,
            interpretation="Regime boundary — above = positive gamma, below = negative gamma",
        ),
    )

    return GexResponse(
        symbol=chain.symbol,
        spot_price=spot,
        timestamp=chain.timestamp,
        data_source="sample",
        regime=regime,
        flip_point=flip_strike,
        total_gex=round(total_gex, 2),
        key_levels=key_levels,
        strikes=strikes_data,
    )


def _find_flip_point(strikes: list[StrikeGex], spot: float) -> float:
    """Find the gamma flip point.

    Primary: the strike where cumulative GEX (scanned low to high) crosses from
    negative to positive. This only exists when total GEX is positive.

    Fallback: when the cumulative sum never crosses (net-negative chain), use the
    per-strike sign change nearest to spot — the boundary between the put-dominated
    zone below and the call-dominated zone above.
    """
    if not strikes:
        return 0.0

    cumulative = 0.0
    prev_strike = strikes[0].strike
    prev_cum = 0.0

    for s in strikes:
        cumulative += s.net_gex
        if prev_cum <= 0 and cumulative > 0:
            # Crossed zero — interpolate
            if cumulative - prev_cum != 0:
                frac = -prev_cum / (cumulative - prev_cum)
                return round(prev_strike + frac * (s.strike - prev_strike), 1)
            return s.strike
        prev_cum = cumulative
        prev_strike = s.strike

    # No cumulative crossing: find per-strike sign changes and pick the one nearest spot
    best: float | None = None
    best_dist = float("inf")
    for a, b in zip(strikes, strikes[1:]):
        if a.net_gex == 0 or b.net_gex == 0 or (a.net_gex < 0) == (b.net_gex < 0):
            continue
        frac = -a.net_gex / (b.net_gex - a.net_gex)
        crossing = a.strike + frac * (b.strike - a.strike)
        dist = abs(crossing - spot)
        if dist < best_dist:
            best, best_dist = crossing, dist
    if best is not None:
        return round(best, 1)

    # No sign change anywhere: return strike with net_gex closest to zero
    return min(strikes, key=lambda s: abs(s.net_gex)).strike


def _filter_expirations(contracts, expiration_filter: str):
    """Filter contracts by expiration window (dates are YYYY-MM-DD, US market days).

      0dte    — the nearest unexpired expiration (today's during the session)
      weekly  — every expiration within the next 7 calendar days
      monthly — the nearest standard monthly expiration (3rd Friday of the month)
    """
    if not contracts:
        return contracts

    expirations = sorted(set(c.expiration for c in contracts))
    today = datetime.now(ZoneInfo("America/New_York")).date()

    if expiration_filter == "0dte":
        target = expirations[0]
        return [c for c in contracts if c.expiration == target]
    elif expiration_filter == "weekly":
        cutoff = (today + timedelta(days=7)).isoformat()
        targets = {e for e in expirations if e <= cutoff}
        return [c for c in contracts if c.expiration in targets]
    elif expiration_filter == "monthly":
        monthlies = [e for e in expirations if _is_third_friday(e)]
        target = monthlies[0] if monthlies else expirations[-1]
        return [c for c in contracts if c.expiration == target]
    return contracts


def _is_third_friday(iso_date: str) -> bool:
    d = date.fromisoformat(iso_date)
    return d.weekday() == 4 and 15 <= d.day <= 21
