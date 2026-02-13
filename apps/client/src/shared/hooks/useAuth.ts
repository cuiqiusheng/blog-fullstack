import { getToken } from '@/lib/auth';

export function useAuth() {
  return { isAuthenticated: !!getToken() };
}
