/**
 * Logger Configuration
 * ====================
 *
 * Centralized logging using Pino - one of the fastest Node.js loggers.
 *
 * WHY PINO:
 * - 5x faster than Bunyan, 10x faster than Winston
 * - JSON output by default (great for log aggregation)
 * - Structured logging with child loggers
 * - Pretty printing in development
 *
 * LOGGING BEST PRACTICES:
 * - Use child loggers for components (adds context automatically)
 * - Log at appropriate levels (debug for verbose, info for important events)
 * - Include structured data, not string interpolation
 *   GOOD: log.info({ userId, orderId }, 'Order placed')
 *   BAD:  log.info(`User ${userId} placed order ${orderId}`)
 */

import * as pinoModule from 'pino';
import { env, isDev } from '../config/env.js';

type PinoFactory = typeof import('pino').default;

const pino: PinoFactory =
  (pinoModule as unknown as { default?: PinoFactory }).default ??
  (pinoModule as unknown as { pino?: PinoFactory }).pino ??
  (pinoModule as unknown as PinoFactory);

// Serialize Error-like objects consistently

const serializeErrorLike = (value: unknown) => {
 if (value instanceof Error) return pino.stdSerializers.err(value);
 if (value && typeof value === 'object') {
   const v = value as { name?: unknown; message?: unknown; stack?: unknown };
   const type = typeof v.name === 'string' ? v.name : undefined;
   const message = typeof v.message === 'string' ? v.message : undefined;
   const stack = typeof v.stack === 'string' ? v.stack : undefined;
   if (type || message || stack) return { type, message, stack };
 }
 return value;
};

/**
 * In development: pretty-printed, colorized output
 * In production: JSON output (for log aggregation systems)
 */
const transportTargets: Array<{ target: string; options?: Record<string, unknown> }> = [];

// Console logging
if (isDev) {
  transportTargets.push({
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'HH:MM:ss.l',
      ignore: 'pid,hostname',
      errorLikeObjectKeys: ['err', 'error', 'reason'],
    },
  });
}

// File logging
if (env.MARKET_DATA_LOG_FILE_PATH) {
  transportTargets.push({
    target: 'pino/file',
    options: {
      destination: env.MARKET_DATA_LOG_FILE_PATH,
      mkdir: true,
      append: true,
    },
  });
}

const transport = transportTargets.length > 0
  ? { targets: transportTargets }
  : undefined;

/**
 * Root logger instance.
 * Create child loggers for different components:
 *   const log = logger.child({ component: 'binance-collector' });
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    service: 'market-data',
  },
  serializers: {
    err: serializeErrorLike,
    error: serializeErrorLike,
    reason: serializeErrorLike,
  },
});

// Log startup info
logger.info({
  env: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
  logFilePath: env.MARKET_DATA_LOG_FILE_PATH,
}, 'Logger initialized');

