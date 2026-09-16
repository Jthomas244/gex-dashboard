"""CLI OAuth flow for Schwab API authentication.

Usage:
    cd backend
    source .venv/bin/activate
    python -m app.auth_flow

This will:
1. Print the Schwab authorization URL — open it in your browser
2. Log in to your Schwab account and authorize the app
3. You'll be redirected to https://127.0.0.1 (which won't load — that's fine)
4. Copy the FULL URL from your browser's address bar and paste it here
5. The script extracts the auth code and exchanges it for tokens
6. Tokens are saved to backend/.env.local

Schwab refresh tokens are valid for 7 days; the dashboard shows a warning
when one is about to expire. Re-run this script to get a fresh one.
"""

import asyncio
import re
import sys
import webbrowser
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, parse_qs

import httpx

from .config import get_settings
from .services.schwab_client import SchwabClient, DEFAULT_REDIRECT_URI


def update_env_file(key: str, value: str):
    """Update a key in .env.local, preserving other values."""
    env_path = Path(__file__).parent.parent / ".env.local"
    lines = []
    found = False

    if env_path.exists():
        with open(env_path) as f:
            for line in f:
                if line.startswith(f"{key}="):
                    lines.append(f"{key}={value}\n")
                    found = True
                else:
                    lines.append(line)

    if not found:
        lines.append(f"{key}={value}\n")

    with open(env_path, "w") as f:
        f.writelines(lines)


async def run_auth_flow():
    settings = get_settings()

    if not settings.schwab_app_key or settings.schwab_app_key == "your_app_key_here":
        print("ERROR: Set your SCHWAB_APP_KEY in backend/.env.local first.")
        sys.exit(1)
    if not settings.schwab_app_secret or settings.schwab_app_secret == "your_app_secret_here":
        print("ERROR: Set your SCHWAB_APP_SECRET in backend/.env.local first.")
        sys.exit(1)

    client = SchwabClient(settings.schwab_app_key, settings.schwab_app_secret)

    auth_url = client.get_auth_url(DEFAULT_REDIRECT_URI)

    print("\n" + "=" * 60)
    print("  SCHWAB API — OAuth Authorization Flow")
    print("=" * 60)
    print()
    print("Step 1: Log in at this URL (opening it in your browser):\n")
    print(f"  {auth_url}")
    print()
    webbrowser.open(auth_url)
    print("Step 2: Log in to your Schwab account and click 'Allow'.")
    print()
    print("Step 3: You'll be redirected to a page that won't load.")
    print("        That's expected! Copy the FULL URL from your")
    print("        browser's address bar.")
    print()

    print("        Auth codes expire in ~30 seconds — paste promptly.")
    print()
    callback_url = input("Step 4: Paste the callback URL here:\n> ").strip()

    # Extract the authorization code from the callback URL
    parsed = urlparse(callback_url)
    params = parse_qs(parsed.query)
    code = params.get("code", [None])[0]

    if not code:
        # Some redirects put the code in the fragment or path
        # Try regex as fallback
        match = re.search(r"code=([^&]+)", callback_url)
        if match:
            code = match.group(1)

    if not code:
        print("\nERROR: Could not find authorization code in the URL.")
        print("Make sure you copied the full URL including the ?code=... part.")
        sys.exit(1)

    print(f"\nAuthorization code received. Exchanging for tokens...")

    try:
        tokens = await client.exchange_code(code, DEFAULT_REDIRECT_URI)
    except httpx.HTTPStatusError as e:
        print(f"\nERROR: Token exchange failed: {e.response.status_code} {e.response.text}")
        print("Auth codes are single-use and expire in ~30s — re-run and paste a fresh URL.")
        sys.exit(1)
    except Exception as e:
        print(f"\nERROR: Token exchange failed: {e}")
        sys.exit(1)

    access_token = tokens.get("access_token", "")
    refresh_token = tokens.get("refresh_token", "")
    expires_in = tokens.get("expires_in", "unknown")

    # Save tokens to .env.local
    update_env_file("SCHWAB_ACCESS_TOKEN", access_token)
    update_env_file("SCHWAB_REFRESH_TOKEN", refresh_token)
    update_env_file("SCHWAB_TOKEN_ISSUED_AT", datetime.now(timezone.utc).isoformat(timespec="seconds"))
    update_env_file("DATA_SOURCE", "schwab")

    print("\n" + "=" * 60)
    print("  SUCCESS — Tokens saved to backend/.env.local")
    print("=" * 60)
    print(f"\n  Access token expires in: {expires_in} seconds")
    print(f"  Refresh token: {'received — valid 7 days' if refresh_token else 'not provided'}")
    print(f"  DATA_SOURCE set to: schwab")
    print(f"\n  Restart the backend to use live data:")
    print(f"  uvicorn app.main:app --reload")
    print()


def main():
    asyncio.run(run_auth_flow())


if __name__ == "__main__":
    main()
