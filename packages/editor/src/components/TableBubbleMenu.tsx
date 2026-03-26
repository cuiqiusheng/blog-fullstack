import type { ReactNode } from 'react';
import { useEditorState, type Editor } from '@tiptap/react';
import type { TableBubbleLabels } from '../types';

const DEFAULT_LABELS: Required<TableBubbleLabels> = {
  tableContextToolbar: 'Table',
  addRowBefore: 'Add row above',
  addRowAfter: 'Add row below',
  addColumnBefore: 'Add column left',
  addColumnAfter: 'Add column right',
  deleteRow: 'Delete row',
  deleteColumn: 'Delete column',
  deleteTable: 'Delete table',
};

const NO_TABLE_CMD = {
  inTable: false,
  addRowBefore: false,
  addRowAfter: false,
  addColumnBefore: false,
  addColumnAfter: false,
  deleteRow: false,
  deleteColumn: false,
  deleteTable: false,
};

interface TableBubbleMenuProps {
  editor: Editor;
  labels?: TableBubbleLabels;
}

function TableToolbarBtn({
  onClick,
  disabled,
  title,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className="editor-table-toolbar-btn"
      title={title}
      disabled={disabled}
      onMouseDown={e => e.preventDefault()}
      onClick={() => {
        onClick();
      }}
    >
      {children}
    </button>
  );
}

/**
 /**
  * Table context toolbar: only displayed when the cursor is inside a table (below the main toolbar).
  * Avoids using BubbleMenu + appendTo(body) which can cause React event issues, and does not interfere with main content input.
  */
export function TableBubbleMenu({ editor, labels: customLabels }: TableBubbleMenuProps) {
  const l = { ...DEFAULT_LABELS, ...customLabels };

  const state = useEditorState({
    editor,
    selector: snapshot => {
      const ed = snapshot.editor;
      if (!ed || ed.isDestroyed) {
        return NO_TABLE_CMD;
      }
      if (!ed.isEditable || !ed.isActive('table')) {
        return NO_TABLE_CMD;
      }
      const can = ed.can();
      return {
        inTable: true,
        addRowBefore: can.addRowBefore(),
        addRowAfter: can.addRowAfter(),
        addColumnBefore: can.addColumnBefore(),
        addColumnAfter: can.addColumnAfter(),
        deleteRow: can.deleteRow(),
        deleteColumn: can.deleteColumn(),
        deleteTable: can.deleteTable(),
      };
    },
  });

  if (!state.inTable) {
    return null;
  }

  return (
    <div className="editor-table-context-toolbar" role="toolbar" aria-label={l.tableContextToolbar}>
      <span className="editor-table-context-toolbar-hint">{l.tableContextToolbar}</span>
      <TableToolbarBtn
        title={l.addRowBefore}
        disabled={!state.addRowBefore}
        onClick={() => editor.chain().focus().addRowBefore().run()}
      >
        ↑
      </TableToolbarBtn>
      <TableToolbarBtn
        title={l.addRowAfter}
        disabled={!state.addRowAfter}
        onClick={() => editor.chain().focus().addRowAfter().run()}
      >
        ↓
      </TableToolbarBtn>
      <span className="editor-table-toolbar-sep" aria-hidden />
      <TableToolbarBtn
        title={l.addColumnBefore}
        disabled={!state.addColumnBefore}
        onClick={() => editor.chain().focus().addColumnBefore().run()}
      >
        ←
      </TableToolbarBtn>
      <TableToolbarBtn
        title={l.addColumnAfter}
        disabled={!state.addColumnAfter}
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      >
        →
      </TableToolbarBtn>
      <span className="editor-table-toolbar-sep" aria-hidden />
      <TableToolbarBtn
        title={l.deleteRow}
        disabled={!state.deleteRow}
        onClick={() => editor.chain().focus().deleteRow().run()}
      >
        ⊖
      </TableToolbarBtn>
      <TableToolbarBtn
        title={l.deleteColumn}
        disabled={!state.deleteColumn}
        onClick={() => editor.chain().focus().deleteColumn().run()}
      >
        ⊟
      </TableToolbarBtn>
      <TableToolbarBtn
        title={l.deleteTable}
        disabled={!state.deleteTable}
        onClick={() => editor.chain().focus().deleteTable().run()}
      >
        ✕
      </TableToolbarBtn>
    </div>
  );
}
