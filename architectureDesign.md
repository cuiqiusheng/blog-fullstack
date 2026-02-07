```mermaid
graph TD
    subgraph 客户端层
        A[PC端浏览器] --> C[React应用]
        B[移动端浏览器] --> C[React应用]
        C --> D[Apollo Client]
    end

    subgraph BFF层_Backend_For_Frontend
        E[Express + Apollo Server]
        F[GraphQL Schema/Resolver]
        G[数据聚合逻辑]
        D --> E
        E --> F
        F --> G
    end

    subgraph 服务层
        H[Express 业务接口]
        I[Prisma ORM]
        J[ioredis 缓存]
        K[第三方API集成]
        G --> H
        H --> I
        H --> J
        G --> K
    end

    subgraph 数据层
        L[PostgreSQL 数据库]
        M[Redis 缓存]
        N[通义千问API]
        I --> L
        J --> M
        K --> N
    end

    subgraph 部署层
        O[Nginx 反向代理/静态资源]
        P[阿里云ECS (Docker Compose)]
        C --> O
        E --> O
        O --> P
        L --> P
        M --> P
    end

    style C fill:#e1f5fe
    style E fill:#f3e5f5
    style H fill:#e8f5e8
    style L fill:#fff3e0
```
