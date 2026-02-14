import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import type { GraphQLContext } from '../../types/context';
import { generateToken } from '../../utils/jwt';
import { hashPassword, comparePassword } from '../../utils/encrypt';
import { requireAuth } from '../../utils/permissions';
import { logger, maskEmail } from '../../utils/logger';
import type { MutationLoginArgs, MutationRegisterArgs } from '../__generated__/types';

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, context: GraphQLContext) => {
      const user = requireAuth(context);
      return user;
    },
  },

  Mutation: {
    login: async (_: unknown, { email, password }: MutationLoginArgs, context: GraphQLContext) => {
      const masked = maskEmail(email);
      const reqLog = context.req?.log ?? logger;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { roles: { select: { id: true, name: true, description: true } } },
      });

      if (!user) {
        reqLog.warn({ maskedEmail: masked, reason: 'user_not_found' }, 'Login failed');
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const isValid = await comparePassword(password, user.password);
      if (!isValid) {
        reqLog.warn(
          { maskedEmail: masked, userId: user.id, reason: 'invalid_password' },
          'Login failed',
        );
        throw new GraphQLError('Invalid email or password', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      reqLog.info({ userId: user.id, maskedEmail: masked }, 'Login success');
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      };
    },

    register: async (
      _: unknown,
      { email, password }: MutationRegisterArgs,
      context: GraphQLContext,
    ) => {
      const masked = maskEmail(email);
      const reqLog = context.req?.log ?? logger;

      const existing = await prisma.user.findUnique({
        where: { email },
      });

      if (existing) {
        reqLog.warn({ maskedEmail: masked, reason: 'email_exists' }, 'Register failed');
        throw new GraphQLError('User already exists with this email', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
        },
        include: { roles: { select: { id: true, name: true, description: true } } },
      });

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      reqLog.info({ userId: user.id, maskedEmail: masked }, 'Register success');
      return {
        token,
        user: {
          id: user.id,
          email: user.email,
          roles: user.roles,
        },
      };
    },
  },
};
