FROM node:22-slim

RUN sed -i 's/deb.debian.org/mirrors.aliyun.com/g' /etc/apt/sources.list.d/debian.sources && \
    apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN npm config set registry https://registry.npmmirror.com && \
    corepack enable && corepack prepare pnpm@10.10.0 --activate

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/ apps/server/

RUN pnpm config set registry https://registry.npmmirror.com && \
    pnpm install --frozen-lockfile --filter @blog-fullstack/server

WORKDIR /app/apps/server
RUN pnpm prisma generate
RUN pnpm build

ENV NODE_ENV=production
EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
