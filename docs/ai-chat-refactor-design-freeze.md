# AI Chat Refactor Design Freeze

## Scope

- Stabilize chat rendering and streaming lifecycle.
- Refactor page architecture into composable modules.
- Introduce clearer DB/API contract for session/message lifecycle.

## Data Contract

- Session (`ChatTopic` as storage, exposed as `ChatSession` in GraphQL):
  - `id`, `userId`, `title`, `status`, `createdAt`, `updatedAt`, `lastMessageAt`
- Message (`ChatMessage`):
  - `id`, `topicId`, `role`, `content`, `status`, `createdAt`

## Lifecycle Semantics

- `sendChatMessage` creates:
  - one user message (`COMPLETED`)
  - one assistant placeholder message (`STREAMING`)
- `chatSessionStream(sessionId, messageId)` streams chunks for that assistant message.
- Stream completion updates assistant message to `COMPLETED`.
- Stream failure updates assistant message to `FAILED`.

## Frontend State Rules

- Thread state has a single source of truth in reducer state.
- Server hydration only runs on session switch or explicit reload.
- Streaming message update uses `messageId` anchor; never array index anchor.

## Component Boundaries

- `AiChatPage`: layout shell and wiring.
- `TopicSidebar`: sessions list and selection.
- `ChatThread`: message viewport and presentation.
- `ChatComposer`: input and submit UX.
- `useChatSessionController`: all side-effect orchestration.

## Compatibility

- Existing `/ai/:topicId?` route remains.
- New v2 GraphQL operations are added alongside old ones.
- UI switched through feature flag `VITE_AI_CHAT_V2`.
