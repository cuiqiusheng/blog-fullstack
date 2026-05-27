from dataclasses import dataclass

import httpx

from app.config import settings


@dataclass
class TavilyResult:
    title: str
    url: str
    content: str
    score: float | None = None


TAVILY_SEARCH_URL = 'https://api.tavily.com/search'


async def search_tavily(query: str) -> list[TavilyResult]:
    if not settings.tavily_api_key:
        raise RuntimeError('Tavily API key is not configured')

    payload = {
        'api_key': settings.tavily_api_key,
        'query': query,
        'search_depth': 'basic',
        'max_results': settings.tavily_max_results,
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(TAVILY_SEARCH_URL, json=payload)
        resp.raise_for_status()
        data = resp.json()

    results = data.get('results', [])
    return [
        TavilyResult(
            title=r.get('title', ''),
            url=r.get('url', ''),
            content=r.get('content', ''),
            score=r.get('score'),
        ) for r in results
    ]