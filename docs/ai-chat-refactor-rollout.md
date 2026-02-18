# AI Chat Refactor Rollout Guide

## Frontend Entry

- Frontend entry is now pinned to v2 page:
  - `apps/client/src/pages/ai/index.ts` exports `AiChatPageV2` directly.
- Legacy page file remains in repo only as reference, not as runtime route target.

## New Frontend Architecture

- `features/ai-chat/useChatSessionController.ts`: reducer-based orchestration
- `features/ai-chat/TopicSidebar.tsx`
- `features/ai-chat/ChatThread.tsx`
- `features/ai-chat/ChatComposer.tsx`
- `pages/ai/AiChatPageV2.tsx`: page shell composition

## New Backend Contract

- Schema: `apps/server/src/graphql/schema/chat.graphql`
- Resolver: `apps/server/src/graphql/resolvers/chatResolver.ts`
- Services:
  - `service/chat/queryService.ts`
  - `service/chat/commandService.ts`
  - `service/chat/streamService.ts`
  - `service/chat/titleService.ts`

## Operational Notes

- v2 stream is message-id anchored; no index-based chunk patching.
- session list refresh no longer drives thread overwrite in v2 path.
- assistant lifecycle:
  - create `STREAMING` placeholder
  - stream chunks through `chatSessionStream`
  - finalize as `COMPLETED`/`FAILED`

## Verification Checklist

1. `pnpm --filter @blog-fullstack/server prisma:generate`
2. `pnpm --filter @blog-fullstack/server codegen`
3. `pnpm --filter @blog-fullstack/client codegen`
4. `pnpm --filter @blog-fullstack/server build`
5. `pnpm --filter @blog-fullstack/client build`

## Compatibility Status

- Runtime UI path is fully v2.
- Legacy GraphQL fields remain available temporarily on server for compatibility cleanup.
