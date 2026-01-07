/**
 * Admin Repository - PostgreSQL Implementation
 *
 * This repository handles:
 * 1. Audit log persistence (immutable)
 * 2. Admin-specific queries (users with stats, accounts with user info)
 * 3. Symbol configuration management
 *
 * The audit log is append-only - no updates or deletes allowed.
 */

import { eq, and, desc, gte, lte, sql, like, or, count } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { adminAuditLog, symbols } from "@repo/database";
import type {
  AdminRepository,
  AdminAuditEntry,
  CreateAuditEntryInput,
  AuditLogFilter,
  AdminUserView,
  AdminAccountView,
  AdminOrderView,
  AdminPositionView,
  SymbolConfig,
  UserRole,
  UserActivitySummary,
} from "../core/admin.types.js";

// =============================================================================
// REPOSITORY FACTORY
// =============================================================================

/**
 * Creates an Admin Repository backed by PostgreSQL.
 */
export function createAdminRepositoryPg(
  db: NodePgDatabase<Record<string, unknown>>
): AdminRepository {
  // ===========================================================================
  // AUDIT LOG
  // ===========================================================================

  /**
   * Create a new audit entry.
   * This is the core audit function - every admin action goes through here.
   */
  async function createAuditEntry(
    input: CreateAuditEntryInput
  ): Promise<AdminAuditEntry> {
    // Get admin email for denormalization (makes audit log self-contained)
    const adminEmailResult = await db.execute(
      sql`SELECT email FROM users WHERE id = ${input.adminUserId}`
    );
    const adminEmail =
      (adminEmailResult.rows[0] as { email?: string })?.email || undefined;

    const result = await db
      .insert(adminAuditLog)
      .values({
        adminUserId: input.adminUserId,
        adminEmail,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        targetIdentifier: input.targetIdentifier,
        oldValue: input.oldValue as Record<string, unknown>,
        newValue: input.newValue as Record<string, unknown>,
        reason: input.reason,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
      })
      .returning();

    const entry = result[0];
    if (!entry) throw new Error("Failed to create audit entry");
    return mapAuditEntry(entry);
  }

  /**
   * Get a single audit entry by ID.
   */
  async function getAuditEntry(id: string): Promise<AdminAuditEntry | null> {
    const [entry] = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.id, id));

    return entry ? mapAuditEntry(entry) : null;
  }

  /**
   * List audit entries with filtering.
   */
  async function listAuditEntries(
    filter: AuditLogFilter
  ): Promise<AdminAuditEntry[]> {
    const conditions = [];

    if (filter.adminUserId) {
      conditions.push(eq(adminAuditLog.adminUserId, filter.adminUserId));
    }
    if (filter.action) {
      conditions.push(eq(adminAuditLog.action, filter.action));
    }
    if (filter.targetType) {
      conditions.push(eq(adminAuditLog.targetType, filter.targetType));
    }
    if (filter.targetId) {
      conditions.push(eq(adminAuditLog.targetId, filter.targetId));
    }
    if (filter.startDate) {
      conditions.push(gte(adminAuditLog.createdAt, filter.startDate));
    }
    if (filter.endDate) {
      conditions.push(lte(adminAuditLog.createdAt, filter.endDate));
    }

    const query = db
      .select()
      .from(adminAuditLog)
      .orderBy(desc(adminAuditLog.createdAt));

    if (conditions.length > 0) {
      query.where(and(...conditions));
    }

    if (filter.limit) {
      query.limit(filter.limit);
    }
    if (filter.offset) {
      query.offset(filter.offset);
    }

    const entries = await query;
    return entries.map(mapAuditEntry);
  }

  // ===========================================================================
  // USER QUERIES
  // ===========================================================================

  /**
   * List users with aggregated statistics.
   * This provides admins with a comprehensive view of each user.
   */
  async function listUsersWithStats(filter?: {
    role?: UserRole;
    status?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminUserView[]> {
    // Using raw SQL for complex aggregation
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.role) {
      whereClause += ` AND u.role = $${paramIndex++}`;
      params.push(filter.role);
    }
    if (filter?.status) {
      whereClause += ` AND u.status = $${paramIndex++}`;
      params.push(filter.status);
    }
    if (filter?.search) {
      whereClause += ` AND u.email ILIKE $${paramIndex++}`;
      params.push(`%${filter.search}%`);
    }

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const query = `
      SELECT
        u.id,
        u.email,
        u.role,
        COALESCE(u.status, 'active') as status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        COALESCE(acc.account_count, 0) as account_count,
        COALESCE(acc.total_balance, '0') as total_balance,
        COALESCE(ord.open_order_count, 0) as open_order_count,
        COALESCE(pos.open_position_count, 0) as open_position_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as account_count, SUM(balance) as total_balance
        FROM accounts
        GROUP BY user_id
      ) acc ON u.id = acc.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as open_order_count
        FROM orders
        WHERE status IN ('pending', 'open', 'partially_filled')
        GROUP BY user_id
      ) ord ON u.id = ord.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as open_position_count
        FROM positions
        WHERE status = 'open'
        GROUP BY user_id
      ) pos ON u.id = pos.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      email: row.email as string,
      role: row.role as UserRole,
      status: row.status as "active" | "pending" | "suspended" | "deleted",
      lastLoginAt: row.last_login_at
        ? new Date(row.last_login_at as string)
        : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      accountCount: Number(row.account_count),
      totalBalance: String(row.total_balance),
      openOrderCount: Number(row.open_order_count),
      openPositionCount: Number(row.open_position_count),
    }));
  }

  /**
   * Get a single user with stats.
   */
  async function getUserWithStats(
    userId: string
  ): Promise<AdminUserView | null> {
    const users = await listUsersWithStats({ limit: 1 });
    const query = `
      SELECT
        u.id,
        u.email,
        u.role,
        COALESCE(u.status, 'active') as status,
        u.last_login_at,
        u.created_at,
        u.updated_at,
        COALESCE(acc.account_count, 0) as account_count,
        COALESCE(acc.total_balance, '0') as total_balance,
        COALESCE(ord.open_order_count, 0) as open_order_count,
        COALESCE(pos.open_position_count, 0) as open_position_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, COUNT(*) as account_count, SUM(balance) as total_balance
        FROM accounts
        GROUP BY user_id
      ) acc ON u.id = acc.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as open_order_count
        FROM orders
        WHERE status IN ('pending', 'open', 'partially_filled')
        GROUP BY user_id
      ) ord ON u.id = ord.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(*) as open_position_count
        FROM positions
        WHERE status = 'open'
        GROUP BY user_id
      ) pos ON u.id = pos.user_id
      WHERE u.id = $1
    `;

    const result = await db.execute(sql.raw(query));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      email: row.email as string,
      role: row.role as UserRole,
      status: row.status as "active" | "pending" | "suspended" | "deleted",
      lastLoginAt: row.last_login_at
        ? new Date(row.last_login_at as string)
        : undefined,
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
      accountCount: Number(row.account_count),
      totalBalance: String(row.total_balance),
      openOrderCount: Number(row.open_order_count),
      openPositionCount: Number(row.open_position_count),
    };
  }

  // ===========================================================================
  // ACCOUNT QUERIES
  // ===========================================================================

  /**
   * List accounts with user information.
   */
  async function listAccountsWithUserInfo(filter?: {
    userId?: string;
    currency?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<AdminAccountView[]> {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.userId) {
      whereClause += ` AND a.user_id = $${paramIndex++}`;
      params.push(filter.userId);
    }
    if (filter?.currency) {
      whereClause += ` AND a.currency = $${paramIndex++}`;
      params.push(filter.currency);
    }
    if (filter?.status) {
      whereClause += ` AND COALESCE(a.status, 'active') = $${paramIndex++}`;
      params.push(filter.status);
    }

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const query = `
      SELECT
        a.id,
        a.user_id,
        u.email as user_email,
        a.currency,
        a.balance,
        COALESCE(a.locked, '0') as locked,
        (a.balance - COALESCE(a.locked, 0)) as available,
        COALESCE(a.account_type, 'spot') as account_type,
        COALESCE(a.status, 'active') as status,
        a.created_at,
        a.updated_at
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY a.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      currency: row.currency as string,
      balance: String(row.balance),
      locked: String(row.locked),
      available: String(row.available),
      accountType: row.account_type as "spot" | "margin" | "futures" | "demo",
      status: row.status as "active" | "locked" | "closed",
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }));
  }

  /**
   * Get a single account with user info.
   */
  async function getAccountWithUserInfo(
    accountId: string
  ): Promise<AdminAccountView | null> {
    const query = `
      SELECT
        a.id,
        a.user_id,
        u.email as user_email,
        a.currency,
        a.balance,
        COALESCE(a.locked, '0') as locked,
        (a.balance - COALESCE(a.locked, 0)) as available,
        COALESCE(a.account_type, 'spot') as account_type,
        COALESCE(a.status, 'active') as status,
        a.created_at,
        a.updated_at
      FROM accounts a
      JOIN users u ON a.user_id = u.id
      WHERE a.id = $1
    `;

    const result = await db.execute(sql.raw(query));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      currency: row.currency as string,
      balance: String(row.balance),
      locked: String(row.locked),
      available: String(row.available),
      accountType: row.account_type as "spot" | "margin" | "futures" | "demo",
      status: row.status as "active" | "locked" | "closed",
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  // ===========================================================================
  // SYMBOL MANAGEMENT
  // ===========================================================================

  /**
   * List all trading symbols.
   */
  async function listSymbols(): Promise<SymbolConfig[]> {
    const rows = await db.select().from(symbols).orderBy(symbols.symbol);
    return rows.map(mapSymbol);
  }

  /**
   * Get a single symbol.
   */
  async function getSymbol(symbolName: string): Promise<SymbolConfig | null> {
    const [row] = await db
      .select()
      .from(symbols)
      .where(eq(symbols.symbol, symbolName));
    return row ? mapSymbol(row) : null;
  }

  /**
   * Create or update a symbol.
   */
  async function upsertSymbol(
    config: Omit<SymbolConfig, "createdAt" | "updatedAt">
  ): Promise<SymbolConfig> {
    const result = await db
      .insert(symbols)
      .values({
        symbol: config.symbol,
        baseCurrency: config.baseCurrency,
        quoteCurrency: config.quoteCurrency,
        tradingEnabled: config.tradingEnabled,
        minOrderSize: String(config.minOrderSize),
        maxOrderSize: String(config.maxOrderSize),
        makerFee: String(config.makerFee),
        takerFee: String(config.takerFee),
        priceDecimals: config.priceDecimals,
        quantityDecimals: config.quantityDecimals,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: symbols.symbol,
        set: {
          baseCurrency: config.baseCurrency,
          quoteCurrency: config.quoteCurrency,
          tradingEnabled: config.tradingEnabled,
          minOrderSize: String(config.minOrderSize),
          maxOrderSize: String(config.maxOrderSize),
          makerFee: String(config.makerFee),
          takerFee: String(config.takerFee),
          priceDecimals: config.priceDecimals,
          quantityDecimals: config.quantityDecimals,
          updatedAt: new Date(),
        },
      })
      .returning();

    const row = result[0];
    if (!row) throw new Error("Failed to upsert symbol");
    return mapSymbol(row);
  }

  // ===========================================================================
  // STATS
  // ===========================================================================

  async function getOpenOrderCount(): Promise<number> {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM orders WHERE status IN ('pending', 'open', 'partially_filled')`
    );
    return Number((result.rows[0] as { count: string }).count);
  }

  async function getOpenPositionCount(): Promise<number> {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM positions WHERE status = 'open'`
    );
    return Number((result.rows[0] as { count: string }).count);
  }

  async function getActiveUserCount(): Promise<number> {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM users WHERE COALESCE(status, 'active') = 'active'`
    );
    return Number((result.rows[0] as { count: string }).count);
  }

  // ===========================================================================
  // ORDER QUERIES (Phase 2)
  // ===========================================================================

  /**
   * List orders with user information for admin view.
   */
  async function listOrdersWithUserInfo(filter?: {
    userId?: string;
    accountId?: string;
    symbol?: string;
    side?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<AdminOrderView[]> {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.userId) {
      whereClause += ` AND a.user_id = $${paramIndex++}`;
      params.push(filter.userId);
    }
    if (filter?.accountId) {
      whereClause += ` AND o.account_id = $${paramIndex++}`;
      params.push(filter.accountId);
    }
    if (filter?.symbol) {
      whereClause += ` AND o.symbol = $${paramIndex++}`;
      params.push(filter.symbol);
    }
    if (filter?.side) {
      whereClause += ` AND o.side = $${paramIndex++}`;
      params.push(filter.side);
    }
    if (filter?.status) {
      whereClause += ` AND o.status = $${paramIndex++}`;
      params.push(filter.status);
    }
    if (filter?.startDate) {
      whereClause += ` AND o.created_at >= $${paramIndex++}`;
      params.push(filter.startDate);
    }
    if (filter?.endDate) {
      whereClause += ` AND o.created_at <= $${paramIndex++}`;
      params.push(filter.endDate);
    }

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const query = `
      SELECT
        o.id,
        o.account_id,
        a.user_id,
        u.email as user_email,
        o.symbol,
        o.side,
        o.type,
        o.price,
        o.quantity,
        o.filled_quantity,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN accounts a ON o.account_id = a.id
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      accountId: row.account_id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      symbol: row.symbol as string,
      side: row.side as AdminOrderView["side"],
      type: row.type as AdminOrderView["type"],
      price: row.price as string | null,
      quantity: String(row.quantity),
      filledQuantity: String(row.filled_quantity),
      status: row.status as AdminOrderView["status"],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    }));
  }

  /**
   * Get a single order with user info.
   */
  async function getOrderWithUserInfo(orderId: string): Promise<AdminOrderView | null> {
    const query = `
      SELECT
        o.id,
        o.account_id,
        a.user_id,
        u.email as user_email,
        o.symbol,
        o.side,
        o.type,
        o.price,
        o.quantity,
        o.filled_quantity,
        o.status,
        o.created_at,
        o.updated_at
      FROM orders o
      JOIN accounts a ON o.account_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE o.id = $1
    `;

    const result = await db.execute(sql.raw(query));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      accountId: row.account_id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      symbol: row.symbol as string,
      side: row.side as AdminOrderView["side"],
      type: row.type as AdminOrderView["type"],
      price: row.price as string | null,
      quantity: String(row.quantity),
      filledQuantity: String(row.filled_quantity),
      status: row.status as AdminOrderView["status"],
      createdAt: new Date(row.created_at as string),
      updatedAt: new Date(row.updated_at as string),
    };
  }

  /**
   * Get IDs of all open orders (for bulk cancellation).
   */
  async function getOpenOrderIds(filter?: { userId?: string; symbol?: string }): Promise<string[]> {
    let whereClause = "WHERE o.status IN ('new', 'partially_filled')";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.userId) {
      whereClause += ` AND a.user_id = $${paramIndex++}`;
      params.push(filter.userId);
    }
    if (filter?.symbol) {
      whereClause += ` AND o.symbol = $${paramIndex++}`;
      params.push(filter.symbol);
    }

    const query = `
      SELECT o.id
      FROM orders o
      JOIN accounts a ON o.account_id = a.id
      ${whereClause}
    `;

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<{ id: string }>).map((row) => row.id);
  }

  // ===========================================================================
  // POSITION QUERIES (Phase 2)
  // ===========================================================================

  /**
   * List positions with user information for admin view.
   */
  async function listPositionsWithUserInfo(filter?: {
    userId?: string;
    accountId?: string;
    symbol?: string;
    minQuantity?: number;
    limit?: number;
    offset?: number;
  }): Promise<AdminPositionView[]> {
    let whereClause = "WHERE 1=1";
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filter?.userId) {
      whereClause += ` AND a.user_id = $${paramIndex++}`;
      params.push(filter.userId);
    }
    if (filter?.accountId) {
      whereClause += ` AND p.account_id = $${paramIndex++}`;
      params.push(filter.accountId);
    }
    if (filter?.symbol) {
      whereClause += ` AND p.symbol = $${paramIndex++}`;
      params.push(filter.symbol);
    }
    if (filter?.minQuantity !== undefined) {
      whereClause += ` AND ABS(p.quantity) >= $${paramIndex++}`;
      params.push(filter.minQuantity);
    }

    // Only show positions with non-zero quantity
    whereClause += ` AND p.quantity != 0`;

    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;

    const query = `
      SELECT
        p.id,
        p.account_id,
        a.user_id,
        u.email as user_email,
        p.symbol,
        p.side,
        p.quantity,
        p.entry_price,
        p.unrealized_pnl,
        p.realized_pnl,
        p.updated_at
      FROM positions p
      JOIN accounts a ON p.account_id = a.id
      JOIN users u ON a.user_id = u.id
      ${whereClause}
      ORDER BY ABS(p.quantity * COALESCE(p.entry_price, 0)) DESC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex}
    `;

    params.push(limit, offset);

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      id: row.id as string,
      accountId: row.account_id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      symbol: row.symbol as string,
      side: row.side as string,
      quantity: String(row.quantity),
      entryPrice: row.entry_price ? String(row.entry_price) : null,
      unrealizedPnl: row.unrealized_pnl ? String(row.unrealized_pnl) : null,
      realizedPnl: row.realized_pnl ? String(row.realized_pnl) : null,
      updatedAt: new Date(row.updated_at as string),
    }));
  }

  /**
   * Get a single position with user info.
   */
  async function getPositionWithUserInfo(positionId: string): Promise<AdminPositionView | null> {
    const query = `
      SELECT
        p.id,
        p.account_id,
        a.user_id,
        u.email as user_email,
        p.symbol,
        p.side,
        p.quantity,
        p.entry_price,
        p.unrealized_pnl,
        p.realized_pnl,
        p.updated_at
      FROM positions p
      JOIN accounts a ON p.account_id = a.id
      JOIN users u ON a.user_id = u.id
      WHERE p.id = $1
    `;

    const result = await db.execute(sql.raw(query));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      id: row.id as string,
      accountId: row.account_id as string,
      userId: row.user_id as string,
      userEmail: row.user_email as string,
      symbol: row.symbol as string,
      side: row.side as string,
      quantity: String(row.quantity),
      entryPrice: row.entry_price ? String(row.entry_price) : null,
      unrealizedPnl: row.unrealized_pnl ? String(row.unrealized_pnl) : null,
      realizedPnl: row.realized_pnl ? String(row.realized_pnl) : null,
      updatedAt: new Date(row.updated_at as string),
    };
  }

  // ===========================================================================
  // REPORT QUERIES (Phase 2)
  // ===========================================================================

  /**
   * Get daily trading statistics.
   */
  async function getDailyTradingStats(date: string): Promise<{
    totalVolume: string;
    totalTrades: number;
    totalFees: string;
    uniqueUsers: number;
  } | null> {
    const query = `
      SELECT
        COALESCE(SUM(t.price * t.quantity), 0) as total_volume,
        COUNT(t.id) as total_trades,
        COALESCE(SUM(t.fee), 0) as total_fees,
        COUNT(DISTINCT a.user_id) as unique_users
      FROM trades t
      JOIN orders o ON t.order_id = o.id
      JOIN accounts a ON o.account_id = a.id
      WHERE DATE(t.created_at) = $1
    `;

    const result = await db.execute(sql.raw(query));

    if (result.rows.length === 0) return null;

    const row = result.rows[0] as Record<string, unknown>;
    return {
      totalVolume: String(row.total_volume || "0"),
      totalTrades: Number(row.total_trades || 0),
      totalFees: String(row.total_fees || "0"),
      uniqueUsers: Number(row.unique_users || 0),
    };
  }

  /**
   * Get top symbols by volume for a given date.
   */
  async function getTopSymbolsByVolume(date: string, limit: number): Promise<Array<{
    symbol: string;
    volume: string;
    trades: number;
  }>> {
    const query = `
      SELECT
        o.symbol,
        COALESCE(SUM(t.price * t.quantity), 0) as volume,
        COUNT(t.id) as trades
      FROM trades t
      JOIN orders o ON t.order_id = o.id
      WHERE DATE(t.created_at) = $1
      GROUP BY o.symbol
      ORDER BY volume DESC
      LIMIT $2
    `;

    const result = await db.execute(sql.raw(query));

    return (result.rows as Array<Record<string, unknown>>).map((row) => ({
      symbol: row.symbol as string,
      volume: String(row.volume || "0"),
      trades: Number(row.trades || 0),
    }));
  }

  /**
   * Get user activity summary for a period.
   */
  async function getUserActivityStats(startDate: string, endDate: string): Promise<{
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
  }> {
    const query = `
      SELECT
        COUNT(*) as total_users,
        COUNT(CASE WHEN last_login_at >= $1 AND last_login_at <= $2 THEN 1 END) as active_users,
        COUNT(CASE WHEN created_at >= $1 AND created_at <= $2 THEN 1 END) as new_users
      FROM users
      WHERE COALESCE(status, 'active') != 'deleted'
    `;

    const result = await db.execute(sql.raw(query));

    const row = result.rows[0] as Record<string, unknown>;
    return {
      totalUsers: Number(row.total_users || 0),
      activeUsers: Number(row.active_users || 0),
      newUsers: Number(row.new_users || 0),
    };
  }

  // ===========================================================================
  // MAPPERS
  // ===========================================================================

  function mapAuditEntry(row: typeof adminAuditLog.$inferSelect): AdminAuditEntry {
    return {
      id: row.id,
      adminUserId: row.adminUserId,
      adminEmail: row.adminEmail || undefined,
      action: row.action as AdminAuditEntry["action"],
      targetType: row.targetType as AdminAuditEntry["targetType"],
      targetId: row.targetId || undefined,
      targetIdentifier: row.targetIdentifier || undefined,
      oldValue: row.oldValue as Record<string, unknown> | undefined,
      newValue: row.newValue as Record<string, unknown> | undefined,
      reason: row.reason,
      ipAddress: row.ipAddress || undefined,
      userAgent: row.userAgent || undefined,
      createdAt: row.createdAt,
    };
  }

  function mapSymbol(row: typeof symbols.$inferSelect): SymbolConfig {
    return {
      symbol: row.symbol,
      baseCurrency: row.baseCurrency,
      quoteCurrency: row.quoteCurrency,
      tradingEnabled: row.tradingEnabled,
      minOrderSize: Number(row.minOrderSize),
      maxOrderSize: Number(row.maxOrderSize),
      makerFee: Number(row.makerFee),
      takerFee: Number(row.takerFee),
      priceDecimals: row.priceDecimals,
      quantityDecimals: row.quantityDecimals,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  // ===========================================================================
  // RETURN REPOSITORY
  // ===========================================================================

  return {
    createAuditEntry,
    getAuditEntry,
    listAuditEntries,
    listUsersWithStats,
    getUserWithStats,
    listAccountsWithUserInfo,
    getAccountWithUserInfo,
    listSymbols,
    getSymbol,
    upsertSymbol,
    // Phase 2 - Orders
    listOrdersWithUserInfo,
    getOrderWithUserInfo,
    getOpenOrderIds,
    // Phase 2 - Positions
    listPositionsWithUserInfo,
    getPositionWithUserInfo,
    // Phase 2 - Reports
    getDailyTradingStats,
    getTopSymbolsByVolume,
    getUserActivityStats,
    // Stats
    getOpenOrderCount,
    getOpenPositionCount,
    getActiveUserCount,
  };
}
