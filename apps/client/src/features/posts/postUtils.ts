import { PostStatus } from '@/graphql/codegen';

export function statusColor(status: PostStatus): string {
  switch (status) {
    case PostStatus.Published:
      return 'green';
    case PostStatus.Draft:
      return 'orange';
    default:
      return 'default';
  }
}
