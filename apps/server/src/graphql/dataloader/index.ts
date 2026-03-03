import { createInteractionLoader } from './interactionLoader';

export function createDataLoaders(userId: string | null) {
  return {
    interactionInfo: createInteractionLoader(userId),
  };
}

export type DataLoaders = ReturnType<typeof createDataLoaders>;
