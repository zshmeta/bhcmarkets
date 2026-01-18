/**
 * Logger Configuration
 * ====================
 *
 * Centralized logging using Pino for the market-data service.
 */

import pinoModule, { stdSerializers, type Logger } from 'pino';

// NodeNext + ESM/CJS interop can make the Pino import look like a module object
// instead of a callable function.
const pino = (
  (pinoModule as unknown as { default?: unknown }).default ??
  (pinoModule as unknown)
) as unknown as (options: Record<string, unknown>) => Logger;

// Environment detection
const NODE_ENV = process.env.NODE_ENV ?? 'development';
const LOG_LEVEL = process.env.LOG_LEVEL ?? 'info';
const isDev = NODE_ENV === 'development';

/**
 * Base logger configuration.
 */
const transport = isDev
  ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
    },
  }
  : undefined;

/**
 * Root logger instance.
 */
export const logger = pino({
  level: LOG_LEVEL,
  transport,
  base: {
    service: 'market-data',
  },
  serializers: {
    err: stdSerializers.err,
    error: stdSerializers.err,
    reason: stdSerializers.err,
  },
});
