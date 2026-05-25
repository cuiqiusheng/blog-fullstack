import asyncio
import logging
from dataclasses import dataclass
from datetime import date, datetime
from zoneinfo import ZoneInfo

import arxiv

from app.config import settings


logger = logging.getLogger(__name__)

_arxiv_client: arxiv.Client | None = None

@dataclass
class ArxivResult:
    title: str
    url: str
    content: str
    arxiv_id: str   # for duplicate detection
    authors: list[str]
    published: datetime | None = None


_cache_bucket_date: date | None = None
_arxiv_day_cache: dict[str, list[ArxivResult]] = {}


def get_arxiv_client() -> arxiv.Client:
    global _arxiv_client
    if _arxiv_client is None:
        _arxiv_client = arxiv.Client(
            page_size=100,
            delay_seconds=settings.arxiv_delay_seconds,
            num_retries=settings.arxiv_num_retries,
        )
    return _arxiv_client


def _cache_key(query: str, max_results: int) -> str:
    return f'{query}|{max_results}'


def _today_in_scheduler_tz() -> date:
    tz = ZoneInfo(settings.scheduler_timezone)
    return datetime.now(tz).date()


def _ensure_today_bucket(today: date) -> None:
    """When the cache bucket is not today, clear the cache."""
    global _cache_bucket_date

    if _cache_bucket_date == today:
        return

    old_bucket = _cache_bucket_date
    removed = len(_arxiv_day_cache)
    _arxiv_day_cache.clear()
    _cache_bucket_date = today

    if removed > 0:
        logger.info(
            'arXiv cache bucket rotated: %s -> %s, purged %d entries',
            old_bucket,
            today,
            removed,
        )


def _get_cached_results(key) -> list[ArxivResult] | None:
    entry = _arxiv_day_cache.get(key)
    if entry is None:
        return None
    return list(entry)


def _set_cached_results(key: str, results: list[ArxivResult]) -> None:
    _arxiv_day_cache[key] = list(results)


def _build_query(categories: list[str]) -> str:
    parts = [f'cat:{c.strip()}' for c in categories if c.strip()]
    if len(parts) == 1:
        return parts[0]
    return f'({" OR ".join(parts)})'


def _fetch_arxiv_sync(query: str, max_results: int) -> list[ArxivResult]:
    client = get_arxiv_client()

    search = arxiv.Search(
        query=query,
        max_results=max_results,
        sort_by=arxiv.SortCriterion.SubmittedDate,
        sort_order=arxiv.SortOrder.Descending,
    )

    results: list[ArxivResult] = []

    for paper in client.results(search):
        arxiv_id = paper.get_short_id()
        results.append(
            ArxivResult(
                title=paper.title.replace('\n', ' ').strip(),
                url=paper.entry_id,
                content=paper.summary.replace('\n', ' ').strip(),
                arxiv_id=arxiv_id,
                authors=[author.name for author in paper.authors],
                published=paper.published.date() if paper.published else None,
            )
        )

    return results


async def search_arxiv(
    categories: list[str] | None = None,
    max_results: int | None = None,
) -> list[ArxivResult]:
    cats = categories or [
        c.strip() for c in settings.arxiv_categories.split(',') if c.strip()
    ]
    limit = max_results or settings.arxiv_max_results
    query = _build_query(cats)

    key = _cache_key(query, limit)
    today = _today_in_scheduler_tz()

    if settings.arxiv_cache_enabled:
        _ensure_today_bucket(today)

        cached = _get_cached_results(key)
        if cached is not None:
            logger.info(
                'arXiv cache hit: key=%s date=%s count=%d',
                key,
                today,
                len(cached),
            )
            return cached

    results = await asyncio.to_thread(_fetch_arxiv_sync, query, limit)

    if settings.arxiv_cache_enabled:
        _set_cached_results(key, results)
        logger.info(
            'arXiv cache miss: stored key=%s date=%s count=%d',
            key,
            today,
            len(results),
        )

    return results
