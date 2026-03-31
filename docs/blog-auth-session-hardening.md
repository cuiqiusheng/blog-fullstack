# JWT 过期后界面「半登录」：我踩过的坑和改法

这篇记录的是个人项目里真实遇到的一类问题：用户明明已经「算过期了」，前端却还当他是登录用户，路由不拦、导航栏像登录态，接口却一批一批报错。改完之后顺手把过程记下来，方便以后自己查，也希望能帮读者少绕几圈。

## 现象长什么样

概括起来三件事：

1. **JWT 设了 7 天过期**，过期后服务端校验失败，带 `Bearer` 的请求在需要登录的 resolver 上会返回 `UNAUTHENTICATED`。
2. **产品上有「游客」路径**：没账号也能逛广场、看文章，所以并不是所有页面都要跳登录。
3. **过期之后体验很怪**：有的页面还能进「会员区」，头像区可能还挂着旧数据，一点赞、一刷新或一进个人页就报错；想手动去登录页，有时还会被路由当成「已登录」给重定向走。

也就是说，既不是干净的「已登录」，也不是干净的「游客」，卡在中间。

## 根因其实就几条（拆开说就不玄乎）

### 1. 前端把「有没有 token 字符串」当成了「是否登录」

很多教程示例都是：`localStorage` 里有 token 就算登录。这在 token **永不过期**或者从不严格校验时勉强能跑；一旦服务端不认这个 token 了，前端还在 `!!getToken()`，**路由守卫和导航就会继续按登录态画 UI**。

服务端和客户端对「你是谁」的判断不一致，是混乱的主要来源。

### 2. `me` 这类查询的缓存策略在帮倒忙

如果 `me` 用 `cache-first`，曾经成功过一次的用户信息会长期躺在 Apollo 缓存里。token 已经废了，界面还能短暂显示「上一个自己」，和接口错误叠在一起，用户更懵。

### 3. 游客也会打到 `me`（如果你无差别发这个 query）

我们后端的 `me` 在未登录时是 `requireAuth` 直接抛错，GraphQL 里就是带 `UNAUTHENTICATED` 的错误。若前端在**没 token**的情况下仍然发 `me`，每个游客请求都会失败——控制台吵，也容易和「真的会话失效」混在一起。

所以后面做了一件事：**没有 token 就不要发 `me`**。

### 4. 清 token 不会自动触发 React 重渲染

就算你在某个回调里 `localStorage.removeItem`，`useAuth` 如果只是渲染时读一遍存储，**组件不知道要更新**，界面会继续显示旧的「已登录」直到用户点来点去触发别的渲染。

所以需要一种「token 变了就通知订阅者」的机制；我用的是 `useSyncExternalStore` 配一个简单的 subscribe。

## 方案上我考虑过什么

**只改 `useAuth` 去读 JWT 的 `exp`？**  
能缓解「过期当天」的展示问题，但：前端解码 payload **不能代替服务端校验**（密钥、吊销、时钟偏差都在服务端），最多做辅助。真要严谨，仍以服务端返回为准。

**上 Refresh Token？**  
这是业界很常见的下一层：短 access + 长 refresh，静默续期，用户少被打断。但它要动服务端存储、轮换策略、登出撤销，工程量明显大一档。我先把**「失效后的一致体验」**做稳，refresh 留给二期。

**我最终选的主线**（成本小、收益大）：

1. Apollo **ErrorLink**：在响应里识别 GraphQL 的 `UNAUTHENTICATED`，在合适的条件下清 token、清缓存，并通知应用做跳转或提示。
2. **这里有个必须写进代码注释的坑**：并不是所有 `UNAUTHENTICATED` 都要「踢下线」。例如登录密码错误，我们项目里同样用了 `UNAUTHENTICATED`；纯游客也不该带 token。  
   **判定我用的规则是：只有当前请求发生时本地还存在 token，才把这次当成「会话被服务端拒绝」，走清会话流程。** 这样游客和「没带 token 的登录失败」都不会误伤。
3. **token 变更可订阅** + `useSyncExternalStore`，让路由和导航跟存储同步。
4. **`me`：无 token 则 `skip`，有 token 用 `cache-and-network`**，减少「缓存里还是好人、线上已是匿名」的窗口。

## 施工时文件大概怎么动（按顺序）

1. [`apps/client/src/lib/auth.ts`](../apps/client/src/lib/auth.ts)：`subscribeAuth`、`getAuthTokenSnapshot`，`setToken` / `clearToken` 里通知监听方。
2. [`apps/client/src/shared/hooks/useAuth.ts`](../apps/client/src/shared/hooks/useAuth.ts)：`useSyncExternalStore` 订阅上述快照。
3. [`apps/client/src/lib/authSessionBridge.ts`](../apps/client/src/lib/authSessionBridge.ts)：给 ErrorLink 一个**脱离 React hooks** 的入口，在 `BrowserRouter` 里注册 `navigate`。
4. [`apps/client/src/lib/apolloErrorLink.ts`](../apps/client/src/lib/apolloErrorLink.ts)：Apollo 4 里用 `CombinedGraphQLErrors.is` 判断 GraphQL 错误，再扫 `extensions.code`。
5. [`apps/client/src/lib/apollo.ts`](../apps/client/src/lib/apollo.ts)：把 `ErrorLink` 接在整条链最前面（相对 split/http），用 ref 持有 `ApolloClient` 实例，避免初始化顺序踩 TDZ。
6. [`apps/client/src/app/SessionInvalidatedNavigation.tsx`](../apps/client/src/app/SessionInvalidatedNavigation.tsx)：挂在 `App` 里注册跳转；已在登录/注册页则不再 `navigate`，避免无意义跳转。
7. [`apps/client/src/pages/auth/LoginPage.tsx`](../apps/client/src/pages/auth/LoginPage.tsx)：用路由 `state` 带一个 `session_expired`，配合 i18n 文案做一次性的提示条。
8. [`apps/client/src/shared/hooks/useCurrentUser.ts`](../apps/client/src/shared/hooks/useCurrentUser.ts)：`skip` + `fetchPolicy`。

## 实现过程中几个小坑

**Apollo Client 4 的错误类型**  
和以前「直接在 error 上找 `graphQLErrors`」的写法不完全一样，需要按官方推荐用 `CombinedGraphQLErrors.is` 再读 `errors` 数组。

**ErrorLink 里拿 `ApolloClient` 实例**  
`new ApolloClient` 还没执行完时，闭包里不能乱引用 `const apolloClient`（严格说会涉及暂时性死区）。用 `apolloClientRef` 在构造后赋值，调用时再取，省心。

**登录页的 ESLint（setState in effect）**  
一开始在 `useEffect` 里读到 `session_expired` 再 `setState`，被 `react-hooks/set-state-in-effect` 拦了。改成：`useState` 的惰性初始值读第一次的 `location.state`，用 `useLayoutEffect` 只做 `navigate` 清 state，提示是否展示由初始 state 闩住，逻辑更简单。

**WebSocket**  
`graphql-ws` 的 `connectionParams` 已经是函数形式，重连时会再读 `getToken()`；token 被清掉之后，新连接不会带旧 Bearer。若业务里长时间挂着订阅，还要不要强制重连，可以看具体场景再加，一期没强行上复杂度。

## 自测时可以过一遍的场景

- 本地塞一个**改过 `exp` 或签名的假 token**，打开需要登录的页：应清会话、跳登录、登录页有「过期」提示。
- **纯游客**逛广场：不应再为 `me` 刷一堆 `UNAUTHENTICATED`（query 被 skip）。
- **错误密码登录**（本地无 token）：不应误触发「整站登出」。
- 正常退出登录：行为与改前一致（仍清 token + `clearStore`）。

## 如果继续做二期

Refresh Token、服务端会话表、撤销列表、httpOnly Cookie 等，都是「少打断用户 + 可控安全」的常见组合。它们不改变上面这条主线：**前端最终要相信服务端对凭证的判断，并在拒绝时把本地状态收束到一致。**

---

*文内路径相对于仓库根目录。*
