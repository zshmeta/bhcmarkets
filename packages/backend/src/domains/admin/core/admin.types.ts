/**
 * Admin Domain - Type Definitions
 *
 * The Admin domain is critical for platform operations and compliance.
 * Every admin action must be:
 * 1. Authenticated (who is doing this?)
 * 2. Authorized (are they allowed to do this?)
 * 3. Audited (recorded with full context)
 * 4. Justified (why are they doing this?)
 *
 * The audit trail is immutable and must capture before/after state.
 */

export type UUID = string;

// =============================================================================
// ROLES & PERMISSIONS
// =============================================================================

/**
 * User roles in the system.
 * Maps to the database enum 'user_role'.
 */
export type UserRole = "user" | "admin" | "support";

/**
 * Admin actions that can be performed.
 * Format: "resource:action"
 */
export type AdminAction =
  // User management
  | "user:list"
  | "user:read"
  | "user:suspend"
  | "user:unsuspend"
  | "user:update_role"
  | "user:reset_password"
  // Account management
  | "account:list"
  | "account:read"
  | "account:deposit"
  | "account:withdraw"
  | "account:freeze"
  | "account:unfreeze"
  | "account:adjust"
  // Order management
  | "order:list"
  | "order:read"
  | "order:cancel"
  | "order:cancel_all"
  // Position management
  | "position:list"
  | "position:read"
  | "position:force_close"
  // Risk management
  | "risk:read"
  | "risk:update_symbol_limits"
  | "risk:update_user_limits"
  | "risk:circuit_breaker_activate"
  | "risk:circuit_breaker_deactivate"
  | "risk:kill_switch"
  // Symbol management
  | "symbol:list"
  | "symbol:read"
  | "symbol:create"
  | "symbol:update"
  | "symbol:enable"
  | "symbol:disable"
  // Audit & Reports
  | "audit:read"
  | "report:generate"
  | "report:export"
  // System
  | "system:health"
  | "system:stats";

/**
 * Permission sets for each role.
 * Admin has all permissions, support has limited read/action.
 */
export const ROLE_PERMISSIONS: Record<UserRole, AdminAction[]> = {
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
    // All permissions
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
// AUDIT LOG
// =============================================================================

/**
 * Target types for audit entries.
 */
export type AuditTargetType =
  | "user"
  | "account"
  | "order"
  | "orders"
  | "position"
  | "symbol"
  | "risk_config"
  | "circuit_breaker"
  | "system";

/**
 * An entry in the admin audit log.
 * This is an immutable record of every admin action.
 */
export interface AdminAuditEntry {
  id: UUID;
  adminUserId: UUID;
  adminEmail?: string; // Denormalized for easy reading
  action: AdminAction;
  targetType: AuditTargetType;
  targetId?: UUID;
  targetIdentifier?: string; // Human-readable (e.g., user email, symbol name)
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason: string; // Admin must provide justification
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

/**
 * Input for creating an audit entry.
 */
export interface CreateAuditEntryInput {
  adminUserId: UUID;
  action: AdminAction;
  targetType: AuditTargetType;
  targetId?: UUID;
  targetIdentifier?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Filters for querying audit log.
 */
export interface AuditLogFilter {
  adminUserId?: UUID;
  action?: AdminAction;
  targetType?: AuditTargetType;
  targetId?: UUID;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

// =============================================================================
// USER MANAGEMENT
// =============================================================================

/**
 * User details visible to admins.
 */
export interface AdminUserView {
  id: UUID;
  email: string;
  role: UserRole;
  status: "active" | "pending" | "suspended" | "deleted";
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Aggregated data
  accountCount: number;
  totalBalance: string;
  openOrderCount: number;
  openPositionCount: number;
}

/**
 * Input for suspending a user.
 */
export interface SuspendUserInput {
  userId: UUID;
  reason: string;
}

/**
 * Input for updating user role.
 */
export interface UpdateUserRoleInput {
  userId: UUID;
  newRole: UserRole;
  reason: string;
}

// =============================================================================
// ACCOUNT OPERATIONS
// =============================================================================

/**
 * Account details visible to admins.
 */
export interface AdminAccountView {
  id: UUID;
  userId: UUID;
  userEmail: string;
  currency: string;
  balance: string;
  locked: string;
  available: string;
  accountType: "spot" | "margin" | "futures" | "demo";
  status: "active" | "locked" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for admin balance operation (deposit/withdraw/adjust).
 */
export interface AdminBalanceOperationInput {
  accountId: UUID;
  amount: string; // Positive for deposit, negative for withdrawal
  operationType: "deposit" | "withdraw" | "adjust";
  reason: string;
}

// =============================================================================
// RISK DASHBOARD
// =============================================================================

/**
 * House exposure summary for risk dashboard.
 */
export interface HouseExposureSummary {
  symbol: string;
  netPosition: number; // House's net position
  absolutePosition: number;
  markPrice: number;
  notionalValue: number;
  unrealizedPnl: number;
  percentOfLimit: number;
  status: "normal" | "warning" | "critical";
}

/**
 * Platform-wide risk metrics.
 */
export interface PlatformRiskMetrics {
  totalHouseExposure: number;
  exposureBySymbol: HouseExposureSummary[];
  circuitBreakerActive: boolean;
  circuitBreakerReason?: string;
  activeUserCount: number;
  openOrderCount: number;
  openPositionCount: number;
  tradingEnabled: boolean;
}

// =============================================================================
// ORDER MANAGEMENT (Phase 2)
// =============================================================================

/**
 * Order status types.
 */
export type OrderStatus = "new" | "partially_filled" | "filled" | "cancelled" | "rejected";
export type OrderSide = "buy" | "sell";
export type OrderType = "market" | "limit" | "stop" | "take_profit";

/**
 * Order details visible to admins.
 * Includes user information for context.
 */
export interface AdminOrderView {
  id: UUID;
  accountId: UUID;
  userId: UUID;
  userEmail: string;
  symbol: string;
  side: OrderSide;
  type: OrderType;
  price: string | null;
  quantity: string;
  filledQuantity: string;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Filters for listing orders.
 */
export interface AdminOrderFilter {
  userId?: UUID;
  accountId?: UUID;
  symbol?: string;
  side?: OrderSide;
  status?: OrderStatus;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Input for admin order cancellation.
 */
export interface AdminCancelOrderInput {
  orderId: UUID;
  reason: string;
}

/**
 * Input for cancelling all orders (kill switch).
 */
export interface AdminCancelAllOrdersInput {
  userId?: UUID;  // Optional: cancel for specific user only
  accountId?: UUID;  // Optional: cancel for specific account only
  symbol?: string;  // Optional: cancel for specific symbol only
  reason: string;
}

// =============================================================================
// POSITION MANAGEMENT (Phase 2)
// =============================================================================

/**
 * Position details visible to admins.
 */
export interface AdminPositionView {
  id: UUID;
  accountId: UUID;
  userId: UUID;
  userEmail: string;
  symbol: string;
  side: string;
  quantity: string;
  entryPrice: string | null;
  currentPrice?: string;
  unrealizedPnl: string | null;
  realizedPnl: string | null;
  notionalValue?: string;
  updatedAt: Date;
}

/**
 * Filters for listing positions.
 */
export interface AdminPositionFilter {
  userId?: UUID;
  accountId?: UUID;
  symbol?: string;
  minQuantity?: number;
  limit?: number;
  offset?: number;
}

/**
 * Input for force-closing a position.
 * Used in emergencies or for compliance reasons.
 */
export interface AdminForceClosePositionInput {
  accountId: UUID;
  symbol: string;
  reason: string;
}

// =============================================================================
// REPORTS (Phase 2)
// =============================================================================

/**
 * Time period for reports.
 */
export interface ReportPeriod {
  startDate: string; // ISO date string YYYY-MM-DD
  endDate: string;   // ISO date string YYYY-MM-DD
}

/**
 * Daily trading summary report.
 */
export interface DailyTradingSummary {
  date: string;
  totalVolume: string;
  totalTrades: number;
  totalFees: string;
  uniqueTraders: number;
  topSymbolsByVolume: Array<{
    symbol: string;
    volume: string;
    trades: number;
  }>;
}

/**
 * User activity summary.
 */
export interface UserActivitySummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  suspendedUsers: number;
  topTradersByVolume: Array<{
    userId: UUID;
    email: string;
    volume: string;
  }>;
}

/**
 * Platform P&L summary.
 */
export interface PlatformPnLSummary {
  period: {
    startDate: string;
    endDate: string;
  };
  totalFees: string;
  totalRealizedPnl: string;
  totalUnrealizedPnl: string;
  exposureBySymbol: Record<string, {
    netPosition: number;
    unrealizedPnl: number;
  }>;
  netPnL: string;
}

// =============================================================================
// SYMBOL MANAGEMENT
// =============================================================================

/**
 * Symbol/trading pair configuration.
 */
export interface SymbolConfig {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  tradingEnabled: boolean;
  minOrderSize: number;
  maxOrderSize: number;
  makerFee: number; // e.g., 0.001 = 0.1%
  takerFee: number;
  priceDecimals: number;
  quantityDecimals: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Input for creating/updating a symbol.
 */
export interface UpsertSymbolInput {
  symbol: string;
  baseCurrency: string;
  quoteCurrency: string;
  tradingEnabled?: boolean;
  minOrderSize?: number;
  maxOrderSize?: number;
  makerFee?: number;
  takerFee?: number;
  priceDecimals?: number;
  quantityDecimals?: number;
  reason: string;
}

// =============================================================================
// SERVICE INTERFACE
// =============================================================================

/**
 * Admin Service Interface.
 *
 * All methods that modify state require a reason for the audit log.
 */
export interface AdminService {
  // --- Permission Check ---
  hasPermission(role: UserRole, action: AdminAction): boolean;

  // --- User Management ---
  listUsers(filter?: {
    role?: UserRole;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminUserView[]>;

  getUserDetails(userId: UUID): Promise<AdminUserView | null>;

  suspendUser(
    adminUserId: UUID,
    input: SuspendUserInput,
    context: RequestContext
  ): Promise<void>;

  unsuspendUser(
    adminUserId: UUID,
    userId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void>;

  updateUserRole(
    adminUserId: UUID,
    input: UpdateUserRoleInput,
    context: RequestContext
  ): Promise<void>;

  // --- Account Operations ---
  listAccounts(filter?: {
    userId?: UUID;
    currency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAccountView[]>;

  getAccountDetails(accountId: UUID): Promise<AdminAccountView | null>;

  adminDeposit(
    adminUserId: UUID,
    input: AdminBalanceOperationInput,
    context: RequestContext
  ): Promise<void>;

  adminWithdraw(
    adminUserId: UUID,
    input: AdminBalanceOperationInput,
    context: RequestContext
  ): Promise<void>;

  freezeAccount(
    adminUserId: UUID,
    accountId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void>;

  unfreezeAccount(
    adminUserId: UUID,
    accountId: UUID,
    reason: string,
    context: RequestContext
  ): Promise<void>;

  // --- Risk Dashboard ---
  getRiskDashboard(): Promise<PlatformRiskMetrics>;

  activateCircuitBreaker(
    adminUserId: UUID,
    reason: string,
    symbol?: string,
    context?: RequestContext
  ): Promise<void>;

  deactivateCircuitBreaker(
    adminUserId: UUID,
    reason: string,
    symbol?: string,
    context?: RequestContext
  ): Promise<void>;

  // --- Symbol Management ---
  listSymbols(): Promise<SymbolConfig[]>;

  getSymbol(symbol: string): Promise<SymbolConfig | null>;

  upsertSymbol(
    adminUserId: UUID,
    input: UpsertSymbolInput,
    context: RequestContext
  ): Promise<SymbolConfig>;

  enableSymbol(
    adminUserId: UUID,
    symbol: string,
    reason: string,
    context: RequestContext
  ): Promise<void>;

  disableSymbol(
    adminUserId: UUID,
    symbol: string,
    reason: string,
    context: RequestContext
  ): Promise<void>;

  // --- Order Management (Phase 2) ---
  listOrders(filter?: AdminOrderFilter): Promise<AdminOrderView[]>;

  getOrderDetails(orderId: UUID): Promise<AdminOrderView | null>;

  cancelOrder(
    adminUserId: UUID,
    input: AdminCancelOrderInput,
    context: RequestContext
  ): Promise<void>;

  cancelAllOrders(
    adminUserId: UUID,
    input: AdminCancelAllOrdersInput,
    context: RequestContext
  ): Promise<{ cancelledCount: number }>;

  // --- Position Management (Phase 2) ---
  listPositions(filter?: AdminPositionFilter): Promise<AdminPositionView[]>;

  getPositionDetails(positionId: UUID): Promise<AdminPositionView | null>;

  forceClosePosition(
    adminUserId: UUID,
    input: AdminForceClosePositionInput,
    context: RequestContext
  ): Promise<void>;

  // --- Reports (Phase 2) ---
  getDailyTradingSummary(period: ReportPeriod): Promise<DailyTradingSummary[]>;

  getUserActivitySummary(period: ReportPeriod): Promise<UserActivitySummary>;

  getPlatformPnLSummary(period: ReportPeriod): Promise<PlatformPnLSummary>;

  // --- Audit Log ---
  getAuditLog(filter: AuditLogFilter): Promise<AdminAuditEntry[]>;

  getAuditEntry(id: UUID): Promise<AdminAuditEntry | null>;
}

/**
 * Request context for audit logging.
 */
export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

// =============================================================================
// REPOSITORY INTERFACE
// =============================================================================

/**
 * Repository for admin data operations.
 */
export interface AdminRepository {
  // Audit log
  createAuditEntry(entry: CreateAuditEntryInput): Promise<AdminAuditEntry>;
  getAuditEntry(id: UUID): Promise<AdminAuditEntry | null>;
  listAuditEntries(filter: AuditLogFilter): Promise<AdminAuditEntry[]>;

  // User queries (admin-specific views)
  listUsersWithStats(filter?: {
    role?: UserRole;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminUserView[]>;

  getUserWithStats(userId: UUID): Promise<AdminUserView | null>;

  // Account queries
  listAccountsWithUserInfo(filter?: {
    userId?: UUID;
    currency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAccountView[]>;

  getAccountWithUserInfo(accountId: UUID): Promise<AdminAccountView | null>;

  // Symbol management
  listSymbols(): Promise<SymbolConfig[]>;
  getSymbol(symbol: string): Promise<SymbolConfig | null>;
  upsertSymbol(config: Omit<SymbolConfig, "createdAt" | "updatedAt">): Promise<SymbolConfig>;

  // Order queries (Phase 2)
  listOrdersWithUserInfo(filter?: AdminOrderFilter): Promise<AdminOrderView[]>;
  getOrderWithUserInfo(orderId: UUID): Promise<AdminOrderView | null>;
  getOpenOrderIds(filter?: { userId?: UUID; accountId?: UUID; symbol?: string }): Promise<UUID[]>;

  // Position queries (Phase 2)
  listPositionsWithUserInfo(filter?: AdminPositionFilter): Promise<AdminPositionView[]>;
  getPositionWithUserInfo(positionId: UUID): Promise<AdminPositionView | null>;

  // Report queries (Phase 2)
  getDailyTradingStats(date: string): Promise<{
    totalVolume: string;
    totalTrades: number;
    totalFees: string;
    uniqueUsers: number;
  } | null>;
  getTopSymbolsByVolume(date: string, limit: number): Promise<Array<{
    symbol: string;
    volume: string;
    trades: number;
  }>>;
  getUserActivityStats(startDate: string, endDate: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  }>;

  // Stats
  getOpenOrderCount(): Promise<number>;
  getOpenPositionCount(): Promise<number>;
  getActiveUserCount(): Promise<number>;
}
