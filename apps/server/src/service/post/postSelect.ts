import type { Prisma } from '@/generated/prisma/client';

export const postAuthorInclude = {
  author: {
    select: {
      id: true,
      email: true,
      nickname: true,
      avatarUrl: true,
      createdAt: true,
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              name: true,
              description: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.PostInclude;

export type PostWithAuthor = Prisma.PostGetPayload<{
  include: typeof postAuthorInclude;
}>;
