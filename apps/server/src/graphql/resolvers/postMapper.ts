import { PostStatus as PrismaPostStatus } from '@/generated/prisma/client';
import { PostStatus as GqlPostStatus } from '../__generated__/types';
import type { PostWithAuthor } from '@/service/post';

export const gqlToPrismaStatus: Record<GqlPostStatus, PrismaPostStatus> = {
  [GqlPostStatus.Draft]: PrismaPostStatus.DRAFT,
  [GqlPostStatus.Published]: PrismaPostStatus.PUBLISHED,
  [GqlPostStatus.Archived]: PrismaPostStatus.ARCHIVED,
};

export const prismaToGqlStatus: Record<PrismaPostStatus, GqlPostStatus> = {
  [PrismaPostStatus.DRAFT]: GqlPostStatus.Draft,
  [PrismaPostStatus.PUBLISHED]: GqlPostStatus.Published,
  [PrismaPostStatus.ARCHIVED]: GqlPostStatus.Archived,
};

export function toGqlPost(row: PostWithAuthor) {
  return {
    ...row,
    status: prismaToGqlStatus[row.status],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    author: {
      ...row.author,
      createdAt: row.author.createdAt.toISOString(),
    },
  };
}
