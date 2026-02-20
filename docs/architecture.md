## 项目介绍与总结

### 一、项目概览

这是一个基于 **pnpm monorepo** 的全栈博客应用（`blog-fullstack`），集成了 AI 聊天能力。项目采用 **GraphQL BFF（Backend for Frontend）** 架构，前后端通过 GraphQL schema 作为契约进行通信，并使用 codegen 自动生成类型代码，实现端到端的类型安全。

---

### 二、技术栈

| 层级 | 技术选型 |
|------|---------|
| **前端** | React 19 + Vite 7 + Apollo Client 4 + Ant Design 6 + React Router 7 + i18next |
| **后端** | Node.js + Express 5 + Apollo Server 5 + Prisma 7 + PostgreSQL |
| **AI 能力** | Ollama（本地大模型推理） |
| **实时通信** | GraphQL Subscriptions（WebSocket） |
| **包管理** | pnpm workspace monorepo |
| **代码质量** | ESLint + Prettier + Husky + Commitlint + lint-staged |

---

### 三、Monorepo 结构

```
blog-fullstack/
├── apps/
│   ├── client/          # React 前端应用
│   └── server/          # Node.js 后端 BFF
├── packages/
│   ├── content-utils/   # 文章解析/验证工具（共享）
│   └── markdown-renderer/ # Markdown 渲染组件（共享）
├── pnpm-workspace.yaml
└── package.json         # 根编排脚本
```

- `packages/*` 存放前后端复用的共享包，职责清晰。
- 根目录通过 `pnpm --filter` 统一编排 `dev`、`build`、`codegen`、`lint` 等命令。

---

### 四、后端架构（`apps/server`）

#### 分层设计

```
GraphQL Schema → Resolvers → Service → Prisma (数据库)
```

1. **Schema 层**（`graphql/schema/*.graphql`）：契约定义，包含 Auth、Post、Chat、AI 四个域。
2. **Resolver 层**（`graphql/resolvers/`）：接收请求并委托给 service 层，不包含业务逻辑。
3. **Service 层**（`service/`）：核心业务逻辑，按领域组织：
   - `article-generation/` — 批量文章生成（含提示词构建、校验、持久化、调度、并发控制、重试）
   - `chat/` — 会话管理（CRUD、流式回复、自动标题生成）
   - `post/` — 文章查询（过滤、排序、分页、系列导航）
   - `user/` — 角色管理（RBAC）
4. **中间件层**（`middleware/`）：JWT 认证上下文构建、请求日志（结构化日志 + 请求关联 ID）。
5. **基础设施层**（`lib/`）：Prisma 客户端、Ollama 客户端封装。

#### 数据模型（Prisma）

- **User** — 用户，关联 Post、ChatTopic、角色
- **Role / UserRole** — RBAC 角色系统
- **Post** — 文章（支持 DRAFT/PUBLISHED/ARCHIVED 状态、系列文章、批量生成追踪）
- **ChatTopic / ChatMessage** — AI 聊天会话与消息（支持流式状态 STREAMING/COMPLETED/FAILED）

#### AI 集成

- 通过 **Ollama** 实现本地大模型推理，支持：
  - 单次对话（`aiChat` mutation）
  - 流式对话（`aiChatStream` subscription / `chatSessionStream` subscription）
  - 批量文章自动生成（定时调度 + 并发控制 + 重试机制）
  - 聊天标题自动生成

#### 实时能力

- 使用 `graphql-ws` 实现 WebSocket subscriptions，用于 AI 聊天的流式回复推送。

---

### 五、前端架构（`apps/client`）

#### 目录组织

```
src/
├── app/        # 应用组合层（路由、主题、入口）
├── pages/      # 路由级页面组件
├── features/   # 业务功能模块（跨页面复用）
├── shared/     # 通用工具/hooks
├── lib/        # 基础设施适配器（Apollo、Auth、i18n）
├── graphql/    # GraphQL 操作定义 + 生成代码
└── locales/    # 国际化资源（en / zh-CN）
```

#### 路由与页面

| 路由 | 页面 | 说明 |
|------|------|------|
| `/login` | LoginPage | 登录（公开，已登录则重定向） |
| `/register` | RegisterPage | 注册（公开） |
| `/home` | HomePage | 首页（展示所有文章列表） |
| `/posts` | PostListPage | 我的文章列表 |
| `/posts/:id` | PostDetailPage | 文章详情（Markdown 渲染、系列导航） |
| `/ai/:topicId?` | AiChatPageV2 | AI 聊天（会话管理 + 流式对话） |

- 使用 `React.lazy` 实现路由级代码分割。
- 路由守卫：`ProtectedRoute`（需登录）、`PublicOnlyRoute`（已登录跳转）。

#### 核心功能模块

**1. 文章系统（`features/posts` + `pages/posts`）**
- 文章列表：搜索、话题/子话题筛选、状态过滤、排序、分页
- URL 驱动的状态管理（筛选条件同步到 URL）
- 文章详情：Markdown 渲染、元数据展示、系列文章前后导航

**2. AI 聊天（`features/ai-chat` + `pages/ai`）**
- 完整的会话式 AI 聊天界面
- `useChatSessionController` — 核心控制 hook，管理会话生命周期
- `reducer.ts` — 用 useReducer 管理聊天线程状态（消息追加、流式分块、阶段切换）
- `TopicSidebar` — 左侧会话列表（新建、归档、删除）
- `ChatThread` — 消息展示（用户/助手消息、Markdown 渲染、加载/错误状态）
- `ChatComposer` — 输入组件（自适应高度、回车发送）
- GraphQL Subscription 实现流式响应

**3. 布局与导航（`features/layout`）**
- 顶部导航栏（菜单 + 语言切换 + 登出）
- 统一布局包装

**4. 认证**
- JWT token 存储在 localStorage
- Apollo Link 自动注入 Authorization header
- 路由级权限控制

#### 国际化

- 支持中文（zh-CN）和英文（en）
- 所有用户可见文案均走 i18n
- 语言切换持久化到 localStorage

#### GraphQL 集成

- 操作定义在 `graphql/operations/*.graphql`
- 通过 `@graphql-codegen/client-preset` 生成类型化的 hooks/documents
- Apollo Client 配置：HTTP Link + WS Link（split 策略）+ Auth Link + InMemoryCache

---

### 六、架构亮点

1. **契约驱动开发（Schema-First）**：GraphQL schema 作为前后端的唯一契约来源，双端 codegen 保证类型一致性。
2. **清晰的分层边界**：后端 Resolver → Service → Prisma 三层分离；前端 Pages → Features → Shared 分层明确。
3. **AI 原生集成**：通过 Ollama 本地部署大模型，支持流式对话和批量内容生成，是一个将 AI 能力深度融入传统 CRUD 应用的实践。
4. **实时通信**：基于 GraphQL Subscriptions + WebSocket 的流式推送，用户体验接近主流 AI 聊天产品。
5. **Monorepo 治理**：pnpm workspace + 共享包 + 统一编排脚本，开发体验一致。
6. **工程规范完善**：commitlint + husky + lint-staged + ESLint + Prettier，保证代码质量和提交规范。

---

### 七、总结

这是一个**功能完整、架构清晰的全栈博客 + AI 聊天应用**。它不仅实现了传统博客的用户认证、文章 CRUD、列表筛选排序等标准功能，还深度集成了基于 Ollama 的 AI 能力——包括流式 AI 聊天对话和自动化文章批量生成。

项目在架构上遵循了清晰的分层原则和契约驱动模式，通过 GraphQL codegen 实现了端到端的类型安全，通过 monorepo 实现了代码复用和统一管理。`.cursor/rules/` 目录下的 7 份治理规则文档也体现了对架构演进的系统性思考——确保项目在持续迭代中保持结构一致性和可维护性。