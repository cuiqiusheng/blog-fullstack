import { GraphQLError } from 'graphql';
import type { GraphQLContext } from '../types/context';
import type { AuthUser } from '../middleware/auth';

/**
 * 要求已认证，否则抛出 UNAUTHENTICATED
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
 * 要求拥有指定角色，否则抛出 FORBIDDEN
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
 * 要求拥有任意一个指定角色
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
