from dataclasses import dataclass, field
from typing import Literal

from app.services.fetch.tavily_client import TavilyResult
from app.services.fetch.arxiv_client import ArxivResult


SourceKind = Literal['tavily', 'arxiv']
Category = Literal['news', 'paper', 'tool', 'other']
ArticleStatus = Literal['draft', 'published', 'archived']


@dataclass
class RowItem:
    '''
    Row material to be processed
    '''
    title: str
    url: str
    content: str
    source: SourceKind
    external_id: str | None = None # arxiv_id, etc.
    authors: list[str] = field(default_factory=list)
    category: Category | None = None # classify node filled


@dataclass
class ProcessedArticle:
    title: str
    summary: str
    category: Category
    source: SourceKind
    url: str
    quality_score: int
    quality_reason: str
    status: ArticleStatus
    body: str | None = None


def from_tavily(r: TavilyResult) -> RowItem:
    return RowItem(
        title=r.title,
        url=r.url,
        content=r.content,
        source='tavily',
    )


def from_arxiv(r: ArxivResult) -> RowItem:
    return RowItem(
        title=r.title,
        url=r.url,
        content=r.content,
        source='arxiv',
        external_id=r.arxiv_id,
        authors=r.authors,
    )