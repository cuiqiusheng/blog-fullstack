import '@blog-fullstack/content-theme/code-highlight.css';
import '@blog-fullstack/content-theme/nested-ordered-lists.css';
import { type JSX, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize from 'rehype-sanitize';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { rehypeTocSlug } from './rehypeTocSlug';
import './styles.css';

/**
 * Lazily load the MermaidBlock component to avoid importing the Mermaid library on initial load, preventing slow page loads.
 * The Mermaid library is only loaded when a Mermaid chart needs to be rendered.
 */
const MermaidBlock = lazy(() => import('./MermaidBlock').then(m => ({ default: m.MermaidBlock })));

export interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function CodeBlock(props: JSX.IntrinsicElements['code']) {
  const { children, className, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const lang = match?.[1];

  if (lang === 'mermaid') {
    const chart = String(children).replace(/\n$/, '');
    return (
      <Suspense fallback={<pre>{chart}</pre>}>
        <MermaidBlock chart={chart} />
      </Suspense>
    );
  }

  return (
    <code className={className} {...rest}>
      {children}
    </code>
  );
}

function TableBlock(props: JSX.IntrinsicElements['table']) {
  const { children, ...rest } = props;
  return (
    <div className="markdown-renderer__table-wrap">
      <table {...rest}>{children}</table>
    </div>
  );
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const wrapperClassName = ['markdown-renderer', 'content-theme-host', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={wrapperClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[
          rehypeSanitize,
          rehypeTocSlug,
          [
            rehypeHighlight,
            {
              /** 不交给 lowlight 解析，仍由下方 CodeBlock 走 Mermaid 渲染 */
              plainText: ['mermaid'],
            },
          ],
        ]}
        components={{ code: CodeBlock, table: TableBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
