/**
 * Database Connection
 * ===================
 *
 * PostgreSQL connection for order persistence.
 */

import postgres from 'postgres';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const log = logger.child({ component: 'database' });

let client: postgres.Sql | null = null;

/**
 * Get database client.
 */
export async function getDbClient(): Promise<postgres.Sql> {
  if (!client) {
    client = postgres(env.DATABASE_URL, {
      max: 20,           // Higher pool for order engine
      idle_timeout: 30,
      connect_timeout: 10,
    });

    // Test connection
    await client`SELECT 1`;
    log.info('Database connection established');
  }

  return client;
}

/**
 * Check if database is connected.
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    if (!client) return false;
    await client`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

/**
 * Close database connection.
 */
export async function closeDb(): Promise<void> {
  if (client) {
    await client.end();
    client = null;
    log.info('Database connection closed');
  }
}

/**
 * Execute in transaction.
 */
export async function withTransaction<T>(
  fn: (sql: postgres.TransactionSql) => Promise<T>
): Promise<T> {
  const db = await getDbClient();
  return db.begin(fn);
}
