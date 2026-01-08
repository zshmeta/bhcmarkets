/*
  Application bootstrap for @repo/backend
  - We deliberately start with Node's built-in HTTP to minimize dependencies.
  - Wiring order: config -> database -> repositories -> domain services -> http router.
  - You can later swap the router with Fastify (see ADR-0004) without touching domain logic.
*/

import http from "http";
import { AddressInfo } from "net";
import "dotenv/config";
import { loadEnv } from "./config/env.js";
import { createPgPool, createDrizzleClient } from "@repo/database";
import { and, eq, sql } from "drizzle-orm";
import { accounts, positions } from "@repo/database";
import {
  createAuthService,
  createUserRepository,
  createCredentialRepository,
  createSessionRepository,
  createAuthCodeRepository,
  createPasswordResetTokenRepository,
  createBcryptHasher,
  createJwtTokenManager,
} from "./domains/auth/index.js";

// Account domain - now using factory pattern like auth
import {
  createAccountService,
  createAccountRepository,
} from "./domains/account/index.js";

// Risk domain - the house cannot fail!
import {
  createRiskService,
  createRiskRepository,
} from "./domains/risk/index.js";

import { createNodeRouter } from "./api/nodeRouter.js";
import { registerApiRoutes } from "./api/index.js";

// Config loader documents our runtime contract and provides safe defaults.
const config = loadEnv();

// Minimal structured logger stub (replace with pino/winston later)
const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", msg, ...meta })),
  warn: (msg: string, meta?: Record<string, unknown>) =>
    console.warn(JSON.stringify({ level: "warn", msg, ...meta })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", msg, ...meta })),

};

const { router, handle } = createNodeRouter({ corsOrigins: config.corsOrigins, logger });

// Very small dependency container. In a larger codebase we'd use a proper DI/wiring layer.
const services = await (async () => {
  const pool = createPgPool({ connectionString: config.databaseUrl });
  const drizzleClient = createDrizzleClient(pool);
  // Migrations are now manual
  // await services.db.query("SELECT 1");

  // --- Auth Domain Setup ---
  const userRepository = createUserRepository(pool);
  const credentialRepository = createCredentialRepository(pool);
  const sessionRepository = createSessionRepository(pool);
  const authCodeRepository = createAuthCodeRepository(pool);
  const passwordResetTokenRepository = createPasswordResetTokenRepository(pool);

  const passwordHasher = createBcryptHasher(config.bcryptRounds);
  const tokenManager = createJwtTokenManager(config.jwtSecret);

  // --- Account Domain Setup (factory pattern) ---
  const accountRepository = createAccountRepository(pool);
  const accountService = createAccountService({ repository: accountRepository });

  // --- Risk Domain Setup ---
  // Risk service needs callbacks into Account and Position to check balances/positions.
  // This is dependency injection to avoid circular imports.
  const riskRepository = createRiskRepository(drizzleClient);
  const riskService = createRiskService({
    repository: riskRepository,

    // Get available balance for an account (balance - locked)
    getAvailableBalance: async (accountId) => {
      return accountService.getAvailableBalance(accountId);
    },

    // NOTE: This reads from the shared DB tables. If order-engine is the only writer,
    // backend risk effectively operates on the engine-maintained read-model.
    getUserPosition: async (accountId, symbol) => {
      const rows = await drizzleClient
        .select({ quantity: positions.quantity, side: positions.side })
        .from(positions)
        .where(and(eq(positions.accountId, accountId), eq(positions.symbol, symbol)))
        .limit(1);

      const row = rows[0];
      if (!row) return null;
      return { quantity: row.quantity, side: row.side };
    },

    getHouseNetPosition: async (symbol) => {
      const rows = await drizzleClient
        .select({
          netUserQty: sql<string>`coalesce(sum(case when ${positions.side} = 'buy' then (${positions.quantity})::numeric else -(${positions.quantity})::numeric end), 0)`,
        })
        .from(positions)
        .where(eq(positions.symbol, symbol));

      const netUserQty = Number(rows[0]?.netUserQty ?? "0");
      return -netUserQty;
    },

    getUserTotalExposure: async (userId) => {
      const rows = await drizzleClient
        .select({
          totalAbsQty: sql<string>`coalesce(sum(abs((${positions.quantity})::numeric)), 0)`,
        })
        .from(positions)
        .innerJoin(accounts, eq(positions.accountId, accounts.id))
        .where(eq(accounts.userId, userId));

      return Number(rows[0]?.totalAbsQty ?? "0");
    },

    logger,
  });

  // Auth service depends on account service to create accounts on registration
  const auth = createAuthService({
    userRepository,
    credentialRepository,
    sessionRepository,
    authCodeRepository,
    passwordResetTokenRepository,
    passwordHasher,
    tokenManager,
    config: {
      accessTokenTtlSeconds: config.accessTtlSec,
      refreshTokenTtlSeconds: config.refreshTtlSec,
      maxSessionsPerUser: config.maxSessionsPerUser,
    },
    // Note: Auth creates accounts via its own logic, but we could inject accountService if needed
  });

  return {
    auth,
    account: accountService,
    risk: riskService,
    tokenManager,
    sessionRepository,
    db: drizzleClient, // Needed for Admin domain
  } as const;
})();

registerApiRoutes(router, services, logger);

async function main() {
  const server = http.createServer(handle);

  server.on("clientError", (err, socket) => {
    logger.error("client_error", { err: String(err) });
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  server.listen(config.port, () => {
    const address = server.address() as AddressInfo | null;
    const port = address?.port ?? config.port;
    logger.info("server_started", { port, env: config.nodeEnv });
  });

  const shutdown = (signal: string) => {
    logger.info("shutdown_signal", { signal });
    server.close((err?: Error) => {
      if (err) logger.error("server_close_error", { err: String(err) });
      logger.info("server_closed");
      process.exit(err ? 1 : 0);
    });
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Run only when invoked directly: `node src/index.ts` with ts-node/register or compiled output
// In this monorepo, `pnpm -w dev`/`bun` may run via node; this guard keeps import safety if used as a lib later.
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}

export { main };
