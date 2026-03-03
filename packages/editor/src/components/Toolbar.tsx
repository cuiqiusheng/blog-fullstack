import { useCallback, useState } from 'react';
import type { Editor } from '@tiptap/react';
import { ImageUploadModal } from './ImageUploadModal';

interface ToolbarProps {
  editor: Editor | null;
  onImageUpload?: (file: File) => Promise<string>;
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

export function Toolbar({ editor, onImageUpload }: ToolbarProps) {
  const [showUploadModal, setShowUploadModal] = useState(false);

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
        title="Heading 1"
      >
        H1
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        H2
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        H3
      </ToolbarButton>

      <ToolbarDivider />

      {/* Inline formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        S̶
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        {'</>'}
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        •
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        1.
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        ☑
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        ❝
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        {'{ }'}
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        ―
      </ToolbarButton>

      <ToolbarDivider />

      {/* Media & structure */}
      <ToolbarButton onClick={addImage} title="Insert Image">
        🖼
      </ToolbarButton>
      <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} title="Insert Link">
        🔗
      </ToolbarButton>
      <ToolbarButton onClick={addTable} title="Insert Table">
        ⊞
      </ToolbarButton>

      <ToolbarDivider />

      {/* Undo / Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        ↩
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
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
