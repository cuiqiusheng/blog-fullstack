from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str
    port: int = 8000
    tavily_api_key: str | None = None
    tavily_max_results: int = 5


settings = Settings()
