# @blog-fullstack/editor

[English](./README.md)

基于 [Tiptap](https://tiptap.dev/) 封装的 Markdown 富文本编辑器，作为 monorepo 共享包供 `apps/blog` 消费。

## 设计思想

### 1. Markdown-first

编辑器内部使用 ProseMirror 结构化文档模型（所见即所得），但对外暴露的数据格式始终是 **Markdown**。这保证了与项目中已有的 `@blog-fullstack/markdown-renderer` 和 `@blog-fullstack/content-utils` 无缝协作——写入和阅读共享同一份内容格式，无需额外的格式转换层。

底层通过 `tiptap-markdown` 扩展实现双向转换：
- 初始化时将 Markdown 解析为 ProseMirror 文档。
- 每次编辑变更时通过 `storage.markdown.getMarkdown()` 序列化回 Markdown 字符串。

### 2. 职责边界清晰

编辑器包 **只负责编辑体验本身**，不包含任何业务逻辑：

| 关注点 | 归属 |
|---|---|
| 富文本编辑、格式化、快捷键 | `@blog-fullstack/editor` |
| 文章保存、发布、图片上传 | 消费方（`apps/blog`） |
| 内容渲染（阅读视图） | `@blog-fullstack/markdown-renderer` |

这种分层使编辑器可以在不同场景复用（文章编辑、评论、即时通讯），而不会携带任何特定业务假设。

### 3. 可组合的扩展架构

利用 Tiptap 的 Extension 体系，所有编辑能力按功能拆分为独立扩展模块，集中在 `src/extensions/` 中注册：

```
extensions/
├── index.ts              # 扩展注册入口 (createExtensions)
├── codeBlockLowlight.ts  # 代码块 + 语法高亮
├── slashCommand.ts       # Slash 命令定义
└── slashSuggestion.ts    # Slash 命令 UI 渲染（tippy.js 弹出层）
```

需要新增编辑能力（如 mentions、emoji picker）时，只需添加扩展文件并在 `createExtensions` 中注册，不影响已有功能。

### 4. 样式与宿主解耦

所有样式集中在 `src/styles/editor.css`，使用 CSS 变量（`--ant-color-*`）对齐 Ant Design 主题系统。宿主应用无需额外配置样式，导入组件即自动加载。编辑器不依赖任何 CSS-in-JS 运行时。

### 5. 最小化 Props 表面积

对外仅暴露 6 个 Props，覆盖「可控/受控」两种使用模式：

```typescript
interface EditorProps {
  content?: string;           // 初始 Markdown 内容
  onChange?: (md: string) => void;  // 内容变更回调
  editable?: boolean;         // 是否可编辑（默认 true）
  placeholder?: string;       // 空白时占位文案
  className?: string;         // 自定义容器样式类
  autofocus?: boolean;        // 挂载后自动聚焦
}
```

## 功能清单

| 分类 | 功能 |
|---|---|
| **标题** | H1 / H2 / H3 |
| **行内格式** | 粗体、斜体、删除线、行内代码 |
| **列表** | 无序列表、有序列表、任务列表（支持嵌套） |
| **块级元素** | 引用块、代码块（highlight.js 语法高亮）、分割线 |
| **媒体与结构** | 图片（URL）、链接（自动检测 + 粘贴识别）、表格（3×3 初始化） |
| **交互增强** | Slash 命令菜单（`/` 触发，支持搜索过滤）、链接气泡菜单、块级拖拽排序 |
| **历史操作** | 撤销 / 重做 |
| **排版优化** | Typography 扩展（自动替换引号、破折号等排版符号） |

## 项目结构

```
packages/editor/
├── package.json
├── tsconfig.json
├── README.md
├── README.zh-CN.md
└── src/
    ├── index.ts                  # 公共导出
    ├── types.ts                  # EditorProps 类型定义
    ├── Editor.tsx                # 主组件
    ├── components/
    │   ├── Toolbar.tsx           # 顶部工具栏
    │   ├── LinkBubbleMenu.tsx    # 链接编辑气泡菜单
    │   ├── SlashMenu.tsx         # Slash 命令弹出面板
    │   └── DragHandle.tsx        # 块级拖拽手柄
    ├── extensions/
    │   ├── index.ts              # 扩展注册
    │   ├── codeBlockLowlight.ts  # 代码块语法高亮
    │   ├── slashCommand.ts       # Slash 命令逻辑
    │   └── slashSuggestion.ts    # Slash 命令 UI 桥接
    └── styles/
        └── editor.css            # 全部样式
```

## 使用方式

```tsx
import { Editor } from '@blog-fullstack/editor';
import { useState } from 'react';

function WriteArticle() {
  const [markdown, setMarkdown] = useState('');

  return (
    <Editor
      content={markdown}
      onChange={setMarkdown}
      placeholder="开始写作，输入 / 唤起命令菜单..."
    />
  );
}
```

只读模式（内容预览）：

```tsx
<Editor content={articleContent} editable={false} />
```

## 技术栈

| 依赖 | 用途 |
|---|---|
| `@tiptap/core` + `@tiptap/react` | 编辑器内核与 React 绑定 |
| `@tiptap/starter-kit` | 基础扩展集（段落、标题、列表、加粗等） |
| `@tiptap/pm` | ProseMirror 底层 API（状态、视图、模型） |
| `tiptap-markdown` | Markdown ↔ ProseMirror 双向转换 |
| `lowlight` + `highlight.js` | 代码块语法高亮 |
| `@tiptap/suggestion` + `tippy.js` | Slash 命令弹出层 |
| 各 `@tiptap/extension-*` | 图片、链接、表格、任务列表等独立扩展 |

Peer dependencies：`react ^19.0.0`、`react-dom ^19.0.0`。

## 扩展指南

添加新的编辑能力只需三步：

1. 在 `src/extensions/` 下创建新扩展文件（或安装 Tiptap 官方/社区扩展）。
2. 在 `src/extensions/index.ts` 的 `createExtensions` 函数中注册。
3. 如需工具栏按钮，在 `src/components/Toolbar.tsx` 中添加对应的 `ToolbarButton`。

如需添加 Slash 命令项，在 `src/extensions/slashCommand.ts` 的 `slashCommandItems` 数组中追加即可。
