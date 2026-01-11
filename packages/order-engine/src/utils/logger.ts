/**
 * Logger Configuration
 * ====================
 *
 * Centralized logging using Pino.
 */

import pinoModule, { stdSerializers } from 'pino';
import { env, isDev } from '../config/env.js';

// NodeNext + ESM/CJS interop can make the Pino import look like a module object
// instead of a callable function. This keeps the runtime behavior correct while
// also keeping TypeScript happy.
const pino = (
  (pinoModule as unknown as { default?: unknown }).default ??
  (pinoModule as unknown)
) as unknown as (options: Record<string, unknown>) => any;

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
  level: env.LOG_LEVEL,
  transport,
  base: {
    service: 'order-engine',
  },
  // Use Pino's standard Error serializer and support a few common keys.
  // The most important convention is: log errors as `{ err }`.
  serializers: {
    err: stdSerializers.err,
    error: stdSerializers.err,
    reason: stdSerializers.err,
  },
});

logger.info({
  env: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
}, 'Logger initialized');
