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

import pino from 'pino';
import { env, isDev } from '../config/env.js';

/**
 * Base logger configuration.
 * In development: pretty-printed, colorized output
 * In production: JSON output (for log aggregation systems)
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
 * Create child loggers for different components:
 *   const log = logger.child({ component: 'binance-collector' });
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport,
  base: {
    service: 'market-data',
  },
});

// Log startup info
logger.info({
  env: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
}, 'Logger initialized');
