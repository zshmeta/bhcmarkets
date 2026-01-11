import type { Pool } from "pg";

export type DbHealth = {
  isConnected: () => Promise<boolean>;
};

export function createDbHealth(
  pool: Pool,
  options?: {
    /** Cache the last connectivity result to avoid per-request DB pings. */
    cacheMs?: number;
    /** Upper bound for a single health check query. */
    timeoutMs?: number;
  }
): DbHealth {
  const cacheMs = options?.cacheMs ?? 1000;
  const timeoutMs = options?.timeoutMs ?? 1000;

  let lastCheckedAt = 0;
  let lastResult = false;
  let inFlight: Promise<boolean> | null = null;

  const runCheck = async (): Promise<boolean> => {
    try {
      await Promise.race([
        pool.query("SELECT 1"),
        new Promise((_, reject) => setTimeout(() => reject(new Error("db_health_timeout")), timeoutMs)),
      ]);
      return true;
    } catch {
      return false;
    }
  };

  return {
    isConnected: async () => {
      const now = Date.now();
      if (now - lastCheckedAt < cacheMs) return lastResult;

      if (!inFlight) {
        inFlight = (async () => {
          const ok = await runCheck();
          lastCheckedAt = Date.now();
          lastResult = ok;
          inFlight = null;
          return ok;
        })();
      }

      return inFlight;
    },
  };
}
