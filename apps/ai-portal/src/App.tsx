import { Navigate, Route, Routes } from 'react-router-dom';
import ArticleDetailPage from './pages/ArticleDetailPage';
import ArticleListPage from './pages/ArticleListPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ArticleListPage />} />
      <Route path="/articles/:id" element={<ArticleDetailPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
