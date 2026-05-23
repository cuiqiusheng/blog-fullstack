# 博客系统接入七牛云图片上传：从粘贴 URL 到本地上传的完整改造

## 背景：为什么要改？

很多全栈项目在早期开发时，图片处理往往是最容易被简化的环节——直接让用户粘贴一个图片链接就完事了。我的博客系统也不例外：

- 设置头像：在输入框里粘贴一个图片 URL
- 文章插图：编辑器弹出一个 `prompt` 框，输入 URL

这种方式能用，但用户体验很差：

1. 用户需要先把图片上传到某个地方（比如图床），拿到链接，再粘贴过来
2. 操作步骤多，中间要切换多个页面
3. 不支持直接从截图粘贴，不支持拖拽文件

所以，是时候让系统支持"本地上传图片"了。

## 方案选型：图片存在哪里？

在决定怎么实现之前，首先要回答一个关键问题：**上传的图片存到哪里？**

### 我的服务器配置

- 阿里云 ECS，2 核 2G 内存
- 3M 带宽（约 375KB/s）
- 40G 系统盘

这个配置决定了我的选择空间。

### 方案对比

| 方案 | 存储 | 访问速度 | 成本 | 适合场景 |
|------|------|---------|------|---------|
| ECS 本地磁盘 | 占用 40G 硬盘空间 | 受 3M 带宽限制 | 免费 | 用户极少的个人项目 |
| 阿里云 OSS | 云端无限 | 快（CDN 加速） | 低费用 | 正式产品 |
| 七牛云 Kodo | 云端无限 | 快（国内 CDN） | 免费额度足够 | 个人博客 |
| Cloudflare R2 | 云端无限 | 国内一般 | 免费 | 海外用户为主 |
| Cloudinary | 云端 25GB | 国内不稳定 | 免费额度大 | 原型验证 |

### 为什么选七牛云？

对于一个部署在国内 ECS 上的个人博客，七牛云 Kodo 是最合适的选择：

1. **免费额度够用**：10GB 存储 + 每月 10GB CDN 流量，个人博客写几年都用不完
2. **国内 CDN 加速**：七牛自带 CDN 节点，图片加载速度远快于从 ECS 直接访问
3. **不占用 ECS 资源**：图片不经过 ECS，3M 带宽和 40G 硬盘都不受影响
4. **内置图片处理**：通过 URL 参数可以实时裁剪、缩放、转 WebP，不用自己写图片处理代码

## 架构设计：客户端直传

图片上传有两种常见架构：

### 方案 A：服务端中转

```
客户端 → 服务器（接收文件）→ 七牛云
```

文件先上传到我的 ECS，ECS 再转存到七牛云。

**问题**：文件经过 ECS，会占用 2G 内存和 3M 带宽。上传一张 2MB 的图片，ECS 需要先花 ~5 秒接收完文件，再花 ~5 秒传到七牛，总共 ~10 秒。如果多人同时上传，ECS 可能直接 OOM。

### 方案 B：客户端直传（采用）

```
客户端 → 服务器（只拿上传凭证，约 200 字节）
客户端 → 七牛云（直接上传文件）
```

ECS 全程只做一件事：生成一个上传凭证（uptoken），这只是一个字符串计算，几乎不消耗任何资源。文件直接从用户浏览器传到七牛云，完全不经过 ECS。

**完整流程：**

```
1. 用户选择图片
2. 客户端 → POST /upload/token → ECS 返回 { token, key, cdnDomain }
3. 客户端 → POST https://up.qiniup.com → 七牛云接收文件
4. 客户端拼接最终 URL：cdnDomain/key
5. 图片通过 CDN 域名访问（如 https://cdn.cuiqs.com/uploads/2026/02/xxx.jpg）
```

## 上传凭证的安全机制

你可能会问：客户端直传不会有安全问题吗？谁都可以往我的存储空间里传文件？

七牛云的上传凭证（uptoken）设计了一套完整的安全机制：

### putPolicy（上传策略）

上传凭证不是一个简单的密钥，而是一个 **带策略的签名令牌**。生成凭证时，服务端可以指定：

```javascript
const putPolicy = new qiniu.rs.PutPolicy({
  scope: `${bucket}:${key}`,     // 只允许上传到指定的文件路径
  expires: 3600,                  // 凭证 1 小时后过期
  fsizeLimit: 5 * 1024 * 1024,   // 文件最大 5MB
  mimeLimit: 'image/jpeg;image/png;image/gif;image/webp',  // 只允许图片类型
});
```

- **scope 精确到文件路径**：凭证只能用于上传到 `uploads/2026/02/uuid.jpg` 这一个特定路径，不能上传到其他路径
- **有效期限制**：凭证 1 小时后自动失效
- **文件大小限制**：超过 5MB 的文件会被七牛云拒绝
- **MIME 类型限制**：只能上传图片，不能上传可执行文件等

### 签名过程

凭证的生成过程：

```
1. 将 putPolicy JSON 序列化 → Base64 编码 → 得到 encodedPolicy
2. 用 SecretKey 对 encodedPolicy 做 HMAC-SHA1 签名 → 得到 sign
3. 最终 token = AccessKey:sign:encodedPolicy
```

SecretKey 始终保存在服务端，不会暴露给客户端。客户端只拿到最终的 token 字符串，无法篡改策略内容（因为签名会失效）。

## 实现过程

### Server 端：上传凭证服务

首先安装七牛云 SDK：

```bash
pnpm --filter @blog-fullstack/server add qiniu
```

然后创建上传服务（`apps/server/src/service/upload/uploadService.ts`）：

```typescript
import qiniu from 'qiniu';
import { randomUUID } from 'crypto';
import path from 'path';

function generateFileKey(fileName: string): string {
  const ext = path.extname(fileName).toLowerCase();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const uuid = randomUUID();
  return `uploads/${year}/${month}/${uuid}${ext}`;
}

export function generateUploadToken(fileName: string): UploadTokenResult {
  // 校验文件扩展名
  const ext = path.extname(fileName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File type not allowed: ${ext}`);
  }

  // 读取环境变量
  const { accessKey, secretKey, bucket, cdnDomain } = getQiniuConfig();
  const key = generateFileKey(fileName);

  // 生成上传凭证
  const mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
  const putPolicy = new qiniu.rs.PutPolicy({
    scope: `${bucket}:${key}`,
    expires: 3600,
    fsizeLimit: 5 * 1024 * 1024,
    mimeLimit: 'image/jpeg;image/png;image/gif;image/webp',
  });

  const token = putPolicy.uploadToken(mac);
  return { token, key, cdnDomain };
}
```

**文件命名策略**：`uploads/{年}/{月}/{UUID}.{扩展名}`。

- 按年月分目录，方便管理和排查
- UUID 保证文件名唯一，不会覆盖已有文件
- 保留原始扩展名，方便 CDN 识别文件类型

然后在 Express 中注册一个 REST 端点（`apps/server/src/app.ts`）：

```typescript
app.post('/upload/token', uploadLimiter, async (req, res) => {
  const auth = await createAuthContext(req);
  if (!auth.isAuthenticated) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const { fileName } = req.body;
  const result = generateUploadToken(fileName);
  res.json(result);
});
```

**为什么用 REST 而不是 GraphQL？**

上传凭证是一个基础设施操作（类似健康检查 `/health`），不属于业务数据的查询/变更。用 REST 更符合语义——GraphQL 适合描述数据图谱，不适合做文件上传这类基础设施操作。

### Client 端：通用上传函数

创建一个通用的上传函数（`apps/blog/src/lib/upload.ts`），不引入七牛 JS SDK，直接用 `fetch` + `FormData`，减少包体积：

```typescript
export async function uploadImage(file: File): Promise<string> {
  // 1. 前端预校验
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new UploadError('不支持的文件类型');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new UploadError('文件大小超出 5MB 限制');
  }

  // 2. 向服务端请求上传凭证
  const tokenRes = await fetch(getUploadTokenUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fileName: file.name }),
  });
  const { token: uploadToken, key, cdnDomain } = await tokenRes.json();

  // 3. 直传到七牛云
  const formData = new FormData();
  formData.append('file', file);
  formData.append('token', uploadToken);
  formData.append('key', key);

  await fetch('https://up.qiniup.com', {
    method: 'POST',
    body: formData,
  });

  // 4. 返回 CDN URL
  return `${cdnDomain}/${key}`;
}
```

**URL 路由适配**：上传凭证的 URL 通过 GraphQL URI 动态推导。

- 开发环境：GraphQL URI 是 `/api/graphql`，上传 URL 推导为 `/api/upload/token`，Vite 代理会自动转发到后端
- 生产环境：GraphQL URI 是 `/graphql`，上传 URL 推导为 `/upload/token`，Nginx 代理到后端

这样不需要额外的环境变量，保持了配置的简洁性。

### Editor 包：支持图片上传

编辑器是一个独立的 monorepo 包（`packages/editor`），不依赖 antd。所以要在保持独立性的前提下增加上传能力。

**核心设计**：给 `EditorProps` 新增一个可选回调：

```typescript
interface EditorProps {
  // ...原有 props
  onImageUpload?: (file: File) => Promise<string>;
}
```

- **有 `onImageUpload`**：使用文件选择器 + 上传弹窗
- **没有 `onImageUpload`**：保持原来的 `window.prompt` 方式（向后兼容）

这样编辑器包本身不知道也不关心图片存在哪里（七牛、OSS、还是本地），上传逻辑由使用方注入。

#### 图片上传弹窗

创建了 `ImageUploadModal` 组件（纯 HTML + CSS，不依赖 antd），支持：

- **两个 Tab**："上传文件" 和 "输入链接"，满足不同场景
- **拖拽区域**：拖拽图片文件到虚线框内
- **点击选择**：点击虚线框打开文件选择器
- **即时预览**：选中文件后立即显示缩略图
- **上传状态**：上传中显示 loading 动画
- **错误提示**：文件类型不对、超过大小限制等提示

#### 三种图片插入入口

1. **工具栏按钮**：点击 🖼 按钮，弹出上传弹窗
2. **斜杠命令**：输入 `/image`，选择后弹出上传弹窗
3. **粘贴 / 拖拽**：直接粘贴截图或拖拽文件到编辑区域，自动上传

粘贴和拖拽的实现通过 ProseMirror Plugin：

```typescript
new Plugin({
  props: {
    handlePaste(_view, event) {
      const imageFile = Array.from(event.clipboardData?.files ?? [])
        .find(f => f.type.startsWith('image/'));
      if (!imageFile) return false;

      event.preventDefault();
      uploadFn(imageFile).then(url => {
        editor.chain().focus().setImage({ src: url }).run();
      });
      return true;
    },
    handleDrop(_view, event) {
      // 类似逻辑
    },
  },
});
```

#### 斜杠命令的技术挑战

斜杠命令的命令列表（`slashCommandItems`）是静态定义的，但"打开上传弹窗"需要访问 React 组件的状态。解决方案是利用 Tiptap 的 **Editor Storage** 机制：

1. 创建一个 `ImageUploadStorage` 扩展，在 editor storage 中暴露 `triggerUploadModal` 函数
2. React 组件层通过 `useEffect` 把"打开弹窗"的 setter 注入到 storage 中
3. 斜杠命令执行时从 storage 中取出 trigger 函数并调用

这样静态命令定义就能和 React 状态联动，同时保持了关注点分离。

### 头像上传改造

用户设置页面的头像从一个简单的文本输入框，改造为带上传能力的交互：

- 显示 64px 的圆形头像预览
- 鼠标悬停出现相机图标遮罩
- 点击头像直接打开文件选择器，选择后自动上传
- 保留了"使用链接"选项（点击展开 URL 输入框），兼顾需要使用外部图片链接的场景

## 部署配置

### Nginx

需要为新的上传凭证端点添加反向代理：

```nginx
location /upload/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### 环境变量

在 `.env` 中新增四个变量：

```env
QINIU_ACCESS_KEY=your_access_key
QINIU_SECRET_KEY=your_secret_key
QINIU_BUCKET=your_bucket_name
QINIU_CDN_DOMAIN=https://cdn.cuiqs.com
```

### 七牛云控制台配置

1. 创建存储空间（Bucket），区域选就近的区域
2. 进入空间设置 → 绑定自定义 CDN 加速域名（如 `cdn.cuiqs.com`）
3. 复制七牛提供的 CNAME 值，在域名 DNS 中添加 CNAME 记录：`cdn` → `xxx.qiniudns.com`
4. 在个人中心 → 密钥管理中获取 AccessKey 和 SecretKey
5. 等待 CDN 域名审核通过（通常几分钟到几小时）

### Docker / CI

不需要任何改动。因为图片不经过 ECS：
- Docker 不需要挂载上传目录
- CI 构建流程不变
- ECS 磁盘不会被图片占用

## 成本估算

以一个日均 100 PV、每篇文章 3 张图、平均每张 200KB 的个人博客为例：

| 资源 | 月用量 | 免费额度 | 是否超出 |
|------|-------|---------|---------|
| 存储 | ~0.5GB（写 100 篇后） | 10GB | 否 |
| CDN 流量 | ~1.8GB | 10GB | 否 |
| PUT 请求 | ~300 次 | 10 万次 | 否 |
| GET 请求 | ~9000 次 | 100 万次 | 否 |

结论：个人博客完全在免费额度内。

## 可以继续扩展的方向

### 图片处理

七牛云支持通过 URL 参数实时处理图片：

```
// 头像裁剪为 200x200
https://cdn.cuiqs.com/uploads/xxx.jpg?imageView2/1/w/200/h/200

// 文章图片限制宽度为 800px，自动等比缩放
https://cdn.cuiqs.com/uploads/xxx.jpg?imageView2/2/w/800

// 自动转换为 WebP 格式（节省 30-50% 流量）
https://cdn.cuiqs.com/uploads/xxx.jpg?imageMogr2/format/webp
```

可以在上传成功后，根据使用场景（头像 vs 文章图片）自动拼接处理参数。

### 上传进度

目前的上传使用 `fetch`，无法获取上传进度。如果需要显示进度条，可以改用 `XMLHttpRequest`：

```typescript
const xhr = new XMLHttpRequest();
xhr.upload.onprogress = (e) => {
  const percent = Math.round((e.loaded / e.total) * 100);
  onProgress?.(percent);
};
```

### 图片压缩

可以在上传前在浏览器端压缩图片（使用 Canvas API 或 `browser-image-compression` 库），进一步减少上传时间和存储成本。

### 水印

七牛云支持通过 URL 参数添加文字或图片水印，适合保护原创内容。

## 总结

这次改造的核心思路是：

1. **选择合适的存储方案**：根据服务器配置（2G 内存、3M 带宽、40G 硬盘）排除了本地存储，选择七牛云免费额度
2. **客户端直传架构**：ECS 只生成凭证（~200 字节），文件直传云端，不消耗服务器资源
3. **编辑器包保持独立**：通过回调函数注入上传能力，不耦合具体存储服务
4. **渐进式改造**：保留 URL 输入方式，新增上传方式，不影响已有功能

整个改造涉及 Server（上传凭证服务）、Client（上传工具函数 + 页面改造）、Editor 包（上传弹窗 + 粘贴拖拽）三层，但每一层的改动都比较聚焦，没有大的架构调整。
