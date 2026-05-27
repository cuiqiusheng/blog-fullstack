from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.models.tables import AiArticle

ALLOWED_STATUS = frozenset(['draft', 'published', 'archived'])


def list_articles(
    db: Session,
    *,
    page: int = 1,
    page_size: int = 20,
    status: str | None,
) -> tuple[list[AiArticle], int]:
    filters = []
    if status is not None:
        filters.append(AiArticle.status == status)

    total = db.scalar(
        select(func.count()).select_from(AiArticle).where(*filters)
    )
    total = total or 0

    offset = (page - 1) * page_size
    stmt = (
        select(AiArticle)
        .options(joinedload(AiArticle.source))
        .where(*filters)
        .order_by(AiArticle.created_at.desc())
        .offset(offset)
        .limit(page_size)
    )
    rows = list(db.scalars(stmt).unique().all())
    return rows, total


def get_article_by_id(db: Session, article_id: int) -> AiArticle | None:
    return db.scalar(
        select(AiArticle)
        .options(joinedload(AiArticle.source))
        .where(AiArticle.id == article_id)
    )
