import { Extension, type Extensions } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Typography from '@tiptap/extension-typography';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Markdown } from 'tiptap-markdown';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { CodeBlockLowlightExtension } from './codeBlockLowlight';
import { SlashCommandExtension, slashCommandItems } from './slashCommand';
import { createSlashSuggestion } from './slashSuggestion';
import { ImageUploadStorage } from './imageUploadStorage';

interface ExtensionOptions {
  placeholder?: string;
  onImageUpload?: ((file: File) => Promise<string>) | null;
}

function isImageFile(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type);
}

export function createExtensions(options: ExtensionOptions): Extensions {
  const { onImageUpload } = options;

  return [
    StarterKit.configure({
      codeBlock: false,
    }),
    CodeBlockLowlightExtension,
    Placeholder.configure({
      placeholder: options.placeholder ?? 'Start writing...',
    }),
    Typography,
    Image.configure({
      inline: false,
      allowBase64: false,
    }),
    Link.configure({
      openOnClick: false,
      autolink: true,
      linkOnPaste: true,
    }),
    Table.configure({
      resizable: false,
    }),
    TableRow,
    TableCell,
    TableHeader,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    SlashCommandExtension.configure({
      suggestion: createSlashSuggestion(slashCommandItems),
    }),
    Markdown.configure({
      html: false,
      transformPastedText: true,
      transformCopiedText: true,
    }),
    ImageUploadStorage,
    ...(onImageUpload ? [createImagePasteDropExtension(onImageUpload)] : []),
  ];
}

function createImagePasteDropExtension(uploadFn: (file: File) => Promise<string>) {
  return Extension.create({
    name: 'imagePasteDrop',

    addProseMirrorPlugins() {
      const editor = this.editor;

      return [
        new Plugin({
          key: new PluginKey('imagePasteDrop'),
          props: {
            handlePaste(_view, event) {
              const files = event.clipboardData?.files;
              if (!files?.length) return false;

              const imageFile = Array.from(files).find(isImageFile);
              if (!imageFile) return false;

              event.preventDefault();
              uploadFn(imageFile).then(url => {
                editor.chain().focus().setImage({ src: url }).run();
              });
              return true;
            },

            handleDrop(_view, event) {
              const files = (event as DragEvent).dataTransfer?.files;
              if (!files?.length) return false;

              const imageFile = Array.from(files).find(isImageFile);
              if (!imageFile) return false;

              event.preventDefault();
              uploadFn(imageFile).then(url => {
                editor.chain().focus().setImage({ src: url }).run();
              });
              return true;
            },
          },
        }),
      ];
    },
  });
}
