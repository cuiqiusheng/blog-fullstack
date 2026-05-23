# blog-fullstack root Makefile - unified entry for pnpm, uv, docker

.DEFAULT_GOAL := help

.PHONY: help install dev dev-blog dev-server build lint migrate test dev-python

help: ## Show all commands
	@grep -E '^[a-zA-Z0-9_.-]+:.*##' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*## "}; {printf " \033[36m%-16s\033[0m %s\n", $$1, $$2}'

install: ## install JavaScript dependencies (pnpm)
	pnpm install

dev: ## start client and server concurrently
	pnpm dev

dev-blog: ## start client only
	pnpm dev:blog

dev-server: ## start graphql server only
	pnpm dev:server

build: ## build all workspace packages
	pnpm build

lint: ## ESLint
	pnpm lint

migrate: ## Prisma migrate dev (apps/server)
	pnpm --filter @blog-fullstack/server prisma:migrate

test: ## run test
	pnpm -r test

dev-python: ## start the Python development server (apps/ai-service)
	$(MAKE) -C apps/ai-service dev