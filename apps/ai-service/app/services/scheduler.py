import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.config import settings
from app.services.daily_job import run_daily_job


logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler | None = None


def get_scheduler() -> AsyncIOScheduler:
    """Create single instance of scheduler lazily."""
    global _scheduler
    if _scheduler is None:
        _scheduler = AsyncIOScheduler(timezone=settings.scheduler_timezone)
    return _scheduler


def start_scheduler() -> None:
    if not settings.scheduler_enabled:
        logger.info('Scheduler disabled, skipping start')
        return

    sched = get_scheduler()
    if sched.running:
        logger.warning('Scheduler already running, skipping start')
        return

    sched.add_job(
        run_daily_job,
        trigger=CronTrigger(
            hour=settings.scheduler_cron_hour,
            minute=settings.scheduler_cron_minute,
            timezone=settings.scheduler_timezone,
        ),
        id='daily_job',
        name='Daily AI content job',
        replace_existing=True,
        max_instances=1, # run only one instance of the job
        coalesce=True, # coalesce multiple job instances into a single one
    )
    sched.start()
    logger.info(
        'Scheduler started: job=daily_job cron=%02d:%02d timezone=%s',
        settings.scheduler_cron_hour,
        settings.scheduler_cron_minute,
        settings.scheduler_timezone,
    )


def shutdown_scheduler() -> None:
    if _scheduler is None or not _scheduler.running:
        return
    _scheduler.shutdown(wait=False)
    logger.info('Scheduler shutdown')
