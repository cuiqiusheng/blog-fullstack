import { Extension } from '@tiptap/core';
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion';

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: {
    editor: SuggestionOptions['editor'];
    range: { from: number; to: number };
  }) => void;
}

export const slashCommandItems: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: 'H1',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
    },
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: 'H2',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
    },
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: 'H3',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
    },
  },
  {
    title: 'Bullet List',
    description: 'Unordered list',
    icon: '•',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'Ordered List',
    description: 'Numbered list',
    icon: '1.',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'Task List',
    description: 'Checklist with checkboxes',
    icon: '☑',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'Blockquote',
    description: 'Quotation block',
    icon: '❝',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: 'Code Block',
    description: 'Code with syntax highlighting',
    icon: '{ }',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: 'Image',
    description: 'Insert image from URL',
    icon: '🖼',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      const trigger = (
        editor.storage as { imageUploadStorage?: { triggerUploadModal?: (() => void) | null } }
      ).imageUploadStorage?.triggerUploadModal;
      if (trigger) {
        trigger();
      } else {
        const url = window.prompt('Image URL');
        if (url) {
          editor.chain().focus().setImage({ src: url }).run();
        }
      }
    },
  },
  {
    title: 'Table',
    description: 'Insert a 3×3 table',
    icon: '⊞',
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
  {
    title: 'Horizontal Rule',
    description: 'Visual divider',
    icon: '―',
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
];

export const SlashCommandExtension = Extension.create({
  name: 'slashCommand',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        startOfLine: false,
        command: ({
          editor,
          range,
          props,
        }: {
          editor: SuggestionOptions['editor'];
          range: { from: number; to: number };
          props: SlashCommandItem;
        }) => {
          props.command({ editor, range });
        },
      } satisfies Partial<SuggestionOptions>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});
