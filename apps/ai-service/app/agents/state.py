from typing import TypedDict

from app.agents.types import RowItem, ProcessedArticle


class AgentState(TypedDict):
    row_items: list[RowItem]
    filtered_items: list[RowItem]
    articles: list[ProcessedArticle]
    errors: list[str]