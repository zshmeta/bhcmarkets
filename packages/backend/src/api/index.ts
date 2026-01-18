/*
	HTTP API composition layer
	- Define route registrars per domain (auth, accounts, orders, etc.)
	- Keep controllers thin: validate -> call service -> map result
	- Used by the Node HTTP server today; can be adapted to Fastify later.
*/

import type { Router } from "./types.js";
import type { TokenManager, UserSessionRepository, AuthService } from "../domains/auth/index.js";
import type { AccountServiceInterface } from "../domains/account/index.js";
import type { RiskService } from "../domains/risk/index.js";
import type { TradingService } from "../domains/trading/index.js";
import { registerAuthRoutes } from "../domains/auth/index.js";
import { registerAccountRoutes } from "../domains/account/index.js";
import { registerAdminApiRoutes } from "../domains/admin/index.js";
import { registerTradingRoutes } from "../domains/trading/index.js";
import type { DrizzleClient } from "@repo/database";
import type { DbHealth } from "../infra/db-health.js";

export type ApiServices = {
	auth: AuthService;
	tokenManager: TokenManager;
	sessionRepository: UserSessionRepository;
	account: AccountServiceInterface;
	trading: TradingService;
	risk: RiskService;
	db: DrizzleClient;
	dbHealth: DbHealth;
};

type LoggerLike = {
	error: (msg: string, meta?: Record<string, unknown>) => void;
	info: (msg: string, meta?: Record<string, unknown>) => void;
	warn?: (msg: string, meta?: Record<string, unknown>) => void;
};

export function registerApiRoutes(router: Router, services: ApiServices, logger: LoggerLike) {
	// Health & readiness
	router.route("GET", "/healthz", async () => ({ status: 200, body: { status: "ok" } }));
	router.route("GET", "/readyz", async () => {
		const dbOk = await services.dbHealth.isConnected();
		if (!dbOk) {
			return { status: 503, body: { status: "not_ready", reason: "database_not_connected" } };
		}
		return { status: 200, body: { status: "ready" } };
	});

	// Auth routes live in the auth domain module.
	registerAuthRoutes(router, { auth: services.auth, dbHealth: services.dbHealth }, logger);

	// Account routes - wallet and balance management
	registerAccountRoutes(router, {
		accountService: services.account,
		tokenManager: services.tokenManager,
	}, logger);

	// Admin routes - comprehensive admin panel with audit trail
	registerAdminApiRoutes(router, {
		db: services.db,
		tokenManager: services.tokenManager,
		sessionRepository: services.sessionRepository,
		accountService: services.account,
		riskService: services.risk,
		logger: {
			info: logger.info,
			warn: logger.warn || logger.info,
			error: logger.error,
		},
	});

	// Trading routes - user-facing orders and positions
	registerTradingRoutes(router, {
		db: services.db,
		tokenManager: services.tokenManager,
		tradingService: services.trading,
	}, logger);
}


