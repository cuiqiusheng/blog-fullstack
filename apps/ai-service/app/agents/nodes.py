import json
import re
from dataclasses import replace

from app.agents.state import AgentState
from app.agents.types import RowItem, Category, ProcessedArticle
from app.lib.llm import ainvoke_prompt
from app.config import settings


"""
langgraph flow: 去重 -> 归类 -> 摘要 -> 质检 -> 生成文章

data flow:
row_items ->
dedupe_node ->
filtered_items ->
classify_node ->
filtered_items + category ->
summarize_node ->
articles first draft, score = 0 ->
quality_check_node ->
articles final draft/published
"""


_CATEGORIES: tuple[Category, ...] = ('news', 'paper', 'tool', 'other')
_CLASSIFY_BATCH_SIZE = 10


def _norm_url(url: str) -> str:
    return url.rstrip('/').lower()


def _extract_json(text: str) -> str:
    text = text.strip()
    if text.startswith('```'):
        text = re.sub(r'^```(?:json)?\s*', '', text, flags=re.IGNORECASE)
        text = re.sub(r'\s*```$', '', text)
    return text.strip()


def _parse_json_array(text: str) -> list[dict]:
    try:
        data = json.loads(_extract_json(text))
        return data if isinstance(data, list) else []
    except json.JSONDecodeError:
        return []


def _parse_json_object(text: str) -> dict:
    try:
        data = json.loads(_extract_json(text))
        return data if isinstance(data, dict) else {}
    except json.JSONDecodeError:
        return {}


def _default_category(item: RowItem) -> Category:
    if item.source == 'arxiv':
        return 'paper'
    return 'other'


def _row_with_category(item: RowItem, category: Category) -> RowItem:
    return RowItem(
        title=item.title,
        url=item.url,
        content=item.content,
        source=item.source,
        external_id=item.external_id,
        authors=item.authors,
        category=category,
    )


# Node1: Deduplicate items, not use llm
def dedupe_node(state: AgentState) -> dict:
    seen_url: set[str] = set()
    seen_id: set[str] = set()
    out: list[RowItem] = []

    for item in state['row_items']:
        url_key = _norm_url(item.url)
        if url_key in seen_url:
            continue
        if item.external_id and item.external_id in seen_id:
            continue
        seen_url.add(url_key)
        if item.external_id:
            seen_id.add(item.external_id)
        out.append(item)

    return {'filtered_items': out}


# Node2: Classify items, llm batch
def _build_classify_prompt(batch: list[RowItem]) -> str:
    blocks: list[str] = []
    for i, item in enumerate(batch):
        snippet = (item.content or '').strip()[:500]
        blocks.append(
            f'{i}. title: {item.title}\n'
            f'  source: {item.source}\n'
            f'  snippet: {snippet}',
        )
    items_text = '\n\n'.join(blocks)
    return f"""你是一个 AI 资讯编辑。将下列条目各归为一类：

- news: 行业新闻、产品发布、融资、政策
- paper: 学术论文、预印本
- tool: 开源工具、框架、模型/权重、GitHub/HuggingFace 上新
- other: 无法归入以上三类

只输出 JSON 数组，不要 markdown，不要任何解释。格式示例：
[{{"index": 0, "category": "news"}}, {{"index": 1, "category": "paper"}}]

条目：
{items_text}
"""


async def classify_node(state: AgentState) -> dict:
    items = list(state['filtered_items'])
    errors = list(state.get('errors', []))

    for start in range(0, len(items), _CLASSIFY_BATCH_SIZE):
        batch = items[start:start + _CLASSIFY_BATCH_SIZE]
        try:
            raw = await ainvoke_prompt(
                _build_classify_prompt(batch),
                run_name='classify',
                metadata={'node': 'classify', 'batch_start': start},
            )
            rows = _parse_json_array(raw)
            index_to_cat: dict[int, Category] = {}
            for row in rows:
                idx = row.get('index')
                cat = row.get('category', 'other')
                if isinstance(idx, int) and cat in _CATEGORIES:
                    index_to_cat[idx] = cat

            for local_i, item in enumerate(batch):
                global_i = start + local_i
                cat = index_to_cat.get(global_i, _default_category(item))
                if item.source == 'arxiv' and cat == 'other':
                    cat = 'paper'
                items[global_i] = _row_with_category(item, cat)
        except Exception as exc:
            errors.append(f'classify batch@{start}: {exc}')
            for local_i, item in enumerate(batch):
                global_i = start + local_i
                items[global_i] = _row_with_category(item, _default_category(item))

    return {'filtered_items': items, 'errors': errors}


# Node3: Summarize items, llm item by item
def _build_summarize_prompt(item: RowItem, category: Category) -> str:
    content = (item.content or '').strip()[:2000]
    return f"""你是 AI 专栏作者。根据素材写中文摘要。

要求：
1. title: 可微调原标题，不超过 80 字
2. summary: 150-300 字，信息密度高
3. body: Markdown，2-4 段，含「要点」「为何重要」；素材过短则 null

category: {category}
source: {item.source}
url: {item.url}
原文：
{content}

只输出 JSON 对象，不要 markdown 代码块：
{{"title": "...", "summary": "...", "body": "..."}}
body 可为 null。
"""


async def summarize_node(state: AgentState) -> dict:
    articles: list[ProcessedArticle] = []
    errors = list(state.get('errors', []))

    for item in state['filtered_items']:
        category = item.category or _default_category(item)
        try:
            raw = await ainvoke_prompt(
                _build_summarize_prompt(item, category),
                run_name='summarize',
                metadata={
                    'node': 'summarize',
                    'source': item.source,
                    'url': item.url,
                },
            )
            obj = _parse_json_object(raw)
            title = str(obj.get('title') or item.title).strip()
            summary = str(obj.get('summary') or '').strip()
            body_val = obj.get('body')
            body = str(body_val).strip() if body_val else None

            if not summary:
                raise ValueError('empty summary from LLM')

            articles.append(ProcessedArticle(
                title=title,
                summary=summary,
                category=category,
                source=item.source,
                url=item.url,
                quality_score=0,
                quality_reason='pending',
                status='draft',
                body=body,
            ))
        except Exception as exc:
            errors.append(f'summarize item@{item.url}: {exc}')
            
    return {'articles': articles, 'errors': errors}


# Node4: Quality check articles, llm score item by item
def _build_quality_prompt(article: ProcessedArticle) -> str:
    return f"""你是内容质量审核员。对下列 AI 专栏摘要打分（1-10 整数）。

维度：准确性、信息密度、可读性、与 category 是否匹配。
请客观打分；质量一般也应给中低分。

title: {article.title}
category: {article.category}
summary: {article.summary}

只输出 JSON：{{"score": 8, "reason": "一句话理由"}}
"""


async def quality_check_node(state: AgentState) -> dict:
    updated: list[ProcessedArticle] = []
    errors = list(state.get('errors', []))
    min_score = settings.quality_min_score

    for article in state['articles']:
        try:
            raw = await ainvoke_prompt(
                _build_quality_prompt(article),
                run_name='quality_check',
                metadata={
                    'node': 'quality_check',
                    'category': article.category,
                    'url': article.url,
                },
            )
            obj = _parse_json_object(raw)
            score = int(obj.get('score', 0))
            reason = str(obj.get('reason') or '').strip() or 'no reason'
            status = 'published' if score >= min_score else 'draft'
            updated.append(
                replace(
                    article,
                    quality_score=score,
                    quality_reason=reason,
                    status=status,
                )
            )
        except Exception as exc:
            errors.append(f'quality check article@{article.url}: {exc}')
            updated.append(
                replace(
                    article,
                    quality_score=0,
                    quality_reason=str(exc),
                    status='draft',
                )
            )

    return {'articles': updated, 'errors': errors}
