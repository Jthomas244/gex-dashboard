import pytest
from app.models.options import OptionsChain, OptionContract
from app.services.gex_calculator import compute_gex


def _make_chain(contracts: list[dict], spot: float = 100.0) -> OptionsChain:
    return OptionsChain(
        symbol="TEST",
        spot_price=spot,
        timestamp="2026-01-01T00:00:00Z",
        contracts=[OptionContract(
            strike=c["strike"],
            expiration=c.get("expiration", "2026-01-01"),
            call_oi=c["call_oi"],
            put_oi=c["put_oi"],
            call_gamma=c["call_gamma"],
            put_gamma=c["put_gamma"],
        ) for c in contracts],
    )


class TestGexMath:
    def test_single_strike_call_only(self):
        """call_gex = call_gamma * call_OI * 100 * spot"""
        chain = _make_chain([{
            "strike": 100, "call_oi": 1000, "put_oi": 0,
            "call_gamma": 0.05, "put_gamma": 0.0,
        }], spot=100.0)
        result = compute_gex(chain)
        assert len(result.strikes) == 1
        s = result.strikes[0]
        # 0.05 * 1000 * 100 * 100 = 500,000
        assert s.call_gex == 500_000.0
        assert s.put_gex == 0.0
        assert s.net_gex == 500_000.0

    def test_single_strike_put_only(self):
        """put_gex = put_gamma * put_OI * 100 * spot * (-1)"""
        chain = _make_chain([{
            "strike": 100, "call_oi": 0, "put_oi": 2000,
            "call_gamma": 0.0, "put_gamma": 0.04,
        }], spot=100.0)
        result = compute_gex(chain)
        s = result.strikes[0]
        # 0.04 * 2000 * 100 * 100 * (-1) = -800,000
        assert s.put_gex == -800_000.0
        assert s.net_gex == -800_000.0

    def test_net_gex_calculation(self):
        chain = _make_chain([{
            "strike": 100, "call_oi": 1000, "put_oi": 1500,
            "call_gamma": 0.05, "put_gamma": 0.04,
        }], spot=100.0)
        result = compute_gex(chain)
        s = result.strikes[0]
        assert s.call_gex == 500_000.0
        assert s.put_gex == -600_000.0
        assert s.net_gex == -100_000.0

    def test_total_gex_sums_all_strikes(self):
        chain = _make_chain([
            {"strike": 95, "call_oi": 500, "put_oi": 2000,
             "call_gamma": 0.02, "put_gamma": 0.03},
            {"strike": 100, "call_oi": 3000, "put_oi": 1000,
             "call_gamma": 0.05, "put_gamma": 0.05},
            {"strike": 105, "call_oi": 2000, "put_oi": 500,
             "call_gamma": 0.02, "put_gamma": 0.01},
        ], spot=100.0)
        result = compute_gex(chain)
        expected_total = sum(s.net_gex for s in result.strikes)
        assert result.total_gex == expected_total

    def test_spot_normalizes_to_dollar_gamma(self):
        chain_low = _make_chain([{
            "strike": 50, "call_oi": 1000, "put_oi": 0,
            "call_gamma": 0.05, "put_gamma": 0.0,
        }], spot=50.0)
        chain_high = _make_chain([{
            "strike": 200, "call_oi": 1000, "put_oi": 0,
            "call_gamma": 0.05, "put_gamma": 0.0,
        }], spot=200.0)
        r_low = compute_gex(chain_low)
        r_high = compute_gex(chain_high)
        # Same gamma/OI but 4x the spot → 4x the GEX
        assert r_high.strikes[0].call_gex == r_low.strikes[0].call_gex * 4


class TestRegime:
    def test_positive_regime_when_spot_above_flip(self):
        # Heavy call GEX at 105 (positive), heavy put GEX at 95 (negative)
        # Flip should be between 95 and 105, spot at 100 should be above
        chain = _make_chain([
            {"strike": 95, "call_oi": 100, "put_oi": 5000,
             "call_gamma": 0.01, "put_gamma": 0.04},
            {"strike": 105, "call_oi": 5000, "put_oi": 100,
             "call_gamma": 0.04, "put_gamma": 0.01},
        ], spot=106.0)
        result = compute_gex(chain)
        assert result.regime.type == "positive"

    def test_negative_regime_when_spot_below_flip(self):
        chain = _make_chain([
            {"strike": 95, "call_oi": 100, "put_oi": 5000,
             "call_gamma": 0.01, "put_gamma": 0.04},
            {"strike": 105, "call_oi": 5000, "put_oi": 100,
             "call_gamma": 0.04, "put_gamma": 0.01},
        ], spot=90.0)
        result = compute_gex(chain)
        assert result.regime.type == "negative"


class TestKeyLevels:
    def test_identifies_highest_positive_and_negative(self):
        chain = _make_chain([
            {"strike": 90, "call_oi": 100, "put_oi": 3000,
             "call_gamma": 0.01, "put_gamma": 0.05},
            {"strike": 100, "call_oi": 5000, "put_oi": 500,
             "call_gamma": 0.06, "put_gamma": 0.06},
            {"strike": 110, "call_oi": 1000, "put_oi": 100,
             "call_gamma": 0.02, "put_gamma": 0.01},
        ], spot=100.0)
        result = compute_gex(chain)
        assert result.key_levels.highest_positive_gex.strike == 100
        assert result.key_levels.highest_negative_gex.strike == 90


class TestExpirationFilter:
    def test_filter_0dte(self):
        chain = _make_chain([
            {"strike": 100, "call_oi": 1000, "put_oi": 500,
             "call_gamma": 0.05, "put_gamma": 0.04, "expiration": "2026-01-01"},
            {"strike": 100, "call_oi": 2000, "put_oi": 1000,
             "call_gamma": 0.03, "put_gamma": 0.02, "expiration": "2026-01-08"},
        ])
        result_all = compute_gex(chain, "all")
        result_0dte = compute_gex(chain, "0dte")
        # 0DTE should have less total GEX since it excludes the weekly
        assert abs(result_0dte.total_gex) < abs(result_all.total_gex)

    def test_aggregates_across_expirations(self):
        chain = _make_chain([
            {"strike": 100, "call_oi": 1000, "put_oi": 0,
             "call_gamma": 0.05, "put_gamma": 0.0, "expiration": "2026-01-01"},
            {"strike": 100, "call_oi": 1000, "put_oi": 0,
             "call_gamma": 0.05, "put_gamma": 0.0, "expiration": "2026-01-08"},
        ])
        result = compute_gex(chain, "all")
        # Should aggregate: 2 * (0.05 * 1000 * 100 * 100) = 1,000,000
        assert result.strikes[0].call_gex == 1_000_000.0
