/**
 * Admin Domain - HTTP Route Definitions
 *
 * These routes expose the Admin API. Every route:
 * 1. Authenticates the request (JWT)
 * 2. Authorizes the action (role check)
 * 3. Validates input (Zod)
 * 4. Executes the action
 * 5. Returns structured response
 *
 * All modifying actions require a reason in the request body.
 */

import type { IncomingMessage, ServerResponse } from "http";
import { AdminError, isAdminError } from "../core/admin.errors.js";
import type { AdminService, UserRole, AdminAction } from "../core/admin.types.js";
import {
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
} from "../validators/admin.validators.js";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Authenticated request context.
 */
interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Route handler type.
 */
type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  auth: AuthContext,
  params?: Record<string, string>
) => Promise<void>;

/**
 * Route definition.
 */
interface RouteDefinition {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  handler: RouteHandler;
  requiredAction: AdminAction;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse JSON body from request.
 */
async function parseBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        reject(new AdminError("INVALID_INPUT", "Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}

/**
 * Send JSON response.
 */
function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown
): void {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

/**
 * Extract request context for audit.
 */
function getRequestContext(req: IncomingMessage) {
  return {
    ipAddress:
      (req.headers["x-forwarded-for"] as string)?.split(",")[0] ||
      req.socket.remoteAddress ||
      undefined,
    userAgent: req.headers["user-agent"] || undefined,
  };
}

/**
 * Extract path parameters.
 * Matches /path/:param patterns.
 */
function extractParams(
  routePath: string,
  requestPath: string
): Record<string, string> | null {
  const routeParts = routePath.split("/");
  const pathWithoutQuery = requestPath.split("?")[0] || "";
  const requestParts = pathWithoutQuery.split("/");

  if (routeParts.length !== requestParts.length) return null;

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const requestPart = requestParts[i];

    if (routePart === undefined || requestPart === undefined) {
      return null;
    }

    if (routePart.startsWith(":")) {
      params[routePart.slice(1)] = requestPart;
    } else if (routePart !== requestPart) {
      return null;
    }
  }

  return params;
}

/**
 * Parse query string parameters.
 */
function parseQuery(url: string): Record<string, string> {
  const queryIndex = url.indexOf("?");
  if (queryIndex === -1) return {};

  const params: Record<string, string> = {};
  const queryString = url.slice(queryIndex + 1);

  for (const pair of queryString.split("&")) {
    const [key, value] = pair.split("=");
    if (key) params[key] = decodeURIComponent(value || "");
  }

  return params;
}

// =============================================================================
// ROUTE FACTORY
// =============================================================================

/**
 * Creates Admin HTTP routes.
 */
export function createAdminRoutes(adminService: AdminService) {
  // ===========================================================================
  // USER MANAGEMENT HANDLERS
  // ===========================================================================

  const listUsersHandler: RouteHandler = async (req, res, auth) => {
    const query = parseQuery(req.url || "");
    const filter = listUsersSchema.parse(query);
    const users = await adminService.listUsers(filter);
    sendJson(res, 200, { data: users });
  };

  const getUserHandler: RouteHandler = async (req, res, auth, params) => {
    const userId = params?.userId;
    if (!userId) {
      throw new AdminError("INVALID_INPUT", "User ID is required");
    }
    const user = await adminService.getUserDetails(userId);
    if (!user) {
      throw new AdminError("USER_NOT_FOUND");
    }
    sendJson(res, 200, { data: user });
  };

  const suspendUserHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = suspendUserSchema.parse(body);
    await adminService.suspendUser(auth.userId, input, getRequestContext(req));
    sendJson(res, 200, { success: true, message: "User suspended" });
  };

  const unsuspendUserHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = unsuspendUserSchema.parse(body);
    await adminService.unsuspendUser(
      auth.userId,
      input.userId,
      input.reason,
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: "User unsuspended" });
  };

  const updateUserRoleHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = updateUserRoleSchema.parse(body);
    await adminService.updateUserRole(auth.userId, input, getRequestContext(req));
    sendJson(res, 200, { success: true, message: "User role updated" });
  };

  // ===========================================================================
  // ACCOUNT MANAGEMENT HANDLERS
  // ===========================================================================

  const listAccountsHandler: RouteHandler = async (req, res, auth) => {
    const query = parseQuery(req.url || "");
    const filter = listAccountsSchema.parse(query);
    const accounts = await adminService.listAccounts(filter);
    sendJson(res, 200, { data: accounts });
  };

  const getAccountHandler: RouteHandler = async (req, res, auth, params) => {
    const accountId = params?.accountId;
    if (!accountId) {
      throw new AdminError("INVALID_INPUT", "Account ID is required");
    }
    const account = await adminService.getAccountDetails(accountId);
    if (!account) {
      throw new AdminError("ACCOUNT_NOT_FOUND");
    }
    sendJson(res, 200, { data: account });
  };

  const adminDepositHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = adminDepositSchema.parse(body);
    await adminService.adminDeposit(
      auth.userId,
      { ...input, operationType: "deposit" },
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: "Deposit completed" });
  };

  const adminWithdrawHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = adminWithdrawSchema.parse(body);
    await adminService.adminWithdraw(
      auth.userId,
      { ...input, operationType: "withdraw" },
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: "Withdrawal completed" });
  };

  const freezeAccountHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = freezeAccountSchema.parse(body);
    await adminService.freezeAccount(
      auth.userId,
      input.accountId,
      input.reason,
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: "Account frozen" });
  };

  const unfreezeAccountHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = unfreezeAccountSchema.parse(body);
    await adminService.unfreezeAccount(
      auth.userId,
      input.accountId,
      input.reason,
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: "Account unfrozen" });
  };

  // ===========================================================================
  // RISK MANAGEMENT HANDLERS
  // ===========================================================================

  const getRiskDashboardHandler: RouteHandler = async (req, res, auth) => {
    const dashboard = await adminService.getRiskDashboard();
    sendJson(res, 200, { data: dashboard });
  };

  const activateCircuitBreakerHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = circuitBreakerSchema.parse(body);
    await adminService.activateCircuitBreaker(
      auth.userId,
      input.reason,
      input.symbol,
      getRequestContext(req)
    );
    sendJson(res, 200, {
      success: true,
      message: input.symbol
        ? `Circuit breaker activated for ${input.symbol}`
        : "Platform-wide circuit breaker activated",
    });
  };

  const deactivateCircuitBreakerHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = circuitBreakerSchema.parse(body);
    await adminService.deactivateCircuitBreaker(
      auth.userId,
      input.reason,
      input.symbol,
      getRequestContext(req)
    );
    sendJson(res, 200, {
      success: true,
      message: input.symbol
        ? `Circuit breaker deactivated for ${input.symbol}`
        : "Platform-wide circuit breaker deactivated",
    });
  };

  // ===========================================================================
  // SYMBOL MANAGEMENT HANDLERS
  // ===========================================================================

  const listSymbolsHandler: RouteHandler = async (req, res, auth) => {
    const symbols = await adminService.listSymbols();
    sendJson(res, 200, { data: symbols });
  };

  const getSymbolHandler: RouteHandler = async (req, res, auth, params) => {
    const symbolId = params?.symbol;
    if (!symbolId) {
      throw new AdminError("INVALID_INPUT", "Symbol is required");
    }
    const symbol = await adminService.getSymbol(symbolId);
    if (!symbol) {
      throw new AdminError("SYMBOL_NOT_FOUND");
    }
    sendJson(res, 200, { data: symbol });
  };

  const upsertSymbolHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = upsertSymbolSchema.parse(body);
    const symbol = await adminService.upsertSymbol(
      auth.userId,
      input,
      getRequestContext(req)
    );
    sendJson(res, 200, { data: symbol });
  };

  const enableSymbolHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = symbolActionSchema.parse(body);
    await adminService.enableSymbol(
      auth.userId,
      input.symbol,
      input.reason,
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: `Trading enabled for ${input.symbol}` });
  };

  const disableSymbolHandler: RouteHandler = async (req, res, auth) => {
    const body = await parseBody(req);
    const input = symbolActionSchema.parse(body);
    await adminService.disableSymbol(
      auth.userId,
      input.symbol,
      input.reason,
      getRequestContext(req)
    );
    sendJson(res, 200, { success: true, message: `Trading disabled for ${input.symbol}` });
  };

  // ===========================================================================
  // AUDIT LOG HANDLERS
  // ===========================================================================

  const getAuditLogHandler: RouteHandler = async (req, res, auth) => {
    const query = parseQuery(req.url || "");
    const filter = auditLogFilterSchema.parse(query);

    // Convert string dates to Date objects and cast action properly
    const parsedFilter = {
      ...filter,
      action: filter.action as AdminAction | undefined,
      startDate: filter.startDate ? new Date(filter.startDate) : undefined,
      endDate: filter.endDate ? new Date(filter.endDate) : undefined,
    };

    const entries = await adminService.getAuditLog(parsedFilter);
    sendJson(res, 200, { data: entries });
  };

  const getAuditEntryHandler: RouteHandler = async (req, res, auth, params) => {
    const entryId = params?.id;
    if (!entryId) {
      sendJson(res, 400, { error: "Audit entry ID is required" });
      return;
    }
    const entry = await adminService.getAuditEntry(entryId);
    if (!entry) {
      sendJson(res, 404, { error: "Audit entry not found" });
      return;
    }
    sendJson(res, 200, { data: entry });
  };

  // ===========================================================================
  // ROUTE DEFINITIONS
  // ===========================================================================

  const routes: RouteDefinition[] = [
    // User management
    { method: "GET", path: "/admin/users", handler: listUsersHandler, requiredAction: "user:list" },
    { method: "GET", path: "/admin/users/:userId", handler: getUserHandler, requiredAction: "user:read" },
    { method: "POST", path: "/admin/users/suspend", handler: suspendUserHandler, requiredAction: "user:suspend" },
    { method: "POST", path: "/admin/users/unsuspend", handler: unsuspendUserHandler, requiredAction: "user:unsuspend" },
    { method: "POST", path: "/admin/users/role", handler: updateUserRoleHandler, requiredAction: "user:update_role" },

    // Account management
    { method: "GET", path: "/admin/accounts", handler: listAccountsHandler, requiredAction: "account:list" },
    { method: "GET", path: "/admin/accounts/:accountId", handler: getAccountHandler, requiredAction: "account:read" },
    { method: "POST", path: "/admin/accounts/deposit", handler: adminDepositHandler, requiredAction: "account:deposit" },
    { method: "POST", path: "/admin/accounts/withdraw", handler: adminWithdrawHandler, requiredAction: "account:withdraw" },
    { method: "POST", path: "/admin/accounts/freeze", handler: freezeAccountHandler, requiredAction: "account:freeze" },
    { method: "POST", path: "/admin/accounts/unfreeze", handler: unfreezeAccountHandler, requiredAction: "account:unfreeze" },

    // Risk management
    { method: "GET", path: "/admin/risk/dashboard", handler: getRiskDashboardHandler, requiredAction: "risk:read" },
    { method: "POST", path: "/admin/risk/circuit-breaker/activate", handler: activateCircuitBreakerHandler, requiredAction: "risk:circuit_breaker_activate" },
    { method: "POST", path: "/admin/risk/circuit-breaker/deactivate", handler: deactivateCircuitBreakerHandler, requiredAction: "risk:circuit_breaker_deactivate" },

    // Symbol management
    { method: "GET", path: "/admin/symbols", handler: listSymbolsHandler, requiredAction: "symbol:list" },
    { method: "GET", path: "/admin/symbols/:symbol", handler: getSymbolHandler, requiredAction: "symbol:read" },
    { method: "POST", path: "/admin/symbols", handler: upsertSymbolHandler, requiredAction: "symbol:create" },
    { method: "PUT", path: "/admin/symbols", handler: upsertSymbolHandler, requiredAction: "symbol:update" },
    { method: "POST", path: "/admin/symbols/enable", handler: enableSymbolHandler, requiredAction: "symbol:enable" },
    { method: "POST", path: "/admin/symbols/disable", handler: disableSymbolHandler, requiredAction: "symbol:disable" },

    // Audit log
    { method: "GET", path: "/admin/audit", handler: getAuditLogHandler, requiredAction: "audit:read" },
    { method: "GET", path: "/admin/audit/:id", handler: getAuditEntryHandler, requiredAction: "audit:read" },
  ];

  // ===========================================================================
  // MAIN HANDLER
  // ===========================================================================

  /**
   * Main request handler for admin routes.
   * Returns true if the request was handled, false otherwise.
   */
  async function handleAdminRequest(
    req: IncomingMessage,
    res: ServerResponse,
    auth: AuthContext | null
  ): Promise<boolean> {
    const method = req.method as RouteDefinition["method"];
    const path = req.url?.split("?")[0] || "";

    // Check if this is an admin route
    if (!path.startsWith("/admin")) {
      return false;
    }

    // Must be authenticated
    if (!auth) {
      sendJson(res, 401, { error: "Authentication required" });
      return true;
    }

    // Find matching route
    let matchedRoute: RouteDefinition | undefined;
    let params: Record<string, string> | null = null;

    for (const route of routes) {
      if (route.method !== method) continue;
      params = extractParams(route.path, path);
      if (params !== null) {
        matchedRoute = route;
        break;
      }
    }

    if (!matchedRoute) {
      sendJson(res, 404, { error: "Admin endpoint not found" });
      return true;
    }

    // Check permission
    if (!adminService.hasPermission(auth.role, matchedRoute.requiredAction)) {
      sendJson(res, 403, {
        error: "Insufficient permissions",
        code: "INSUFFICIENT_PERMISSIONS",
        required: matchedRoute.requiredAction,
      });
      return true;
    }

    // Execute handler
    try {
      await matchedRoute.handler(req, res, auth, params || undefined);
    } catch (error) {
      if (isAdminError(error)) {
        sendJson(res, error.httpStatus, error.toJSON());
      } else if (error instanceof Error && error.name === "ZodError") {
        sendJson(res, 400, {
          error: "Validation failed",
          code: "INVALID_INPUT",
          details: (error as { errors?: unknown }).errors,
        });
      } else {
        console.error("Admin route error:", error);
        sendJson(res, 500, {
          error: "Internal server error",
          code: "INTERNAL_ERROR",
        });
      }
    }

    return true;
  }

  return {
    handleAdminRequest,
    routes,
  };
}
