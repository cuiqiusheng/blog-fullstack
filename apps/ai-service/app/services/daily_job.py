import logging

from app.agents.graph import run_pipeline
from app.agents.types import from_arxiv, from_tavily
from app.config import settings
from app.services.article_store import save_processed_articles
from app.services.fetch.arxiv_client import search_arxiv
from app.services.fetch.tavily_client import search_tavily


logger = logging.getLogger(__name__)


async def run_daily_job() -> dict:
    """
    Orchestration entry point for daily job.
    Fetch -> LangGraph pipeline -> Return statistics data.
    """
    logger.info('Daily job started')

    row_items = []

    if settings.tavily_api_key:
        logger.info('Fetching Tavily: %s', settings.tavily_daily_query)
        tavily_rows = await search_tavily(settings.tavily_daily_query)
        row_items.extend(from_tavily(r) for r in tavily_rows)
        logger.info('Tavily rows: %d', len(tavily_rows))
    else:
        logger.warning('Tavily skipped: no API key')

    logger.info('Fetching arXiv (max=%d)', settings.arxiv_max_results)
    arxiv_rows = await search_arxiv(max_results=settings.arxiv_max_results)
    row_items.extend(from_arxiv(r) for r in arxiv_rows)
    logger.info('arXiv rows: %d', len(arxiv_rows))

    if not row_items:
        logger.warning('No rows fetched, pipeline skipped')
        return {
            'row_count': 0,
            'filtered_count': 0,
            'article_count': 0,
            'saved_count': 0,
            'skipped_count': 0,
            'error_count': 0,
            'errors': [],
        }

    result = await run_pipeline(row_items)

    persist = save_processed_articles(result['articles'])

    stats = {
        'row_count': len(row_items),
        'filtered_count': len(result['filtered_items']),
        'article_count': len(result['articles']),
        'saved_count': persist['saved'],
        'skipped_count': persist['skipped'],
        'error_count': len(result['errors']),
        'errors': result['errors'],
    }

    logger.info('Daily job finished: %s', stats)
    return stats