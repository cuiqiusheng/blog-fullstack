import { GraphQLError } from 'graphql';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../utils/encrypt';

const USER_INCLUDE = {
  roles: { select: { id: true, name: true, description: true } },
} as const;

export async function updateUserProfile(
  userId: string,
  data: { nickname?: string | null; avatarUrl?: string | null },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      nickname: data.nickname ?? undefined,
      avatarUrl: data.avatarUrl ?? undefined,
    },
    include: USER_INCLUDE,
  });
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });
  }

  const isValid = await comparePassword(currentPassword, user.password);
  if (!isValid) {
    throw new GraphQLError('Current password is incorrect', {
      extensions: { code: 'BAD_USER_INPUT' },
    });
  }

  const hashed = await hashPassword(newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  return true;
}
