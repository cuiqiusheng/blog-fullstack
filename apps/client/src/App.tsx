import { useState } from 'react';
import { useMutation, useQuery } from '@apollo/client/react';
import { LOGIN, ME } from './graphql/auth';
import { setToken, clearToken, getToken } from './lib/auth';
import './App.css';

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { loading: loginLoading, error: loginError }] = useMutation(LOGIN, {
    onCompleted: (data: unknown) => {
      const payload = data as { login: { token: string } };
      if (payload?.login?.token) {
        setToken(payload.login.token);
        setEmail('');
        setPassword('');
      }
    },
  });

  const {
    data: meData,
    loading: meLoading,
    refetch: refetchMe,
  } = useQuery(ME, { skip: !getToken() });

  const isLoggedIn = !!getToken();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login({ variables: { email, password } });
  };

  const handleLogout = () => {
    clearToken();
    refetchMe();
  };

  return (
    <div style={{ padding: 24, maxWidth: 480, margin: '0 auto' }}>
      <h1>Blog 登录</h1>

      {!isLoggedIn ? (
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 12 }}>
            <input
              type="email"
              placeholder="邮箱"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: 8 }}
            />
          </div>
          {loginError && <p style={{ color: 'red', marginBottom: 8 }}>{loginError.message}</p>}
          <button type="submit" disabled={loginLoading} style={{ padding: '8px 16px' }}>
            {loginLoading ? '登录中…' : '登录'}
          </button>
        </form>
      ) : (
        <div>
          <p>已登录。每次请求都会自动携带 Authorization header。</p>
          <button onClick={handleLogout} style={{ marginBottom: 16 }}>
            退出登录
          </button>
          <h2>当前用户 (me 接口，需带 Token)</h2>
          {meLoading ? (
            <p>加载中…</p>
          ) : (meData as { me?: unknown })?.me ? (
            <pre style={{ background: '#f5f5f5', padding: 12, overflow: 'auto' }}>
              {JSON.stringify((meData as { me: unknown }).me, null, 2)}
            </pre>
          ) : (
            <p>未获取到用户信息</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
