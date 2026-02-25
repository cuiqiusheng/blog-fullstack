import { ReactRenderer } from '@tiptap/react';
import tippy, { type Instance as TippyInstance } from 'tippy.js';
import type { SuggestionOptions } from '@tiptap/suggestion';
import { SlashMenu, type SlashMenuRef } from '../components/SlashMenu';
import type { SlashCommandItem } from './slashCommand';

export function createSlashSuggestion(
  items: SlashCommandItem[],
): Partial<SuggestionOptions<SlashCommandItem>> {
  return {
    char: '/',
    startOfLine: false,

    items: ({ query }) => {
      const q = query.toLowerCase();
      return items.filter(
        item => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q),
      );
    },

    render: () => {
      let component: ReactRenderer<SlashMenuRef> | null = null;
      let popup: TippyInstance[] | null = null;

      return {
        onStart: props => {
          component = new ReactRenderer(SlashMenu, {
            props,
            editor: props.editor,
          });

          if (!props.clientRect) return;

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          });
        },

        onUpdate: props => {
          component?.updateProps(props);

          if (props.clientRect && popup?.[0]) {
            popup[0].setProps({
              getReferenceClientRect: props.clientRect as () => DOMRect,
            });
          }
        },

        onKeyDown: props => {
          if (props.event.key === 'Escape') {
            popup?.[0]?.hide();
            return true;
          }
          return component?.ref?.onKeyDown(props) ?? false;
        },

        onExit: () => {
          popup?.[0]?.destroy();
          component?.destroy();
        },
      };
    },
  };
}
