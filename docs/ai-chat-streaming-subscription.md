# AI Chat 流式改造教学说明（GraphQL Subscription）

本文按“改动点 -> 为什么 -> 怎么做 -> 注意事项”的结构讲解本次流式改造，目标是让你不仅能用，还能复用这套模式到别的实时功能。

## 1) 为什么选 Subscription，而不是 SSE 或轮询

- **保持架构一致性**：你的项目已经以 GraphQL 为 BFF 边界，Subscription 可以继续沿用 schema、codegen、generated types 这一整套工程约束。
- **客户端心智一致**：Apollo 通过 `split` 同时管理 query/mutation/subscription，调用体验统一，不会引入一套并行的 REST/SSE 协议层。
- **类型安全完整**：事件 payload 进入 schema 后，服务端 resolver 参数、客户端 operation 响应都由 codegen 生成，减少“字符串协议”错误。

> 结论：在你当前项目中，Subscription 是“最小心智切换、最大工程一致性”的方案。

## 2) Schema 设计：为什么要定义事件类型而不是直接返回 String

文件：`apps/server/src/graphql/schema/ai.graphql`

新增类型 `AiChatStreamEvent`，字段包括：
- `chunk`: 当前增量文本
- `done`: 是否结束
- `model`: 实际模型名（便于排查和观测）
- `createdAt`: 服务端事件时间
- `error`: 流式过程中的可恢复错误信息

同时新增：
- `Subscription.aiChatStream(messages, model, temperature): AiChatStreamEvent!`

**教学点**：
- 流式不是“不断返回完整 reply”，而是“不断返回事件”；事件模型比裸文本更适合扩展。
- `done` 显式化可避免客户端靠“超时猜测结束”。
- `error` 放入事件可让 UI 在流中断时仍有可读反馈。

## 3) 严格 codegen 流程：为什么要先改 schema 再写代码

执行：
- `pnpm --filter @blog-fullstack/server codegen`
- `pnpm --filter @blog-fullstack/client codegen`

**教学点**：
- 先生成类型，再写 resolver/client，可把“不匹配 schema 的实现”在编译期直接阻断。
- 这一步是你规则 `schema -> codegen -> generated types` 的核心落地点。

## 4) 服务端传输层：为什么要在 Apollo 旁边接入 graphql-ws

文件：`apps/server/src/app.ts`

关键改动：
- 使用 `WebSocketServer` 挂在已有 `httpServer` 上（路径 `/graphql`）。
- 用 `useServer` 接入 `graphql-ws`。
- Apollo 使用 `makeExecutableSchema` 生成的 schema。
- 增加 drain 生命周期，确保服务关闭时 ws 连接被正确释放。

**教学点**：
- HTTP GraphQL 和 WS GraphQL 可以共用同一套 schema/resolvers，但传输层不同。
- 没有 drain 清理时，开发环境热重启或生产滚动发布容易出现连接泄漏。

## 5) 鉴权统一：为什么要把 auth 逻辑抽成 Header 版本

文件：`apps/server/src/middleware/auth.ts`

新增：
- `createAuthContextFromAuthorizationHeader()`

保留：
- `createAuthContext(req)`（HTTP 入口继续可用）

**教学点**：
- HTTP 场景拿 `req.headers.authorization`，WS 场景拿 `connectionParams.authorization`。
- 把“解析与查库逻辑”集中在一个函数，避免两套鉴权逻辑漂移。

## 6) Ollama 流式封装：为什么用 async generator

文件：`apps/server/src/lib/ollama.ts`

新增：
- `generateTextStreamWithOllama(options): AsyncGenerator<OllamaStreamChunk>`

实现要点：
- 请求 `stream: true`
- 按 NDJSON 每行解析 JSON
- 逐条 `yield { chunk, done, model, createdAt }`
- 保留 `AbortController` 超时中断

**教学点**：
- `AsyncGenerator` 是 resolver 流式输出最自然的数据结构，支持“边读边产出”。
- NDJSON 常见坑是“分包不按行对齐”，所以必须维护 `buffer` 拼接后再按换行切割。

## 7) Subscription Resolver：为什么要用“单字段 payload 包装”

文件：`apps/server/src/graphql/resolvers/aiResolver.ts`

新增：
- `Subscription.aiChatStream.subscribe`

关键实现：
- `requireAuth(context)` 继续生效
- 调用 `generateTextStreamWithOllama` 逐 chunk `yield`
- `resolve: payload => payload.aiChatStream`

**教学点**：
- GraphQL subscription 的默认字段解析通常期望 `yield { fieldName: value }` 结构。
- done/error 在 resolver 内显式发事件，客户端状态收口更稳定。

## 8) 客户端 Apollo Split：为什么 query/mutation 与 subscription 要分流

文件：`apps/client/src/lib/apollo.ts`

关键改动：
- 新增 `GraphQLWsLink`
- 根据 operation 类型 `split`：
  - query/mutation -> `HttpLink`
  - subscription -> `GraphQLWsLink`
- WS `connectionParams` 同步 Bearer Token

**教学点**：
- 这是“一个 ApolloClient 同时支持两种传输”的标准模式。
- 如果不传 token，WS 握手会通过但业务鉴权失败，表现为订阅一连接就报未授权。

## 9) 页面流式渲染策略：为什么先插入 AI 占位消息再 append

文件：`apps/client/src/pages/ai/AiChatPage.tsx`

关键策略：
- 用户发送后，先插入：
  - 用户消息
  - 空内容的 AI 占位消息
- 订阅每次收到 chunk，都追加到同一条 AI 消息内容。
- `done/error/complete` 统一收口 loading。

**教学点**：
- 这样可避免“每个 chunk 生成一条新消息”的 UI 抖动。
- 对 markdown 内容尤其重要：单消息持续增长的阅读体验最好。

## 10) 验证清单（建议每次改造后都走）

1. 生成类型：server/client codegen 都通过。
2. 编译：server/client build 都通过。
3. 交互验证：
   - 长回复能逐段增长；
   - done 后按钮 loading 关闭；
   - token 失效时有明确错误；
   - 中断后不会卡在“正在发送”。

## 11) 常见问题与排查思路

- **现象：无流式，只在最后一次性出现**
  - 排查：`ollama.ts` 是否仍是 `stream: false`。
- **现象：订阅建立但一直没数据**
  - 排查：客户端是否走到了 WS link（split 条件是否命中 subscription）。
- **现象：401/未授权**
  - 排查：WS `connectionParams.authorization` 是否携带 Bearer token。
- **现象：UI 一直 loading**
  - 排查：`done/error/complete` 三个分支是否都执行了状态收口。
