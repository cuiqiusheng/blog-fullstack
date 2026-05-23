from langgraph.graph import END, START, StateGraph

from app.agents.nodes import (
    classify_node,
    dedupe_node,
    quality_check_node,
    summarize_node,
)
from app.agents.state import AgentState
from app.agents.types import RowItem


'''
StateGraph(AgentState) 注册节点与边
START → dedupe → classify → summarize → quality_check → END
compile() 得到可执行图；ainvoke 异步跑完全程
'''


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
    result = await app.ainvoke(initial)
    return result