import { useEditor, EditorContent } from '@tiptap/react';
import type { Editor as TiptapEditor } from '@tiptap/core';
import { useRef, useCallback } from 'react';
import { createExtensions } from './extensions';
import { Toolbar } from './components/Toolbar';
import { LinkBubbleMenu } from './components/LinkBubbleMenu';
import { DragHandle } from './components/DragHandle';
import type { EditorProps } from './types';
import './styles/editor.css';

export function Editor({
  content,
  onChange,
  editable = true,
  placeholder,
  className,
  autofocus = false,
}: EditorProps) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const handleUpdate = useCallback(({ editor: e }: { editor: TiptapEditor }) => {
    const md = (
      e.storage as Record<string, { getMarkdown?: () => string }>
    ).markdown?.getMarkdown?.();
    if (md !== undefined) {
      onChangeRef.current?.(md);
    }
  }, []);

  const editor = useEditor({
    extensions: createExtensions({ placeholder }),
    content,
    editable,
    autofocus,
    onUpdate: handleUpdate,
  });

  const wrapperClass = ['editor-wrapper', !editable && 'is-readonly', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClass}>
      {editable && <Toolbar editor={editor} />}
      {editor && editable && <LinkBubbleMenu editor={editor} />}
      <div className="editor-content-area">
        {editor && editable && <DragHandle editor={editor} />}
        <EditorContent editor={editor} className="editor-content" />
      </div>
    </div>
  );
}
