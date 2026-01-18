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
  getRedisWithConfig,
  getPubSub,
  getPubSubWithConfig,
  isUsingFallback,
  isRedisConnected,
  isRedisConnectedWithConfig,
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


// =============================================================================
// DRIZZLE ORM UTILITIES
// =============================================================================

export {
  eq, ne, gt, gte, lt, lte,
  isNull, isNotNull,
  inArray, notInArray,
  exists, notExists,
  between, notBetween,
  like, ilike, notLike, notIlike,
  and, or, not,
  asc, desc,
  sql,
  type SQL,
  type SQLWrapper,
  relations,
  count,
} from 'drizzle-orm';
export { type NodePgDatabase } from 'drizzle-orm/node-postgres';

export * from './schema/index.js';
