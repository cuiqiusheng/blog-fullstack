import { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

let mermaidInitialized = false;
let idCounter = 0;

function ensureMermaidInit() {
  if (mermaidInitialized) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
  });
  mermaidInitialized = true;
}

interface MermaidBlockProps {
  chart: string;
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chart.trim()) return;

    ensureMermaidInit();
    const id = `mermaid-${++idCounter}`;

    let cancelled = false;
    mermaid
      .render(id, chart.trim())
      .then(({ svg }) => {
        if (!cancelled && el) {
          el.innerHTML = svg;
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <pre style={{ color: '#ff4d4f', whiteSpace: 'pre-wrap', fontSize: 12 }}>
        Mermaid rendering error: {error}
      </pre>
    );
  }

  return <div ref={containerRef} style={{ textAlign: 'center' }} />;
}
