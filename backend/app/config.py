from __future__ import annotations
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    data_source: str = "sample"
    schwab_app_key: str = ""
    schwab_app_secret: str = ""
    schwab_access_token: str = ""
    schwab_refresh_token: str = ""
    schwab_token_issued_at: str = ""  # ISO timestamp written by auth_flow; refresh tokens last 7 days
    anthropic_api_key: str = ""
    cors_origins: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]

    model_config = {"env_file": ".env.local", "env_file_encoding": "utf-8"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
