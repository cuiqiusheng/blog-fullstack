import type { CommentsQuery } from '@/graphql/codegen';

export type TopComment = CommentsQuery['comments'][number];
export type ReplyComment = TopComment['replies'][number];

export function getDisplayName(author: { nickname?: string | null; email: string }) {
  return author.nickname || author.email.split('@')[0];
}

export const COMMENTS_PAGE_SIZE = 10;
