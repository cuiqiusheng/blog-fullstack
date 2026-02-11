import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Paths to redact in any logged object (case-insensitive match in path).
 * Values are replaced with [Redacted].
 */
const REDACT_PATHS = [
  'password',
  '*.password',
  'token',
  '*.token',
  'authorization',
  '*.authorization',
  'headers.authorization',
  'cookie',
  '*.cookie',
  'headers.cookie',
  'secret',
  '*.secret',
  'jwt',
  '*.jwt',
  // GraphQL variables often contain password/email
  'variables.password',
  'body.variables.password',
  'req.body.variables.password',
  'req.body.variables.email', // optional: redact email in logs; remove if you need to audit by email
];

const redactOptions: pino.redactOptions = {
  paths: REDACT_PATHS,
  censor: '[Redacted]',
  remove: false,
};

const baseOptions: pino.LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  redact: redactOptions,
  base: {
    env: process.env.NODE_ENV,
    pid: process.pid,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: label => ({ level: label }),
  },
};

/**
 * Base logger. In development uses pino-pretty for human-readable output;
 * in production outputs JSON for log aggregation (e.g. ELK, Datadog).
 */
const baseLogger = isDev
  ? pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      },
    })
  : pino(baseOptions);

export const logger = baseLogger;

/**
 * Create a child logger with bound context (e.g. requestId, operationName).
 * Use for request-scoped or module-scoped logging.
 */
export function createChildLogger(bindings: Record<string, unknown>): pino.Logger {
  return baseLogger.child(bindings);
}

/**
 * Mask email for safe logging: "a***@b.com"
 */
export function maskEmail(email: string): string {
  if (!email || email.length < 5) return '[Redacted]';
  const at = email.indexOf('@');
  if (at <= 0) return '[Redacted]';
  const local = email.slice(0, at);
  const domain = email.slice(at);
  if (local.length <= 2) return local[0] + '***' + domain;
  return local[0] + '***' + local[local.length - 1] + domain;
}
