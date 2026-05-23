import asyncio
from app.services.fetch.tavily_client import search_tavily


async def main():
    results = await search_tavily('latest AI breakthroughs 2026')
    for i, r in enumerate(results, 1):
        print(f'[{i}] {r.title}\n{r.url}\n{r.content[:120]}...\n')

if __name__ == '__main__':
    asyncio.run(main())