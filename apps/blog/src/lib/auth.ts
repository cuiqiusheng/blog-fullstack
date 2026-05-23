const TOKEN_KEY = 'blog_token';

const listeners = new Set<() => void>();

export function subscribeAuth(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Snapshot for `useSyncExternalStore` (same source as `getToken`). */
export function getAuthTokenSnapshot(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function emitAuthChange(): void {
  listeners.forEach(l => l());
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
  emitAuthChange();
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
  emitAuthChange();
}
