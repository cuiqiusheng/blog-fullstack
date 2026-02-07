### 项目文件夹结构（详细版，适配全栈开发+工程化）

```
blog-fullstack/          # 项目根目录
├── client/              # 前端React项目（Vite构建）
│   ├── public/          # 静态资源（favicon、logo）
│   ├── src/
│   │   ├── apollo/      # Apollo Client配置
│   │   │   ├── client.js # Apollo Client实例
│   │   │   ├── queries/ # GraphQL查询语句
│   │   │   └── mutations/ # GraphQL变更语句
│   │   ├── components/  # 通用组件
│   │   │   ├── common/  # 基础组件（Button、Loading）
│   │   │   ├── article/ # 文章相关组件
│   │   │   └── user/    # 用户相关组件
│   │   ├── pages/       # 页面组件
│   │   │   ├── Login/   # 登录页
│   │   │   ├── Register/ # 注册页
│   │   │   ├── Home/    # 广场首页
│   │   │   ├── ArticleDetail/ # 文章详情页
│   │   │   └── Publish/ # 文章发布页
│   │   ├── router/      # 路由配置
│   │   │   └── index.js # 路由定义+守卫
│   │   ├── store/       # 状态管理（Zustand）
│   │   ├── utils/       # 工具函数（请求、格式化）
│   │   ├── types/       # TS类型定义（GraphQL生成）
│   │   ├── App.tsx      # 根组件
│   │   └── main.tsx     # 入口文件
│   ├── .env.development # 开发环境变量
│   ├── .env.production  # 生产环境变量
│   ├── vite.config.ts   # Vite配置
│   └── package.json     # 依赖配置
│
├── server/              # 后端BFF+数据层（Express）
│   ├── prisma/          # Prisma配置
│   │   ├── schema.prisma # 数据库模型定义
│   │   └── migrations/  # 数据迁移文件
│   ├── src/
│   │   ├── graphql/     # GraphQL核心
│   │   │   ├── schema/  # Schema定义
│   │   │   │   ├── typeDefs.js # 类型定义
│   │   │   │   └── fragments.js # 片段定义
│   │   │   └── resolvers/ # 解析器
│   │   │       ├── userResolver.js # 用户相关解析器
│   │   │       ├── articleResolver.js # 文章相关解析器
│   │   │       └── aiResolver.js # AI助手解析器
│   │   ├── api/         # 基础业务接口（可选，备用REST）
│   │   │   ├── userApi.js
│   │   │   └── articleApi.js
│   │   ├── cache/       # Redis缓存逻辑
│   │   │   ├── redisClient.js # Redis客户端
│   │   │   └── cacheService.js # 缓存服务
│   │   ├── middleware/  # Express中间件
│   │   │   ├── authMiddleware.js # JWT校验
│   │   │   ├── errorMiddleware.js # 全局异常处理
│   │   │   └── loggerMiddleware.js # 日志记录
│   │   ├── service/     # 业务逻辑层
│   │   │   ├── userService.js
│   │   │   ├── articleService.js
│   │   │   └── aiService.js # 第三方API调用
│   │   ├── utils/       # 工具函数
│   │   │   ├── jwt.js   # JWT生成/校验
│   │   │   ├── encrypt.js # 密码加密
│   │   │   └── logger.js # 日志工具
│   │   ├── app.js       # Express入口
│   │   └── server.js    # 服务启动文件
│   ├── .env.example     # 环境变量示例
│   └── package.json     # 依赖配置
│
├── nginx/               # Nginx配置
│   ├── nginx.conf       # 主配置（反向代理、HTTPS、Gzip）
│   └── ssl/             # SSL证书存放目录
│
├── docker-compose.yml   # Docker部署配置
├── .gitignore           # Git忽略文件
└── README.md            # 项目文档
```

### 关键补充说明
1. **文件夹设计原则**：
   - 前后端分离但目录结构对称，便于维护（如`src/graphql`在前后端都有对应目录）；
   - 分层清晰：前端按「组件-页面-路由-工具」拆分，后端按「GraphQL-业务逻辑-数据层-中间件」拆分；
   - 工程化适配：预留`types`目录存放TS类型，`migrations`存放数据库迁移文件，符合面试中“工程化思维”的展示需求。

2. **核心目录作用**：
   - `server/src/graphql`：BFF层核心，聚合所有数据源的入口，面试时重点讲解该目录的设计逻辑；
   - `prisma`：数据库模型和迁移的核心，体现“数据层工程化”；
   - `client/src/apollo`：前端GraphQL请求管理，体现Apollo Client的缓存和类型能力。

3. **部署适配**：
   - `docker-compose.yml`可一键启动前端、后端、PostgreSQL、Redis、Nginx；
   - `nginx/`目录配置HTTPS和反向代理，适配阿里云ECS的99元配置。

### 总结
1. **架构图**：清晰展示从客户端到部署层的全链路，面试时可直观讲解设计思路；
2. **README**：覆盖项目介绍、架构、运行指南、核心实现、面试适配，是面试展示的核心文档；
3. **文件夹结构**：分层清晰、工程化规范，既适配边学边做的开发节奏，又能体现全栈项目的专业度。
   