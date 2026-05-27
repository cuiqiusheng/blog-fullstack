"""
Run daily job manually, same with APScheduler's daily job, no need to start uvicorn.

Usage (under `apps/ai-service` directory):
    PYTHONPATH=. uv run python scripts/run_daily_job.py
"""
import asyncio
import logging
import sys

from app.services.daily_job import run_daily_job


def configure_app_logging() -> None:
    app_log = logging.getLogger('app')
    app_log.setLevel(logging.INFO)
    if app_log.handlers:
        return
    handler = logging.StreamHandler()
    handler.setFormatter(
        logging.Formatter('%(levelname)s:\t%(name)s - %(message)s')
    )
    app_log.addHandler(handler)


async def main() -> None:
    configure_app_logging()
    stats = await run_daily_job()

    print('\n=== Daily job stats ===')
    for key, value in stats.items():
        print(f'    {key}: {value}')

    if stats.get('error_count', 0) > 0:
        sys.exit(1)


if __name__ == '__main__':
    asyncio.run(main())
