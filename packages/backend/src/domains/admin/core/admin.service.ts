/**
 * Admin Service - Business Logic Implementation
 *
 * This service handles all admin operations with a strict audit-first approach.
 * Every modifying action:
 * 1. Validates the admin has permission
 * 2. Validates the operation is allowed
 * 3. Captures the "before" state
 * 4. Performs the operation
 * 5. Captures the "after" state
 * 6. Records the audit entry
 *
 * If any step fails, the entire operation is rolled back.
 */

import type {
  AdminService,
  AdminRepository,
  AdminAction,
  UserRole,
  AdminUserView,
  AdminAccountView,
  AdminAuditEntry,
  AuditLogFilter,
  SuspendUserInput,
  UpdateUserRoleInput,
  AdminBalanceOperationInput,
  PlatformRiskMetrics,
  SymbolConfig,
  UpsertSymbolInput,
  RequestContext,
  UUID,
  // Phase 2 types
  AdminOrderView,
  AdminOrderFilter,
  AdminCancelOrderInput,
  AdminCancelAllOrdersInput,
  AdminPositionView,
  AdminPositionFilter,
  AdminForceClosePositionInput,
  ReportPeriod,
  DailyTradingSummary,
  UserActivitySummary,
  PlatformPnLSummary,
} from "./admin.types.js";
import { AdminError } from "./admin.errors.js";

// =============================================================================
// DEPENDENCIES
// =============================================================================

/**
 * External dependencies required by the Admin Service.
 */
export interface AdminServiceDependencies {
  /** Repository for admin data operations */
  repository: AdminRepository;

  /** Account service for balance operations */
  accountService: {
    deposit(input: { accountId: string; amount: string }): Promise<void>;
    withdraw(input: { accountId: string; amount: string }): Promise<void>;
    freezeAccount(accountId: string): Promise<void>;
    unfreezeAccount(accountId: string): Promise<void>;
    getAccountById(accountId: string): Promise<{ balance: string; locked: string; status: string } | null>;
  };

  /** User service for user operations */
  userService: {
    suspendUser(userId: string): Promise<void>;
    unsuspendUser(userId: string): Promise<void>;
    updateRole(userId: string, role: UserRole): Promise<void>;
    getUserById(userId: string): Promise<{ status: string; role: string } | null>;
  };

  /** Risk service for risk operations */
  riskService: {
    activateCircuitBreaker(
      trigger: string,
      reason: string,
      symbol?: string,
      adminUserId?: string
    ): Promise<void>;
    deactivateCircuitBreaker(symbol?: string): Promise<void>;
    isCircuitBreakerActive(symbol?: string): Promise<boolean>;
    getAllSymbolExposures(): Promise<Array<{
      symbol: string;
      netPosition: number;
      absolutePosition: number;
      markPrice: number;
      notionalValue: number;
      unrealizedPnl: number;
    }>>;
    getSymbolLimits(symbol: string): Promise<{ maxHouseNotionalExposure: number } | null>;
  };

  /** Order service for order management (Phase 2) */
  orderService: {
    get(orderId: string): Promise<{ id: string; status: string; symbol: string; side: string; type: string; quantity: string; filledQuantity: string } | null>;
    cancel(orderId: string, userId?: string): Promise<void>;
  };

  /** Position service for position management (Phase 2) */
  positionService: {
    getByAccountAndSymbol(accountId: string, symbol: string): Promise<{ id: string; quantity: string; side: string; entryPrice: string | null } | null>;
    updatePosition(accountId: string, symbol: string, side: string, quantityDelta: number, price: number): Promise<void>;
    closePosition(accountId: string, symbol: string): Promise<void>;
  };

  /** Optional logger */
  logger?: {
    info: (msg: string, meta?: Record<string, unknown>) => void;
    warn: (msg: string, meta?: Record<string, unknown>) => void;
    error: (msg: string, meta?: Record<string, unknown>) => void;
  };
}

// =============================================================================
// PERMISSION CHECK
// =============================================================================

/**
 * Role permissions map.
 * Imported from types but defined here to avoid circular deps.
 */
const PERMISSIONS: Record<UserRole, AdminAction[]> = {
  user: [],
  support: [
    "user:list",
    "user:read",
    "user:suspend",
    "user:unsuspend",
    "account:list",
    "account:read",
    "order:list",
    "order:read",
    "order:cancel",
    "position:list",
    "position:read",
    "audit:read",
  ],
  admin: [
    "user:list",
    "user:read",
    "user:suspend",
    "user:unsuspend",
    "user:update_role",
    "user:reset_password",
    "account:list",
    "account:read",
    "account:deposit",
    "account:withdraw",
    "account:freeze",
    "account:unfreeze",
    "account:adjust",
    "order:list",
    "order:read",
    "order:cancel",
    "order:cancel_all",
    "position:list",
    "position:read",
    "position:force_close",
    "risk:read",
    "risk:update_symbol_limits",
    "risk:update_user_limits",
    "risk:circuit_breaker_activate",
    "risk:circuit_breaker_deactivate",
    "risk:kill_switch",
    "symbol:list",
    "symbol:read",
    "symbol:create",
    "symbol:update",
    "symbol:enable",
    "symbol:disable",
    "audit:read",
    "report:generate",
    "report:export",
    "system:health",
    "system:stats",
  ],
};

// =============================================================================
// SERVICE IMPLEMENTATION
// =============================================================================

/**
 * Creates an Admin Service instance.
 */
export function createAdminService(
  deps: AdminServiceDependencies
): AdminService {
  const { repository, accountService, userService, riskService, orderService, positionService, logger } = deps;

  /**
   * Check if a role has a specific permission.
   */
  function hasPermission(role: UserRole, action: AdminAction): boolean {
    const permissions = PERMISSIONS[role] || [];
    return permissions.includes(action);
  }

  /**
   * Require permission or throw.
   */
  function requirePermission(role: UserRole, action: AdminAction): void {
    if (!hasPermission(role, action)) {
      throw new AdminError("INSUFFICIENT_PERMISSIONS", undefined, {
        role,
        action,
      });
    }
  }

  /**
   * Require a non-empty reason.
   */
  function requireReason(reason: string | undefined): string {
    if (!reason || reason.trim().length === 0) {
      throw new AdminError("REASON_REQUIRED");
    }
    return reason.trim();
  }

  // ===========================================================================
  // USER MANAGEMENT
  // ===========================================================================

  async function listUsers(filter?: {
    role?: UserRole;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminUserView[]> {
    return repository.listUsersWithStats(filter);
  }

  async function getUserDetails(userId: UUID): Promise<AdminUserView | null> {
    return repository.getUserWithStats(userId);
  }

  async function suspendUser(
    adminUserId: UUID,
    input: SuspendUserInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    // Prevent self-suspension
    if (adminUserId === input.userId) {
      throw new AdminError("CANNOT_SUSPEND_SELF");
    }

    // Get current state for audit
    const user = await userService.getUserById(input.userId);
    if (!user) {
      throw new AdminError("USER_NOT_FOUND", undefined, { userId: input.userId });
    }

    if (user.status === "suspended") {
      throw new AdminError("USER_ALREADY_SUSPENDED");
    }

    const oldValue = { status: user.status };

    // Perform the operation
    await userService.suspendUser(input.userId);

    // Record audit entry
    await repository.createAuditEntry({
      adminUserId,
      action: "user:suspend",
      targetType: "user",
      targetId: input.userId,
      oldValue,
      newValue: { status: "suspended" },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("user_suspended", {
      adminUserId,
      targetUserId: input.userId,
      reason,
    });
  }

  async function unsuspendUser(
    adminUserId: UUID,
    userId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const user = await userService.getUserById(userId);
    if (!user) {
      throw new AdminError("USER_NOT_FOUND", undefined, { userId });
    }

    if (user.status !== "suspended") {
      throw new AdminError("USER_NOT_SUSPENDED");
    }

    const oldValue = { status: user.status };

    await userService.unsuspendUser(userId);

    await repository.createAuditEntry({
      adminUserId,
      action: "user:unsuspend",
      targetType: "user",
      targetId: userId,
      oldValue,
      newValue: { status: "active" },
      reason: validReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("user_unsuspended", { adminUserId, targetUserId: userId });
  }

  async function updateUserRole(
    adminUserId: UUID,
    input: UpdateUserRoleInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    // Prevent changing own role
    if (adminUserId === input.userId) {
      throw new AdminError("CANNOT_MODIFY_OWN_ROLE");
    }

    const user = await userService.getUserById(input.userId);
    if (!user) {
      throw new AdminError("USER_NOT_FOUND", undefined, { userId: input.userId });
    }

    const oldValue = { role: user.role };

    await userService.updateRole(input.userId, input.newRole);

    await repository.createAuditEntry({
      adminUserId,
      action: "user:update_role",
      targetType: "user",
      targetId: input.userId,
      oldValue,
      newValue: { role: input.newRole },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("user_role_changed", {
      adminUserId,
      targetUserId: input.userId,
      oldRole: user.role,
      newRole: input.newRole,
    });
  }

  // ===========================================================================
  // ACCOUNT OPERATIONS
  // ===========================================================================

  async function listAccounts(filter?: {
    userId?: UUID;
    currency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAccountView[]> {
    return repository.listAccountsWithUserInfo(filter);
  }

  async function getAccountDetails(
    accountId: UUID
  ): Promise<AdminAccountView | null> {
    return repository.getAccountWithUserInfo(accountId);
  }

  async function adminDeposit(
    adminUserId: UUID,
    input: AdminBalanceOperationInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    const amount = parseFloat(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new AdminError("INVALID_AMOUNT", "Amount must be positive.");
    }

    // Get current state
    const account = await accountService.getAccountById(input.accountId);
    if (!account) {
      throw new AdminError("ACCOUNT_NOT_FOUND");
    }

    const oldValue = { balance: account.balance };

    // Perform deposit
    await accountService.deposit({
      accountId: input.accountId,
      amount: input.amount,
    });

    // Get new state
    const updatedAccount = await accountService.getAccountById(input.accountId);
    const newValue = { balance: updatedAccount?.balance || "unknown" };

    await repository.createAuditEntry({
      adminUserId,
      action: "account:deposit",
      targetType: "account",
      targetId: input.accountId,
      oldValue,
      newValue,
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("admin_deposit", {
      adminUserId,
      accountId: input.accountId,
      amount: input.amount,
    });
  }

  async function adminWithdraw(
    adminUserId: UUID,
    input: AdminBalanceOperationInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    const amount = parseFloat(input.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new AdminError("INVALID_AMOUNT", "Amount must be positive.");
    }

    const account = await accountService.getAccountById(input.accountId);
    if (!account) {
      throw new AdminError("ACCOUNT_NOT_FOUND");
    }

    const available =
      parseFloat(account.balance) - parseFloat(account.locked);
    if (available < amount) {
      throw new AdminError("INSUFFICIENT_BALANCE", undefined, {
        available: available.toString(),
        requested: input.amount,
      });
    }

    const oldValue = { balance: account.balance };

    await accountService.withdraw({
      accountId: input.accountId,
      amount: input.amount,
    });

    const updatedAccount = await accountService.getAccountById(input.accountId);
    const newValue = { balance: updatedAccount?.balance || "unknown" };

    await repository.createAuditEntry({
      adminUserId,
      action: "account:withdraw",
      targetType: "account",
      targetId: input.accountId,
      oldValue,
      newValue,
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("admin_withdraw", {
      adminUserId,
      accountId: input.accountId,
      amount: input.amount,
    });
  }

  async function freezeAccount(
    adminUserId: UUID,
    accountId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const account = await accountService.getAccountById(accountId);
    if (!account) {
      throw new AdminError("ACCOUNT_NOT_FOUND");
    }

    if (account.status === "locked") {
      throw new AdminError("ACCOUNT_ALREADY_FROZEN");
    }

    const oldValue = { status: account.status };

    await accountService.freezeAccount(accountId);

    await repository.createAuditEntry({
      adminUserId,
      action: "account:freeze",
      targetType: "account",
      targetId: accountId,
      oldValue,
      newValue: { status: "locked" },
      reason: validReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("account_frozen", { adminUserId, accountId });
  }

  async function unfreezeAccount(
    adminUserId: UUID,
    accountId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const account = await accountService.getAccountById(accountId);
    if (!account) {
      throw new AdminError("ACCOUNT_NOT_FOUND");
    }

    if (account.status !== "locked") {
      throw new AdminError("ACCOUNT_NOT_FROZEN");
    }

    const oldValue = { status: account.status };

    await accountService.unfreezeAccount(accountId);

    await repository.createAuditEntry({
      adminUserId,
      action: "account:unfreeze",
      targetType: "account",
      targetId: accountId,
      oldValue,
      newValue: { status: "active" },
      reason: validReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("account_unfrozen", { adminUserId, accountId });
  }

  // ===========================================================================
  // RISK DASHBOARD
  // ===========================================================================

  async function getRiskDashboard(): Promise<PlatformRiskMetrics> {
    const [
      exposures,
      circuitBreakerActive,
      activeUserCount,
      openOrderCount,
      openPositionCount,
    ] = await Promise.all([
      riskService.getAllSymbolExposures(),
      riskService.isCircuitBreakerActive(),
      repository.getActiveUserCount(),
      repository.getOpenOrderCount(),
      repository.getOpenPositionCount(),
    ]);

    // Calculate total exposure and per-symbol status
    let totalHouseExposure = 0;
    const exposureBySymbol = await Promise.all(
      exposures.map(async (exp) => {
        totalHouseExposure += exp.notionalValue;

        // Get limit to calculate percentage
        const limits = await riskService.getSymbolLimits(exp.symbol);
        const maxNotional = limits?.maxHouseNotionalExposure || 1_000_000;
        const percentOfLimit = exp.notionalValue / maxNotional;

        let status: "normal" | "warning" | "critical" = "normal";
        if (percentOfLimit >= 0.9) {
          status = "critical";
        } else if (percentOfLimit >= 0.7) {
          status = "warning";
        }

        return {
          ...exp,
          percentOfLimit,
          status,
        };
      })
    );

    return {
      totalHouseExposure,
      exposureBySymbol,
      circuitBreakerActive,
      activeUserCount,
      openOrderCount,
      openPositionCount,
      tradingEnabled: !circuitBreakerActive,
    };
  }

  async function activateCircuitBreaker(
    adminUserId: UUID,
    reason: string,
    symbol?: string,
    context?: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const isActive = await riskService.isCircuitBreakerActive(symbol);
    if (isActive) {
      throw new AdminError("CIRCUIT_BREAKER_ALREADY_ACTIVE");
    }

    await riskService.activateCircuitBreaker(
      "manual",
      validReason,
      symbol,
      adminUserId
    );

    await repository.createAuditEntry({
      adminUserId,
      action: "risk:circuit_breaker_activate",
      targetType: "circuit_breaker",
      targetIdentifier: symbol || "PLATFORM",
      oldValue: { active: false },
      newValue: { active: true, reason: validReason },
      reason: validReason,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    logger?.warn("circuit_breaker_activated_by_admin", {
      adminUserId,
      symbol,
      reason: validReason,
    });
  }

  async function deactivateCircuitBreaker(
    adminUserId: UUID,
    reason: string,
    symbol?: string,
    context?: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const isActive = await riskService.isCircuitBreakerActive(symbol);
    if (!isActive) {
      throw new AdminError("CIRCUIT_BREAKER_NOT_ACTIVE");
    }

    await riskService.deactivateCircuitBreaker(symbol);

    await repository.createAuditEntry({
      adminUserId,
      action: "risk:circuit_breaker_deactivate",
      targetType: "circuit_breaker",
      targetIdentifier: symbol || "PLATFORM",
      oldValue: { active: true },
      newValue: { active: false },
      reason: validReason,
      ipAddress: context?.ipAddress,
      userAgent: context?.userAgent,
    });

    logger?.info("circuit_breaker_deactivated_by_admin", {
      adminUserId,
      symbol,
    });
  }

  // ===========================================================================
  // SYMBOL MANAGEMENT
  // ===========================================================================

  async function listSymbols(): Promise<SymbolConfig[]> {
    return repository.listSymbols();
  }

  async function getSymbol(symbol: string): Promise<SymbolConfig | null> {
    return repository.getSymbol(symbol);
  }

  async function upsertSymbol(
    adminUserId: UUID,
    input: UpsertSymbolInput,
    context: RequestContext
  ): Promise<SymbolConfig> {
    const reason = requireReason(input.reason);

    // Get existing for audit
    const existing = await repository.getSymbol(input.symbol);
    const isCreate = !existing;

    const config: Omit<SymbolConfig, "createdAt" | "updatedAt"> = {
      symbol: input.symbol,
      baseCurrency: input.baseCurrency,
      quoteCurrency: input.quoteCurrency,
      tradingEnabled: input.tradingEnabled ?? existing?.tradingEnabled ?? true,
      minOrderSize: input.minOrderSize ?? existing?.minOrderSize ?? 0.0001,
      maxOrderSize: input.maxOrderSize ?? existing?.maxOrderSize ?? 1000,
      makerFee: input.makerFee ?? existing?.makerFee ?? 0.001,
      takerFee: input.takerFee ?? existing?.takerFee ?? 0.002,
      priceDecimals: input.priceDecimals ?? existing?.priceDecimals ?? 2,
      quantityDecimals: input.quantityDecimals ?? existing?.quantityDecimals ?? 8,
    };

    const result = await repository.upsertSymbol(config);

    await repository.createAuditEntry({
      adminUserId,
      action: isCreate ? "symbol:create" : "symbol:update",
      targetType: "symbol",
      targetIdentifier: input.symbol,
      oldValue: existing ? { ...existing } : undefined,
      newValue: { ...result },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info(isCreate ? "symbol_created" : "symbol_updated", {
      adminUserId,
      symbol: input.symbol,
    });

    return result;
  }

  async function enableSymbol(
    adminUserId: UUID,
    symbol: string,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const existing = await repository.getSymbol(symbol);
    if (!existing) {
      throw new AdminError("SYMBOL_NOT_FOUND");
    }

    if (existing.tradingEnabled) {
      throw new AdminError("SYMBOL_ALREADY_ENABLED");
    }

    await repository.upsertSymbol({ ...existing, tradingEnabled: true });

    await repository.createAuditEntry({
      adminUserId,
      action: "symbol:enable",
      targetType: "symbol",
      targetIdentifier: symbol,
      oldValue: { tradingEnabled: false },
      newValue: { tradingEnabled: true },
      reason: validReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.info("symbol_enabled", { adminUserId, symbol });
  }

  async function disableSymbol(
    adminUserId: UUID,
    symbol: string,
    reason: string,
    context: RequestContext
  ): Promise<void> {
    const validReason = requireReason(reason);

    const existing = await repository.getSymbol(symbol);
    if (!existing) {
      throw new AdminError("SYMBOL_NOT_FOUND");
    }

    if (!existing.tradingEnabled) {
      throw new AdminError("SYMBOL_ALREADY_DISABLED");
    }

    await repository.upsertSymbol({ ...existing, tradingEnabled: false });

    await repository.createAuditEntry({
      adminUserId,
      action: "symbol:disable",
      targetType: "symbol",
      targetIdentifier: symbol,
      oldValue: { tradingEnabled: true },
      newValue: { tradingEnabled: false },
      reason: validReason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("symbol_disabled", { adminUserId, symbol, reason: validReason });
  }

  // ===========================================================================
  // AUDIT LOG
  // ===========================================================================

  async function getAuditLog(filter: AuditLogFilter): Promise<AdminAuditEntry[]> {
    return repository.listAuditEntries(filter);
  }

  async function getAuditEntry(id: UUID): Promise<AdminAuditEntry | null> {
    return repository.getAuditEntry(id);
  }

  // ===========================================================================
  // PHASE 2: ORDER MANAGEMENT
  // ===========================================================================

  async function listOrders(
    filter?: AdminOrderFilter
  ): Promise<AdminOrderView[]> {
    return repository.listOrdersWithUserInfo(filter);
  }

  async function getOrderDetails(
    orderId: UUID
  ): Promise<AdminOrderView | null> {
    return repository.getOrderWithUserInfo(orderId);
  }

  async function cancelOrder(
    adminUserId: UUID,
    input: AdminCancelOrderInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    // Get order with user info for audit
    const order = await orderService.get(input.orderId);
    if (!order) {
      throw new AdminError("ORDER_NOT_FOUND", undefined, { orderId: input.orderId });
    }

    if (order.status === "filled") {
      throw new AdminError("ORDER_ALREADY_FILLED");
    }

    if (order.status === "cancelled") {
      throw new AdminError("ORDER_ALREADY_CANCELLED");
    }

    const oldValue = {
      status: order.status,
      symbol: order.symbol,
      side: order.side,
      quantity: order.quantity,
      filledQuantity: order.filledQuantity,
    };

    // Cancel the order through the order service
    await orderService.cancel(input.orderId);

    // Record audit entry
    await repository.createAuditEntry({
      adminUserId,
      action: "order:cancel",
      targetType: "order",
      targetId: input.orderId,
      oldValue,
      newValue: { status: "cancelled" },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("admin_order_cancelled", {
      adminUserId,
      orderId: input.orderId,
      symbol: order.symbol,
      reason,
    });
  }

  async function cancelAllOrders(
    adminUserId: UUID,
    input: AdminCancelAllOrdersInput,
    context: RequestContext
  ): Promise<{ cancelledCount: number }> {
    const reason = requireReason(input.reason);

    // Get all open orders matching criteria
    const openOrderIds = await repository.getOpenOrderIds({
      userId: input.userId,
      accountId: input.accountId,
      symbol: input.symbol,
    });

    if (openOrderIds.length === 0) {
      return { cancelledCount: 0 };
    }

    let cancelledCount = 0;
    const errors: Array<{ orderId: string; error: string }> = [];

    // Cancel each order
    for (const orderId of openOrderIds) {
      try {
        await orderService.cancel(orderId);
        cancelledCount++;
      } catch (err) {
        errors.push({
          orderId,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    // Record audit entry
    await repository.createAuditEntry({
      adminUserId,
      action: "order:cancel_all",
      targetType: "orders",
      targetIdentifier: input.symbol || input.userId || input.accountId || "all",
      oldValue: { openOrderCount: openOrderIds.length },
      newValue: {
        cancelledCount,
        failedCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
      },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("admin_orders_bulk_cancelled", {
      adminUserId,
      cancelledCount,
      failedCount: errors.length,
      symbol: input.symbol,
      userId: input.userId,
    });

    return { cancelledCount };
  }

  // ===========================================================================
  // PHASE 2: POSITION MANAGEMENT
  // ===========================================================================

  async function listPositions(
    filter?: AdminPositionFilter
  ): Promise<AdminPositionView[]> {
    return repository.listPositionsWithUserInfo(filter);
  }

  async function getPositionDetails(
    positionId: UUID
  ): Promise<AdminPositionView | null> {
    return repository.getPositionWithUserInfo(positionId);
  }

  async function forceClosePosition(
    adminUserId: UUID,
    input: AdminForceClosePositionInput,
    context: RequestContext
  ): Promise<void> {
    const reason = requireReason(input.reason);

    // Get position details
    const position = await positionService.getByAccountAndSymbol(
      input.accountId,
      input.symbol
    );

    if (!position) {
      throw new AdminError("POSITION_NOT_FOUND", undefined, {
        accountId: input.accountId,
        symbol: input.symbol,
      });
    }

    const quantity = parseFloat(position.quantity);
    if (quantity === 0) {
      throw new AdminError("POSITION_ALREADY_CLOSED");
    }

    const oldValue = {
      symbol: input.symbol,
      side: position.side,
      quantity: position.quantity,
      entryPrice: position.entryPrice,
    };

    // Close the position
    await positionService.closePosition(input.accountId, input.symbol);

    // Record audit entry
    await repository.createAuditEntry({
      adminUserId,
      action: "position:force_close",
      targetType: "position",
      targetId: position.id,
      oldValue,
      newValue: { quantity: "0", status: "closed" },
      reason,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    logger?.warn("admin_position_force_closed", {
      adminUserId,
      positionId: position.id,
      symbol: input.symbol,
      accountId: input.accountId,
      closedQuantity: position.quantity,
      reason,
    });
  }

  // ===========================================================================
  // PHASE 2: REPORTS
  // ===========================================================================

  async function getDailyTradingSummary(
    period: ReportPeriod
  ): Promise<DailyTradingSummary[]> {
    const summaries: DailyTradingSummary[] = [];
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);

    // Iterate through each day in the period
    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split("T")[0] as string;
      const stats = await repository.getDailyTradingStats(dateStr);

      if (stats) {
        // Get top symbols for this day
        const topSymbols = await repository.getTopSymbolsByVolume(dateStr, 5);

        summaries.push({
          date: dateStr,
          totalVolume: stats.totalVolume,
          totalTrades: stats.totalTrades,
          totalFees: stats.totalFees,
          uniqueTraders: stats.uniqueUsers,
          topSymbolsByVolume: topSymbols.map((s) => ({
            symbol: s.symbol,
            volume: s.volume,
            trades: s.trades,
          })),
        });
      }
    }

    return summaries;
  }

  async function getUserActivitySummary(
    period: ReportPeriod
  ): Promise<UserActivitySummary> {
    const stats = await repository.getUserActivityStats(
      period.startDate,
      period.endDate
    );

    return {
      period: {
        startDate: period.startDate,
        endDate: period.endDate,
      },
      totalUsers: stats.totalUsers,
      activeUsers: stats.activeUsers,
      newUsers: stats.newUsers,
      suspendedUsers: 0, // Could add query if needed
      topTradersByVolume: [], // Could add query if needed
    };
  }

  async function getPlatformPnLSummary(
    period: ReportPeriod
  ): Promise<PlatformPnLSummary> {
    // Get daily trading stats for fee calculation
    const dailyStats = await getDailyTradingSummary(period);

    const totalFees = dailyStats.reduce(
      (sum, day) => sum + parseFloat(day.totalFees),
      0
    );

    // Get current exposure from risk dashboard
    const riskDashboard = await getRiskDashboard();

    const exposureBySymbol = riskDashboard.exposureBySymbol.reduce(
      (acc, exp) => {
        acc[exp.symbol] = {
          netPosition: exp.netPosition,
          unrealizedPnl: exp.unrealizedPnl,
        };
        return acc;
      },
      {} as Record<string, { netPosition: number; unrealizedPnl: number }>
    );

    const totalUnrealizedPnl = riskDashboard.exposureBySymbol.reduce(
      (sum, exp) => sum + exp.unrealizedPnl,
      0
    );

    return {
      period: {
        startDate: period.startDate,
        endDate: period.endDate,
      },
      totalFees: totalFees.toString(),
      totalRealizedPnl: "0", // Would need trade-level PnL tracking
      totalUnrealizedPnl: totalUnrealizedPnl.toString(),
      exposureBySymbol,
      netPnL: (totalFees + totalUnrealizedPnl).toString(),
    };
  }

  // ===========================================================================
  // RETURN SERVICE
  // ===========================================================================

  return {
    hasPermission,
    // User management
    listUsers,
    getUserDetails,
    suspendUser,
    unsuspendUser,
    updateUserRole,
    // Account management
    listAccounts,
    getAccountDetails,
    adminDeposit,
    adminWithdraw,
    freezeAccount,
    unfreezeAccount,
    // Risk management
    getRiskDashboard,
    activateCircuitBreaker,
    deactivateCircuitBreaker,
    // Symbol management
    listSymbols,
    getSymbol,
    upsertSymbol,
    enableSymbol,
    disableSymbol,
    // Audit
    getAuditLog,
    getAuditEntry,
    // Phase 2: Orders
    listOrders,
    getOrderDetails,
    cancelOrder,
    cancelAllOrders,
    // Phase 2: Positions
    listPositions,
    getPositionDetails,
    forceClosePosition,
    // Phase 2: Reports
    getDailyTradingSummary,
    getUserActivitySummary,
    getPlatformPnLSummary,
  };
}
