import { BubbleMenu, type Editor } from '@tiptap/react';
import { useState, useCallback } from 'react';

interface LinkBubbleMenuProps {
  editor: Editor;
}

export function LinkBubbleMenu({ editor }: LinkBubbleMenuProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [url, setUrl] = useState('');

  const currentUrl = editor.getAttributes('link').href as string | undefined;

  const handleEdit = useCallback(() => {
    setUrl(currentUrl ?? '');
    setIsEditing(true);
  }, [currentUrl]);

  const handleSave = useCallback(() => {
    if (url.trim()) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run();
    } else {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    }
    setIsEditing(false);
  }, [editor, url]);

  const handleRemove = useCallback(() => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setIsEditing(false);
  }, [editor]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
      if (e.key === 'Escape') {
        setIsEditing(false);
      }
    },
    [handleSave],
  );

  return (
    <BubbleMenu
      editor={editor}
      tippyOptions={{ duration: 150 }}
      shouldShow={({ editor: e }) => e.isActive('link')}
    >
      <div className="editor-bubble-menu">
        {isEditing ? (
          <div className="editor-bubble-menu-edit">
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://..."
              className="editor-bubble-menu-input"
              autoFocus
            />
            <button type="button" className="editor-bubble-menu-btn" onClick={handleSave}>
              ✓
            </button>
          </div>
        ) : (
          <div className="editor-bubble-menu-view">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="editor-bubble-menu-link"
            >
              {currentUrl}
            </a>
            <button type="button" className="editor-bubble-menu-btn" onClick={handleEdit}>
              ✎
            </button>
            <button type="button" className="editor-bubble-menu-btn" onClick={handleRemove}>
              ✕
            </button>
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
