"""
Configuration management for the Legal AI Assistant API.
Handles environment variables, database settings, and application configuration.
"""

import os
import sys
from typing import List, Optional
from functools import lru_cache

# Use typing_extensions for Python 3.8 compatibility
try:
    from typing import Annotated
except ImportError:
    from typing_extensions import Annotated

from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict



from typing import List, Optional

from pydantic import BaseModel, Field, EmailStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # NOTE: we will avoid complex field types for env values we want
        # to treat as simple strings, so no need to rely on enable_decoding
    )

    # Application Configuration
    app_name: str = Field("arthSarthi - AI", description="Application name")
    app_version: str = Field("1.0.0", description="Application version")
    debug: bool = Field(False, description="Debug mode")
    environment: str = Field("production", description="Environment", alias="env")
    log_level: str = Field("INFO", description="Logging level")

    # Server Configuration
    host: str = Field("0.0.0.0", description="Server host")
    port: int = Field(8000, description="Server port")
    reload: bool = Field(False, description="Auto-reload on code changes")

    # Database Configuration
    mongodb_uri: str = Field(
        "mongodb+srv://ankurrajauria92:PF4sVQkHxjNIJ8uZ@cluster0.2tai1jm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0",
        description="MongoDB connection URI",
    )
    database_name: str = Field(
        "legal_ai_db", description="MongoDB database name", alias="mongodb_db_name"
    )
    mongodb_test_db_name: str = Field(
        "legal_ai_test_db", description="MongoDB test database name"
    )

    # Authentication & Security Configuration
    secret_key: str = Field(
        ...,
        min_length=32,
        description="Secret key for JWT tokens (must be at least 32 characters)",
    )
    csrf_secret_key: str = Field(
        ...,
        min_length=32,
        description="CSRF secret key (must be at least 32 characters)",
    )
    algorithm: str = Field("HS256", description="JWT algorithm")
    access_token_expire_minutes: int = Field(
        30, description="Access token expiration in minutes"
    )
    refresh_token_expire_days: int = Field(
        7, description="Refresh token expiration in days"
    )

    # Email Configuration
    mail_server: str = Field("localhost", description="SMTP server")
    mail_port: int = Field(587, description="SMTP port")
    mail_username: Optional[str] = Field(None, description="SMTP username")
    mail_password: Optional[str] = Field(None, description="SMTP password")
    mail_from: EmailStr = Field(
        "noreply@legalai.com", description="From email address"
    )
    mail_from_name: str = Field("arthSarthi AI", description="From name")
    mail_starttls: bool = Field(True, description="Enable STARTTLS")
    mail_ssl_tls: bool = Field(False, description="Enable SSL/TLS")
    use_credentials: bool = Field(True, description="Use credentials for SMTP")
    validate_certs: bool = Field(True, description="Validate SSL certificates")

    # OTP Configuration
    otp_expire_minutes: int = Field(10, description="OTP expiration in minutes")
    otp_length: int = Field(6, description="OTP code length")
    otp_max_attempts: int = Field(3, description="Maximum OTP verification attempts")
    otp_rate_limit_per_hour: int = Field(
        5, description="Maximum OTP requests per hour per email"
    )

    # Frontend Configuration
    frontend_url: str = Field("http://localhost:3000", description="Frontend URL")

    # Store allowed origins as a simple string from env, then parse it ourselves
    allowed_origins_raw: str = Field(
        "http://localhost:3000,https://yourdomain.com",
        description="Allowed CORS origins (comma-separated)",
    )

    # CORS Configuration
    cors_allow_credentials: bool = Field(True, description="Allow credentials in CORS")

    # File Upload – same trick: raw string in env, parsed to list via property
    allowed_file_types_raw: str = Field(
        ".pdf,.doc,.docx,.txt",
        description="Allowed file types for upload (comma-separated)",
    )
    max_file_size: int = Field(
        10 * 1024 * 1024, description="Maximum file upload size in bytes"
    )  # 10MB

    # Rate Limiting
    rate_limit_requests: int = Field(
        100, description="Rate limit requests per minute"
    )
    rate_limit_window: int = Field(
        60, description="Rate limit window in seconds"
    )

    # ------------------------------------------------------------------
    # Validators for ints / bools / secrets / etc
    # ------------------------------------------------------------------

    @field_validator(
        "port",
        "access_token_expire_minutes",
        "refresh_token_expire_days",
        "otp_expire_minutes",
        "otp_length",
        "otp_max_attempts",
        "otp_rate_limit_per_hour",
        "rate_limit_requests",
        "rate_limit_window",
        "max_file_size",
        "mail_port",
        mode="before",
    )
    @classmethod
    def parse_int_fields(cls, v):
        if isinstance(v, str):
            return int(v)
        return v

    @field_validator(
        "debug",
        "reload",
        "mail_starttls",
        "mail_ssl_tls",
        "use_credentials",
        "validate_certs",
        "cors_allow_credentials",
        mode="before",
    )
    @classmethod
    def parse_bool_fields(cls, v):
        if isinstance(v, str):
            return v.lower() in ("true", "1", "yes", "on")
        return v

    @field_validator("secret_key", "csrf_secret_key")
    @classmethod
    def validate_secret_keys(cls, v):
        if len(v) < 32:
            raise ValueError("Secret keys must be at least 32 characters long")
        return v

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, v):
        allowed_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if v.upper() not in allowed_levels:
            raise ValueError(f"Log level must be one of: {allowed_levels}")
        return v.upper()

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v):
        allowed_envs = ["development", "testing", "staging", "production"]
        if v.lower() not in allowed_envs:
            raise ValueError(f"Environment must be one of: {allowed_envs}")
        return v.lower()

    # ------------------------------------------------------------------
    # Convenience properties that return parsed lists
    # ------------------------------------------------------------------

    @property
    def allowed_origins(self) -> List[str]:
        """
        Parsed CORS origins as a list of strings.
        Reads from allowed_origins_raw (comma-separated env string).
        """
        raw = (self.allowed_origins_raw or "").strip()
        if not raw:
            return ["http://localhost:3000", "https://yourdomain.com"]
        return [o.strip() for o in raw.split(",") if o.strip()]

    @property
    def allowed_file_types(self) -> List[str]:
        """
        Parsed allowed file types as a list of extensions.
        Reads from allowed_file_types_raw (comma-separated env string).
        """
        raw = (self.allowed_file_types_raw or "").strip()
        if not raw:
            return [".pdf", ".doc", ".docx", ".txt"]
        return [ext.strip() for ext in raw.split(",") if ext.strip()]

    # ------------------------------------------------------------------
    # Convenience helpers
    # ------------------------------------------------------------------

    @property
    def env(self) -> str:
        return self.environment

    @property
    def is_development(self) -> bool:
        return self.environment == "development" or self.debug

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def database_url(self) -> str:
        return self.mongodb_uri

    def get_cors_config(self) -> dict:
        """Centralized CORS config based on parsed allowed_origins."""
        return {
            "allow_origins": self.allowed_origins,
            "allow_credentials": self.cors_allow_credentials,
            "allow_methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["*"],
        }



# Global settings instance
settings = Settings() 

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Single source of truth for app settings.
    Returns the already-created module-level `settings` to avoid re-instantiation.
    """
    return settings