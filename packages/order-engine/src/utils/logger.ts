/**
 * Logger Configuration
 * ====================
 *
 * Centralized logging using Pino.
 */

import pino from 'pino';
import { env, isDev } from '../config/env.js';

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
});

logger.info({
  env: env.NODE_ENV,
  logLevel: env.LOG_LEVEL,
}, 'Logger initialized');
