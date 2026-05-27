from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ArticleSourceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    kind: str


class ArticleListItemOut(BaseModel):
    """List item schema for article, without body field"""
    
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    summary: str | None
    status: str
    url: str | None
    category: str | None
    quality_score: int | None
    source: ArticleSourceOut | None
    published_at: datetime | None
    created_at: datetime


class ArticleDetailOut(ArticleListItemOut):
    """Detail schema for article, with body field"""

    body: str | None


class ArticleListResponse(BaseModel):
    items: list[ArticleListItemOut]
    total: int
    page: int = Field(ge=1)
    page_size: int = Field(ge=1, le=100)