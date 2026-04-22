import { ChatMessageRole, ChatMessageStatus } from '@/generated/prisma/client';
import {
  chatCompletionStream,
  type ChatMessage,
  type StreamChunk,
  type ToolCall,
  type ToolDefinition,
} from '@/lib/llm';
import { prisma } from '@/lib/prisma';
import { WEB_SEARCH_TOOL, executeToolCall } from '@/lib/searchProvider';
import { logger } from '@/utils/logger';
import { finalizeAssistantMessage, maybeGenerateSessionTitle } from './commandService';
import { ChatSessionStreamEvent, ChatStreamEventType } from '@/graphql/__generated__/types';

const MAX_TOOL_ROUNDS = 3;

function buildSystemMessage(): ChatMessage {
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'Asia/Shanghai',
  });

  return {
    role: 'system',
    content: `Current date: ${dateStr}. When searching the web, include the current date in queries to get up-to-date results. Cross-check dates in search results against today's date to avoid citing stale data.`,
  };
}

function buildChatMessages(
  messages: Array<{ role: ChatMessageRole; content: string; status: ChatMessageStatus }>,
): ChatMessage[] {
  const chatMessages: ChatMessage[] = messages
    .filter(m => m.content.trim().length > 0)
    .map(m => ({
      role: m.role === ChatMessageRole.USER ? ('user' as const) : ('assistant' as const),
      content: m.content.trim(),
    }));

  return [buildSystemMessage(), ...chatMessages];
}

function getActiveTools(): ToolDefinition[] | undefined {
  const tools: ToolDefinition[] = [];
  if (WEB_SEARCH_TOOL) {
    tools.push(WEB_SEARCH_TOOL);
  }
  return tools.length > 0 ? tools : undefined;
}

// ---------------------------------------------------------------------------
// Text-based tool call detection (fallback for models that output tool calls
// as <tool_call> tags in content instead of structured tool_calls)
// ---------------------------------------------------------------------------

const TOOL_CALL_TAG_RE = /<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/g;

function parseToolCallsFromContent(content: string): ToolCall[] | undefined {
  const matches = [...content.matchAll(TOOL_CALL_TAG_RE)];
  if (matches.length === 0) return undefined;

  const toolCalls: ToolCall[] = [];
  for (let i = 0; i < matches.length; i++) {
    const jsonStr = matches[i][1].trim();
    try {
      const parsed = JSON.parse(jsonStr) as { name?: string; arguments?: unknown };
      if (!parsed.name) continue;

      const args =
        typeof parsed.arguments === 'string'
          ? parsed.arguments
          : JSON.stringify(parsed.arguments ?? {});

      toolCalls.push({
        id: `text_call_${i}`,
        type: 'function',
        function: { name: parsed.name, arguments: args },
      });
    } catch {
      logger.warn({ jsonStr }, 'Failed to parse text-based tool call JSON');
    }
  }

  return toolCalls.length > 0 ? toolCalls : undefined;
}

function extractLeakedWebSearchQuery(normalized: string): string | undefined {
  const unescape = (s: string) => s.replace(/\\"/g, '"').replace(/\\\\/g, '\\').trim();

  const strict = normalized.match(/"query"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (strict?.[1]?.trim()) return unescape(strict[1]);

  const spacedKey = normalized.match(/"[\s]*query[\s]*"[\s]*:\s*"((?:[^"\\]|\\.)*)"/i);
  if (spacedKey?.[1]?.trim()) return unescape(spacedKey[1]);

  // When the key is split across quoted fragments (e.g. `" "query "` and `"…weather…"`),
  // scan quoted segments after `"arguments":` and prefer segments with CJK text.
  const argsMatch = /"arguments"\s*:\s*/i.exec(normalized);
  const scanFrom = argsMatch ? normalized.slice(argsMatch.index + argsMatch[0].length) : normalized;
  const quoted = [...scanFrom.matchAll(/"((?:[^"\\]|\\.)*)"/g)]
    .map(m => unescape(m[1]))
    .filter(Boolean);

  const skip = new Set(['web_search', 'name', 'arguments', 'query', 'function', 'type']);
  for (const seg of quoted) {
    if (seg.length < 4) continue;
    if (skip.has(seg)) continue;
    if (/^query$/i.test(seg)) continue;
    if (/^[\s{}:[\],.0-9|]+$/i.test(seg)) continue;
    if (/[\u4e00-\u9fff]{2,}/.test(seg)) return seg;
  }

  for (const seg of quoted) {
    if (seg.length < 4) continue;
    if (skip.has(seg)) continue;
    if (/^query$/i.test(seg)) continue;
    if (/[\u4e00-\u9fff]/.test(seg)) return seg;
  }

  return undefined;
}

/**
 * Some models (e.g. Qwen2.5 via OpenAI-compatible APIs) leak tool intent into `content`
 * without `<tool_call>...</tool_call>` wrappers and with invalid JSON (extra braces,
 * broken `arguments`, or split `"query"` fragments). When tools are enabled on the
 * first round, recover a `web_search` call if we can extract a reliable `query` string.
 */
function parseLeakedWebSearchToolCall(content: string): ToolCall[] | undefined {
  const normalized = content
    .replace(/^\s*<tool_call>\s*/i, '')
    .replace(/\s*<\/tool_call>\s*$/i, '')
    .trim();
  if (!normalized.includes('web_search')) return undefined;

  const nameMatch = /"name"\s*:\s*"web_search"/.test(normalized);
  if (!nameMatch) return undefined;

  const query = extractLeakedWebSearchQuery(normalized);
  if (!query) return undefined;

  logger.info(
    { queryPreview: query.slice(0, 120) },
    'Recovered web_search from malformed model content',
  );

  return [
    {
      id: 'recovered_web_search_0',
      type: 'function',
      function: {
        name: 'web_search',
        arguments: JSON.stringify({ query }),
      },
    },
  ];
}

// ---------------------------------------------------------------------------
// Tool calling orchestration
// ---------------------------------------------------------------------------

/**
 * Extracts a valid JSON object from a potentially malformed string.
 * Some models append extra characters after the JSON (e.g. `{"query":"..."}"}"`).
 * Tries direct parse first, then scans for the first `{` and iterates
 * through `}` positions to find a valid JSON object.
 */
function safeParseJsonObject(raw: string): Record<string, unknown> {
  const trimmed = raw.trim();
  try {
    const result = JSON.parse(trimmed);
    if (typeof result === 'object' && result !== null) return result as Record<string, unknown>;
  } catch {
    /* fall through */
  }

  const start = trimmed.indexOf('{');
  if (start < 0) return {};

  let pos = start;
  while (pos < trimmed.length) {
    const end = trimmed.indexOf('}', pos + 1);
    if (end < 0) break;
    try {
      const result = JSON.parse(trimmed.slice(start, end + 1));
      if (typeof result === 'object' && result !== null) return result as Record<string, unknown>;
    } catch {
      /* try next } */
    }
    pos = end;
  }

  return {};
}

async function executeAndAppendToolResults(
  messages: ChatMessage[],
  toolCalls: ToolCall[],
): Promise<ChatMessage[]> {
  const assistantMsg: ChatMessage = {
    role: 'assistant',
    content: null,
    tool_calls: toolCalls,
  };
  let updated = [...messages, assistantMsg];

  for (const tc of toolCalls) {
    const args = safeParseJsonObject(tc.function.arguments);
    if (Object.keys(args).length === 0) {
      logger.warn({ raw: tc.function.arguments }, 'Failed to parse tool call arguments');
    }

    logger.info({ tool: tc.function.name, args }, 'Executing tool call');

    const result = await executeToolCall(tc.function.name, args);

    logger.debug(
      { tool: tc.function.name, resultLength: result.length, resultPreview: result.slice(0, 300) },
      'Tool call result',
    );

    updated = [...updated, { role: 'tool' as const, tool_call_id: tc.id, content: result }];
  }

  return updated;
}

/**
 * Streams LLM content chunks, handling the tool calling loop transparently.
 *
 * When tools are configured, the first round buffers content to detect both
 * structured tool_calls (OpenAI standard) AND text-based tool calls (Qwen's
 * `<tool_call>` tag format). Subsequent rounds stream normally.
 */
async function* streamWithToolSupport(
  messages: ChatMessage[],
  tools: ToolDefinition[] | undefined,
): AsyncGenerator<StreamChunk> {
  let currentMessages = messages;
  let round = 0;

  while (round < MAX_TOOL_ROUNDS) {
    round += 1;
    const isFirstRound = round === 1;
    const shouldBuffer = isFirstRound && tools != null;

    let bufferedContent = '';
    let structuredToolCalls: ToolCall[] | undefined;
    let lastModel: string | undefined;
    let lastCreatedAt: string | undefined;

    // Pass `tools` only on the first round. After `role: tool` results are appended,
    // keeping `tools` enabled makes some models (e.g. Qwen) keep emitting pseudo-tool
    // JSON in `delta.content`, which surfaces as garbage or a stream of quote characters.
    for await (const chunk of chatCompletionStream({
      messages: currentMessages,
      tools: isFirstRound ? tools : undefined,
    })) {
      if (chunk.model) lastModel = chunk.model;
      if (chunk.createdAt) lastCreatedAt = chunk.createdAt;

      if (chunk.toolCalls?.length) {
        structuredToolCalls = chunk.toolCalls;
        break;
      }

      if (chunk.chunk) {
        bufferedContent += chunk.chunk;
      }

      if (!shouldBuffer && (chunk.chunk || chunk.done)) {
        yield chunk;
      }
    }

    const detectedToolCalls =
      structuredToolCalls ??
      parseToolCallsFromContent(bufferedContent) ??
      parseLeakedWebSearchToolCall(bufferedContent);

    if (detectedToolCalls?.length) {
      logger.info(
        {
          round,
          tools: detectedToolCalls.map(tc => tc.function.name),
          textBased: !structuredToolCalls,
        },
        'Tool calls detected',
      );

      currentMessages = await executeAndAppendToolResults(currentMessages, detectedToolCalls);
      continue;
    }

    if (shouldBuffer && bufferedContent) {
      yield { chunk: bufferedContent, done: false, model: lastModel, createdAt: lastCreatedAt };
    }
    yield { chunk: '', done: true, model: lastModel };
    return;
  }

  logger.warn({ rounds: MAX_TOOL_ROUNDS }, 'Tool calling loop reached maximum rounds');
  for await (const chunk of chatCompletionStream({ messages: currentMessages })) {
    if (chunk.chunk || chunk.done) {
      yield chunk;
    }
  }
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function* streamSessionAssistantReply(options: {
  userId: string;
  sessionId: string;
  messageId: string;
}): AsyncGenerator<ChatSessionStreamEvent> {
  const session = await prisma.chatTopic.findFirst({
    where: {
      id: options.sessionId,
      userId: options.userId,
    },
  });
  if (!session) {
    throw new Error('Chat session not found');
  }
  const assistant = await prisma.chatMessage.findFirst({
    where: {
      id: options.messageId,
      topicId: options.sessionId,
      role: ChatMessageRole.ASSISTANT,
      status: ChatMessageStatus.STREAMING,
    },
  });
  if (!assistant) {
    throw new Error('Streaming assistant message not found');
  }

  const history = await prisma.chatMessage.findMany({
    where: {
      topicId: options.sessionId,
      OR: [{ status: ChatMessageStatus.COMPLETED }, { id: options.messageId }],
    },
    orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
    select: {
      role: true,
      content: true,
      status: true,
    },
  });
  const messages = buildChatMessages(history);
  const tools = getActiveTools();

  logger.info(
    {
      sessionId: options.sessionId,
      messageCount: messages.length,
      tools: tools?.map(t => t.function.name) ?? [],
    },
    'Stream reply started',
  );

  let seq = 0;
  let accumulated = '';
  const base = {
    sessionId: options.sessionId,
    messageId: options.messageId,
  };

  seq += 1;
  yield {
    ...base,
    eventId: `${options.messageId}:${seq}`,
    seq,
    type: ChatStreamEventType.MessageStarted,
    chunk: '',
    done: false,
    createdAt: new Date().toISOString(),
    error: null,
  };

  try {
    for await (const item of streamWithToolSupport(messages, tools)) {
      if (item.chunk) {
        accumulated += item.chunk;
      }
      seq += 1;
      yield {
        ...base,
        eventId: `${options.messageId}:${seq}`,
        seq,
        type: ChatStreamEventType.MessageChunk,
        chunk: item.chunk,
        done: false,
        createdAt: item.createdAt ?? new Date().toISOString(),
        model: item.model ?? undefined,
        error: null,
      };
    }

    logger.debug(
      {
        sessionId: options.sessionId,
        responseLength: accumulated.length,
        responsePreview: accumulated.slice(0, 200),
      },
      'Stream reply completed',
    );

    await finalizeAssistantMessage(
      options.userId,
      options.sessionId,
      options.messageId,
      accumulated,
      ChatMessageStatus.COMPLETED,
    );
    await maybeGenerateSessionTitle(options.userId, options.sessionId);
    seq += 1;
    yield {
      ...base,
      eventId: `${options.messageId}:${seq}`,
      seq,
      type: ChatStreamEventType.MessageCompleted,
      chunk: '',
      done: true,
      createdAt: new Date().toISOString(),
      error: null,
    };
  } catch (error) {
    await finalizeAssistantMessage(
      options.userId,
      options.sessionId,
      options.messageId,
      accumulated,
      ChatMessageStatus.FAILED,
    );
    seq += 1;
    yield {
      ...base,
      eventId: `${options.messageId}:${seq}`,
      seq,
      type: ChatStreamEventType.MessageFailed,
      chunk: '',
      done: true,
      createdAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown stream error',
    };
  }
}
