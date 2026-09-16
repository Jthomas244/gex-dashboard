"""One-time Schwab OAuth flow. Run from backend/:

    .venv/bin/python scripts/schwab_auth.py

Opens the Schwab login URL, waits for you to paste the redirect URL you land on
(https://127.0.0.1/?code=...&session=...), exchanges the code, and writes the
new access + refresh tokens into .env.local. Refresh tokens last 7 days.
"""
import asyncio
import os
import re
import sys
import webbrowser
from pathlib import Path
from urllib.parse import parse_qs, unquote, urlparse

import httpx
from dotenv import load_dotenv

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.services.schwab_client import SchwabClient  # noqa: E402

ENV_PATH = Path(__file__).resolve().parents[1] / ".env.local"


def write_env(updates: dict[str, str]) -> None:
    text = ENV_PATH.read_text() if ENV_PATH.exists() else ""
    for key, val in updates.items():
        pattern = re.compile(rf"^{key}=.*$", re.MULTILINE)
        line = f"{key}={val}"
        text = pattern.sub(line, text) if pattern.search(text) else text.rstrip("\n") + f"\n{line}\n"
    ENV_PATH.write_text(text)


async def main() -> None:
    load_dotenv(ENV_PATH)
    app_key = os.environ.get("SCHWAB_APP_KEY", "")
    app_secret = os.environ.get("SCHWAB_APP_SECRET", "")
    if not app_key or not app_secret:
        sys.exit("SCHWAB_APP_KEY / SCHWAB_APP_SECRET missing from .env.local")

    client = SchwabClient(app_key, app_secret)
    url = client.get_auth_url()
    print("\n1. Log in to Schwab at this URL (opening in your browser):\n")
    print(f"   {url}\n")
    webbrowser.open(url)
    print("2. After approving, your browser will land on a https://127.0.0.1/... page")
    print("   that fails to load. Copy the FULL URL from the address bar.\n")
    redirect = input("3. Paste the redirect URL here: ").strip()

    code = parse_qs(urlparse(redirect).query).get("code", [None])[0]
    if not code:
        sys.exit("No ?code= found in that URL.")
    code = unquote(code)

    try:
        tokens = await client.exchange_code(code)
    except httpx.HTTPStatusError as e:
        sys.exit(
            f"Token exchange failed: {e.response.status_code} {e.response.text}\n"
            "Auth codes are single-use and expire in ~30s — re-run and paste promptly."
        )
    write_env(
        {
            "SCHWAB_ACCESS_TOKEN": tokens["access_token"],
            "SCHWAB_REFRESH_TOKEN": tokens["refresh_token"],
            "DATA_SOURCE": "schwab",
        }
    )
    print(f"\nTokens written to {ENV_PATH}. Restart the backend to use live data.")


if __name__ == "__main__":
    asyncio.run(main())
