# AI 专栏 + 微前端改造施工计划

> **合作方式**：讲解原理 + 示例代码，由开发者手敲实现。Cursor 规则见 `.cursor/rules/08-teaching-mode.mdc`（`alwaysApply: true`，新 session 自动生效）。

## 目标

1. 在博客中增加 **AI 专栏**功能模块，提供每日前沿信息摘要、论文速读、工具追踪等学习辅助功能
2. 引入独立的 **Python 后端服务**（FastAPI），专责 AI Agent、数据抓取与内容生成
3. 将前端改造为基于 **Vite Module Federation** 的微前端架构，支持各子应用独立部署

---

## 技术选型

### 前端

| 方向 | 选型 | 理由 |
|---|---|---|
| 微前端方案 | Vite Module Federation (`@module-federation/vite`) | 与 Vite 7 + React 19 天然契合，无额外运行时，原生 ESM |
| 宿主应用 | React 19 + Vite 7 | 轻量 shell，负责路由分发和全局 layout |
| AI 专栏子应用 | React 19 + Vite 7 | 与现有技术栈一致 |
| 博客子应用 | 现有 `apps/client/` 改造 | 尽量少改，保持已有功能稳定 |

### Python 后端

| 方向 | 选型 | 理由 |
|---|---|---|
| Web 框架 | FastAPI | 异步原生，自动生成 OpenAPI 文档，类型友好 |
| 包管理 | uv | 极速依赖解析，替代 pip/poetry |
| Agent 框架 | LangGraph | 支持有状态的多步 Agent，适合抓取+生成流程 |
| LLM 可观测 | Langfuse | 与 LangChain / LangGraph 集成，按 trace 查看各节点 prompt、延迟与 token |
| 数据库迁移 | Alembic | SQLAlchemy 生态标配 |
| 任务调度 | APScheduler | 轻量，适合定时抓取任务，无需额外 broker |
| 数据源 | Tavily API + arXiv API + RSS | 前沿信息、论文、博客订阅 |

### 工程管理

| 方向 | 选型 | 理由 |
|---|---|---|
| Monorepo JS | pnpm workspace（保持不变） | 无需引入额外工具 |
| Python 管理 | uv + pyproject.toml（独立子目录） | 各管各的，不混用 |
| 跨语言协调 | 根目录 Makefile | 统一 dev/build/migrate/test 入口 |

### 数据库

- 共用同一个 PostgreSQL 实例
- Python 服务管理自己的表（`ai_` 前缀），用 Alembic 做迁移
- Node 服务继续用 Prisma 管理现有表
- 两侧不直接读写对方的表，通过 REST API 交互

---

## 最终目录结构

```
blog-fullstack/
├── Makefile                        ← 根目录统一入口
├── apps/
│   ├── shell/                      ← 新增：微前端宿主应用
│   │   ├── src/
│   │   │   ├── App.tsx             ← 全局 Layout、路由分发
│   │   │   └── main.tsx
│   │   └── vite.config.ts          ← Module Federation host 配置
│   ├── blog/                       ← 原 apps/client/ 改名
│   │   └── vite.config.ts          ← Module Federation remote 配置
│   ├── ai-portal/                  ← 新增：AI 专栏子应用
│   │   ├── src/
│   │   └── vite.config.ts          ← Module Federation remote 配置
│   ├── server/                     ← 原 apps/server/ 不动
│   └── ai-service/                 ← 新增：Python FastAPI 后端
│       ├── pyproject.toml
│       ├── alembic/
│       ├── app/
│       │   ├── main.py             ← FastAPI 入口
│       │   ├── routers/            ← 路由（articles, sources, digest）
│       │   ├── services/           ← 业务逻辑（fetch, generate, schedule）
│       │   ├── agents/             ← LangGraph agent 定义
│       │   └── models/             ← SQLAlchemy 模型
│       └── Makefile                ← Python 子项目命令
├── packages/                       ← 共享包不动
├── deploy/
│   ├── docker-compose.yml          ← 加入 ai-service 容器
│   └── nginx/blog.conf             ← 加入 /ai-api/ 代理
└── pnpm-workspace.yaml
```

---

## 施工计划

### Phase 0：准备工作（1-2天）

#### 0.1 根目录 Makefile

- [x] **0.1.1** 理解：Makefile 是跨语言 monorepo 的「统一遥控器」，把 pnpm / uv / docker 命令封装成语义化 target
- [x] **0.1.2** 在仓库根目录创建 `Makefile`（注意 Tab 缩进，不能用空格）
- [x] **0.1.3** 实现 `help` target（默认目标，打印所有命令说明）
- [x] **0.1.4** 实现 `install` → `pnpm install`
- [x] **0.1.5** 实现 `dev` → 并行启动 client + server（先复用现有 pnpm script，Python 服务 Phase 1 再加）
- [x] **0.1.6** 实现 `build` → `pnpm build`
- [x] **0.1.7** 实现 `lint` → `pnpm lint`
- [x] **0.1.8** 实现 `migrate` → `pnpm --filter @blog-fullstack/server prisma:migrate`（dev 迁移）
- [x] **0.1.9** 验证：`make help`、`make install`（可选）、`make dev` 能正常启动

#### 0.2 重命名 client → blog（Phase 4 微前端前置，但目录名先统一）

- [x] **0.2.1** 理解：rename 影响 package name、CI 路径、eslint glob；**先 grep 再改**
- [x] **0.2.2** `git mv apps/client apps/blog`
- [x] **0.2.3** 修改 `apps/blog/package.json`：`name` → `@blog-fullstack/blog`
- [x] **0.2.4** 修改根 `package.json`：`dev:client` → `dev:blog`，filter 改为 `@blog-fullstack/blog`
- [x] **0.2.5** 修改 `eslint.config.mjs`：`apps/client` → `apps/blog`
- [x] **0.2.6** 修改 `.gitlab-ci.yml`：build filter + `apps/blog/dist` rsync 路径
- [x] **0.2.7** 修改 `.prettierignore` / `.dockerignore`（如有 `apps/client` 引用）
- [x] **0.2.8** 运行 `pnpm install` 刷新 lockfile 中的 workspace 路径
- [x] **0.2.9** 验证：`pnpm dev:blog` + `pnpm dev:server`，博客功能正常

#### 0.3 本地 Python 环境

- [x] **0.3.1** 确认 Python ≥ 3.12：`python3 --version`
- [x] **0.3.2** 安装 uv：`curl -LsSf https://astral.sh/uv/install.sh | sh`（或 `brew install uv`）
- [x] **0.3.3** 验证：`uv --version`

---

### Phase 1：Python 后端骨架（3-5天）

**目标**：跑通 FastAPI 服务，能连接数据库，有一个可用的 `/health` 接口

- [x] **1.1** 在 `apps/ai-service/` 执行 `uv init`，配置 `pyproject.toml`（FastAPI、uvicorn、sqlalchemy、alembic、psycopg）
- [x] **1.2** 创建 `app/main.py`，挂载 `/health` 路由
- [x] **1.3** 配置 SQLAlchemy 连接 `DATABASE_URL`（复用 PostgreSQL，库名不变）
- [x] **1.4** `uv run alembic init alembic`，配置 `alembic.ini` + `env.py`
- [x] **1.4.1** ⚠️ 在 `alembic/env.py` 配置 `include_name`，**仅处理 `ai_*` 表**（见下方「共享库迁移安全」）
- [x] **1.5** 定义模型：`ai_sources`、`ai_articles`、`ai_digests`（表名带 `ai_` 前缀）
- [x] **1.6** 生成并执行首次迁移：`alembic revision --autogenerate` + `alembic upgrade head`
- [x] **1.6.1** ⚠️ **升级前人工审查** migration 文件：不得出现对 Prisma 表的 `drop_table` / `drop_index`
- [x] **1.7** 本地启动：`uv run uvicorn app.main:app --reload --port 8000`
- [x] **1.8** 验证：`curl http://localhost:8000/health` 返回 200
- [x] **1.9** 根 `Makefile` 加入 `dev-python` target
- [x] **1.10** `apps/ai-service/Makefile`：`dev` / `migrate` / `lint` / `test`

#### ⚠️ 共享库 Alembic 迁移安全（必读）

Python 与 Node **共用同一个 `blog` 数据库**：Prisma 管 `User`、`Post`、`_prisma_migrations` 等；Alembic 只管 `ai_*` 表。**这是高危操作场景**——配置不当或跳过审查，可能**误删 Prisma 表，导致博客数据丢失（等同删库）**。

**原因：`alembic revision --autogenerate` 的默认行为**

Autogenerate 对比两侧：

| 来源 A | 来源 B |
|---|---|
| Python `Base.metadata`（仅 `ai_*` model） | 数据库中**全部**已有表（含 Prisma） |

默认规则：「库里有、metadata 里没有」→ 生成 `op.drop_table(...)`。  
因此未隔离时，migration 可能包含 `drop_table('User')`、`drop_table('_prisma_migrations')` 等。**执行 `alembic upgrade head` 会直接破坏现有博客数据。**

**强制防护 1：`alembic/env.py` 配置 `include_name`**

在 `run_migrations_offline` 与 `run_migrations_online` 的 `context.configure(...)` 中传入：

```python
AI_TABLE_PREFIX = 'ai_'

def include_name(name, type_, parent_names):
    """共享 blog 库时，只让 Alembic 处理 ai_* 表，不碰 Prisma 表"""
    if type_ == 'table':
        return name.startswith(AI_TABLE_PREFIX)
    return True

context.configure(..., include_name=include_name)
```

**强制防护 2：升级前人工审查 migration 文件**

每次 autogenerate 后、**执行 upgrade 前**，打开 `alembic/versions/*.py` 检查：

- ✅ 只允许：`create_table` / `alter_table` / `drop_table` 等针对 **`ai_` 前缀** 的对象
- 🛑 若出现：`drop_table('User')`、`drop_table('Post')`、`drop_table('_prisma_migrations')` 或任何非 `ai_` 表 → **禁止 upgrade**，先修复 `env.py` 或手写 migration

推荐工作流：

```bash
uv run alembic revision --autogenerate -m "describe change"
# 1. 打开新生成的 versions/*.py 逐行审查
# 2. 确认无危险 drop 后再执行：
uv run alembic upgrade head
```

**其他可选隔离方案**（了解即可，当前采用表名前缀 + `include_name`）：

- 独立 PostgreSQL schema（如 Python 用 `ai` schema）
- 独立 database（如 `blog_ai`）
- 完全手写 migration、不用 autogenerate

---

### Phase 2：AI 内容生成核心功能（1-2周）

**目标**：每日自动抓取 AI 前沿信息，生成结构化文章，存入数据库

- [x] **2.1** 接入 Tavily API，实现关键词搜索抓取
- [x] **2.2** 接入 arXiv API，抓取热门论文摘要
- [x] **2.3** LangGraph Agent：筛选去重 → 归类 → 生成摘要 → 质量校验
- [x] **2.4** 接入 Langfuse v4：可观测 LangGraph 流水线内每一步 LLM 调用
  - [x] **2.4.1** 理解：Langfuse 用 **trace**（一次 pipeline）与 **observation**（span / generation 等，单次 LLM 为 generation）分层记录；便于按 `classify` / `summarize` / `quality_check` 排查 prompt 与 token
  - [x] **2.4.2** 注册 Langfuse Cloud（或自建），拿到 `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY`
  - [x] **2.4.3** `uv add langfuse`（当前 **v4.x**），在 `app/config.py` + `.env.example` 增加 `LANGFUSE_BASE_URL`（Cloud 默认 `https://cloud.langfuse.com`）、`LANGFUSE_ENABLED`（本地可关）、`LANGFUSE_PUBLIC_KEY` / `LANGFUSE_SECRET_KEY`
  - [x] **2.4.4** `uv add langchain`（v4 的 `langfuse.langchain.CallbackHandler` 依赖 `langchain` 元包）；在 `app/lib/llm.py` 初始化 `Langfuse(base_url=...)` + 于 `ainvoke_prompt` 的 `model.ainvoke(..., config={'callbacks': [...]})` 挂载 Callback，每次 LLM 调用自动上报并在末尾 `flush()`
  - [x] **2.4.5** 扩展 `ainvoke_prompt(run_name=..., metadata=...)`；在 `classify` / `summarize` / `quality_check` 传入 `metadata={'node': '...', 'langfuse_tags': ['ai-column']}`，UI 中可按节点名 / tag 筛选
  - [x] **2.4.6** （推荐）在 `run_pipeline` 外包一层 Langfuse v4 **trace**：`start_as_current_observation(name='daily-pipeline')` + `propagate_attributes(tags=['ai-column'])`，将单次 test/定时任务下的多步 LLM 归到同一 trace
  - [x] **2.4.7** 验证：跑 `scripts/test_pipeline.py`，在 Langfuse UI 看到 1 条 trace、多条 generation，且能区分节点名

  > **Langfuse v4 备忘**（相对 v3）：Client 用 `base_url`（非 `LANGFUSE_HOST`）；外层 trace 用 `start_as_current_observation()`（非 `start_as_current_span()`）；trace 级 `user_id` / `tags` 用 `propagate_attributes()`（非 `update_current_trace()`）；`CallbackHandler(update_trace=...)` 已移除。
- [ ] **2.5** APScheduler 每日定时任务（如 6:00）+ 流水线结果入库
  - [x] **2.5.1** `uv add "apscheduler>=3.10.4,<4"`；`config` + `.env.example` 增加 `SCHEDULER_*`、`TAVILY_DAILY_QUERY`（本地默认 `SCHEDULER_ENABLED=false`）
  - [x] **2.5.2** `app/services/daily_job.py`：Tavily（可选）+ arXiv → `run_pipeline` → 返回 `stats`
  - [x] **2.5.2a** arXiv 抓取优化（`arxiv_client.py`）：进程内单例 `Client`、`ARXIV_DELAY_SECONDS` / `ARXIV_NUM_RETRIES`；**按日内存缓存**（调度时区日桶，换日 `clear()`，仅保留当天；命中须 `return cached`）
  - [ ] **2.5.3** `app/services/article_store.py`：`ProcessedArticle` → `ai_sources` / `ai_articles`（按 `source + url` 去重；`url` 暂写入 `body` 尾部，见下「表结构缺口」）
  - [ ] **2.5.4** `app/services/scheduler.py` + `main.py` lifespan：`AsyncIOScheduler` cron 触发 `run_daily_job`（`max_instances=1`）
  - [ ] **2.5.5** `scripts/run_daily_job.py`：不启服务也可手动跑完整链路（含入库）
  - [ ] **2.5.6** 验证：跑脚本后 DB 有新增 `ai_articles`；`SCHEDULER_ENABLED=true` 时启动 uvicorn 可见 scheduler 注册日志

  > **表结构缺口（2.5.3 → 2.6 衔接）**：当前 `ai_articles` 无 `url` / `category` / `quality_score` 列。2.5.3 先用现有列入库；**2.6 前**用 Alembic 补列（推荐 `url` 唯一或 `(source_id, url)` 唯一），REST 与去重更干净。`ai_digests` 关联可放在 2.5 之后迭代。
- [ ] **2.6** REST API：`GET /articles`、`GET /articles/{id}`（前缀 `/ai-api` 由 Nginx 代理）
  - [ ] **2.6.0** （推荐）Alembic：`ai_articles` 增加 `url`、`category`、`quality_score` 等（autogenerate 后审查，仅 `ai_*`）
  - [ ] **2.6.1** `app/routers/articles.py` + `main.py` 挂载路由
  - [ ] **2.6.2** 列表分页 / 按 `status` 筛选；详情 404 处理
  - [ ] **2.6.3** 本地验证：`curl http://localhost:8000/articles`（或统一前缀 `/ai-api/articles` 与 Nginx 一致）

---

### Phase 3：AI 专栏前端子应用（1周）

**目标**：独立的 `apps/ai-portal/` 子应用，展示 AI 专栏内容

- [ ] **3.1** `pnpm create vite apps/ai-portal --template react-ts`，升级到 React 19
- [ ] **3.2** 加入 `pnpm-workspace.yaml`（`apps/*` 已覆盖则只需 `pnpm install`）
- [ ] **3.3** 文章列表页 + 详情页
- [ ] **3.4** 对接 ai-service REST API
- [ ] **3.5** 独立 SPA 跑通（暂不接 Module Federation）

---

### Phase 4：微前端改造（1-2周）

**目标**：`apps/shell/` 作为宿主，`apps/blog/` 和 `apps/ai-portal/` 作为子应用

- [ ] **4.1** 安装 `@module-federation/vite`（shell / blog / ai-portal）
- [ ] **4.2** 创建 `apps/shell/`：Layout + 路由 `/` → blog、`/ai` → ai-portal
- [ ] **4.3** 改造 `apps/blog/` 为 remote，暴露根组件
- [ ] **4.4** 改造 `apps/ai-portal/` 为 remote，暴露根组件
- [ ] **4.5** 配置 shared 依赖（react、react-dom、antd singleton）
- [ ] **4.6** 本地联调：shell 加载两个子应用

---

### Phase 5：部署更新（2-3天）

- [ ] **5.1** `deploy/docker-compose.yml` 加入 `ai-service`
- [ ] **5.2** `apps/ai-service/Dockerfile`（python:3.12-slim + uv）
- [ ] **5.3** Nginx `/ai-api/` → `ai-service:8000`
- [ ] **5.4** GitLab CI：Python lint/test + 三前端 build
- [ ] **5.5** 服务器 `.env` 配置 `TAVILY_API_KEY` 等

---

### Phase 6：扩展功能（持续迭代）

- [ ] 论文速读（arXiv → 问题/方法/结论/意义）
- [ ] AI 工具追踪（GitHub trending、Hugging Face）
- [ ] 知识图谱
- [ ] RAG 问答
- [ ] 视频摘要（YouTube 字幕）

---

## 风险与注意事项

| 风险 | 应对 |
|---|---|
| **Alembic autogenerate 误删 Prisma 表（共享库，极高危）** | `env.py` 配置 `include_name` 仅处理 `ai_*`；**每次 upgrade 前审查** migration，禁止对非 `ai_` 表执行 `drop_table` |
| 微前端改造影响现有博客功能 | Phase 4 最后做，改造期间 `apps/blog/` 保持独立可运行 |
| Module Federation 共享依赖版本冲突 | 统一在 shell 声明 shared，子应用标记 singleton |
| Python 服务内存占用影响 ECS | 先用 APScheduler 轻量方案，如有压力再迁移到独立队列 |
| 每日抓取内容质量不稳定 | Agent 加质量校验节点，低质量内容标记为草稿而非直接发布 |
| Langfuse trace 含原文/摘要 | 生产注意脱敏与 retention；`LANGFUSE_*` 仅放 `.env`，勿提交仓库 |
| **arXiv API 429 / 限流** | 遵守 [API 手册](https://info.arxiv.org/help/api/user-manual.html)（≥3s 间隔、同 query 每天约 1 次）；单例 `Client` + 按日缓存 + 开发勿连跑脚本；**勿伪造 UA 绕限速** |
| 进程内 arXiv 缓存 | 仅当日、仅本进程；多副本部署时各进程各缓存，或改 DB 缓存 |
| 重复跑 daily job 重复发文 | 2.5.3 按 `url`（或 title+source）去重；补 Alembic `url` 列后可用 DB 唯一约束 |
| CI 构建时间变长 | Python 依赖用 uv 缓存，Module Federation 各子应用可并行构建 |

---

## 进度日志（可选）

| 日期 | 完成步骤 | 备注 |
|---|---|---|
| 2026-05-24 | 2.4、2.5.1–2.5.2a | Langfuse trace；daily_job；arXiv 日桶缓存 |
