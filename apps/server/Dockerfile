FROM node:20-slim AS base
RUN corepack enable && corepack prepare pnpm@10.10.0 --activate
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/server/package.json apps/server/
COPY apps/server/prisma apps/server/prisma/
RUN pnpm install --frozen-lockfile --filter @blog-fullstack/server

FROM base AS build
COPY --from=deps /app /app
COPY apps/server apps/server/
WORKDIR /app/apps/server
RUN pnpm prisma generate
RUN pnpm build

FROM base AS runtime
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/apps/server/node_modules /app/apps/server/node_modules
COPY --from=build /app/apps/server/dist /app/apps/server/dist
COPY --from=build /app/apps/server/package.json /app/apps/server/
COPY --from=build /app/apps/server/prisma /app/apps/server/prisma/
COPY --from=build /app/apps/server/src/generated /app/apps/server/src/generated/
COPY --from=build /app/apps/server/tsconfig.json /app/apps/server/

WORKDIR /app/apps/server
ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "-r", "tsconfig-paths/register", "dist/server.js"]
