import { ErrorLink } from '@apollo/client/link/error';
import { CombinedGraphQLErrors, CombinedProtocolErrors, isErrorLike } from '@apollo/client/errors';
import type { ApolloClient } from '@apollo/client';
import { clearToken, getToken } from './auth';
import { notifySessionInvalidated } from './authSessionBridge';
import { notifyGraphqlErrorUserMessage } from './graphqlErrorBridge';

const GLOBAL_ERROR_DEDUP_MS = 900;

let lastGlobalError: { text: string; at: number } = { text: '', at: 0 };

function hasUnauthenticatedError(error: unknown): boolean {
  if (!CombinedGraphQLErrors.is(error)) {
    return false;
  }
  return error.errors.some(
    e => e.extensions && (e.extensions as { code?: string }).code === 'UNAUTHENTICATED',
  );
}

function formatLinkErrorMessage(error: unknown): string | null {
  if (CombinedGraphQLErrors.is(error)) {
    const parts = error.errors.map(e => e.message).filter(Boolean);
    return parts.length ? parts.join('\n') : null;
  }
  if (CombinedProtocolErrors.is(error)) {
    return error.message?.trim() || null;
  }
  if (isErrorLike(error)) {
    return error.message?.trim() || null;
  }
  if (error instanceof Error) {
    return error.message?.trim() || null;
  }
  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }
  return null;
}

function emitGlobalUserError(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  const now = Date.now();
  if (trimmed === lastGlobalError.text && now - lastGlobalError.at < GLOBAL_ERROR_DEDUP_MS) {
    return;
  }
  lastGlobalError = { text: trimmed, at: now };
  notifyGraphqlErrorUserMessage(trimmed);
}

/**
 * Clears invalid session when the server rejects the current Bearer token.
 * Surfaces other GraphQL / network errors via {@link registerGraphqlErrorNotifier} (antd message).
 *
 * Opt out per operation: `useQuery(MY_QUERY, { context: { skipGlobalError: true } })`.
 */
export function createSessionErrorLink(getClient: () => ApolloClient) {
  return new ErrorLink(({ error, operation }) => {
    if (hasUnauthenticatedError(error)) {
      const hadToken = !!getToken();
      if (hadToken) {
        void (async () => {
          clearToken();
          await getClient().clearStore();
          notifySessionInvalidated();
        })();
      }
      return;
    }

    if (operation.getContext().skipGlobalError === true) {
      return;
    }

    const msg = formatLinkErrorMessage(error);
    if (msg) {
      emitGlobalUserError(msg);
    }
  });
}
