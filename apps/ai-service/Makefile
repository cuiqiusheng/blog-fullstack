.PHONY: dev migrate lint test

dev: ## start the development server
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

migrate: ## run Alembic to migrate to head
	uv run alembic upgrade head

lint: ## Ruff check
	uv run ruff check .

test: ## Pytest
	uv run pytest -q