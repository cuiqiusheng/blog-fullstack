# Deployment Guide

Deploy blog-fullstack using **Vercel** (frontend) + **Render** (backend) + **Neon** (PostgreSQL).

## Prerequisites

- GitHub repository with the project code pushed
- Accounts on [Vercel](https://vercel.com), [Render](https://render.com), and [Neon](https://neon.tech)

## 1. Database (Neon)

1. Sign up at [neon.tech](https://neon.tech) and create a new project.
2. Create a database named `blog`.
3. Copy the connection string. It looks like:
   ```
   postgresql://user:password@ep-xxx.region.neon.tech/blog?sslmode=require
   ```
4. Save this — you'll need it as `DATABASE_URL` for Render.

## 2. Backend (Render)

### Option A: Using render.yaml (recommended)

1. Go to [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**.
2. Connect your GitHub repo. Render will detect `render.yaml` automatically.
3. Fill in the required environment variables:
   - `DATABASE_URL`: your Neon connection string
   - `CORS_ORIGIN`: your Vercel frontend URL (set after deploying frontend, e.g. `https://blog-xxx.vercel.app`)
4. Deploy.

### Option B: Manual setup

1. Go to Render Dashboard → **New** → **Web Service**.
2. Connect your GitHub repo.
3. Configure:
   - **Environment**: Docker
   - **Dockerfile Path**: `apps/server/Dockerfile`
   - **Docker Context**: `.` (repo root)
   - **Plan**: Free
   - **Health Check Path**: `/health`
4. Add environment variables (see table below).
5. Deploy.

### First deployment: run Prisma migration

After the first deploy, open the Render **Shell** tab and run:

```bash
cd /app/apps/server && npx prisma migrate deploy
```

### Backend environment variables

| Variable | Example | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://...@xxx.neon.tech/blog?sslmode=require` | Yes |
| `JWT_SECRET` | (random long string) | Yes |
| `JWT_EXPIRES_IN` | `7d` | No |
| `NODE_ENV` | `production` | Yes |
| `PORT` | `4000` | No |
| `CORS_ORIGIN` | `https://blog-xxx.vercel.app` | Yes |
| `LLM_PROVIDER` | `openai-compatible` or `ollama` | No |
| `LLM_API_KEY` | `sk-...` | If using cloud LLM |
| `LLM_API_BASE_URL` | `https://api.deepseek.com/v1` | If using cloud LLM |
| `LLM_MODEL` | `deepseek-chat` | If using cloud LLM |
| `ARTICLE_CRON_ENABLED` | `false` | No |

## 3. Frontend (Vercel)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) → **Add New Project**.
2. Import your GitHub repo.
3. Configure:
   - **Root Directory**: `apps/client`
   - **Framework Preset**: Vite
   - **Build Command**: `cd ../.. && pnpm install && pnpm --filter client build`
   - **Output Directory**: `dist`
   - **Install Command**: (leave empty — handled in build command)
4. Add environment variable:
   - `VITE_GRAPHQL_URI` = `https://blog-server-xxx.onrender.com/graphql`
     (use your actual Render service URL)
5. Deploy.
6. After deployment, copy the Vercel URL and update `CORS_ORIGIN` in Render.

## 4. LLM Provider Configuration

AI features (chat, article generation) require an LLM backend.

### Option A: No LLM (default)

If no LLM environment variables are set, AI features will return an error message indicating no provider is configured. All other features work normally.

### Option B: OpenAI-compatible API (recommended for cloud)

Set these in Render environment variables:

```
LLM_PROVIDER=openai-compatible
LLM_API_KEY=sk-your-api-key
LLM_API_BASE_URL=https://api.deepseek.com/v1
LLM_MODEL=deepseek-chat
```

Compatible providers: DeepSeek, OpenAI, Groq, Together AI, etc.

### Option C: Ollama (local/self-hosted only)

Only works if you have an Ollama instance accessible from Render (not typical for free tier).

```
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://your-ollama-host:11434
OLLAMA_MODEL=qwen2.5:14b
```

## 5. Post-deploy checklist

- [ ] Neon database created with connection string
- [ ] Render service deployed and healthy (`/health` returns OK)
- [ ] Prisma migration applied (`prisma migrate deploy`)
- [ ] Vercel frontend deployed and loading
- [ ] `CORS_ORIGIN` on Render matches Vercel URL
- [ ] `VITE_GRAPHQL_URI` on Vercel matches Render URL
- [ ] Register a user and test login
- [ ] Create and publish a post
- [ ] (Optional) Configure LLM provider and test AI chat

## Notes

- **Render free tier**: instances spin down after 15 minutes of inactivity. First request after idle takes ~30s (cold start).
- **Neon free tier**: 0.5 GB storage, auto-suspend after 5 min inactivity, ~1s cold start.
- **WebSocket**: Render free tier supports WebSocket connections. AI chat streaming works.
- **Custom domain**: both Vercel and Render support custom domains on free tier.
