import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/shared/hooks/useAuth';
import { AppLayout } from '@/features/layout';

function PlaceholderPage({ name }: { name: 'posts' | 'userSetting' | 'ai' }) {
  const { t } = useTranslation();
  return <div style={{ color: 'rgba(0, 0, 0, 0.65)' }}>{t(`placeholders.${name}`)}</div>;
}

const LoginPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import('@/pages/home').then(m => ({ default: m.HomePage })));
const PostListPage = lazy(() => import('@/pages/posts').then(m => ({ default: m.PostListPage })));
const PostDetailPage = lazy(() =>
  import('@/pages/posts').then(m => ({ default: m.PostDetailPage })),
);

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/home' : '/login'} replace />;
}

function PageFallback() {
  return (
    <div
      style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}
    >
      <Spin size="large" />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PostListPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PostDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-setting"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PlaceholderPage name="userSetting" />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PlaceholderPage name="ai" />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
  );
}
