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
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load monorepo root .env regardless of service CWD.
// Repo convention: all services share the root-level `.env`.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootEnvPath = path.resolve(__dirname, '../../../../.env');
config({ path: rootEnvPath });

// Also load a local .env if present (package-level overrides in dev).
config();

/**
 * Schema for environment variables with sensible defaults for development.
 * In production, you'd want stricter validation (e.g., require REDIS_URL).
 */
const envSchema = z.object({
  // Server configuration
  MARKET_DATA_PORT: z.coerce.number().default(4001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database - required for storing candles

  DATABASE_URL: z.string().min(1),

  // Redis - used for price caching and pub/sub between services
  // Optional in dev (will use in-memory fallback), required in production

  REDIS_URL: z.string().min(1),

  // WebSocket server for clients (TradingView charts)
  MARKET_DATA_WS_PORT: z.coerce.number().default(4002),

  // Polling intervals in milliseconds
  // WHY THESE DEFAULTS:
  // - Yahoo Finance has unofficial rate limits (~2000 requests/hour)
  // - 15 seconds for stocks/indices is reasonable for non-HFT use cases
  // - Commodities/FX update less frequently, 30 seconds is fine
  YAHOO_POLL_INTERVAL_MS: z.coerce.number().default(15000),
  YAHOO_BATCH_SIZE: z.coerce.number().default(20), // Symbols per request

  // Internal yfinance-service (stocks)
  // This is a self-hosted REST proxy used to avoid direct Yahoo scraping from every service.
  // Example: http://100.100.13.10:8000
  YFINANCE_SERVICE_BASE_URL: z.string().min(1),
  YFINANCE_STOCKS_POLL_INTERVAL_MS: z.coerce.number().default(15000),
  YFINANCE_BATCH_SIZE: z.coerce.number().default(100),

  // FX rates (free/default)
  // Default provider: open.er-api.com (USD base). One request yields many currencies.
  FX_RATES_URL: z.string().min(1),
  FX_COMMODITIES_POLL_INTERVAL_MS: z.coerce.number().default(15000),

  // RabbitForexAPI (forex + metals)
  // Self-hosted FX+metals API.
  // Example: http://100.100.13.10:3000
  RABBITFOREX_BASE_URL: z.string().min(1),
  // Polling interval for RabbitForexAPI endpoints.
  // If Rabbit refreshes quotes every second, set this to 1000.
  RABBITFOREX_POLL_INTERVAL_MS: z.coerce.number().default(1000),

  // Collector reconnect behavior
  // Jitter helps prevent thundering-herd reconnects across services.
  COLLECTOR_MAX_RECONNECT_DELAY_MS: z.coerce.number().default(30000),
  COLLECTOR_RECONNECT_JITTER_PCT: z.coerce.number().default(0.2),

  // Yahoo Finance rate limiting backoff
  // Yahoo is unofficial and will 429 under load; back off aggressively.
  YAHOO_RATE_LIMIT_BACKOFF_MS: z.coerce.number().default(60000),

  // FMP (Financial Modeling Prep) API
  // Get your free API key at: https://financialmodelingprep.com/
  // Free tier: 250 API calls per day
  FMP_API_KEY: z.string().optional(),

  // Polygon.io (optional)
  // If set, can be used by collectors/routes that support Polygon.
  POLYGON_API_KEY: z.string().optional(),

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

  // Optional file logging
  // If set, logs will also be written to the given file path.
  MARKET_DATA_LOG_FILE_PATH: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? undefined : v),
    z.string().optional()
  ),
});

// Normalize common env var names into service-scoped ones.
const normalizedEnv = {
  ...process.env,
} as Record<string, unknown>;

// Back-compat: if someone only sets PORT/WS_PORT, use those.
if (!normalizedEnv.MARKET_DATA_PORT && process.env.PORT) normalizedEnv.MARKET_DATA_PORT = process.env.PORT;
if (!normalizedEnv.MARKET_DATA_WS_PORT && process.env.WS_PORT) normalizedEnv.MARKET_DATA_WS_PORT = process.env.WS_PORT;

// Parse and validate environment
const parsed = envSchema.safeParse(normalizedEnv);

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
