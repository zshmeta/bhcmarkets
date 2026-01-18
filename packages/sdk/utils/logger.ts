/**
 * Logger Configuration
 * ====================
 *
 * Centralized logging using Pino.
 * NOTE: This module is for Node.js backends only, not for browser use.
 */

import pinoModule, { stdSerializers } from 'pino';

// NodeNext + ESM/CJS interop can make the Pino import look like a module object
// instead of a callable function. This keeps the runtime behavior correct while
// also keeping TypeScript happy.
const pino = (
  (pinoModule as unknown as { default?: unknown }).default ??
  (pinoModule as unknown)
) as unknown as (options: Record<string, unknown>) => any;

// Environment detection - safe defaults
const NODE_ENV = typeof process !== 'undefined' ? process.env.NODE_ENV ?? 'development' : 'development';
const LOG_LEVEL = typeof process !== 'undefined' ? process.env.LOG_LEVEL ?? 'info' : 'info';
const isDev = NODE_ENV === 'development';

/**
 * Base logger configuration.
 */
// Get the absolute path to pino-pretty for Bun compatibility
// Bun's module resolution doesn't work well with pino's dynamic transport loading
let pinoPrettyPath: string | undefined;
try {
  // Try require.resolve if available (Node.js)
  if (typeof require !== 'undefined' && typeof require.resolve === 'function') {
    pinoPrettyPath = require.resolve('pino-pretty');
  }
} catch {
  // Fallback: pino-pretty not available, will use undefined transport
  pinoPrettyPath = undefined;
}

const transport = isDev && pinoPrettyPath
  ? {
    target: pinoPrettyPath,
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
    service: 'sdk',
  },
  serializers: {
    err: stdSerializers.err,
    error: stdSerializers.err,
    reason: stdSerializers.err,
  },
});

/**
 * Create a child logger with a specific name/module.
 */
export const createLogger = (name: string) => logger.child({ module: name });
