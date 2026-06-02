from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "OsteoRisk-AI"
    environment: str = "local"
    api_v1_prefix: str = "/api/v1"

    database_url: str = "postgresql+psycopg://medical:medical@db:5432/medical"

    jwt_secret_key: str = Field(default="change-this-in-production")
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    cors_origins: list[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    risk_rules_path: Path = Path(__file__).resolve().parents[1] / "risk_engine" / "rules.json"
    pdf_template_dir: Path = Path(__file__).resolve().parents[1] / "templates" / "pdf"
    osteorisk_model_type: str = "mock"
    osteorisk_model_version: str = "mock-osteorisk-v1"
    osteorisk_model_path: Path | None = None

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
