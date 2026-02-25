FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/ apps/server/
RUN pnpm install --frozen-lockfile --filter @blog-fullstack/server

WORKDIR /app/apps/server
RUN pnpm prisma generate
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "dist/server.js"]
