import asyncio
from dataclasses import dataclass
from datetime import datetime

import arxiv

from app.config import settings


@dataclass
class ArxivResult:
    title: str
    url: str
    content: str
    arxiv_id: str   # for duplicate detection
    authors: list[str]
    published: datetime | None = None


def _build_query(categories: list[str]) -> str:
    parts = [f'cat:{c.strip()}' for c in categories if c.strip()]
    if len(parts) == 1:
        return parts[0]
    return f'({" OR ".join(parts)})'


def _fetch_arxiv_sync(query: str, max_results: int) -> list[ArxivResult]:
    client = arxiv.Client(page_size=100, delay_seconds=5.0, num_retries=3)

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

    return await asyncio.to_thread(_fetch_arxiv_sync, query, limit)