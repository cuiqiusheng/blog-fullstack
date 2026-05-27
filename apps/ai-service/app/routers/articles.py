from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.article import ArticleDetailOut, ArticleListItemOut, ArticleListResponse
from app.services.article_query import ALLOWED_STATUS, get_article_by_id, list_articles

router = APIRouter()


@router.get('', response_model=ArticleListResponse)
def get_articles(
    page: int = Query(1, ge=1, description='page number, starts from 1'),
    page_size: int = Query(20, ge=1, le=100, description='page size, between 10 and 100'),
    status: str | None = Query(None, description='article status, one of: ' + ', '.join(ALLOWED_STATUS)),
    db: Session = Depends(get_db),
) -> ArticleListResponse:
    if status is not None and status not in ALLOWED_STATUS:
        raise HTTPException(
            status_code=422,
            detail=f'Invalid status: {status}. Allowed: {sorted(ALLOWED_STATUS)}',
        )

    rows, total = list_articles(db, page=page, page_size=page_size, status=status)
    items = [ArticleListItemOut.model_validate(r) for r in rows]
    return ArticleListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get('/{article_id}', response_model=ArticleDetailOut)
def get_article(
    article_id: int,
    db: Session = Depends(get_db),
) -> ArticleDetailOut:
    row = get_article_by_id(db, article_id)
    if row is None:
        raise HTTPException(
            status_code=404,
            detail=f'Article not found: id={article_id}',
        )
    return ArticleDetailOut.model_validate(row)