from __future__ import annotations

"""Schwab API client — OAuth 2.0 auth + options chain fetching."""

import base64
from datetime import datetime, timedelta, timezone
import httpx
import logging

logger = logging.getLogger(__name__)

SCHWAB_AUTH_URL = "https://api.schwabapi.com/v1/oauth/authorize"
SCHWAB_TOKEN_URL = "https://api.schwabapi.com/v1/oauth/token"
SCHWAB_CHAINS_URL = "https://api.schwabapi.com/marketdata/v1/chains"
DEFAULT_REDIRECT_URI = "https://127.0.0.1"

# Schwab uses $ prefix for index symbols
SYMBOL_MAP = {
    "SPX": "$SPX",
    "NDX": "$NDX",
    "RUT": "$RUT",
    "DJX": "$DJX",
    "VIX": "$VIX",
}


REAUTH_HINT = "Re-authorize with: cd backend && python -m app.auth_flow"


class SchwabAuthError(RuntimeError):
    """Refresh token is missing, invalid, or expired — a new OAuth login is required."""


class SchwabClient:
    def __init__(self, app_key: str, app_secret: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self.access_token: str | None = None
        self.refresh_token: str | None = None

    def _auth_header(self) -> str:
        """Base64-encoded client_id:client_secret for token requests."""
        creds = f"{self.app_key}:{self.app_secret}"
        return base64.b64encode(creds.encode()).decode()

    def get_auth_url(self, redirect_uri: str = DEFAULT_REDIRECT_URI) -> str:
        return (
            f"{SCHWAB_AUTH_URL}"
            f"?client_id={self.app_key}"
            f"&redirect_uri={redirect_uri}"
            f"&response_type=code"
        )

    async def exchange_code(self, code: str, redirect_uri: str = DEFAULT_REDIRECT_URI) -> dict:
        """Exchange authorization code for access + refresh tokens."""
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                SCHWAB_TOKEN_URL,
                headers={
                    "Authorization": f"Basic {self._auth_header()}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "authorization_code",
                    "code": code,
                    "redirect_uri": redirect_uri,
                },
            )
            resp.raise_for_status()
            tokens = resp.json()
            self.access_token = tokens["access_token"]
            self.refresh_token = tokens.get("refresh_token")
            return tokens

    async def refresh_access_token(self) -> dict:
        """Refresh the access token using the refresh token."""
        if not self.refresh_token:
            raise SchwabAuthError(f"No Schwab refresh token available. {REAUTH_HINT}")

        async with httpx.AsyncClient() as client:
            resp = await client.post(
                SCHWAB_TOKEN_URL,
                headers={
                    "Authorization": f"Basic {self._auth_header()}",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self.refresh_token,
                },
            )
            if resp.status_code in (400, 401):
                # Schwab returns invalid_grant once the 7-day refresh token lapses
                raise SchwabAuthError(
                    f"Schwab refresh token is invalid or expired (they last 7 days). {REAUTH_HINT}"
                )
            resp.raise_for_status()
            tokens = resp.json()
            self.access_token = tokens["access_token"]
            if "refresh_token" in tokens:
                self.refresh_token = tokens["refresh_token"]
            return tokens

    def _build_chain_params(self, symbol: str) -> dict:
        """Build query params, limiting payload size for index symbols."""
        schwab_symbol = SYMBOL_MAP.get(symbol.upper(), symbol)
        is_index = symbol.upper() in SYMBOL_MAP

        # Limit expirations to 45 days out to avoid massive payloads
        to_date = (datetime.now(timezone.utc) + timedelta(days=45)).strftime("%Y-%m-%d")

        return {
            "symbol": schwab_symbol,
            "contractType": "ALL",
            "strikeCount": 40 if is_index else 80,
            "includeUnderlyingQuote": "true",
            "strategy": "SINGLE",
            "toDate": to_date,
        }

    async def get_options_chain(self, symbol: str) -> dict:
        """Fetch options chain data from Schwab API."""
        if not self.access_token:
            raise RuntimeError("Not authenticated. Run OAuth flow first.")

        params = self._build_chain_params(symbol)

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(
                SCHWAB_CHAINS_URL,
                params=params,
                headers={"Authorization": f"Bearer {self.access_token}"},
            )
            if resp.status_code == 401:
                logger.info("Access token expired, refreshing...")
                await self.refresh_access_token()
                resp = await client.get(
                    SCHWAB_CHAINS_URL,
                    params=params,
                    headers={"Authorization": f"Bearer {self.access_token}"},
                )
            resp.raise_for_status()
            return resp.json()
