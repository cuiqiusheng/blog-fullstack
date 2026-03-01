import type { CommentsQuery } from '@/graphql/codegen';

export type TopComment = CommentsQuery['comments'][number];
export type ReplyComment = TopComment['replies'][number];

export { getDisplayName } from '@/shared/utils/displayName';

export const COMMENTS_PAGE_SIZE = 10;
