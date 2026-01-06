/**
 * Admin Domain - API Registration
 *
 * This module provides a simple adapter to integrate the Admin domain
 * with the existing Node.js router used in this codebase.
 *
 * The Admin domain has its own comprehensive routing logic that handles
 * authentication, authorization, and request processing internally.
 * This adapter bridges between the existing Router pattern and the new system.
 */

import type { Router } from "../../../api/types.js";
import type { TokenManager, UserSessionRepository } from "../../auth/index.js";
import type { AccountServiceInterface } from "../../account/index.js";
import type { RiskService } from "../../risk/index.js";
import { createAdminService } from "../core/admin.service.js";
import { createAdminRepositoryPg } from "../repositories/admin.repository.pg.js";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
import type { IncomingMessage, ServerResponse } from "http";

type LoggerLike = {
  info: (msg: string, meta?: Record<string, unknown>) => void;
  warn: (msg: string, meta?: Record<string, unknown>) => void;
  error: (msg: string, meta?: Record<string, unknown>) => void;
};

/**
 * Dependencies required to wire up the Admin API.
 */
interface AdminApiDependencies {
  db: NodePgDatabase<Record<string, unknown>>;
  tokenManager: TokenManager;
  sessionRepository: UserSessionRepository;
  accountService: AccountServiceInterface;
  riskService: RiskService;

  // User service stub - will need full implementation
  // For now, we provide basic stubs
  userService?: {
    suspendUser(userId: string): Promise<void>;
    unsuspendUser(userId: string): Promise<void>;
    updateRole(userId: string, role: "user" | "admin" | "support"): Promise<void>;
    getUserById(userId: string): Promise<{ status: string; role: string } | null>;
  };

  // Phase 2: Order and Position services
  orderService?: {
    get(orderId: string): Promise<{ id: string; status: string; symbol: string; side: string; type: string; quantity: string; filledQuantity: string } | null>;
    cancel(orderId: string, userId?: string): Promise<void>;
  };

  positionService?: {
    getByAccountAndSymbol(accountId: string, symbol: string): Promise<{ id: string; quantity: string; side: string; entryPrice: string | null } | null>;
    updatePosition(accountId: string, symbol: string, side: string, quantityDelta: number, price: number): Promise<void>;
    closePosition(accountId: string, symbol: string): Promise<void>;
  };

  logger: LoggerLike;
}

/**
 * Registers admin routes with the existing Router.
 *
 * Note: The Admin domain uses a different internal routing pattern.
 * This function creates a catch-all handler that delegates to the Admin routes.
 */
export function registerAdminApiRoutes(
  router: Router,
  deps: AdminApiDependencies
): void {
  const { db, accountService, riskService, logger } = deps;

  // Create the admin repository
  const adminRepository = createAdminRepositoryPg(db);

  // Create user service stub (TODO: Wire to actual user domain when available)
  // For now, these use direct SQL queries via Drizzle
  const userServiceStub = deps.userService || {
    async suspendUser(userId: string): Promise<void> {
      await db.execute(sql`UPDATE users SET status = 'suspended' WHERE id = ${userId}`);
    },
    async unsuspendUser(userId: string): Promise<void> {
      await db.execute(sql`UPDATE users SET status = 'active' WHERE id = ${userId}`);
    },
    async updateRole(userId: string, role: "user" | "admin" | "support"): Promise<void> {
      await db.execute(sql`UPDATE users SET role = ${role} WHERE id = ${userId}`);
    },
    async getUserById(userId: string): Promise<{ status: string; role: string } | null> {
      const result = await db.execute(sql`SELECT status, role FROM users WHERE id = ${userId}`);
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as { status: string; role: string };
      return { status: row.status || "active", role: row.role };
    },
  };

  // Create account service adapter (map to expected interface)
  const accountServiceAdapter = {
    async deposit(input: { accountId: string; amount: string }): Promise<void> {
      await accountService.deposit({ accountId: input.accountId, amount: input.amount });
    },
    async withdraw(input: { accountId: string; amount: string }): Promise<void> {
      await accountService.withdraw({ accountId: input.accountId, amount: input.amount });
    },
    async freezeAccount(accountId: string): Promise<void> {
      // TODO: Implement freeze in account service
      await db.execute(sql`UPDATE accounts SET status = 'locked' WHERE id = ${accountId}`);
    },
    async unfreezeAccount(accountId: string): Promise<void> {
      await db.execute(sql`UPDATE accounts SET status = 'active' WHERE id = ${accountId}`);
    },
    async getAccountById(accountId: string): Promise<{
      balance: string;
      locked: string;
      status: string;
    } | null> {
      const result = await db.execute(
        sql`SELECT balance, locked, status FROM accounts WHERE id = ${accountId}`
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as { balance: string; locked: string; status: string };
      return {
        balance: String(row.balance),
        locked: String(row.locked || "0"),
        status: row.status || "active",
      };
    },
  };

  // Create risk service adapter
  const riskServiceAdapter = {
    async activateCircuitBreaker(
      trigger: string,
      reason: string,
      symbol?: string,
      adminUserId?: string
    ): Promise<void> {
      await riskService.activateCircuitBreaker(trigger as any, reason, symbol, adminUserId);
    },
    async deactivateCircuitBreaker(symbol?: string): Promise<void> {
      await riskService.deactivateCircuitBreaker(symbol);
    },
    async isCircuitBreakerActive(symbol?: string): Promise<boolean> {
      return riskService.isCircuitBreakerActive(symbol);
    },
    async getAllSymbolExposures(): Promise<Array<{
      symbol: string;
      netPosition: number;
      absolutePosition: number;
      markPrice: number;
      notionalValue: number;
      unrealizedPnl: number;
    }>> {
      // TODO: Implement in risk service - return exposures per symbol
      // For now, return empty array
      return [];
    },
    async getSymbolLimits(symbol: string): Promise<{ maxHouseNotionalExposure: number } | null> {
      const limits = await riskService.getSymbolLimits(symbol);
      if (!limits) return null;
      return { maxHouseNotionalExposure: limits.maxHouseNotionalExposure };
    },
  };

  // Create order service adapter (Phase 2)
  const orderServiceAdapter = deps.orderService || {
    async get(orderId: string): Promise<{
      id: string;
      status: string;
      symbol: string;
      side: string;
      type: string;
      quantity: string;
      filledQuantity: string;
    } | null> {
      const result = await db.execute(
        sql`SELECT id, status, symbol, side, type, quantity, filled_quantity as "filledQuantity" FROM orders WHERE id = ${orderId}`
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as any;
      return {
        id: row.id,
        status: row.status,
        symbol: row.symbol,
        side: row.side,
        type: row.type,
        quantity: String(row.quantity),
        filledQuantity: String(row.filledQuantity || "0"),
      };
    },
    async cancel(orderId: string): Promise<void> {
      await db.execute(sql`UPDATE orders SET status = 'cancelled' WHERE id = ${orderId}`);
    },
  };

  // Create position service adapter (Phase 2)
  const positionServiceAdapter = deps.positionService || {
    async getByAccountAndSymbol(
      accountId: string,
      symbol: string
    ): Promise<{ id: string; quantity: string; side: string; entryPrice: string | null } | null> {
      const result = await db.execute(
        sql`SELECT id, quantity, side, entry_price as "entryPrice" FROM positions WHERE account_id = ${accountId} AND symbol = ${symbol}`
      );
      if (result.rows.length === 0) return null;
      const row = result.rows[0] as any;
      return {
        id: row.id,
        quantity: String(row.quantity),
        side: row.side,
        entryPrice: row.entryPrice ? String(row.entryPrice) : null,
      };
    },
    async updatePosition(
      accountId: string,
      symbol: string,
      side: string,
      quantityDelta: number,
      price: number
    ): Promise<void> {
      // Basic implementation - real one would handle PnL calculations
      await db.execute(
        sql`UPDATE positions SET quantity = quantity + ${quantityDelta} WHERE account_id = ${accountId} AND symbol = ${symbol}`
      );
    },
    async closePosition(accountId: string, symbol: string): Promise<void> {
      await db.execute(
        sql`UPDATE positions SET quantity = 0, closed_at = NOW() WHERE account_id = ${accountId} AND symbol = ${symbol}`
      );
    },
  };

  // Create the admin service
  const adminService = createAdminService({
    repository: adminRepository,
    accountService: accountServiceAdapter,
    userService: userServiceStub,
    riskService: riskServiceAdapter,
    orderService: orderServiceAdapter,
    positionService: positionServiceAdapter,
    logger,
  });

  // Import the validators
  const {
    listUsersSchema,
    suspendUserSchema,
    unsuspendUserSchema,
    updateUserRoleSchema,
    listAccountsSchema,
    adminDepositSchema,
    adminWithdrawSchema,
    freezeAccountSchema,
    unfreezeAccountSchema,
    circuitBreakerSchema,
    upsertSymbolSchema,
    symbolActionSchema,
    auditLogFilterSchema,
    // Phase 2 validators
    listOrdersSchema,
    cancelOrderSchema,
    cancelAllOrdersSchema,
    listPositionsSchema,
    forceClosePositionSchema,
    reportPeriodSchema,
  } = require("../validators/admin.validators.js");

  // Helper to get auth context from request
  const { getAuthUser } = require("../../../api/middleware.js");
  type AuthContext = { userId: string; email: string; role: "user" | "admin" | "support" };

  // Helper to check admin permission
  function requireAdminPermission(
    auth: AuthContext | null,
    requiredAction: string
  ): AuthContext {
    if (!auth) throw { status: 401, error: "unauthorized" };
    if (!adminService.hasPermission(auth.role, requiredAction as any)) {
      throw { status: 403, error: "insufficient_permissions", required: requiredAction };
    }
    return auth;
  }

  // Helper to get request context for audit
  function getRequestContext(req: any) {
    return {
      ipAddress: req.headers?.["x-forwarded-for"]?.split(",")[0] || req.socket?.remoteAddress,
      userAgent: req.headers?.["user-agent"],
    };
  }

  // ==========================================================================
  // USER MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/users", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "user:list");

    try {
      const filter = listUsersSchema.parse(req.query || {});
      const users = await adminService.listUsers(filter);
      return { status: 200, body: { data: users } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/users/suspend", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "user:suspend");

    try {
      const input = suspendUserSchema.parse(req.body);
      await adminService.suspendUser(auth!.userId, input, getRequestContext(req));
      return { status: 200, body: { success: true, message: "User suspended" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      logger.error("admin_suspend_error", { error: String(e) });
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/users/unsuspend", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "user:unsuspend");

    try {
      const input = unsuspendUserSchema.parse(req.body);
      await adminService.unsuspendUser(auth!.userId, input.userId, input.reason, getRequestContext(req));
      return { status: 200, body: { success: true, message: "User unsuspended" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/users/role", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "user:update_role");

    try {
      const input = updateUserRoleSchema.parse(req.body);
      await adminService.updateUserRole(auth!.userId, input, getRequestContext(req));
      return { status: 200, body: { success: true, message: "User role updated" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // ACCOUNT MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/accounts", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "account:list");

    try {
      const filter = listAccountsSchema.parse(req.query || {});
      const accounts = await adminService.listAccounts(filter);
      return { status: 200, body: { data: accounts } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/accounts/deposit", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "account:deposit");

    try {
      const input = adminDepositSchema.parse(req.body);
      await adminService.adminDeposit(
        auth!.userId,
        { ...input, operationType: "deposit" },
        getRequestContext(req)
      );
      return { status: 200, body: { success: true, message: "Deposit completed" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/accounts/withdraw", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "account:withdraw");

    try {
      const input = adminWithdrawSchema.parse(req.body);
      await adminService.adminWithdraw(
        auth!.userId,
        { ...input, operationType: "withdraw" },
        getRequestContext(req)
      );
      return { status: 200, body: { success: true, message: "Withdrawal completed" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/accounts/freeze", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "account:freeze");

    try {
      const input = freezeAccountSchema.parse(req.body);
      await adminService.freezeAccount(auth!.userId, input.accountId, input.reason, getRequestContext(req));
      return { status: 200, body: { success: true, message: "Account frozen" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/accounts/unfreeze", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "account:unfreeze");

    try {
      const input = unfreezeAccountSchema.parse(req.body);
      await adminService.unfreezeAccount(auth!.userId, input.accountId, input.reason, getRequestContext(req));
      return { status: 200, body: { success: true, message: "Account unfrozen" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // RISK MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/risk/dashboard", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "risk:read");

    try {
      const dashboard = await adminService.getRiskDashboard();
      return { status: 200, body: { data: dashboard } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/risk/circuit-breaker/activate", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "risk:circuit_breaker_activate");

    try {
      const input = circuitBreakerSchema.parse(req.body);
      await adminService.activateCircuitBreaker(auth!.userId, input.reason, input.symbol, getRequestContext(req));
      return {
        status: 200,
        body: {
          success: true,
          message: input.symbol
            ? `Circuit breaker activated for ${input.symbol}`
            : "Platform-wide circuit breaker activated",
        },
      };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/risk/circuit-breaker/deactivate", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "risk:circuit_breaker_deactivate");

    try {
      const input = circuitBreakerSchema.parse(req.body);
      await adminService.deactivateCircuitBreaker(auth!.userId, input.reason, input.symbol, getRequestContext(req));
      return {
        status: 200,
        body: {
          success: true,
          message: input.symbol
            ? `Circuit breaker deactivated for ${input.symbol}`
            : "Platform-wide circuit breaker deactivated",
        },
      };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // SYMBOL MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/symbols", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "symbol:list");

    try {
      const symbols = await adminService.listSymbols();
      return { status: 200, body: { data: symbols } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/symbols", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "symbol:create");

    try {
      const input = upsertSymbolSchema.parse(req.body);
      const symbol = await adminService.upsertSymbol(auth!.userId, input, getRequestContext(req));
      return { status: 200, body: { data: symbol } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/symbols/enable", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "symbol:enable");

    try {
      const input = symbolActionSchema.parse(req.body);
      await adminService.enableSymbol(auth!.userId, input.symbol, input.reason, getRequestContext(req));
      return { status: 200, body: { success: true, message: `Trading enabled for ${input.symbol}` } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/symbols/disable", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "symbol:disable");

    try {
      const input = symbolActionSchema.parse(req.body);
      await adminService.disableSymbol(auth!.userId, input.symbol, input.reason, getRequestContext(req));
      return { status: 200, body: { success: true, message: `Trading disabled for ${input.symbol}` } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // AUDIT LOG ROUTES
  // ==========================================================================

  router.route("GET", "/admin/audit", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "audit:read");

    try {
      const filter = auditLogFilterSchema.parse(req.query || {});
      // Convert string dates to Date objects
      const parsedFilter = {
        ...filter,
        startDate: filter.startDate ? new Date(filter.startDate) : undefined,
        endDate: filter.endDate ? new Date(filter.endDate) : undefined,
      };
      const entries = await adminService.getAuditLog(parsedFilter);
      return { status: 200, body: { data: entries } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // PHASE 2: ORDER MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/orders", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "order:list");

    try {
      const filter = listOrdersSchema.parse(req.query || {});
      const orders = await adminService.listOrders(filter);
      return { status: 200, body: { data: orders } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("GET", "/admin/orders/:id", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "order:read");

    try {
      const orderId = req.params.id;
      const order = await adminService.getOrderDetails(orderId);
      if (!order) {
        return { status: 404, body: { error: "order_not_found" } };
      }
      return { status: 200, body: { data: order } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/orders/cancel", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "order:cancel");

    try {
      const input = cancelOrderSchema.parse(req.body);
      await adminService.cancelOrder(auth!.userId, input, getRequestContext(req));
      return { status: 200, body: { success: true, message: "Order cancelled" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/orders/cancel-all", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "order:cancel_all");

    try {
      const input = cancelAllOrdersSchema.parse(req.body);
      const result = await adminService.cancelAllOrders(auth!.userId, input, getRequestContext(req));
      return {
        status: 200,
        body: {
          success: true,
          message: `${result.cancelledCount} orders cancelled`,
          cancelledCount: result.cancelledCount,
        },
      };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // PHASE 2: POSITION MANAGEMENT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/positions", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "position:list");

    try {
      const filter = listPositionsSchema.parse(req.query || {});
      const positions = await adminService.listPositions(filter);
      return { status: 200, body: { data: positions } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("GET", "/admin/positions/:id", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "position:read");

    try {
      const positionId = req.params.id;
      const position = await adminService.getPositionDetails(positionId);
      if (!position) {
        return { status: 404, body: { error: "position_not_found" } };
      }
      return { status: 200, body: { data: position } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("POST", "/admin/positions/force-close", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "position:force_close");

    try {
      const input = forceClosePositionSchema.parse(req.body);
      await adminService.forceClosePosition(auth!.userId, input, getRequestContext(req));
      return { status: 200, body: { success: true, message: "Position force-closed" } };
    } catch (e: any) {
      if (e.httpStatus) return { status: e.httpStatus, body: e.toJSON() };
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  // ==========================================================================
  // PHASE 2: REPORT ROUTES
  // ==========================================================================

  router.route("GET", "/admin/reports/trading", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "report:generate");

    try {
      const period = reportPeriodSchema.parse(req.query || {});
      const report = await adminService.getDailyTradingSummary(period);
      return { status: 200, body: { data: report } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("GET", "/admin/reports/users", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "report:generate");

    try {
      const period = reportPeriodSchema.parse(req.query || {});
      const report = await adminService.getUserActivitySummary(period);
      return { status: 200, body: { data: report } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  router.route("GET", "/admin/reports/pnl", async (req: any) => {
    const auth = await getAuthUser(req, deps);
    requireAdminPermission(auth, "report:generate");

    try {
      const period = reportPeriodSchema.parse(req.query || {});
      const report = await adminService.getPlatformPnLSummary(period);
      return { status: 200, body: { data: report } };
    } catch (e: any) {
      if (e.status) return { status: e.status, body: { error: e.error } };
      return { status: 500, body: { error: "internal_error" } };
    }
  });

  logger.info("admin_routes_registered", {
    routes: [
      // Phase 1: User Management
      "GET /admin/users",
      "POST /admin/users/suspend",
      "POST /admin/users/unsuspend",
      "POST /admin/users/role",
      // Phase 1: Account Management
      "GET /admin/accounts",
      "POST /admin/accounts/deposit",
      "POST /admin/accounts/withdraw",
      "POST /admin/accounts/freeze",
      "POST /admin/accounts/unfreeze",
      // Phase 1: Risk Management
      "GET /admin/risk/dashboard",
      "POST /admin/risk/circuit-breaker/activate",
      "POST /admin/risk/circuit-breaker/deactivate",
      // Phase 1: Symbol Management
      "GET /admin/symbols",
      "POST /admin/symbols",
      "POST /admin/symbols/enable",
      "POST /admin/symbols/disable",
      // Phase 1: Audit
      "GET /admin/audit",
      // Phase 2: Order Management
      "GET /admin/orders",
      "GET /admin/orders/:id",
      "POST /admin/orders/cancel",
      "POST /admin/orders/cancel-all",
      // Phase 2: Position Management
      "GET /admin/positions",
      "GET /admin/positions/:id",
      "POST /admin/positions/force-close",
      // Phase 2: Reports
      "GET /admin/reports/trading",
      "GET /admin/reports/users",
      "GET /admin/reports/pnl",
    ],
  });
}
