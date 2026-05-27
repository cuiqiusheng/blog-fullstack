from langfuse import propagate_attributes
from langgraph.graph import END, START, StateGraph

from app.agents.nodes import (
    classify_node,
    dedupe_node,
    quality_check_node,
    summarize_node,
)
from app.agents.state import AgentState
from app.agents.types import RowItem
from app.config import settings
from app.lib.llm import flush_langfuse, get_langfuse_client, get_langfuse_handler


"""
StateGraph(AgentState) 注册节点与边
START → dedupe → classify → summarize → quality_check → END
compile() 得到可执行图；ainvoke 异步跑完全程

Langfuse v4: run_pipeline 外包 start_as_current_observation() + propagate_attributes()，将单次 pipeline 下所有 LLM generation 归到同一 trace。
"""


def build_graph():
    graph = StateGraph(AgentState)

    graph.add_node('dedupe', dedupe_node)
    graph.add_node('classify', classify_node)
    graph.add_node('summarize', summarize_node)
    graph.add_node('quality_check', quality_check_node)

    graph.add_edge(START, 'dedupe')
    graph.add_edge('dedupe', 'classify')
    graph.add_edge('classify', 'summarize')
    graph.add_edge('summarize', 'quality_check')
    graph.add_edge('quality_check', END)

    return graph.compile()


async def run_pipeline(row_items: list[RowItem]) -> AgentState:
    app = build_graph()
    initial: AgentState = {
        'row_items': row_items,
        'filtered_items': [],
        'articles': [],
        'errors': [],
    }

    if not settings.langfuse_enabled:
        return await app.ainvoke(initial)

    handler = get_langfuse_handler()
    langfuse = get_langfuse_client()
    graph_config = {'callbacks': [handler]} if handler else {}

    with langfuse.start_as_current_observation(
        as_type='span',
        name='daily_pipeline',
        input={'row_item_count': len(row_items)},
    ) as root_span:
        with propagate_attributes(
            tags=['ai-column'],
            metadata={'pipeline': 'daily'},
        ):
            result = await app.ainvoke(initial, config=graph_config)

        root_span.update(
            output={
                'filtered_count': len(result['filtered_items']),
                'article_count': len(result['articles']),
                'error_count': len(result['errors']),
            },
        )

    flush_langfuse()
    return result