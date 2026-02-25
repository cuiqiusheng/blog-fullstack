import { PostStatus } from '@/generated/prisma/client';
import { prisma } from '@/lib/prisma';
import { postAuthorInclude } from './postSelect';
import {
  validateCreatePostInput,
  validateUpdatePostInput,
  type CreatePostInput,
  type UpdatePostInput,
} from './postValidation';

function countWords(text: string): number {
  return text.replace(/\s+/g, '').length;
}

export async function createPost(authorId: string, input: CreatePostInput) {
  const validated = validateCreatePostInput(input);
  const status = validated.status === 'PUBLISHED' ? PostStatus.PUBLISHED : PostStatus.DRAFT;
  const wordCount = countWords(validated.content);

  return prisma.post.create({
    data: {
      title: validated.title,
      content: validated.content,
      topic: validated.topic,
      subtopic: validated.subtopic,
      status,
      wordCount,
      publishedAt: status === PostStatus.PUBLISHED ? new Date() : null,
      authorId,
    },
    include: postAuthorInclude,
  });
}

export async function updatePost(id: string, authorId: string, input: UpdatePostInput) {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Post not found');
  }
  if (existing.authorId !== authorId) {
    throw new Error('Not authorized to update this post');
  }

  const validated = validateUpdatePostInput(input);

  const data: Record<string, unknown> = {};

  if (validated.title !== undefined) data.title = validated.title;
  if (validated.content !== undefined) {
    data.content = validated.content;
    data.wordCount = countWords(validated.content);
  }
  if (validated.topic !== undefined) data.topic = validated.topic;
  if (validated.subtopic !== undefined) data.subtopic = validated.subtopic;

  if (validated.status !== undefined) {
    data.status = validated.status === 'PUBLISHED' ? PostStatus.PUBLISHED : PostStatus.DRAFT;

    const isPublishing =
      validated.status === 'PUBLISHED' && existing.status !== PostStatus.PUBLISHED;
    if (isPublishing && !existing.publishedAt) {
      data.publishedAt = new Date();
    }
  }

  return prisma.post.update({
    where: { id },
    data,
    include: postAuthorInclude,
  });
}

export async function deletePost(id: string, authorId: string): Promise<boolean> {
  const existing = await prisma.post.findUnique({ where: { id } });
  if (!existing) {
    throw new Error('Post not found');
  }
  if (existing.authorId !== authorId) {
    throw new Error('Not authorized to delete this post');
  }

  await prisma.post.delete({ where: { id } });
  return true;
}
