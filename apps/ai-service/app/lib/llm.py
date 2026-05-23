from langchain_core.messages import HumanMessage
from langchain_openai import ChatOpenAI

from app.config import settings


def get_chat_model() -> ChatOpenAI:
    if not settings.llm_api_key or not settings.llm_api_base_url:
        raise RuntimeError('LLM API key and base URL are not configured')
    return ChatOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_base_url.rstrip('/'),
        model=settings.llm_model,
        temperature=settings.llm_temperature,
    )


async def ainvoke_prompt(prompt: str) -> str:
    model = get_chat_model()
    msg = await model.ainvoke([HumanMessage(content=prompt)])
    return (msg.content or '').strip()