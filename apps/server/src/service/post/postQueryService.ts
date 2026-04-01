import { PostVisibility as PrismaPostVisibility, type Prisma } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import type { ListPostsOptions, PostNeighbors } from './post.types';
import { normalizeOptionalText } from '../shared/textNormalization';
import { postAuthorInclude } from './postSelect';

function buildPrevNeighborWhere(current: {
  id: string;
  seriesKey: string;
  seriesOrder: number;
  createdAt: Date;
}): Prisma.PostWhereInput {
  return {
    seriesKey: current.seriesKey,
    OR: [
      { seriesOrder: { lt: current.seriesOrder } },
      {
        AND: [{ seriesOrder: current.seriesOrder }, { createdAt: { lt: current.createdAt } }],
      },
      {
        AND: [
          { seriesOrder: current.seriesOrder },
          { createdAt: current.createdAt },
          { id: { lt: current.id } },
        ],
      },
    ],
  };
}

function buildNextNeighborWhere(current: {
  id: string;
  seriesKey: string;
  seriesOrder: number;
  createdAt: Date;
}): Prisma.PostWhereInput {
  return {
    seriesKey: current.seriesKey,
    OR: [
      { seriesOrder: { gt: current.seriesOrder } },
      {
        AND: [{ seriesOrder: current.seriesOrder }, { createdAt: { gt: current.createdAt } }],
      },
      {
        AND: [
          { seriesOrder: current.seriesOrder },
          { createdAt: current.createdAt },
          { id: { gt: current.id } },
        ],
      },
    ],
  };
}

export function buildPostWhere(options: ListPostsOptions): Prisma.PostWhereInput {
  const andClauses: Prisma.PostWhereInput[] = [];
  const topic = normalizeOptionalText(options.topic);
  const subtopic = normalizeOptionalText(options.subtopic);
  const search = normalizeOptionalText(options.search);

  if (topic) {
    andClauses.push({ topic: { contains: topic, mode: 'insensitive' } });
  }
  if (subtopic) {
    andClauses.push({ subtopic: { contains: subtopic, mode: 'insensitive' } });
  }
  if (options.status) {
    andClauses.push({ status: options.status });
  }
  if (options.authorId) {
    andClauses.push({ authorId: options.authorId });
  }
  if (search) {
    andClauses.push({
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { topic: { contains: search, mode: 'insensitive' } },
        { subtopic: { contains: search, mode: 'insensitive' } },
      ],
    });
  }

  const viewer = options.viewerUserId ?? null;
  const authorId = options.authorId;
  const includePrivateForAuthor = authorId != null && viewer != null && authorId === viewer;
  if (!includePrivateForAuthor) {
    andClauses.push({ visibility: PrismaPostVisibility.PUBLIC });
  }

  return andClauses.length > 0 ? { AND: andClauses } : {};
}

function neighborReadableWhere(viewerId: string | null | undefined): Prisma.PostWhereInput {
  if (viewerId) {
    return {
      OR: [
        { visibility: PrismaPostVisibility.PUBLIC },
        {
          AND: [{ visibility: PrismaPostVisibility.PRIVATE }, { authorId: viewerId }],
        },
      ],
    };
  }
  return { visibility: PrismaPostVisibility.PUBLIC };
}

function buildOrderBy(options: ListPostsOptions): Prisma.PostOrderByWithRelationInput[] {
  if (options.sortBy) {
    const direction = options.sortDirection ?? 'desc';
    if (options.sortBy === 'createdAt') {
      return [{ createdAt: direction }, { id: direction }];
    }
    if (options.sortBy === 'updatedAt') {
      return [{ updatedAt: direction }, { id: direction }];
    }
    return [{ subtopic: direction }, { createdAt: 'asc' }, { id: 'asc' }];
  }

  const hasTopicFilter = Boolean(normalizeOptionalText(options.topic));
  const hasSearch = Boolean(normalizeOptionalText(options.search));
  return hasTopicFilter && !hasSearch
    ? [{ seriesOrder: 'asc' }, { createdAt: 'asc' }]
    : [{ createdAt: 'desc' }];
}

export async function listPosts(options: ListPostsOptions = {}) {
  const where = buildPostWhere(options);
  const orderBy = buildOrderBy(options);

  return prisma.post.findMany({
    where,
    include: postAuthorInclude,
    orderBy,
    take: options.limit ?? 20,
    skip: options.offset ?? 0,
  });
}

export async function countPosts(options: ListPostsOptions = {}): Promise<number> {
  return prisma.post.count({
    where: buildPostWhere(options),
  });
}

export async function getPostById(id: string) {
  return prisma.post.findUnique({
    where: { id },
    include: postAuthorInclude,
  });
}

export async function getPostNeighbors(
  id: string,
  viewerUserId?: string | null,
): Promise<PostNeighbors> {
  const current = await prisma.post.findUnique({
    where: { id },
    select: {
      id: true,
      seriesKey: true,
      seriesOrder: true,
      createdAt: true,
    },
  });
  if (!current || !current.seriesKey || current.seriesOrder == null) {
    return { prev: null, next: null };
  }

  const readable = neighborReadableWhere(viewerUserId ?? null);

  // Stable tie-breakers: when seriesOrder is the same, compare createdAt; if still equal, compare id.
  const prevRow = await prisma.post.findFirst({
    where: {
      AND: [
        readable,
        buildPrevNeighborWhere({
          id: current.id,
          seriesKey: current.seriesKey,
          seriesOrder: current.seriesOrder,
          createdAt: current.createdAt,
        }),
      ],
    },
    orderBy: [{ seriesOrder: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
    select: { id: true },
  });
  const nextRow = await prisma.post.findFirst({
    where: {
      AND: [
        readable,
        buildNextNeighborWhere({
          id: current.id,
          seriesKey: current.seriesKey,
          seriesOrder: current.seriesOrder,
          createdAt: current.createdAt,
        }),
      ],
    },
    orderBy: [{ seriesOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
    select: { id: true },
  });

  const [prev, next] = await Promise.all([
    prevRow
      ? prisma.post.findUnique({ where: { id: prevRow.id }, include: postAuthorInclude })
      : Promise.resolve(null),
    nextRow
      ? prisma.post.findUnique({ where: { id: nextRow.id }, include: postAuthorInclude })
      : Promise.resolve(null),
  ]);

  return { prev, next };
}
