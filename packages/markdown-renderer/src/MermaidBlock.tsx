import { useEffect, useRef, useState } from 'react';

interface MermaidAPI {
  initialize: (config: Record<string, unknown>) => void;
  render: (id: string, definition: string) => Promise<{ svg: string }>;
}

const CDN_URL = 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

let mermaidPromise: Promise<MermaidAPI> | null = null;
let idCounter = 0;

function loadMermaid(): Promise<MermaidAPI> {
  if (!mermaidPromise) {
    mermaidPromise = import(/* @vite-ignore */ CDN_URL).then(mod => {
      const api: MermaidAPI = mod.default;
      api.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
      return api;
    });
  }
  return mermaidPromise;
}

interface MermaidBlockProps {
  chart: string;
}

export function MermaidBlock({ chart }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || !chart.trim()) return;

    let cancelled = false;
    const id = `mermaid-${++idCounter}`;

    loadMermaid()
      .then(api => api.render(id, chart.trim()))
      .then(({ svg }) => {
        if (!cancelled && el) {
          el.innerHTML = svg;
          setLoading(false);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
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

  return (
    <div>
      {loading && (
        <div style={{ textAlign: 'center', padding: 16, color: '#999', fontSize: 13 }}>
          Loading diagram...
        </div>
      )}
      <div ref={containerRef} style={{ textAlign: 'center' }} />
    </div>
  );
}
