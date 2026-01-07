/**
 * Database Connection Factory
 * ===========================
 *
 * Centralized database connection management for all packages.
 * Supports both postgres.js (raw SQL) and Drizzle ORM patterns.
 *
 * USAGE:
 * ```typescript
 * import { getDbClient, createDrizzleClient, withTransaction } from '@repo/database';
 *
 * // Raw SQL with postgres.js
 * const sql = await getDbClient();
 * const users = await sql`SELECT * FROM users`;
 *
 * // Drizzle ORM
 * const db = createDrizzleClient(pool);
 * const users = await db.select().from(schema.users);
 * ```
 */

import postgres from 'postgres';
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema/index.js';

// =============================================================================
// TYPES
// =============================================================================

export interface ConnectionConfig {
  connectionString: string;
  max?: number;
  idleTimeout?: number;
  connectTimeout?: number;
}

export type PostgresClient = postgres.Sql;
export type DrizzleClient = NodePgDatabase<typeof schema>;

// =============================================================================
// POSTGRES.JS CLIENT (for raw SQL)
// =============================================================================

let postgresClient: postgres.Sql | null = null;

/**
 * Get or create postgres.js client for raw SQL queries.
 * This is a singleton - call closeDb() to release.
 */
export async function getDbClient(config?: ConnectionConfig): Promise<postgres.Sql> {
  if (!postgresClient) {
    const connectionString = config?.connectionString || process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error('DATABASE_URL is required');
    }

    postgresClient = postgres(connectionString, {
      max: config?.max ?? 10,
      idle_timeout: config?.idleTimeout ?? 30,
      connect_timeout: config?.connectTimeout ?? 10,
    });

    // Test connection
    await postgresClient`SELECT 1`;
  }

  return postgresClient;
}

/**
 * Check if database is connected.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    if (!postgresClient) return false;
    await postgresClient`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Close postgres.js connection.
 */
export async function closeDb(): Promise<void> {
  if (postgresClient) {
    await postgresClient.end();
    postgresClient = null;
  }
}

/**
 * Execute callback within a transaction.
 */
export async function withTransaction<T extends unknown>(
  fn: (sql: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  const db = await getDbClient();
  // Type assertion to satisfy type system
  return db.begin(fn) as Promise<T>;
}

// =============================================================================
// DRIZZLE ORM CLIENT (for type-safe queries)
// =============================================================================

/**
 * Create a pg Pool for Drizzle.
 * Each service can create its own pool with custom settings.
 */
export function createPgPool(config: ConnectionConfig): Pool {
  return new Pool({ connectionString: config.connectionString });
}

/**
 * Create Drizzle client from a pg Pool.
 */
export function createDrizzleClient(pool: Pool): DrizzleClient {
  return drizzle(pool, { schema });
}

// =============================================================================
// CONVENIENCE FACTORY
// =============================================================================

/**
 * Create both Pool and Drizzle client in one call.
 */
export function createDatabase(config: ConnectionConfig): {
  pool: Pool;
  db: DrizzleClient;
} {
  const pool = createPgPool(config);
  const db = createDrizzleClient(pool);
  return { pool, db };
}
