import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import type { ToolbarLabels } from '../types';
import { ImageUploadModal } from './ImageUploadModal';

const DEFAULT_LABELS: Required<ToolbarLabels> = {
  heading1: 'Heading 1',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  bold: 'Bold',
  italic: 'Italic',
  strikethrough: 'Strikethrough',
  inlineCode: 'Inline Code',
  bulletList: 'Bullet List',
  orderedList: 'Ordered List',
  taskList: 'Task List',
  blockquote: 'Blockquote',
  codeBlock: 'Code Block',
  horizontalRule: 'Horizontal Rule',
  insertImage: 'Insert Image',
  insertLink: 'Insert Link',
  insertTable: 'Insert Table',
  undo: 'Undo',
  redo: 'Redo',
};

interface ToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
  labels?: ToolbarLabels;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      className={`editor-toolbar-btn${isActive ? ' is-active' : ''}`}
      onClick={onClick}
      disabled={disabled}
      title={title}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <span className="editor-toolbar-divider" />;
}

export function Toolbar({ editor, onImageUpload, labels: customLabels }: ToolbarProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const l = { ...DEFAULT_LABELS, ...customLabels };

  const addImage = useCallback(() => {
    if (!editor) return;
    if (onImageUpload) {
      setShowUploadModal(true);
    } else {
      const url = window.prompt('Image URL');
      if (url) {
        editor.chain().focus().setImage({ src: url }).run();
      }
    }
  }, [editor, onImageUpload]);

  const handleInsertImage = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  const addLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = (editor.getAttributes('link').href as string) ?? '';
    const url = window.prompt('Link URL', previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
  }, [editor]);

  const addTable = useCallback(() => {
    if (!editor) return;
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="editor-toolbar">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title={l.heading1}
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title={l.heading2}
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title={l.heading3}
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title={l.bold}
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title={l.italic}
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title={l.strikethrough}
      >
        S̶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title={l.inlineCode}
      >
        {'</>'}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title={l.bulletList}
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title={l.orderedList}
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title={l.taskList}
      >
        ☑
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title={l.blockquote}
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title={l.codeBlock}
      >
        {'{ }'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title={l.horizontalRule}
      >
        ―
      </ToolbarButton>

      <ToolbarDivider />

      {/* Media & structure */}
      <ToolbarButton onClick={addImage} title={l.insertImage}>
        🖼
      </ToolbarButton>
      <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title={l.insertLink}>
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={addTable} title={l.insertTable}>
        ⊞
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title={l.undo}
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title={l.redo}
      >
        ↪
      </ToolbarButton>

      {onImageUpload && (
        <ImageUploadModal
          open={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onImageUpload={onImageUpload}
          onInsertImage={handleInsertImage}
        />
      )}
    </div>
  );
}
