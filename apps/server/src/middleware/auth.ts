import type { Request } from 'express';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

export interface AuthUser {
  id: string;
  email: string;
  roles: Array<{ id: string; name: string; description: string | null }>;
}

export interface AuthContext {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

async function buildAuthContextFromToken(token: string): Promise<AuthContext> {
  try {
    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        roles: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (!user) {
      return { user: null, isAuthenticated: false };
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles,
      },
      isAuthenticated: true,
    };
  } catch {
    return { user: null, isAuthenticated: false };
  }
}

export async function createAuthContextFromAuthorizationHeader(
  authorizationHeader?: string,
): Promise<AuthContext> {
  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    return { user: null, isAuthenticated: false };
  }
  const token = authorizationHeader.split(' ')[1];
  if (!token) {
    return { user: null, isAuthenticated: false };
  }
  return buildAuthContextFromToken(token);
}

/**
 * Extract and verify Token from request, return user context.
 * Call in Apollo Server context.
 */
export async function createAuthContext(req: Request): Promise<AuthContext> {
  return createAuthContextFromAuthorizationHeader(req.headers.authorization);
}
