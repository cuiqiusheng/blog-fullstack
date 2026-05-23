from datetime import date, datetime

from sqlalchemy import Date, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class AiSource(Base):
    __tablename__ = 'ai_sources'

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), unique=True)
    kind: Mapped[str] = mapped_column(String(32)) # tavily | arxiv | rss
    config_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    articles: Mapped[list['AiArticle']] = relationship(back_populates='source')


class AiArticle(Base):
    __tablename__ = 'ai_articles'

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(500))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(32), default='draft') # draft | published | archived
    source_id: Mapped[int | None] = mapped_column(ForeignKey('ai_sources.id'), nullable=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    source: Mapped[AiSource | None] = relationship(back_populates='articles')
    digest: Mapped[list['AiDigest']] = relationship(
        secondary='ai_digest_articles', back_populates='articles'
    )


class AiDigest(Base):
    __tablename__ = 'ai_digests'

    id: Mapped[int] = mapped_column(primary_key=True)
    digest_date: Mapped[date] = mapped_column(Date, unique=True) # why unique?
    title: Mapped[str] = mapped_column(String(300))
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    articles: Mapped[list['AiArticle']] = relationship(
        secondary='ai_digest_articles', back_populates='digest'
    )


class AiDigestArticle(Base):
    """多对多关联表"""
    __tablename__ = 'ai_digest_articles'

    digest_id: Mapped[int] = mapped_column(ForeignKey('ai_digests.id'), primary_key=True)
    article_id: Mapped[int] = mapped_column(ForeignKey('ai_articles.id'), primary_key=True)
