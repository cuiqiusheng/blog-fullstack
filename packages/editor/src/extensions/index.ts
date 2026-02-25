import type { Extensions } from '@tiptap/core';
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
import { CodeBlockLowlightExtension } from './codeBlockLowlight';
import { SlashCommandExtension, slashCommandItems } from './slashCommand';
import { createSlashSuggestion } from './slashSuggestion';

export function createExtensions(options: { placeholder?: string }): Extensions {
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
  ];
}
