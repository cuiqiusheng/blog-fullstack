import { forwardRef, useEffect, useImperativeHandle, useState, useCallback, useRef } from 'react';
import type { SlashCommandItem } from '../extensions/slashCommand';

export interface SlashMenuRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

interface SlashMenuProps {
  items: SlashCommandItem[];
  command: (item: SlashCommandItem) => void;
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedIndex(0);
  }, [items]);

  useEffect(() => {
    const active = containerRef.current?.querySelector('.is-selected');
    active?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const selectItem = useCallback(
    (index: number) => {
      const item = items[index];
      if (item) {
        command(item);
      }
    },
    [items, command],
  );

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex(prev => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex(prev => (prev + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return <div className="editor-slash-menu">No results</div>;
  }

  return (
    <div className="editor-slash-menu" ref={containerRef}>
      {items.map((item, index) => (
        <button
          key={item.title}
          type="button"
          className={`editor-slash-menu-item${index === selectedIndex ? ' is-selected' : ''}`}
          onClick={() => selectItem(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <span className="editor-slash-menu-icon">{item.icon}</span>
          <div className="editor-slash-menu-text">
            <span className="editor-slash-menu-title">{item.title}</span>
            <span className="editor-slash-menu-desc">{item.description}</span>
          </div>
        </button>
      ))}
    </div>
  );
});

SlashMenu.displayName = 'SlashMenu';
