import type { Request } from 'express';
import type { AuthContext } from '../middleware/auth';
import type { RequestLogger } from '../middleware/requestLogger';
import type { DataLoaders } from '../graphql/dataloader';

export interface GraphQLContext extends AuthContext {
  /** Express request; present when GraphQL is served via HTTP (e.g. req.log for request-scoped logging). */
  req?: Request & { log?: RequestLogger };
  loaders: DataLoaders;
}
