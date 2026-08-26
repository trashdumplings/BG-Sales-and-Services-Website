import os
import secrets
from functools import lru_cache
from pathlib import Path
from typing import List
from urllib.parse import unquote, urlsplit

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from server/ or project root
load_dotenv()


def _secret_from_file(name: str, current: str) -> str:
    file_name = os.getenv(f"{name}_FILE")
    if current or not file_name:
        return current
    return Path(file_name).read_text(encoding="utf-8").strip()

class Settings(BaseSettings):
    # App
    APP_NAME: str = Field(default="BG Services Portal API")
    DEBUG: bool = Field(default=True)

    @field_validator("DEBUG", mode="before")
    @classmethod
    def parse_debug(cls, value):
        if isinstance(value, str):
            normalized = value.strip().lower()
            if normalized in {"release", "prod", "production", "false", "0", "no", "off"}:
                return False
            if normalized in {"debug", "dev", "development", "true", "1", "yes", "on"}:
                return True
        return value

    # Security
    JWT_SECRET: str = Field(default="change-me-in-prod")
    JWT_ALGORITHM: str = Field(default="HS256")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=15)
    REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7)
    REFRESH_TOKEN_REMEMBER_DAYS: int = Field(default=30)
    REFRESH_TOKEN_SESSION_HOURS: int = Field(default=8)
    SESSION_IDLE_TIMEOUT_MINUTES: int = Field(default=30)
    ALLOW_PUBLIC_REGISTRATION: bool = Field(default=True)
    TRUSTED_HOSTS: str = Field(default="localhost,127.0.0.1")
    ENFORCE_HTTPS: bool = Field(default=False)

    # Database
    DATABASE_URL: str = Field(default="postgresql+psycopg2://postgres:postgres@localhost:5432/bgsale_portal")
    AUTO_CREATE_TABLES: bool = Field(default=True)

    # Email / Notifications
    SMTP_HOST: str = Field(default="")
    SMTP_PORT: int = Field(default=587)
    SMTP_USERNAME: str = Field(default="")
    SMTP_PASSWORD: str = Field(default="")
    SMTP_USE_TLS: bool = Field(default=True)
    EMAIL_FROM: str = Field(default="no-reply@example.com")
    INVENTORY_ALERT_EMAIL: str = Field(default="")

    def model_post_init(self, __context) -> None:
        self.JWT_SECRET = _secret_from_file("JWT_SECRET", self.JWT_SECRET)
        self.SMTP_PASSWORD = _secret_from_file("SMTP_PASSWORD", self.SMTP_PASSWORD)

    # CORS
    CORS_ORIGINS: str = Field(default="http://localhost:3002,http://localhost:5173,http://localhost:3000,http://127.0.0.1:3002,http://127.0.0.1:5173,http://127.0.0.1:3000")

    class Config:
        env_file = ".env"
        case_sensitive = True
        # The project-level file also contains Compose, pgAdmin, and Vite settings.
        # Ignore those unrelated keys while still validating every declared API setting.
        extra = "ignore"

    @property
    def origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @property
    def trusted_hosts_list(self) -> List[str]:
        return [h.strip() for h in self.TRUSTED_HOSTS.split(",") if h.strip()]

    def validate_production(self) -> None:
        if self.DEBUG:
            return
        weak_secrets = {
            "", "change-me-in-prod", "change-this-secret", "secret", "password",
            # Previously committed as a docker-compose.yml fallback default; permanently blocked.
            "eMWU5MpFPJw5yNSclS2KVXQtqCwsXJO13fi0baTSvEvgd0NwwR0aYVZw0wpMddbh",
        }
        normalized_secret = self.JWT_SECRET.lower()
        if (
            self.JWT_SECRET in weak_secrets
            or len(self.JWT_SECRET) < 32
            or any(marker in normalized_secret for marker in ("replace-with", "change-this", "example"))
        ):
            generated = secrets.token_urlsafe(48)
            raise RuntimeError(
                "Production JWT_SECRET must be a unique random value with at least 32 characters. "
                f"Example: JWT_SECRET={generated}"
            )
        if "*" in self.origins_list:
            raise RuntimeError("Production CORS_ORIGINS cannot contain '*' when credentials are enabled.")
        if self.ALLOW_PUBLIC_REGISTRATION:
            raise RuntimeError("Production ALLOW_PUBLIC_REGISTRATION must be false.")
        if self.AUTO_CREATE_TABLES:
            raise RuntimeError("Production AUTO_CREATE_TABLES must be false; use Alembic migrations.")
        if not self.ENFORCE_HTTPS:
            raise RuntimeError("Production ENFORCE_HTTPS must be true.")
        unsafe_hosts = {"*", "localhost", "127.0.0.1"}
        if not self.trusted_hosts_list or any(host in unsafe_hosts for host in self.trusted_hosts_list):
            raise RuntimeError("Production TRUSTED_HOSTS must contain only deployed host names.")
        if any(origin.startswith("http://") for origin in self.origins_list):
            raise RuntimeError("Production CORS_ORIGINS must use HTTPS.")
        database_password = os.getenv("POSTGRES_PASSWORD", "")
        database_password = _secret_from_file("POSTGRES_PASSWORD", database_password)
        if not database_password:
            database_password = unquote(urlsplit(self.DATABASE_URL).password or "").strip()
        normalized_database_password = database_password.lower()
        weak_database_passwords = {"", "postgres", "password", "admin", "changeme", "change-me"}
        if (
            normalized_database_password in weak_database_passwords
            or any(marker in normalized_database_password for marker in ("replace-with", "change-this", "example"))
        ):
            raise RuntimeError("Production DATABASE_URL must use a unique, non-default database password.")


@lru_cache()
def get_settings() -> Settings:
    settings = Settings()
    settings.validate_production()
    return settings
