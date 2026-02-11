import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { createChildLogger } from '../utils/logger';

/**
 * Request-scoped logger attached to req.log.
 * Use in resolvers/middleware for correlated logs (same requestId).
 */
export type RequestLogger = ReturnType<typeof createChildLogger>;

declare global {
  /* eslint-disable no-unused-vars -- TypeScript ambient declaration: Express.Request augmentation (req.id, req.log) */
  namespace Express {
    interface Request {
      id?: string;
      log?: RequestLogger;
    }
  }
  /* eslint-enable no-unused-vars */
}

/**
 * Middleware: assigns requestId, attaches child logger to req.log,
 * and logs when the response finishes (method, url, statusCode, duration).
 * Does not log request/response body to avoid leaking sensitive data;
 * GraphQL operationName is logged when present (safe).
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = randomUUID();
  req.id = requestId;
  req.log = createChildLogger({ requestId });

  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const operationName =
      typeof req.body?.operationName === 'string' ? req.body.operationName : undefined;

    const payload: Record<string, unknown> = {
      requestId,
      method: req.method,
      url: req.originalUrl ?? req.url,
      statusCode: res.statusCode,
      durationMs: duration,
    };
    if (operationName) payload.operationName = operationName;

    if (res.statusCode >= 500) {
      req.log?.error(payload, 'request completed');
    } else if (res.statusCode >= 400) {
      req.log?.warn(payload, 'request completed');
    } else {
      req.log?.info(payload, 'request completed');
    }
  });

  next();
}
