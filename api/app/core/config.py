"""
Configuration settings for the FastAPI application
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    """Application settings"""

    # API Settings
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Smart Grid Operation Platform API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "智能电网运维平台 RESTful API"

    # Server Settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS Settings
    CORS_ORIGINS: list = [
        "http://localhost:3000",  # React dev server
        "http://localhost:5173",  # Vite dev server
        "http://localhost:8501",  # Streamlit (for transition period)
        "http://localhost:8503",
        "http://localhost:8504",
    ]

    # Backend Path (existing models)
    BACKEND_PATH: str = os.path.join(os.path.dirname(__file__), "../../../backend")

    # LLM Settings
    DEEPSEEK_API_KEY: Optional[str] = os.getenv("DEEPSEEK_API_KEY", "sk-a87064c3ac3240839f9e8595a85ccb4b")
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")

    # Data Settings
    DATA_DIR: str = os.path.join(os.path.dirname(__file__), "../../../data")
    REPORTS_DIR: str = os.path.join(os.path.dirname(__file__), "../../../reports")

    # Cache Settings
    CACHE_TTL: int = 300  # 5 minutes

    class Config:
        case_sensitive = True
        env_file = ".env"


# Global settings instance
settings = Settings()
