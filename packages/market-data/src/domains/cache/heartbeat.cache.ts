/**
 * Heartbeat Cache
 * ===============
 *
 * Simple cache for service heartbeats and liveness tracking.
 * Used by the health check system to track which components are alive.
 */

import { getRedisClient } from './redis.client.js';

const HEARTBEAT_PREFIX = 'heartbeat:';
const HEARTBEAT_TTL_SECONDS = 60;

/**
 * Record a heartbeat for a component.
 */
export async function recordHeartbeat(component: string): Promise<void> {
  const redis = await getRedisClient();
  const key = HEARTBEAT_PREFIX + component;
  await redis.set(key, Date.now().toString(), 'EX', HEARTBEAT_TTL_SECONDS);
}

/**
 * Check if a component is alive (has recent heartbeat).
 */
export async function isAlive(component: string): Promise<boolean> {
  const redis = await getRedisClient();
  const key = HEARTBEAT_PREFIX + component;
  const value = await redis.get(key);
  return value !== null;
}

/**
 * Get last heartbeat timestamp for a component.
 */
export async function getLastHeartbeat(component: string): Promise<number | null> {
  const redis = await getRedisClient();
  const key = HEARTBEAT_PREFIX + component;
  const value = await redis.get(key);
  return value ? parseInt(value, 10) : null;
}
