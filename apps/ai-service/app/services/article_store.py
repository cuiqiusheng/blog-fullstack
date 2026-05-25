import logging
from datetime import datetime, timezone

from sqlalchemy import select

from app.agents.types import ProcessedArticle, SourceKind
from app.models.tables import AiArticle, AiSource
from app.db import SessionLocal


logger = logging.getLogger(__name__)

SOURCE_URL_MARKER = '\n\n---\n来源：'

_SOURCE_META: dict[SourceKind, tuple[str, str]] = {
    "tavily": ("tavily", "tavily"),
    "arxiv": ("arxiv", "arxiv"),
}


def _get_or_create_source(db, kind: SourceKind) -> AiSource:
    name, source_kind = _SOURCE_META[kind]
    row = db.scalar(select(AiSource).where(AiSource.name == name))
    if row is not None:
        return row

    row = AiSource(name=name, kind=source_kind)
    db.add(row)
    db.flush()
    logger.info("article_store: created source: name=%s kind=%s", name, source_kind)
    return row


def _body_with_source_url(body: str | None, url: str) -> str:
    footer = f'{SOURCE_URL_MARKER}{url}'
    base = (body or '').strip()
    if footer in base:
        return base
    return f'{base}{footer}' if base else footer.lstrip('\n')


def _exists_by_source_url(db, source_id: int, url: str) -> bool:
    marker = f'{SOURCE_URL_MARKER}{url}'
    article_id= db.scalar(
        select(AiArticle.id).where(
            AiArticle.source_id == source_id,
            AiArticle.body.isnot(None),
            AiArticle.body.endswith(marker),
        ),
    )
    return article_id is not None



def save_processed_articles(articles: list[ProcessedArticle]) -> dict[str, int]:
    """
    write pipeline results (processed articles) to database
    return saved / skipped counts
    """
    saved = 0
    skipped = 0

    if not articles:
        return {"saved": 0, "skipped": 0}

    with SessionLocal() as db:
        for article in articles:
            source = _get_or_create_source(db, article.source)

            if _exists_by_source_url(db, source.id, article.url):
                skipped += 1
                logger.info(
                    "skipped existing article: source=%s url=%s",
                    source.name,
                    article.url,
                )
                continue

            published_at = None
            if article.status == "published":
                published_at = datetime.now(timezone.utc)

            row = AiArticle(
                title=article.title[:500],
                summary=article.summary,
                body=_body_with_source_url(article.body, article.url),
                status=article.status,
                source_id=source.id,
                published_at=published_at,
            )
            db.add(row)
            saved += 1

        db.commit()

    logger.info(
        "article_store: saved=%d skipped=%d",
        saved,
        skipped,
    )

    return {"saved": saved, "skipped": skipped}
