# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev              # Start both client and server concurrently
pnpm dev:client       # Frontend only (Vite, port 5173)
pnpm dev:server       # Backend only (nodemon, port 4000)
```

### Building
```bash
pnpm build            # Build all apps and packages
pnpm codegen          # Regenerate GraphQL types (run after schema changes)
```

### Code Quality
```bash
pnpm lint             # ESLint across all packages
pnpm lint:fix         # Auto-fix lint errors
pnpm format           # Prettier format all files
pnpm format:check     # Check formatting without writing
```

### Database (run from apps/server/)
```bash
pnpm prisma:migrate   # Run migrations in dev (generates migration files)
pnpm prisma:migrate:deploy  # Apply migrations in production
pnpm prisma:generate  # Regenerate Prisma client after schema changes
pnpm prisma:format    # Format prisma/schema.prisma
```

### Other
```bash
pnpm batch:generate   # CLI for batch AI article generation
```

## Architecture

This is a pnpm monorepo with two apps and four shared packages.

### Workspace Layout
```
apps/client/     — React 19 + Vite 7 frontend
apps/server/     — Express 5 + Apollo Server 5 backend
packages/editor/              — Tiptap-based rich text editor
packages/markdown-renderer/   — Markdown rendering component
packages/content-utils/       — Article parsing/validation utilities
packages/content-theme/       — Shared theme definitions
```

### Data Flow
```
React (Apollo Client)
  ↓ GraphQL over HTTP + WebSocket
Express + Apollo Server
  ↓ Service layer (domain-driven)
Prisma ORM → PostgreSQL
```

### Server Architecture (`apps/server/src/`)

Requests flow through: **GraphQL resolver → Service → Prisma**

- `graphql/schema/` — Modular `.graphql` files per domain: `base`, `auth`, `post`, `chat`, `ai`, `interaction`, `notification`, `follow`
- `graphql/resolvers/` — One resolver file per domain; resolvers are thin and delegate to services
- `graphql/dataloader/` — DataLoader instances to batch DB calls and prevent N+1 queries
- `service/` — Business logic organized by domain: `post/`, `chat/`, `user/`, `upload/`, `article-generation/`, `notification/`, `interaction/`, `follow/`
- `middleware/` — JWT auth context injected into every GraphQL request; Pino structured logging
- `lib/` — Prisma client singleton, Ollama LLM client wrappers
- `server.ts` — Express app setup, Apollo middleware, WebSocket server for subscriptions
- `cli/batchGenerate.ts` — Standalone CLI entrypoint for bulk article generation

### Client Architecture (`apps/client/src/`)

- `main.tsx` — Bootstrap: i18n init, Apollo Provider, React Router
- `app/App.tsx` — Root: Ant Design theme/locale provider, error boundary
- `pages/` — Route-level page components (home, posts, auth, profile, ai, bookmarks, settings)
- `features/` — Feature modules: `posts/`, `ai-chat/`, `layout/`, `notification/`
- `lib/apollo.ts` — Apollo Client with auth link (JWT injection), WebSocket link (subscriptions), error handling for session invalidation
- `graphql/` — CodeGen-generated TypeScript types and typed document nodes

### GraphQL Code Generation

Schema is defined in `apps/server/src/graphql/schema/`. After any `.graphql` file changes, run `pnpm codegen` from the root. This generates:
- Server: `apps/server/src/generated/` — resolver type signatures
- Client: `apps/client/src/graphql/` — typed hooks and document nodes

### Authentication

JWT-based. The server issues tokens on login/register; the client stores them and the Apollo auth link injects them as `Authorization: Bearer <token>` headers. The GraphQL context middleware (`middleware/`) decodes the token and attaches the user to `context` for all resolvers.

### Real-time Features

GraphQL Subscriptions over WebSocket (`graphql-ws`). The Apollo Client auto-switches between `ws://` and `wss://` based on environment. Used for AI chat streaming and notifications.

### AI / LLM Integration

Configurable via env vars (`LLM_PROVIDER`, `LLM_API_BASE_URL`, `LLM_MODEL`). Supports Ollama (local) or any OpenAI-compatible API. Optional web search via Tavily (`TAVILY_API_KEY`). The `article-generation` service handles batch generation with scheduling, throttling, and retry logic.

### Environment Variables

Server requires a `.env` in `apps/server/` (or `deploy/`):
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `PORT` (default 4000), `CORS_ORIGIN`
- `LLM_PROVIDER`, `LLM_API_KEY`, `LLM_API_BASE_URL`, `LLM_MODEL`
- `QINIU_ACCESS_KEY`, `QINIU_SECRET_KEY`, `QINIU_CDN_DOMAIN` — image upload CDN
- `TAVILY_API_KEY` — optional web search for AI features

### Commit Convention

Conventional Commits enforced via Commitlint + Husky. Format: `type(scope): message` (e.g. `feat(post): add draft autosave`).
