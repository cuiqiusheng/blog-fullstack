import { PostVisibility } from '@/generated/prisma/client';
import { GraphQLError } from 'graphql';
import { prisma } from '@/lib/prisma';

export async function canViewerReadPost(
  postId: string,
  viewerUserId: string | null,
): Promise<boolean> {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, visibility: true },
  });
  if (!post) return false;
  if (post.visibility === PostVisibility.PRIVATE && post.authorId !== viewerUserId) {
    return false;
  }
  return true;
}

export async function assertPostVisibleToViewer(
  postId: string,
  viewerUserId: string | null,
): Promise<void> {
  const ok = await canViewerReadPost(postId, viewerUserId);
  if (!ok) {
    throw new GraphQLError('Post not found', { extensions: { code: 'NOT_FOUND' } });
  }
}
