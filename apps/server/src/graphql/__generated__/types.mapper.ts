import type { Post } from './types';

export type PostParent = Omit<Post, 'interactionInfo'>;
