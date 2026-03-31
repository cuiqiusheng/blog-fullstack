import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSessionInvalidatedHandler } from '@/lib/authSessionBridge';

/**
 * Registers navigation when Apollo session error link clears an invalid token.
 * Must render under `BrowserRouter`.
 */
export function SessionInvalidatedNavigation() {
  const navigate = useNavigate();

  useEffect(() => {
    setSessionInvalidatedHandler(() => {
      const path = window.location.pathname;
      if (path === '/login' || path === '/register') {
        return;
      }
      navigate('/login', { replace: true, state: { reason: 'session_expired' as const } });
    });
    return () => setSessionInvalidatedHandler(null);
  }, [navigate]);

  return null;
}
