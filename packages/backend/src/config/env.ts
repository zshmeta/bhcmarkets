/* eslint-disable turbo/no-undeclared-env-vars */
/*
  env.ts
  Small, explicit configuration loader for the backend. We keep it simple on purpose:
  - read process.env once at boot
  - coerce types (numbers/booleans)
  - provide safe defaults for local dev

  This file documents the configuration surface so new contributors see
  exactly what the service expects without chasing "magic" environment vars.
*/

const toInt = (val: string | undefined, fallback: number): number => {
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

export type AppConfig = {
  port: number;
  nodeEnv: string;
  databaseUrl: string;
  redisUrl?: string;
  jwtSecret: string; // symmetric key for signing JWTs (access/refresh)
  accessTtlSec: number; // access token TTL in seconds
  refreshTtlSec: number; // refresh token TTL in seconds
  maxSessionsPerUser: number; // cap to prevent unbounded session growth
  bcryptRounds: number; // hashing cost for passwords and refresh token hashes
  corsOrigins: string[]; // explicit allowlist for CORS; use "*" only in dev
};

export function loadEnv(): AppConfig {
  const nodeEnv = process.env.NODE_ENV || "development";
  const port = toInt(process.env.PORT, 8080);
  const databaseUrl = process.env.DATABASE_URL || "postgresql://bhcm:bhcm@100.100.13.10:5432/bhcmarkets";
  const redisUrl = process.env.REDIS_URL;

  // IMPORTANT: use a strong secret in non-dev environments. For MVP we fallback in dev.
  const jwtSecret = process.env.JWT_SECRET || "dev-only-change-me";

  if (!process.env.JWT_SECRET && !["development", "test"].includes(nodeEnv)) {
    throw new Error("JWT_SECRET is required in non-development environments");
  }

  if (jwtSecret === "dev-only-change-me" && !["development", "test"].includes(nodeEnv)) {
    throw new Error("Use a strong JWT_SECRET outside development/test");
  }

  const corsOrigins = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    port,
    nodeEnv,
    databaseUrl,
    redisUrl,
    jwtSecret,
    accessTtlSec: toInt(process.env.ACCESS_TTL_SEC, 15 * 60), // 15m
    refreshTtlSec: toInt(process.env.REFRESH_TTL_SEC, 30 * 24 * 60 * 60), // 30d
    maxSessionsPerUser: toInt(process.env.MAX_SESSIONS_PER_USER, 10),
    bcryptRounds: toInt(process.env.BCRYPT_ROUNDS, 10),
    corsOrigins,
  };
}

export type { AppConfig as EnvConfig };
// Note: We intentionally export a single loadEnv() to avoid confusion.

