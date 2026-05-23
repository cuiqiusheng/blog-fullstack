import { useState, useEffect, useRef } from 'react';
import { Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TocHeading } from '@blog-fullstack/content-utils';
import './postToc.css';

const { Text } = Typography;

const HEADER_OFFSET = 80;

interface PostTocProps {
  headings: TocHeading[];
}

function getScrollTarget(id: string): HTMLElement | null {
  return document.getElementById(id);
}

function getActiveId(headings: TocHeading[]): string {
  for (let i = headings.length - 1; i >= 0; i--) {
    const el = getScrollTarget(headings[i].id);
    if (el && el.getBoundingClientRect().top <= HEADER_OFFSET + 8) {
      return headings[i].id;
    }
  }
  return headings[0]?.id ?? '';
}

export function PostToc({ headings }: PostTocProps) {
  const { t } = useTranslation();
  const [activeId, setActiveId] = useState('');
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (headings.length < 2) return;

    const onScroll = () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setActiveId(getActiveId(headings));
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [headings]);

  if (headings.length < 2) return null;

  const handleClick = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = getScrollTarget(id);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    history.pushState(null, '', `#${id}`);
    setActiveId(id);
  };

  return (
    <Card size="small" className="post-toc-card">
      <Text strong className="post-toc__title">
        {t('posts.detail.toc')}
      </Text>
      <nav className="post-toc">
        {headings.map(h => (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`post-toc__item post-toc__item--h${h.level}${activeId === h.id ? ' post-toc__item--active' : ''}`}
            onClick={e => handleClick(e, h.id)}
          >
            {h.text}
          </a>
        ))}
      </nav>
    </Card>
  );
}
