/**
 * @repo/database
 * ===============
 *
 * Centralized database package for the trading platform.
 *
 * EXPORTS:
 * - Connection factory (postgres.js + Drizzle)
 * - Redis client with fallback
 * - All schema definitions
 *
 * USAGE:
 * ```typescript
 * import {
 *   // Connection
 *   getDbClient,
 *   createDrizzleClient,
 *   createPgPool,
 *   withTransaction,
 *
 *   // Redis
 *   getRedis,
 *   publish,
 *   subscribe,
 *
 *   // Schema
 *   users,
 *   accounts,
 *   orders,
 *   ledgerBalances,
 *   marketPrices,
 * } from '@repo/database';
 * ```
 */

// =============================================================================
// CONNECTION EXPORTS
// =============================================================================

export {
  // Postgres.js (raw SQL)
  getDbClient,
  isDatabaseConnected,
  closeDb,
  withTransaction,
  // Drizzle ORM
  createPgPool,
  createDrizzleClient,
  createDatabase,
  // Types
  type ConnectionConfig,
  type PostgresClient,
  type DrizzleClient,
} from './connection.js';

// =============================================================================
// REDIS EXPORTS
// =============================================================================

export {
  getRedis,
  getPubSub,
  isUsingFallback,
  isRedisConnected,
  closeRedis,
  redisGet,
  redisSet,
  redisDel,
  publish,
  subscribe,
  type RedisConfig,
} from './redis.js';

// =============================================================================
// SCHEMA EXPORTS
// =============================================================================

export * from './schema/index.js';
