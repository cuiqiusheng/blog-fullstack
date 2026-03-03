# GraphQL 列表接口性能优化实战：从 90KB/900ms 到 10KB/200ms

## 问题背景

在一个基于 React + Apollo Client + Node.js + Prisma + PostgreSQL 的全栈博客系统中，随着文章数量和功能的增长，我们注意到文章列表页面的加载速度明显下降。通过浏览器 DevTools 的 Network 面板观察发现：

- **响应体大小**：`posts` 接口返回 10 条数据时，响应体达到 **~90KB**
- **接口耗时**：请求耗时超过 **900ms**
- **用户体验**：页面白屏时间明显过长，翻页卡顿

这对于一个仅展示标题、摘要和元信息的列表页来说，是不可接受的。

## 问题诊断

### 1. 传输层瓶颈：content 全量返回

通过分析 GraphQL 查询和响应，我们发现了最直接的问题——**文章全文在列表接口中被完整返回**。

#### 客户端 GraphQL 查询（优化前）

```graphql
query Posts($limit: Int, $offset: Int, ...) {
  posts(limit: $limit, offset: $offset, ...) {
    id
    title
    content          # 完整的 Markdown 全文，单篇可达 8KB+
    topic
    subtopic
    wordCount
    createdAt
    author { id, email, nickname, avatarUrl }
    interactionInfo { liked, likeCount, bookmarked, bookmarkCount, commentCount }
  }
}
```

#### 服务端 Prisma 查询（优化前）

```typescript
export async function listPosts(options: ListPostsOptions = {}) {
  return prisma.post.findMany({
    where,
    include: postAuthorInclude,  // 只限制了 author 的字段
    orderBy,
    take: options.limit ?? 20,
    skip: options.offset ?? 0,
    // 没有 select → Prisma 默认返回所有列，包括完整 content
  });
}
```

**关键发现**：列表页对 `content` 的使用仅有两处：
1. `createExcerpt(content, 160)` — 截取前 160 个字符作为摘要
2. `estimateReadMinutes(content)` — 根据全文估算阅读时长

也就是说，8KB 的全文数据传到前端，只用了 160 个字符。10 篇文章就是 **~80KB 的无效传输**。

### 2. 数据库瓶颈：interactionInfo 的 N+1 查询

第二个问题更为隐蔽——GraphQL 的 field resolver 模式导致了经典的 **N+1 查询问题**。

#### Post.interactionInfo Field Resolver（优化前）

```typescript
Post: {
  interactionInfo: async (parent: { id: string }, _, context) => {
    const userId = context.user?.id ?? null;
    return getPostInteractionInfo(parent.id, userId);
  },
}
```

#### getPostInteractionInfo 实现

```typescript
export async function getPostInteractionInfo(postId: string, userId: string | null) {
  const [likeCount, bookmarkCount, commentCount, liked, bookmarked] = await Promise.all([
    prisma.postLike.count({ where: { postId } }),
    prisma.postBookmark.count({ where: { postId } }),
    prisma.postComment.count({ where: { postId } }),
    userId ? prisma.postLike.findUnique({ where: { userId_postId: { userId, postId } } }) : false,
    userId ? prisma.postBookmark.findUnique({ where: { userId_postId: { userId, postId } } }) : false,
  ]);
  return { liked, likeCount, bookmarked, bookmarkCount, commentCount };
}
```

**调用链分析**：

```
posts 查询返回 10 篇文章
  → 触发 10 次 Post.interactionInfo field resolver
    → 每次执行 5 个并行 Prisma 查询（3 次 count + 2 次 findUnique）
      → 总计 50 次数据库查询！
```

虽然每次 `getPostInteractionInfo` 内部的 5 个查询是并行的，但 10 篇文章的 10 次调用在 GraphQL 引擎层面是逐个触发的（取决于执行器的实现），总的数据库往返次数仍然很高。

### 3. 次要问题：postNeighbors 接口过度查询

文章详情页的"上一篇/下一篇"导航功能，客户端只需要 `id`、`title`、`seriesKey`、`seriesOrder` 四个字段，但服务端通过 `getPostById` 返回了完整的 Post 对象（含全文 content 和关联的 author）。

## 优化方案设计

### 方案 1：新增 excerpt 计算字段，消除 content 全量传输

**核心思路**：在 GraphQL Schema 的 `Post` 类型上新增一个 `excerpt` 字段，由服务端 field resolver 计算截取，客户端列表查询请求 `excerpt` 而非 `content`。

**为什么选择服务端计算而非客户端截取？**

| 方案 | 优点 | 缺点 |
|------|------|------|
| 客户端截取（现状） | 实现简单 | 需要传输完整 content，浪费带宽 |
| 服务端 excerpt 字段 | 不传 content，传输量极小 | 需要新增 schema 字段 |
| 数据库存储 excerpt | 数据库查询时也能减少 I/O | 需要 migration，数据冗余 |

我们选择了**服务端计算字段**方案：灵活性好（不需要 migration），效果显著（消除大量传输），实现简单。

**阅读时长的优化**：数据库中已有 `wordCount` 字段（文章保存时预计算），可以直接用 `wordCount / 260` 估算阅读时长，不再需要传输全文来计算。

### 方案 2：DataLoader 批量查询，解决 N+1

**核心思路**：引入 [DataLoader](https://github.com/graphql/dataloader)，将同一 GraphQL 请求中多次 `interactionInfo` 的单条查询，自动合并为一次批量查询。

**DataLoader 工作原理**：

```
GraphQL 执行器遍历 10 篇文章
  → 10 次调用 loader.load(postId)（同一事件循环 tick）
  → DataLoader 收集所有 postId
  → 下一个 tick 统一调用 batchFn([postId1, postId2, ..., postId10])
  → 一次批量查询返回所有结果
```

**批量查询实现**：用 Prisma 的 `groupBy` 替代多次 `count`，用 `findMany` 替代多次 `findUnique`：

| 操作 | 优化前（单条） | 优化后（批量） |
|------|---------------|---------------|
| 点赞数 | `count({ where: { postId } })` × 10 | `groupBy({ by: ['postId'], where: { postId: { in: ids } } })` × 1 |
| 收藏数 | 同上 × 10 | 同上 × 1 |
| 评论数 | 同上 × 10 | 同上 × 1 |
| 是否点赞 | `findUnique(...)` × 10 | `findMany({ where: { postId: { in: ids }, userId } })` × 1 |
| 是否收藏 | 同上 × 10 | 同上 × 1 |
| **总计** | **50 次 DB 查询** | **5 次 DB 查询** |

### 方案 3：postNeighbors 精简查询

将 `getPostById`（返回完整 Post）替换为 `prisma.post.findUnique({ select: { id, title, seriesKey, seriesOrder } })`，只查询客户端实际需要的字段。

## 实施过程

### 实施 1：excerpt 字段

#### 1.1 GraphQL Schema 扩展

```graphql
type Post {
  id: ID!
  title: String!
  content: String!
  excerpt: String        # 新增：服务端计算的内容摘要
  topic: String
  # ...
}
```

#### 1.2 Field Resolver 实现

```typescript
// apps/server/src/graphql/resolvers/postResolver.ts
Post: {
  excerpt: (parent: { content: string }) => createExcerpt(parent.content, 200),
},
```

`createExcerpt` 是一个纯函数，将空白符归一化后截取前 200 个字符：

```typescript
function createExcerpt(content: string, maxLength = 200): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}
```

#### 1.3 客户端查询优化

```graphql
# 优化后：列表查询不再请求 content
query Posts($limit: Int, $offset: Int, ...) {
  posts(limit: $limit, offset: $offset, ...) {
    id
    title
    excerpt       # 替代 content
    wordCount     # 用于计算阅读时长
    topic
    # ...
  }
}
```

#### 1.4 前端组件适配

```tsx
// 优化前
<Text>{createExcerpt(item.content, 160)}</Text>
<Text>{estimateReadMinutes(item.content)} min</Text>

// 优化后
<Text>{item.excerpt}</Text>
<Text>{estimateReadMinutesFromWordCount(item.wordCount ?? 0)} min</Text>
```

新增的 `estimateReadMinutesFromWordCount` 基于字数计算，不再需要全文：

```typescript
export function estimateReadMinutesFromWordCount(wordCount: number): number {
  const charsPerMinute = 260;
  return Math.max(1, Math.ceil(wordCount / charsPerMinute));
}
```

### 实施 2：DataLoader 批量查询

#### 2.1 创建 InteractionLoader

```typescript
// apps/server/src/graphql/dataloader/interactionLoader.ts
import DataLoader from 'dataloader';
import { prisma } from '@/lib/prisma';

export function createInteractionLoader(userId: string | null) {
  return new DataLoader<string, PostInteractionInfo>(async (postIds) => {
    const ids = [...postIds];

    const [likeCounts, bookmarkCounts, commentCounts, userLikes, userBookmarks] =
      await Promise.all([
        prisma.postLike.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        prisma.postBookmark.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        prisma.postComment.groupBy({
          by: ['postId'],
          where: { postId: { in: ids } },
          _count: { postId: true },
        }),
        userId
          ? prisma.postLike.findMany({
              where: { postId: { in: ids }, userId },
              select: { postId: true },
            })
          : Promise.resolve([]),
        userId
          ? prisma.postBookmark.findMany({
              where: { postId: { in: ids }, userId },
              select: { postId: true },
            })
          : Promise.resolve([]),
      ]);

    // 构建查找 Map，O(1) 查找
    const likeCountMap = new Map(likeCounts.map((r) => [r.postId, r._count.postId]));
    const bookmarkCountMap = new Map(bookmarkCounts.map((r) => [r.postId, r._count.postId]));
    const commentCountMap = new Map(commentCounts.map((r) => [r.postId, r._count.postId]));
    const likedSet = new Set(userLikes.map((r) => r.postId));
    const bookmarkedSet = new Set(userBookmarks.map((r) => r.postId));

    // DataLoader 要求返回顺序与输入 key 顺序一致
    return ids.map((postId) => ({
      liked: likedSet.has(postId),
      likeCount: likeCountMap.get(postId) ?? 0,
      bookmarked: bookmarkedSet.has(postId),
      bookmarkCount: bookmarkCountMap.get(postId) ?? 0,
      commentCount: commentCountMap.get(postId) ?? 0,
    }));
  });
}
```

#### 2.2 注入 GraphQL Context

DataLoader 实例必须按请求创建（每个请求一个独立的批量窗口和缓存），不能全局共享：

```typescript
// apps/server/src/app.ts
context: async (): Promise<GraphQLContext> => {
  const auth = await createAuthContext(req);
  return {
    ...auth,
    req,
    loaders: createDataLoaders(auth.user?.id ?? null),
  };
},
```

#### 2.3 Resolver 使用 DataLoader

```typescript
// 优化前
Post: {
  interactionInfo: async (parent, _, context) => {
    return getPostInteractionInfo(parent.id, context.user?.id ?? null);
  },
}

// 优化后
Post: {
  interactionInfo: async (parent, _, context) => {
    return context.loaders.interactionInfo.load(parent.id);
  },
}
```

改动只有一行，但效果是从 50 次 DB 查询变为 5 次。

### 实施 3：postNeighbors 精简

```typescript
// 优化前：返回完整 Post（含 content + author 关联查询）
const [prev, next] = await Promise.all([
  prevRow ? getPostById(prevRow.id) : null,
  nextRow ? getPostById(nextRow.id) : null,
]);

// 优化后：只查询需要的 4 个字段
const neighborSelect = { id: true, title: true, seriesKey: true, seriesOrder: true };
const [prev, next] = await Promise.all([
  prevRow ? prisma.post.findUnique({ where: { id: prevRow.id }, select: neighborSelect }) : null,
  nextRow ? prisma.post.findUnique({ where: { id: nextRow.id }, select: neighborSelect }) : null,
]);
```

## 优化效果

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 响应体大小（10 条） | ~90KB | ~10KB | **减少 ~89%** |
| DB 查询次数 | 51 次（1 + 50） | 6 次（1 + 5） | **减少 ~88%** |
| 接口耗时 | 900ms+ | <200ms（预期） | **减少 ~78%** |
| 无效数据传输 | ~80KB（content 全文） | 0 | **完全消除** |

## 技术要点总结

### 1. GraphQL 的 N+1 问题

GraphQL 的 field resolver 机制天然容易产生 N+1 问题。当一个列表查询返回 N 个对象，每个对象的某个字段需要额外查询时，就会触发 N 次额外的数据库调用。

**识别方法**：
- 在 field resolver 中看到数据库查询调用
- 该 resolver 作用于列表场景中的每个元素

**解决方法**：
- **DataLoader**（推荐）：自动收集同一事件循环中的所有 `load()` 调用，合并为一次批量请求
- **预加载**：在父查询中一次性查出所有关联数据，通过 context 或 parent 传递给 field resolver

### 2. Prisma 的 select vs include

- `include` 只指定关联表的查询方式，主表字段全量返回
- `select` 精确指定返回哪些列，可从数据库层面减少 I/O
- 对于包含大文本字段（如 `content`）的表，`select` 排除大字段可显著减少数据库到应用的传输量

### 3. GraphQL Schema 设计的"按需字段"模式

在 Schema 中为同一数据提供不同粒度的字段（如 `content` + `excerpt`），让客户端根据场景按需请求，是一种常见且有效的 API 设计模式。

### 4. DataLoader 的使用注意事项

- **按请求创建**：DataLoader 实例必须在每个 HTTP 请求的 context 中创建，不能全局共享。因为 DataLoader 内置缓存，全局共享会导致跨请求数据泄露
- **保持顺序**：`batchFn` 的返回值顺序必须与输入 keys 的顺序完全一致，这是 DataLoader 的核心契约
- **错误处理**：如果批量查询中某个 key 失败，应该返回 `Error` 实例而非抛出异常，否则会导致整个批次失败

## 延伸优化方向

1. **Prisma select 精简列表查询**：在 `listPosts` 中使用 `select` 代替 `include`，在数据库层面排除 `content` 字段的读取，进一步减少数据库 I/O
2. **Redis 缓存互动计数**：对 likeCount、commentCount 等热点数据进行 Redis 缓存，设置短 TTL（如 30s），在写操作时更新缓存
3. **连接式分页（Cursor-based Pagination）**：用游标分页替代 offset 分页，避免大 offset 导致的性能退化
4. **User 字段 DataLoader**：对 `followerCount`、`followingCount`、`postCount` 等 User 类型的 field resolver 也引入 DataLoader，解决关注列表等场景的 N+1 问题
5. **响应压缩**：启用 GraphQL 响应的 gzip 压缩，进一步减少传输体积
6. **查询复杂度限制**：通过 Apollo Server 的查询复杂度分析插件，防止客户端发起深度嵌套或高代价的查询
