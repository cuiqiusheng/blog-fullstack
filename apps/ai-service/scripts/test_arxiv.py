import asyncio

from app.services.fetch.arxiv_client import search_arxiv


async def main():
    results = await search_arxiv()
    print(f'Fetched {len(results)} Arxiv results\n')
    for i, r in enumerate(results, 1):
        authors = ', '.join(r.authors[:3])
        if len(r.authors) > 3:
            authors += '...'
        print(f'[{i}] {r.title}')
        print(f'    {r.url}')
        print(f'    Authors: {authors}')
        print(f'    Published: {r.published}')
        print(f'    Content: {r.content[:150]}...\n')


if __name__ == '__main__':
    asyncio.run(main())