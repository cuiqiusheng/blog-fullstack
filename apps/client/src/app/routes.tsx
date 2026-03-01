import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '@/shared/hooks/useAuth';
import { AppLayout } from '@/features/layout';

const LoginPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/auth').then(m => ({ default: m.RegisterPage })));
const HomePage = lazy(() => import('@/pages/home').then(m => ({ default: m.HomePage })));
const PostListPage = lazy(() => import('@/pages/posts').then(m => ({ default: m.PostListPage })));
const PostDetailPage = lazy(() =>
  import('@/pages/posts').then(m => ({ default: m.PostDetailPage })),
);
const PostWritePage = lazy(() => import('@/pages/posts').then(m => ({ default: m.PostWritePage })));
const AiChatPage = lazy(() => import('@/pages/ai/index').then(m => ({ default: m.AiChatPage })));
const UserSettingPage = lazy(() =>
  import('@/pages/user-setting').then(m => ({ default: m.UserSettingPage })),
);
const BookmarksPage = lazy(() =>
  import('@/pages/bookmarks').then(m => ({ default: m.BookmarksPage })),
);
const ProfilePage = lazy(() =>
  import('@/pages/profile/ProfilePage').then(m => ({ default: m.ProfilePage })),
);
const UserProfilePage = lazy(() =>
  import('@/pages/profile/UserProfilePage').then(m => ({ default: m.UserProfilePage })),
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
    return <Navigate to="/explore" replace />;
  }
  return <>{children}</>;
}

function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return <Navigate to={isAuthenticated ? '/posts' : '/login'} replace />;
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
          path="/explore"
          element={
            <ProtectedRoute>
              <AppLayout>
                <HomePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/new"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PostWritePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/:id/edit"
          element={
            <ProtectedRoute>
              <AppLayout>
                <PostWritePage />
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
          path="/bookmarks"
          element={
            <ProtectedRoute>
              <AppLayout>
                <BookmarksPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserProfilePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-setting"
          element={
            <ProtectedRoute>
              <AppLayout>
                <UserSettingPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai/:topicId?"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AiChatPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/explore" replace />} />
      </Routes>
    </Suspense>
  );
}
