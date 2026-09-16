import pytest
from fastapi.testclient import TestClient
from app.main import app


client = TestClient(app)


class TestHealthEndpoint:
    def test_health_returns_ok(self):
        resp = client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "ok"
        assert "data_source" in data


class TestGexEndpoint:
    def test_get_spy_gex(self):
        resp = client.get("/api/gex/SPY")
        assert resp.status_code == 200
        data = resp.json()
        assert data["symbol"] == "SPY"
        assert "spot_price" in data
        assert "regime" in data
        assert "strikes" in data
        assert len(data["strikes"]) > 0

    def test_case_insensitive_symbol(self):
        resp = client.get("/api/gex/spy")
        assert resp.status_code == 200
        assert resp.json()["symbol"] == "SPY"

    def test_expiration_filter_0dte(self):
        resp = client.get("/api/gex/SPY?expiration_filter=0dte")
        assert resp.status_code == 200

    def test_invalid_filter_rejected(self):
        resp = client.get("/api/gex/SPY?expiration_filter=invalid")
        assert resp.status_code == 422

    def test_gex_response_structure(self):
        resp = client.get("/api/gex/SPY")
        data = resp.json()
        assert "flip_point" in data
        assert "total_gex" in data
        assert "key_levels" in data
        kl = data["key_levels"]
        assert "highest_positive_gex" in kl
        assert "highest_negative_gex" in kl
        assert "flip_point" in kl

    def test_strike_data_structure(self):
        resp = client.get("/api/gex/SPY")
        strike = resp.json()["strikes"][0]
        for field in ["strike", "call_gex", "put_gex", "net_gex", "call_oi", "put_oi"]:
            assert field in strike
