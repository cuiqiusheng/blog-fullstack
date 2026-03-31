import { useSyncExternalStore } from 'react';
import { getAuthTokenSnapshot, subscribeAuth } from '@/lib/auth';

export function useAuth() {
  const token = useSyncExternalStore(subscribeAuth, getAuthTokenSnapshot, () => null);
  return { isAuthenticated: !!token };
}
