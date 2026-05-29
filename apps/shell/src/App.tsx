import { Link, Navigate, Route, Routes } from 'react-router-dom';

function BlogEntryPlaceholder() {
  return <div>Blog remote 挂载点（下一步接入）</div>;
}

function AiEntryPlaceholder() {
  return <div>AI Portal remote 挂载点（下一步接入）</div>;
}

export default function App() {
  return (
    <div style={{ padding: 16 }}>
      <header style={{ marginBottom: 16 }}>
        <nav style={{ display: 'flex', gap: 12 }}>
          <Link to="/">博客</Link>
          <Link to="/ai">AI 专栏</Link>
        </nav>
      </header>

      <Routes>
        <Route path="/" element={<BlogEntryPlaceholder />} />
        <Route path="/ai/*" element={<AiEntryPlaceholder />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
