/**
 * Environment Configuration
 * =========================
 *
 * This module loads and validates all environment variables needed by the order-engine service.
 * We use Zod for runtime validation to catch configuration errors at startup.
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file if present (development mode)
config();

/**
 * Schema for environment variables with sensible defaults for development.
 */
const envSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().default(4003),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - required for order persistence
  DATABASE_URL: z.string().default('postgresql://bhcm:bhcm@100.100.13.10:5432/bhcmarkets'),

  // Redis - used for pub/sub between services and order book snapshots
  REDIS_URL: z.string().optional(),

  // WebSocket server for real-time order updates
  WS_PORT: z.coerce.number().default(4004),

  // Order engine configuration
  // Maximum orders per account (prevents abuse)
  MAX_ORDERS_PER_ACCOUNT: z.coerce.number().default(100),

  // Order expiration for GTC orders (in days, 0 = no expiration)
  ORDER_EXPIRATION_DAYS: z.coerce.number().default(30),

  // Price validation tolerance (percentage deviation from market price)
  PRICE_DEVIATION_TOLERANCE: z.coerce.number().default(0.1), // 10%

  // Matching engine configuration
  // How often to persist order book snapshots (ms)
  ORDER_BOOK_SNAPSHOT_INTERVAL_MS: z.coerce.number().default(60000),

  // Maximum trades per batch before flushing to DB
  TRADE_BATCH_SIZE: z.coerce.number().default(100),

  // Trade flush interval (ms)
  TRADE_FLUSH_INTERVAL_MS: z.coerce.number().default(1000),

  // Circuit breaker settings
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),
  CIRCUIT_BREAKER_TIMEOUT_MS: z.coerce.number().default(60000),

  // Rate limiting
  RATE_LIMIT_ORDERS_PER_SECOND: z.coerce.number().default(10),
  RATE_LIMIT_BURST: z.coerce.number().default(50),

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),

  // Market data service URL (for price validation)
  MARKET_DATA_URL: z.string().default('http://localhost:4001'),
  MARKET_DATA_WS_URL: z.string().default('ws://localhost:4002/ws'),
});

// Parse and validate environment
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

/**
 * Validated and typed environment configuration.
 * Frozen to prevent accidental mutation.
 */
export const env = Object.freeze(parsed.data);

// Convenience exports
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
