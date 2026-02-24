import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../types/context';
import type { AuthUser } from '../middleware/auth';

/**
 * Require authentication, otherwise throw UNAUTHENTICATED
 */
export function requireAuth(context: GraphQLContext): AuthUser {
  if (!context.isAuthenticated || !context.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

/**
 * Require having the specified role, otherwise throw FORBIDDEN
 */
export function requireRole(context: GraphQLContext, roleName: string): AuthUser {
  const user = requireAuth(context);
  const hasRole = user.roles.some(r => r.name === roleName);
  if (!hasRole) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}

/**
 * Require having any of the specified roles
 */
export function requireAnyRole(context: GraphQLContext, roleNames: string[]): AuthUser {
  const user = requireAuth(context);
  const hasRole = user.roles.some(r => roleNames.includes(r.name));
  if (!hasRole) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
  return user;
}
