from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database
    database_url: str

    # Server
    port: int = 8000

    # Tavily
    tavily_api_key: str | None = None
    tavily_max_results: int = 5

    # arxiv
    arxiv_categories: str = 'cs.AI,cs.LG'
    arxiv_max_results: int = 10

    # llm
    llm_api_key: str | None = None
    llm_api_base_url: str | None = None
    llm_model: str = 'deepseek-v4-flash'
    llm_temperature: float = 0.3
    quality_min_score: int = 7 # low than 7 -> draft


settings = Settings()
