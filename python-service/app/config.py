"""Configuration settings for the Python service."""

import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Server settings
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"

    # OCR settings
    pix2tex_model: str = "default"

    class Config:
        env_file = ".env"


settings = Settings()
