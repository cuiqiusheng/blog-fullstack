import { type JSX, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import rehypeSlug from 'rehype-slug';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

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

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeSlug, rehypeSanitize]}
        components={{ code: CodeBlock }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
