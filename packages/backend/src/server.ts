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
import { createPgPool, createDrizzleClient } from "./db/pg.js";
import {
  createAuthService,
  createUserRepository,
  createCredentialRepository,
  createSessionRepository,
  createAuthCodeRepository,
  createBcryptHasher,
  createJwtTokenManager,
} from "./domains/auth/index.js";

import { OrderService } from "./domains/order/order.service.js";
import { PositionService } from "./domains/position/position.service.js";
import { AccountService } from "./domains/account/account.service.js";


import { createNodeRouter } from "./api/nodeRouter.js";
import { registerApiRoutes } from "./api/index.js";

// Config loader documents our runtime contract and provides safe defaults.
const config = loadEnv();

// Minimal structured logger stub (replace with pino/winston later)
const logger = {
  info: (msg: string, meta?: Record<string, unknown>) =>
    console.log(JSON.stringify({ level: "info", msg, ...meta })),
  error: (msg: string, meta?: Record<string, unknown>) =>
    console.error(JSON.stringify({ level: "error", msg, ...meta })),

};

const { router, handle } = createNodeRouter({ corsOrigins: config.corsOrigins, logger });

// Very small dependency container. In a larger codebase we'd use a proper DI/wiring layer.
const services = await (async () => {
  const pool = createPgPool({ connectionString: config.databaseUrl });
  // Migrations are now manual
  // await services.db.query("SELECT 1");

  const userRepository = createUserRepository(pool);
  const credentialRepository = createCredentialRepository(pool);
  const sessionRepository = createSessionRepository(pool);
  const authCodeRepository = createAuthCodeRepository(pool);

  const passwordHasher = createBcryptHasher(config.bcryptRounds);
  const tokenManager = createJwtTokenManager(config.jwtSecret);

  const drizzleClient = createDrizzleClient(pool);
  const accountService = new AccountService(drizzleClient);

  const auth = createAuthService({
    userRepository,
    credentialRepository,
    sessionRepository,
    authCodeRepository,
    passwordHasher,
    tokenManager,
    config: {
      accessTokenTtlSeconds: config.accessTtlSec,
      refreshTokenTtlSeconds: config.refreshTtlSec,
      maxSessionsPerUser: config.maxSessionsPerUser,
    },
    accountService,
  });

  const positionService = new PositionService(drizzleClient);
  const orderService = new OrderService(drizzleClient, positionService);

  // accountService is already initialized above

  // Hydrate order matching engine
  await orderService.initialize();

  return { auth, position: positionService, order: orderService, account: accountService, tokenManager, sessionRepository } as const;
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
