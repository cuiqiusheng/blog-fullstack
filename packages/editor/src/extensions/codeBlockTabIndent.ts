import { Extension } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';

const INDENT = '  ';

function getCodeBlockTextRange(editor: {
  state: {
    selection: {
      from: number;
      to: number;
      $from: { parent: { textContent: string }; start: () => number };
    };
  };
}) {
  const { from, to, $from } = editor.state.selection;
  const parentStart = $from.start();
  const parentText = $from.parent.textContent;

  const fromOffset = from - parentStart;
  const toOffset = to - parentStart;

  const lineStartOffset = parentText.lastIndexOf('\n', Math.max(0, fromOffset - 1)) + 1;
  const nextLineBreak = parentText.indexOf('\n', toOffset);
  const lineEndOffset = nextLineBreak === -1 ? parentText.length : nextLineBreak;

  return {
    parentStart,
    lineStartOffset,
    lineEndOffset,
    replaceFrom: parentStart + lineStartOffset,
    replaceTo: parentStart + lineEndOffset,
    selectedText: parentText.slice(lineStartOffset, lineEndOffset),
  };
}

export const CodeBlockTabIndentExtension = Extension.create({
  name: 'codeBlockTabIndent',

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (!this.editor.isActive('codeBlock')) {
          return false;
        }

        const { state, view } = this.editor;
        const { from, to, empty } = state.selection;

        if (empty) {
          view.dispatch(state.tr.insertText(INDENT, from, to));
          return true;
        }

        const range = getCodeBlockTextRange(this.editor);
        const indented = range.selectedText
          .split('\n')
          .map(line => `${INDENT}${line}`)
          .join('\n');

        const lineCount = range.selectedText.split('\n').length;
        const addedChars = lineCount * INDENT.length;
        const tr = state.tr.insertText(indented, range.replaceFrom, range.replaceTo);
        tr.setSelection(TextSelection.create(tr.doc, from + INDENT.length, to + addedChars));
        view.dispatch(tr);
        return true;
      },

      'Shift-Tab': () => {
        if (!this.editor.isActive('codeBlock')) {
          return false;
        }

        const { state, view } = this.editor;
        const { from, to } = state.selection;
        const range = getCodeBlockTextRange(this.editor);
        const lines = range.selectedText.split('\n');

        let removedChars = 0;
        const outdented = lines
          .map(line => {
            if (line.startsWith(INDENT)) {
              removedChars += INDENT.length;
              return line.slice(INDENT.length);
            }
            if (line.startsWith(' ')) {
              removedChars += 1;
              return line.slice(1);
            }
            return line;
          })
          .join('\n');

        if (outdented === range.selectedText) {
          return true;
        }

        const tr = state.tr.insertText(outdented, range.replaceFrom, range.replaceTo);
        const startShift = lines[0].startsWith(INDENT)
          ? INDENT.length
          : lines[0].startsWith(' ')
            ? 1
            : 0;
        const nextFrom = Math.max(range.replaceFrom, from - startShift);
        const nextTo = Math.max(nextFrom, to - removedChars);
        tr.setSelection(TextSelection.create(tr.doc, nextFrom, nextTo));
        view.dispatch(tr);
        return true;
      },
    };
  },
});
