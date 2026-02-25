# @blog-fullstack/editor

[中文文档](./README.zh-CN.md)

A Markdown-oriented rich text editor built on [Tiptap](https://tiptap.dev/), shipped as a shared monorepo package for `apps/client`.

## Design Philosophy

### 1. Markdown-first

The editor uses ProseMirror's structured document model internally (WYSIWYG), but the external data format is always **Markdown**. This ensures seamless interoperability with the project's existing `@blog-fullstack/markdown-renderer` and `@blog-fullstack/content-utils` — writing and reading share the same content format with no extra conversion layer.

Under the hood, the `tiptap-markdown` extension handles bidirectional conversion:
- On initialization, Markdown is parsed into a ProseMirror document.
- On every edit, `storage.markdown.getMarkdown()` serializes the document back to a Markdown string.

### 2. Clear Responsibility Boundaries

The editor package is **solely responsible for the editing experience** and contains no business logic:

| Concern | Owner |
|---|---|
| Rich text editing, formatting, keyboard shortcuts | `@blog-fullstack/editor` |
| Saving, publishing, image upload | Consumer (`apps/client`) |
| Content rendering (read view) | `@blog-fullstack/markdown-renderer` |

This separation allows the editor to be reused across different contexts (article editing, comments, messaging) without carrying any domain-specific assumptions.

### 3. Composable Extension Architecture

Leveraging Tiptap's Extension system, all editing capabilities are split into independent extension modules registered in `src/extensions/`:

```
extensions/
├── index.ts              # Extension registry (createExtensions)
├── codeBlockLowlight.ts  # Code block + syntax highlighting
├── slashCommand.ts       # Slash command definitions
└── slashSuggestion.ts    # Slash command UI rendering (tippy.js popup)
```

Adding new capabilities (e.g. mentions, emoji picker) only requires creating an extension file and registering it in `createExtensions` — existing features remain unaffected.

### 4. Styles Decoupled from Host

All styles live in `src/styles/editor.css` and use CSS variables (`--ant-color-*`) to align with the Ant Design theme system. The host application needs no additional style configuration — importing the component loads styles automatically. The editor has no dependency on any CSS-in-JS runtime.

### 5. Minimal Props Surface

Only 6 props are exposed, covering both controlled and uncontrolled usage patterns:

```typescript
interface EditorProps {
  content?: string;                  // Initial Markdown content
  onChange?: (md: string) => void;   // Content change callback
  editable?: boolean;                // Whether the editor is editable (default: true)
  placeholder?: string;              // Placeholder text when empty
  className?: string;                // Custom wrapper CSS class
  autofocus?: boolean;               // Auto-focus on mount
}
```

## Features

| Category | Features |
|---|---|
| **Headings** | H1 / H2 / H3 |
| **Inline Formatting** | Bold, italic, strikethrough, inline code |
| **Lists** | Bullet list, ordered list, task list (with nesting) |
| **Block Elements** | Blockquote, code block (highlight.js syntax highlighting), horizontal rule |
| **Media & Structure** | Image (URL), link (autolink + paste detection), table (3×3 default) |
| **Interaction** | Slash command menu (`/` trigger with search filtering), link bubble menu, block drag-and-drop |
| **History** | Undo / redo |
| **Typography** | Typography extension (auto-replaces quotes, dashes, and other typographic symbols) |

## Project Structure

```
packages/editor/
├── package.json
├── tsconfig.json
├── README.md
├── README.zh-CN.md
└── src/
    ├── index.ts                  # Public exports
    ├── types.ts                  # EditorProps type definition
    ├── Editor.tsx                # Main component
    ├── components/
    │   ├── Toolbar.tsx           # Top toolbar
    │   ├── LinkBubbleMenu.tsx    # Link editing bubble menu
    │   ├── SlashMenu.tsx         # Slash command popup panel
    │   └── DragHandle.tsx        # Block drag handle
    ├── extensions/
    │   ├── index.ts              # Extension registry
    │   ├── codeBlockLowlight.ts  # Code block syntax highlighting
    │   ├── slashCommand.ts       # Slash command logic
    │   └── slashSuggestion.ts    # Slash command UI bridge
    └── styles/
        └── editor.css            # All styles
```

## Usage

```tsx
import { Editor } from '@blog-fullstack/editor';
import { useState } from 'react';

function WriteArticle() {
  const [markdown, setMarkdown] = useState('');

  return (
    <Editor
      content={markdown}
      onChange={setMarkdown}
      placeholder="Start writing, type / for commands..."
    />
  );
}
```

Read-only mode (content preview):

```tsx
<Editor content={articleContent} editable={false} />
```

## Tech Stack

| Dependency | Purpose |
|---|---|
| `@tiptap/core` + `@tiptap/react` | Editor core and React bindings |
| `@tiptap/starter-kit` | Base extension set (paragraph, heading, list, bold, etc.) |
| `@tiptap/pm` | ProseMirror low-level API (state, view, model) |
| `tiptap-markdown` | Markdown ↔ ProseMirror bidirectional conversion |
| `lowlight` + `highlight.js` | Code block syntax highlighting |
| `@tiptap/suggestion` + `tippy.js` | Slash command popup layer |
| Various `@tiptap/extension-*` | Image, link, table, task list, and other standalone extensions |

Peer dependencies: `react ^19.0.0`, `react-dom ^19.0.0`.

## Extension Guide

Adding new editing capabilities takes just three steps:

1. Create a new extension file under `src/extensions/` (or install an official/community Tiptap extension).
2. Register it in the `createExtensions` function in `src/extensions/index.ts`.
3. If a toolbar button is needed, add the corresponding `ToolbarButton` in `src/components/Toolbar.tsx`.

To add a new slash command item, simply append it to the `slashCommandItems` array in `src/extensions/slashCommand.ts`.
