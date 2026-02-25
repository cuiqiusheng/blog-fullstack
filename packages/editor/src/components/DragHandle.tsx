import { useEffect, useRef } from 'react';
import type { Editor } from '@tiptap/react';
import { Plugin, PluginKey, NodeSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { DOMSerializer } from '@tiptap/pm/model';

const dragHandlePluginKey = new PluginKey('dragHandle');

function getDirectBlockParent(view: EditorView, pos: number) {
  const $pos = view.state.doc.resolve(pos);
  for (let depth = $pos.depth; depth > 0; depth--) {
    const node = $pos.node(depth);
    if (node.isBlock && !node.isTextblock) {
      continue;
    }
    const start = $pos.before(depth);
    const dom = view.nodeDOM(start);
    if (dom instanceof HTMLElement) {
      return { pos: start, dom, node };
    }
  }
  const start = $pos.before(1);
  const dom = view.nodeDOM(start);
  if (dom instanceof HTMLElement) {
    return { pos: start, dom, node: $pos.node(1) };
  }
  return null;
}

function createDragHandlePlugin(handle: HTMLElement) {
  let currentBlock: { pos: number; dom: HTMLElement } | null = null;

  return new Plugin({
    key: dragHandlePluginKey,
    props: {
      handleDOMEvents: {
        mousemove: (view, event) => {
          const coords = { left: event.clientX, top: event.clientY };
          const posResult = view.posAtCoords(coords);
          if (!posResult) {
            handle.style.display = 'none';
            currentBlock = null;
            return false;
          }

          const block = getDirectBlockParent(view, posResult.pos);
          if (!block) {
            handle.style.display = 'none';
            currentBlock = null;
            return false;
          }

          currentBlock = block;
          const blockRect = block.dom.getBoundingClientRect();
          const editorRect = view.dom.getBoundingClientRect();

          handle.style.display = 'flex';
          handle.style.top = `${blockRect.top - editorRect.top + view.dom.scrollTop}px`;
          handle.style.left = '-28px';

          return false;
        },
        mouseleave: () => {
          handle.style.display = 'none';
          currentBlock = null;
          return false;
        },
      },
    },
    view: () => ({
      destroy: () => {
        handle.style.display = 'none';
      },
    }),
  });

  // Drag start handled by the DragHandle React component below
  void currentBlock;
}

interface DragHandleProps {
  editor: Editor;
}

export function DragHandle({ editor }: DragHandleProps) {
  const handleRef = useRef<HTMLDivElement>(null);
  const registeredRef = useRef(false);

  useEffect(() => {
    const handle = handleRef.current;
    if (!handle || registeredRef.current) return;
    registeredRef.current = true;

    const plugin = createDragHandlePlugin(handle);
    editor.registerPlugin(plugin);

    let dragPos: number | null = null;

    const onMouseDown = (e: MouseEvent) => {
      const view = editor.view;
      const coords = { left: e.clientX + 40, top: e.clientY };
      const posResult = view.posAtCoords(coords);
      if (!posResult) return;

      const block = getDirectBlockParent(view, posResult.pos);
      if (!block) return;

      dragPos = block.pos;
      const tr = view.state.tr.setSelection(NodeSelection.create(view.state.doc, block.pos));
      view.dispatch(tr);
    };

    const onDragStart = (e: DragEvent) => {
      if (dragPos === null) return;
      const view = editor.view;
      const slice = view.state.doc.slice(dragPos, view.state.doc.resolve(dragPos).after());
      const serializer = DOMSerializer.fromSchema(view.state.schema);
      const fragment = serializer.serializeFragment(slice.content);
      const wrapper = document.createElement('div');
      wrapper.appendChild(fragment);
      e.dataTransfer?.setData('text/html', wrapper.innerHTML);
      e.dataTransfer?.setData('text/plain', wrapper.textContent ?? '');
      view.dragging = { slice, move: true };
    };

    handle.addEventListener('mousedown', onMouseDown);
    handle.addEventListener('dragstart', onDragStart);

    return () => {
      handle.removeEventListener('mousedown', onMouseDown);
      handle.removeEventListener('dragstart', onDragStart);
      editor.unregisterPlugin(dragHandlePluginKey);
    };
  }, [editor]);

  return (
    <div
      ref={handleRef}
      className="editor-drag-handle"
      draggable="true"
      style={{ display: 'none' }}
      title="Drag to move"
    >
      ⠿
    </div>
  );
}
