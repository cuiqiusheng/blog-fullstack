from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langfuse import Langfuse, get_client
from langfuse.langchain import CallbackHandler

from app.config import settings


_langfuse_initialized = False
_callback_handler: CallbackHandler | None = None


def _init_langfuse() -> None:
    global _langfuse_initialized
    if _langfuse_initialized or not settings.langfuse_enabled:
        return
    if not settings.langfuse_base_url or not settings.langfuse_public_key or not settings.langfuse_secret_key:
        raise RuntimeError('Langfuse is not configured')

    Langfuse(
        public_key=settings.langfuse_public_key,
        secret_key=settings.langfuse_secret_key,
        base_url=settings.langfuse_base_url,
    )
    _langfuse_initialized = True


def get_langfuse_handler() -> CallbackHandler | None:
    global _callback_handler
    if not settings.langfuse_enabled:
        return None
    _init_langfuse()
    if _callback_handler is None:
        _callback_handler = CallbackHandler()
    return _callback_handler


def flush_langfuse() -> None:
    if settings.langfuse_enabled and _langfuse_initialized:
        get_langfuse_client().flush()


def get_langfuse_client() -> Langfuse:
    if not settings.langfuse_enabled:
        raise RuntimeError('Langfuse is disabled')
    if not _langfuse_initialized:
        _init_langfuse()
    return get_client()


def get_chat_model() -> ChatOpenAI:
    if not settings.llm_api_key or not settings.llm_api_base_url:
        raise RuntimeError('LLM API key and base URL are not configured')
    return ChatOpenAI(
        api_key=settings.llm_api_key,
        base_url=settings.llm_api_base_url.rstrip('/'),
        model=settings.llm_model,
        temperature=settings.llm_temperature,
    )


async def ainvoke_prompt(
    prompt: str,
    *,
    run_name: str | None = None,
    metadata: dict | None = None,
) -> str:
    model = get_chat_model()
    handler = get_langfuse_handler()

    config: RunnableConfig = {}
    if handler is not None:
        langfuse_metadata: dict = {'langfuse_tags': ['ai-column']}
        if metadata:
            langfuse_metadata.update(metadata)
        config = {
            'callbacks': [handler],
            'metadata': langfuse_metadata,
        }
        if run_name:
            config['run_name'] = run_name

    msg = await model.ainvoke([HumanMessage(content=prompt)], config=config)
    content = (msg.content or '').strip()

    flush_langfuse()
    return content