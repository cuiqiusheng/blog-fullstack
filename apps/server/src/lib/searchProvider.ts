import { tavily } from '@tavily/core';
import { logger } from '@/utils/logger';
import type { ToolDefinition } from './openaiCompatible';

const TAVILY_MAX_RESULTS = 5;

function getTavilyClient() {
  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('TAVILY_API_KEY is not configured');
  }
  return tavily({ apiKey });
}

export async function webSearch(query: string): Promise<string> {
  logger.info({ query }, 'Tavily search started');
  const client = getTavilyClient();

  const response = await client.search(query, {
    searchDepth: 'basic',
    maxResults: TAVILY_MAX_RESULTS,
  });

  if (!response.results?.length) {
    logger.info({ query }, 'Tavily search returned no results');
    return 'No search results found.';
  }

  logger.info({ query, resultCount: response.results.length }, 'Tavily search completed');
  logger.debug(
    {
      results: response.results.map(r => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 150),
      })),
    },
    'Tavily search result details',
  );

  return response.results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.content}\nSource: ${r.url}`)
    .join('\n\n');
}

/**
 * OpenAI Function Calling tool definition for web search.
 * `null` when TAVILY_API_KEY is not configured (graceful degradation).
 */
export const WEB_SEARCH_TOOL: ToolDefinition | null = process.env.TAVILY_API_KEY?.trim()
  ? {
      type: 'function',
      function: {
        name: 'web_search',
        description:
          'Search the web for real-time information. Use when the user asks about current events, weather, news, prices, live scores, or anything requiring up-to-date data.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'The search query in the language most likely to yield good results',
            },
          },
          required: ['query'],
        },
      },
    }
  : null;

const TOOL_REGISTRY: Record<string, (args: Record<string, unknown>) => Promise<string>> = {
  web_search: args => webSearch(String(args.query ?? '')),
};

export async function executeToolCall(
  name: string,
  args: Record<string, unknown>,
): Promise<string> {
  const handler = TOOL_REGISTRY[name];
  if (!handler) {
    return `Unknown tool: ${name}`;
  }
  try {
    return await handler(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Tool execution failed';
    logger.error({ toolName: name, args, error }, 'Tool call execution error');
    return `Tool error: ${message}`;
  }
}
