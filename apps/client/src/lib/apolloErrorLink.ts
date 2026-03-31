import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import type { ApolloClient } from '@apollo/client';
import { clearToken, getToken } from './auth';
import { notifySessionInvalidated } from './authSessionBridge';

function hasUnauthenticatedError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }
  return error.errors.some(
    e => e.extensions && (e.extensions as { code?: string }).code === 'UNAUTHENTICATED',
  );
}

/**
 * Clears invalid session when the server rejects the current Bearer token.
 * Only runs if a token was present (avoids treating guest / login-failure noise as session loss).
 */
export function createSessionErrorLink(getClient: () => ApolloClient) {
  return new ErrorLink(({ error }) => {
    if (!hasUnauthenticatedError(error)) {
      return;
    }

    const hadToken = !!getToken();
    if (!hadToken) {
      return;
    }

    void (async () => {
      clearToken();
      await getClient().clearStore();
      notifySessionInvalidated();
    })();
  });
}
