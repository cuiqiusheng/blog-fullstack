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

    # Scheduler (APScheduler)
    scheduler_enabled: bool = False
    scheduler_cron_hour: int = 6
    scheduler_cron_minute: int = 0
    scheduler_timezone: str = 'Asia/Shanghai'
    tavily_daily_query: str = 'AI LLM agent news this week'

    # arxiv
    arxiv_categories: str = 'cs.AI,cs.LG'
    arxiv_max_results: int = 3
    arxiv_delay_seconds: float = 10.0
    arxiv_num_retries: int = 2
    arxiv_cache_enabled: bool = True

    # llm
    llm_api_key: str | None = None
    llm_api_base_url: str | None = None
    llm_model: str = 'deepseek-v4-flash'
    llm_temperature: float = 0.3
    quality_min_score: int = 7 # low than 7 -> draft

    # langfuse
    langfuse_enabled: bool = False
    langfuse_base_url: str | None = None
    langfuse_public_key: str | None = None
    langfuse_secret_key: str | None = None


settings = Settings()
