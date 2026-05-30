import {
  PostStatus as PrismaPostStatus,
  PostVisibility as PrismaPostVisibility,
} from '@/generated/prisma/client';
import {
  PostStatus as GqlPostStatus,
  PostVisibility as GqlPostVisibility,
} from '../__generated__/types';
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

export const prismaToGqlVisibility: Record<PrismaPostVisibility, GqlPostVisibility> = {
  [PrismaPostVisibility.PUBLIC]: GqlPostVisibility.Public,
  [PrismaPostVisibility.PRIVATE]: GqlPostVisibility.Private,
};

export const gqlToPrismaVisibility: Record<GqlPostVisibility, PrismaPostVisibility> = {
  [GqlPostVisibility.Public]: PrismaPostVisibility.PUBLIC,
  [GqlPostVisibility.Private]: PrismaPostVisibility.PRIVATE,
};

export function toGqlPost(row: PostWithAuthor) {
  return {
    ...row,
    status: prismaToGqlStatus[row.status],
    visibility: prismaToGqlVisibility[row.visibility],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    publishedAt: row.publishedAt?.toISOString() ?? null,
    author: {
      ...row.author,
      createdAt: row.author.createdAt.toISOString(),
      roles: row.author.userRoles.map(ur => ur.role),
    },
  };
}
