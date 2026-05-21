# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
pnpm dev              # Start both client and server concurrently
pnpm dev:client       # Frontend only (Vite, port 5173)
pnpm dev:server       # Backend only (nodemon, port 4000)
```

The Vite dev server proxies `/api` and `/graphql` to `localhost:4000`, so the client never hits CORS issues in development.

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

### Database (run from `apps/server/`)
```bash
pnpm prisma:migrate          # Run migrations in dev (generates migration files)
pnpm prisma:migrate:deploy   # Apply migrations in production
pnpm prisma:generate         # Regenerate Prisma client after schema changes
pnpm prisma:format           # Format prisma/schema.prisma
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
packages/content-theme/       — Shared theme definitions (CSS only)
```

### Data Flow
```
React (Apollo Client)
  ↓ GraphQL over HTTP + WebSocket
Express + Apollo Server
  ↓ GraphQL resolver → Service → Prisma
PostgreSQL
```

### Server Architecture (`apps/server/src/`)

Requests flow through: **GraphQL resolver → Service → Prisma**

- `graphql/schema/` — Modular `.graphql` files per domain: `base`, `auth`, `post`, `chat`, `ai`, `interaction`, `notification`, `follow`
- `graphql/resolvers/` — One resolver file per domain; resolvers are thin and delegate to services
- `graphql/dataloader/` — DataLoader instances initialized per request; batch DB calls to prevent N+1 queries in nested resolvers
- `service/` — Business logic organized by domain; post service splits into `postQueryService` / `postCommandService` to separate reads from writes; chat service has a dedicated `streamService` for AI streaming
- `middleware/` — JWT auth context injected into every GraphQL request; Pino structured logging; `express-rate-limit` + Helmet for security
- `lib/` — Prisma client singleton (`lib/prisma.ts`), LLM provider abstraction (`lib/llm.ts`), Tavily search wrapper (`lib/searchProvider.ts`)
- `server.ts` — Express app setup, Apollo middleware, WebSocket server for subscriptions
- `cli/batchGenerate.ts` — Standalone CLI entrypoint for bulk article generation

### Client Architecture (`apps/client/src/`)

- `main.tsx` — Bootstrap: i18n init, Apollo Provider, React Router
- `app/App.tsx` — Root: Ant Design theme/locale provider, error boundary, session-invalidation navigation
- `pages/` — Route-level page components (home, posts, auth, profile, ai, bookmarks, settings)
- `features/` — Feature modules: `posts/`, `ai-chat/`, `layout/`, `notification/`
- `lib/apollo.ts` — Apollo Client with auth link (JWT injection), WebSocket link (subscriptions), error handling for session invalidation
- `graphql/` — CodeGen-generated TypeScript types and typed document nodes

The client uses **React 19** with the **React Compiler** (via Babel plugin in Vite). Ant Design v6 is the UI library. i18next handles internationalization.

### Shared Packages

| Package | Purpose |
|---------|---------|
| `packages/editor` | Tiptap rich-text editor with code blocks (lowlight), images, links, tables, task lists |
| `packages/markdown-renderer` | react-markdown + rehype/remark plugins; renders highlighted code via lowlight |
| `packages/content-utils` | Article parsing and validation utilities shared by client and server |
| `packages/content-theme` | Pure CSS exports: `code-highlight.css`, `nested-ordered-lists.css` |

### GraphQL Code Generation

Schema is defined in `apps/server/src/graphql/schema/`. After any `.graphql` file changes, run `pnpm codegen` from the root. This generates:
- Server: `apps/server/src/generated/` — resolver type signatures (`@graphql-codegen/typescript-resolvers`)
- Client: `apps/client/src/graphql/` — typed hooks and document nodes (`@graphql-codegen/client-preset`)

### Authentication

JWT-based. The server issues tokens on login/register; the client stores them and the Apollo auth link injects them as `Authorization: Bearer <token>` headers. The GraphQL context middleware (`middleware/`) decodes the token and attaches the user to `context` for all resolvers. Passwords are hashed with `bcryptjs`.

### Real-time Features

GraphQL Subscriptions over WebSocket (`graphql-ws`). The Apollo Client auto-switches between `ws://` and `wss://` based on environment. Used for AI chat streaming and notifications. The Nginx config sets a 3600s proxy timeout to support long-lived streaming connections.

### AI / LLM Integration

Configurable via env vars. The `lib/llm.ts` module provides a unified interface over two providers:
- **Ollama** (`LLM_PROVIDER=ollama`) — local inference
- **OpenAI-compatible** (`LLM_PROVIDER=openai`) — any OpenAI-compatible API

Optional web search via Tavily (`TAVILY_API_KEY`). The `article-generation` service handles batch generation with scheduling, throttling, and retry logic; triggered via `pnpm batch:generate`.

### File Upload (Qiniu CDN)

Uploads use a server-side token flow: the client calls `/upload/token` to get a short-lived Qiniu upload token, then uploads directly to the CDN bucket. The Nginx config proxies `/upload/` to the Express server. `QINIU_BACKUP_BUCKET` / `QINIU_BACKUP_PREFIX` support automated database backups to the same CDN.

### Database Schema Patterns

Key conventions in `apps/server/prisma/schema.prisma`:

- **Enums:** `PostStatus` (DRAFT / PUBLISHED / ARCHIVED), `PostVisibility` (PUBLIC / PRIVATE), `ChatMessageRole`, `NotificationType`
- **RBAC:** `Role` + `UserRole` junction table for user permission management
- **Post series:** `seriesKey` + `seriesOrder` fields allow ordering articles into a series
- **Notifications:** Polymorphic design — references either `postId` or `commentId`; covers LIKE / COMMENT / REPLY / FOLLOW events
- **Follow system:** Reflexive self-join on `User` (follower ↔ following)
- **Prisma client output:** `apps/server/src/generated/prisma` (CommonJS format via `@prisma/adapter-pg`)

### Security Middleware

- `helmet` — secure HTTP headers on all responses
- `express-rate-limit` — protects mutation and auth endpoints
- `CORS_ORIGIN` env var controls allowed origins

### Environment Variables

Server requires a `.env` in `apps/server/` (dev) or `deploy/` (production). See `deploy/.env.example` for a template.

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Token signing secret |
| `JWT_EXPIRES_IN` | Token lifetime (e.g. `7d`) |
| `PORT` | Server port (default `4000`) |
| `CORS_ORIGIN` | Allowed CORS origin |
| `LLM_PROVIDER` | `ollama` or `openai` |
| `LLM_API_KEY` | API key (OpenAI-compatible) |
| `LLM_API_BASE_URL` | Base URL for LLM API |
| `LLM_MODEL` | Model name (e.g. `gpt-4o`, `llama3`) |
| `TAVILY_API_KEY` | Optional web search for AI features |
| `QINIU_ACCESS_KEY` | Qiniu CDN access key |
| `QINIU_SECRET_KEY` | Qiniu CDN secret key |
| `QINIU_CDN_DOMAIN` | CDN domain for serving images |
| `QINIU_BACKUP_BUCKET` | Optional bucket for DB backups |
| `QINIU_BACKUP_PREFIX` | Optional key prefix for DB backups |

### Deployment

The production stack runs on Alibaba Cloud ECS:

```
GitHub (PR merge) → GitHub Actions (lint + build check)
  → mirror to GitLab → GitLab CI (build + deploy to ECS)
```

**Container setup (`deploy/docker-compose.yml`):**
- PostgreSQL 14 Alpine with a healthcheck; server waits for `service_healthy`
- Ports bound to `127.0.0.1` only; Nginx proxies from outside
- DB persisted in named volume `blog-data`

**Nginx (`deploy/nginx/blog.conf`):**
- HTTP → HTTPS redirect; Let's Encrypt SSL via certbot
- SPA routing: all non-asset paths fall back to `index.html`
- `/graphql` proxied with WebSocket upgrade support
- Static assets cached 1 year (Vite content hashes ensure safe long caching)
- Gzip compression enabled (level 5, min 1 KB)

**Build note:** Client builds on low-memory instances may OOM. GitLab CI uses `NODE_OPTIONS=--max-old-space-size=1024` and the ECS setup script configures 2 GB swap as mitigation.

## Code Quality Toolchain

- **ESLint** (flat config `eslint.config.mjs`): TypeScript strict rules, React hooks + React Refresh for client, Node globals for server. Single quotes enforced.
- **Prettier** (`.prettierrc`): `printWidth: 100`, single quotes, trailing commas.
- **Husky + lint-staged** (`.lintstagedrc.js`): ESLint + Prettier run on staged TS/JS files before every commit.
- **Generated files** (`apps/*/src/generated/`, Prisma migrations) are excluded from linting.

### Commit Convention

Conventional Commits enforced via Commitlint + Husky. Format: `type(scope): message`

Allowed types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `revert`, `build`, `ci`

Examples: `feat(post): add draft autosave`, `fix(chat): handle stream timeout`
