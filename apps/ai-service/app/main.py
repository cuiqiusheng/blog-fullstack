import logging

from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db import get_db
from app.routers.articles import router as articles_router
from app.services.scheduler import start_scheduler, shutdown_scheduler


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


@asynccontextmanager
async def lifespan(app: FastAPI):
    configure_app_logging()
    start_scheduler()
    yield
    shutdown_scheduler()


app = FastAPI(title='AI Service', version='0.1.0', lifespan=lifespan)

app.include_router(articles_router, prefix='/articles', tags=['articles'])


@app.get('/health')
def health(db: Session = Depends(get_db)):
    db.execute(text('SELECT 1')) # only check if database is connected
    return {'status': 'ok', 'database': 'connected'}