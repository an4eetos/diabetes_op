from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

INSECURE_JWT_SECRETS = frozenset(
    {
        "change-this-in-production",
        "local-dev-change-me",
        "replace-with-a-long-random-secret",
    }
)


def normalize_database_url(url: str) -> str:
    """Accept Supabase/Railway postgres:// URLs and coerce to SQLAlchemy psycopg driver."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url.removeprefix("postgres://")
    if url.startswith("postgresql://") and "+psycopg" not in url:
        return "postgresql+psycopg://" + url.removeprefix("postgresql://")
    return url


class Settings(BaseSettings):
    app_name: str = "Остео Ангио Скан"
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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @field_validator("database_url", mode="before")
    @classmethod
    def coerce_database_url(cls, value: str) -> str:
        if isinstance(value, str):
            return normalize_database_url(value)
        return value

    @model_validator(mode="after")
    def validate_production_secrets(self) -> "Settings":
        if not self.is_production:
            return self
        if self.jwt_secret_key in INSECURE_JWT_SECRETS or len(self.jwt_secret_key) < 32:
            raise ValueError(
                "JWT_SECRET_KEY must be at least 32 characters and not a default placeholder in production"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()
