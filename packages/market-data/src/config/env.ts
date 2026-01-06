/**
 * Environment Configuration
 * =========================
 *
 * This module loads and validates all environment variables needed by the market-data service.
 * We use Zod for runtime validation to catch configuration errors at startup rather than
 * at random times during execution.
 *
 * DESIGN DECISION: All config is loaded once at startup and exported as frozen constants.
 * This prevents accidental mutation and makes the app behavior predictable.
 */

import { config } from 'dotenv';
import { z } from 'zod';

// Load .env file if present (development mode)
config();

/**
 * Schema for environment variables with sensible defaults for development.
 * In production, you'd want stricter validation (e.g., require REDIS_URL).
 */
const envSchema = z.object({
  // Server configuration
  PORT: z.coerce.number().default(4001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - required for storing candles

  DATABASE_URL: z.string().default('postgres://bhc:bhc@localhost:5432/bhc'),

  // Redis - used for price caching and pub/sub between services
  // Optional in dev (will use in-memory fallback), required in production

  REDIS_URL: z.string().optional(),

  // WebSocket server for clients (TradingView charts)
  WS_PORT: z.coerce.number().default(4002),

  // Polling intervals in milliseconds
  // WHY THESE DEFAULTS:
  // - Yahoo Finance has unofficial rate limits (~2000 requests/hour)
  // - 15 seconds for stocks/indices is reasonable for non-HFT use cases
  // - Commodities/FX update less frequently, 30 seconds is fine
  YAHOO_POLL_INTERVAL_MS: z.coerce.number().default(15000),
  YAHOO_BATCH_SIZE: z.coerce.number().default(20), // Symbols per request

  // FMP (Financial Modeling Prep) API
  // Get your free API key at: https://financialmodelingprep.com/
  // Free tier: 250 API calls per day
  FMP_API_KEY: z.string().optional(),

  // Circuit breaker settings
  // WHAT IS A CIRCUIT BREAKER:
  // When a data source fails repeatedly, we "open the circuit" and stop
  // hitting it for a cooldown period. This prevents cascading failures
  // and gives the upstream service time to recover.
  CIRCUIT_BREAKER_THRESHOLD: z.coerce.number().default(5),    // Failures before opening
  CIRCUIT_BREAKER_TIMEOUT_MS: z.coerce.number().default(60000), // Cooldown period

  // Candle aggregation
  // We build 1-minute candles from ticks, then aggregate up to larger timeframes
  CANDLE_FLUSH_INTERVAL_MS: z.coerce.number().default(60000), // Flush every minute

  // Logging
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info'),
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

// Convenience exports for common values
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
