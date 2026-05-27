import asyncio

from app.agents.graph import run_pipeline
from app.agents.types import from_arxiv, from_tavily
from app.services.fetch.arxiv_client import search_arxiv
from app.services.fetch.tavily_client import search_tavily


async def main() -> None:
    print('Fetching Tavily...')
    tavily_rows = await search_tavily('AI LLM agent news this week')
    print('Fetching arXiv...')
    arxiv_rows = await search_arxiv(max_results=3)

    row_items = [from_tavily(r) for r in tavily_rows] + [
        from_arxiv(r) for r in arxiv_rows
    ]
    print(f'Raw count: {len(row_items)}')

    result = await run_pipeline(row_items)
    print(f"Filtered: {len(result['filtered_items'])}")
    print(f"Articles: {len(result['articles'])}")
    print(f"Errors: {result['errors']}")

    for article in result['articles']:
        print('-' * 60)
        print(f'[{article.status}] score={article.quality_score} cat={article.category}')
        print(article.title)
        print(article.summary[:120], '...')


if __name__ == '__main__':
    asyncio.run(main())