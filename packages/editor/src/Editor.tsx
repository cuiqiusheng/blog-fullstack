import '@blog-fullstack/content-theme/code-highlight.css';
import '@blog-fullstack/content-theme/nested-ordered-lists.css';
import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { useRef, useCallback, useState, useEffect } from 'react';
import { createExtensions } from './extensions';
import { Toolbar } from './components/Toolbar';
import { LinkBubbleMenu } from './components/LinkBubbleMenu';
import { TableBubbleMenu } from './components/TableBubbleMenu';
import { DragHandle } from './components/DragHandle';
import { ImageUploadModal } from './components/ImageUploadModal';
import type { EditorProps } from './types';
import type { ImageUploadStorage } from './extensions/imageUploadStorage';
import './styles/editor.css';

export function Editor({
  content,
  onChange,
  editable = true,
  placeholder,
  className,
  autofocus = false,
  onImageUpload,
  toolbarLabels,
  tableBubbleLabels,
}: EditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [slashUploadOpen, setSlashUploadOpen] = useState(false);

  const handleUpdate = useCallback(({ editor: e }: { editor: TiptapEditor }) => {
    const md = (
      e.storage as Record<string, { getMarkdown?: () => string }>
    ).markdown?.getMarkdown?.();
    if (md !== undefined) {
      onChangeRef.current?.(md);
    }
  }, []);

  const editor = useEditor({
    extensions: createExtensions({ placeholder, onImageUpload }),
    content,
    editable,
    autofocus,
    onUpdate: handleUpdate,
  });

  useEffect(() => {
    if (!editor) return;
    const storage = editor.storage as { imageUploadStorage?: ImageUploadStorage };
    if (storage.imageUploadStorage) {
      storage.imageUploadStorage.onImageUpload = onImageUpload ?? null;
      storage.imageUploadStorage.triggerUploadModal = onImageUpload
        ? () => setSlashUploadOpen(true)
        : null;
    }
  }, [editor, onImageUpload]);

  const handleSlashInsertImage = useCallback(
    (url: string) => {
      editor?.chain().focus().setImage({ src: url }).run();
    },
    [editor],
  );

  const wrapperClass = [
    'editor-wrapper',
    'content-theme-host',
    !editable && 'is-readonly',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {editable && (
        <div className="editor-chrome-sticky">
          <Toolbar editor={editor} onImageUpload={onImageUpload} labels={toolbarLabels} />
          {editor && <TableBubbleMenu editor={editor} labels={tableBubbleLabels} />}
        </div>
      )}
      {editor && editable && <LinkBubbleMenu editor={editor} />}
      <div className="editor-content-area">
        {editor && editable && <DragHandle editor={editor} />}
        <EditorContent editor={editor} className="editor-content" />
      </div>

      {onImageUpload && (
        <ImageUploadModal
          open={slashUploadOpen}
          onClose={() => setSlashUploadOpen(false)}
          onImageUpload={onImageUpload}
          onInsertImage={handleSlashInsertImage}
        />
      )}
    </div>
  );
}
