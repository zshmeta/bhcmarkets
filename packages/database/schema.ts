import { pgTable, uuid, varchar, numeric, timestamp, text, integer, boolean, jsonb, pgEnum, index, uniqueIndex, bigserial, date } from 'drizzle-orm/pg-core';

// Enums
export const userStatusEnum = pgEnum('user_status', ['active', 'pending', 'suspended', 'deleted']);
export const userRoleEnum = pgEnum('user_role', ['user', 'admin', 'support']);
export const sessionStatusEnum = pgEnum('session_status', ['active', 'revoked', 'expired', 'replaced']);
export const sessionInvalidationReasonEnum = pgEnum('session_invalidation_reason', [
    'manual',
    'password_rotated',
    'refresh_rotated',
    'session_limit',
    'suspicious_activity',
    'user_disabled',
    'logout_all',
    'expired'
]);
export const accountTypeEnum = pgEnum('account_type', ['spot', 'margin', 'futures', 'demo']);
export const accountStatusEnum = pgEnum('account_status', ['active', 'locked', 'closed']);
export const orderSideEnum = pgEnum('order_side', ['buy', 'sell']);
export const orderTypeEnum = pgEnum('order_type', ['market', 'limit', 'stop', 'take_profit']);
export const orderStatusEnum = pgEnum('order_status', ['new', 'partially_filled', 'filled', 'cancelled', 'rejected']);

// Users
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    status: userStatusEnum('status').default('pending').notNull(),
    role: userRoleEnum('role').default('user').notNull(),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// User Credentials (password storage and lockout tracking)
export const userCredentials = pgTable('user_credentials', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    passwordHash: text('password_hash').notNull(),
    version: integer('version').notNull().default(1),
    failedAttemptCount: integer('failed_attempt_count').notNull().default(0),
    lockedUntil: timestamp('locked_until', { withTimezone: true }),
    passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Auth Sessions (refresh token and session state management)
export const authSessions = pgTable('auth_sessions', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    refreshTokenHash: text('refresh_token_hash').notNull(),
    refreshTokenVersion: integer('refresh_token_version').notNull().default(1),
    passwordVersion: integer('password_version').notNull().default(1),
    status: sessionStatusEnum('status').notNull().default('active'),
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }), // INET in Postgres, varchar for IP storage
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp('last_seen_at', { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    revokedReason: sessionInvalidationReasonEnum('revoked_reason'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index('idx_auth_sessions_user').on(table.userId),
        statusExpiresIdx: index('idx_auth_sessions_status_expires').on(table.status, table.expiresAt),
        refreshTokenHashIdx: uniqueIndex('uq_auth_sessions_refresh_token_hash').on(table.refreshTokenHash),
    };
});

// Accounts
export const accounts = pgTable('accounts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),
    balance: numeric('balance', { precision: 30, scale: 10 }).default('0').notNull(),
    locked: numeric('locked', { precision: 30, scale: 10 }).default('0').notNull(),
    accountType: accountTypeEnum('account_type').default('spot').notNull(),
    status: accountStatusEnum('status').default('active').notNull(),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        userIdIdx: index('idx_accounts_user').on(table.userId),
    };
});

// Orders
export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
    symbol: varchar('symbol', { length: 64 }).notNull(),
    side: orderSideEnum('side').notNull(),
    type: orderTypeEnum('type').notNull(),
    price: numeric('price', { precision: 30, scale: 10 }),
    quantity: numeric('quantity', { precision: 30, scale: 10 }).notNull(),
    filledQuantity: numeric('filled_quantity', { precision: 30, scale: 10 }).default('0').notNull(),
    status: orderStatusEnum('status').default('new').notNull(),
    timeInForce: varchar('time_in_force', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        accountIdIdx: index('idx_orders_account').on(table.accountId),
        symbolIdx: index('idx_orders_symbol').on(table.symbol),
        statusIdx: index('idx_orders_status').on(table.status),
    };
});

// Positions
export const positions = pgTable('positions', {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id').references(() => accounts.id, { onDelete: 'cascade' }).notNull(),
    symbol: varchar('symbol', { length: 64 }).notNull(),
    side: varchar('side', { length: 10 }).notNull(), // 'long' or 'short' usually, but schema said varchar
    quantity: numeric('quantity', { precision: 30, scale: 10 }).default('0').notNull(),
    entryPrice: numeric('entry_price', { precision: 30, scale: 10 }),
    unrealizedPnl: numeric('unrealized_pnl', { precision: 30, scale: 10 }).default('0'),
    realizedPnl: numeric('realized_pnl', { precision: 30, scale: 10 }).default('0'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        accountSymbolIdx: uniqueIndex('uq_positions_account_symbol').on(table.accountId, table.symbol),
    };
});

// Trades
export const trades = pgTable('trades', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
    price: numeric('price', { precision: 30, scale: 10 }).notNull(),
    quantity: numeric('quantity', { precision: 30, scale: 10 }).notNull(),
    fee: numeric('fee', { precision: 30, scale: 10 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        orderIdIdx: index('idx_trades_order').on(table.orderId),
    };
});

// Market Prices (for completeness with existing migration)
export const marketPrices = pgTable('market_prices', {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    symbol: varchar('symbol', { length: 32 }).notNull(),
    price: numeric('price', { precision: 30, scale: 10 }).notNull(),
    currency: varchar('currency', { length: 10 }),
    source: varchar('source', { length: 32 }),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
    metadata: jsonb('metadata'),
}, (table) => {
    return {
        symbolTimeIdx: index('idx_market_prices_symbol_time').on(table.symbol, table.timestamp),
    };
});

// =============================================================================
// LEDGER TABLES
// =============================================================================

// Transaction types for ledger entries
export const ledgerTransactionTypeEnum = pgEnum('ledger_transaction_type', [
    'deposit',
    'withdrawal',
    'trade_buy',
    'trade_sell',
    'fee',
    'fee_rebate',
    'transfer_in',
    'transfer_out',
    'adjustment',
    'hold',
    'release',
    'margin_call',
    'funding',
    'bonus',
    'referral',
]);

// Transaction status
export const ledgerTransactionStatusEnum = pgEnum('ledger_transaction_status', [
    'pending',
    'completed',
    'failed',
    'cancelled',
    'reversed',
]);

/**
 * Ledger Balances - Real-time balance tracking
 *
 * This is the authoritative source of account balances.
 * Uses available/held model for pending order management.
 */
export const ledgerBalances = pgTable('ledger_balances', {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id').notNull(),
    asset: varchar('asset', { length: 20 }).notNull(),
    available: numeric('available', { precision: 30, scale: 10 }).default('0').notNull(),
    held: numeric('held', { precision: 30, scale: 10 }).default('0').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        accountAssetIdx: uniqueIndex('uq_ledger_balances_account_asset').on(table.accountId, table.asset),
        accountIdx: index('idx_ledger_balances_account').on(table.accountId),
    };
});

/**
 * Ledger Holds - Funds reserved for pending orders
 *
 * When a limit order is placed, funds are moved from 'available' to 'held'.
 * This table tracks which order each hold belongs to.
 */
export const ledgerHolds = pgTable('ledger_holds', {
    orderId: uuid('order_id').primaryKey(),
    accountId: uuid('account_id').notNull(),
    asset: varchar('asset', { length: 20 }).notNull(),
    amount: numeric('amount', { precision: 30, scale: 10 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        accountIdx: index('idx_ledger_holds_account').on(table.accountId),
        assetIdx: index('idx_ledger_holds_asset').on(table.asset),
    };
});

/**
 * Ledger Entries - Immutable transaction history
 *
 * This is the audit trail. Entries are NEVER modified or deleted.
 * Each entry represents a single balance change with full context.
 */
export const ledgerEntries = pgTable('ledger_entries', {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: uuid('account_id').notNull(),
    asset: varchar('asset', { length: 20 }).notNull(),
    type: ledgerTransactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 30, scale: 10 }).notNull(),
    balanceAfter: numeric('balance_after', { precision: 30, scale: 10 }),
    referenceId: varchar('reference_id', { length: 64 }),
    referenceType: varchar('reference_type', { length: 32 }),
    description: text('description'),
    status: ledgerTransactionStatusEnum('status').default('completed').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        accountIdx: index('idx_ledger_entries_account').on(table.accountId),
        accountAssetIdx: index('idx_ledger_entries_account_asset').on(table.accountId, table.asset),
        refIdx: index('idx_ledger_entries_ref').on(table.referenceId),
        typeIdx: index('idx_ledger_entries_type').on(table.type),
        createdAtIdx: index('idx_ledger_entries_created').on(table.createdAt),
    };
});

// =============================================================================
// RISK MANAGEMENT TABLES
// =============================================================================

// Circuit breaker trigger types
export const circuitBreakerTriggerEnum = pgEnum('circuit_breaker_trigger', [
    'manual',           // Admin manually triggered
    'house_exposure',   // House exposure limit breached
    'price_volatility', // Price moved too fast
    'system_error',     // Technical issue detected
    'external_event',   // News or external market event
]);

/**
 * Symbol Risk Limits - Controls per-symbol trading limits
 *
 * These limits protect both users and the house from excessive risk on any single symbol.
 * Can be adjusted by admins based on liquidity, volatility, and business needs.
 */
export const symbolRiskLimits = pgTable('symbol_risk_limits', {
    symbol: varchar('symbol', { length: 32 }).primaryKey(),
    tradingEnabled: boolean('trading_enabled').default(true).notNull(),
    minOrderSize: numeric('min_order_size', { precision: 28, scale: 8 }).default('0.0001').notNull(),
    maxOrderSize: numeric('max_order_size', { precision: 28, scale: 8 }).default('1000').notNull(),
    lotSize: numeric('lot_size', { precision: 28, scale: 8 }).default('0.0001').notNull(),
    maxPriceDeviation: numeric('max_price_deviation', { precision: 8, scale: 4 }).default('0.05').notNull(),
    maxUserPosition: numeric('max_user_position', { precision: 28, scale: 8 }).default('100').notNull(),
    maxHouseExposure: numeric('max_house_exposure', { precision: 28, scale: 8 }).default('10000').notNull(),
    maxHouseNotionalExposure: numeric('max_house_notional_exposure', { precision: 28, scale: 2 }).default('1000000').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * User Risk Limits - Per-user trading restrictions
 *
 * Allows fine-grained control over individual users based on:
 * - VIP status (higher limits)
 * - Risk profile (historical behavior)
 * - Compliance requirements (restrictions)
 */
export const userRiskLimits = pgTable('user_risk_limits', {
    userId: uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
    tradingRestricted: boolean('trading_restricted').default(false).notNull(),
    restrictionReason: text('restriction_reason'),
    maxOrdersPerMinute: integer('max_orders_per_minute').default(30).notNull(),
    dailyLossLimit: numeric('daily_loss_limit', { precision: 28, scale: 2 }).default('10000').notNull(),
    maxSymbolPositionValue: numeric('max_symbol_position_value', { precision: 28, scale: 2 }).default('100000').notNull(),
    maxTotalPositionValue: numeric('max_total_position_value', { precision: 28, scale: 2 }).default('500000').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Circuit Breaker Events - Audit trail for trading halts
 *
 * Records every time trading was halted (platform-wide or per-symbol).
 * Critical for compliance and post-incident review.
 */
export const circuitBreakerEvents = pgTable('circuit_breaker_events', {
    id: uuid('id').defaultRandom().primaryKey(),
    symbol: varchar('symbol', { length: 32 }), // null = platform-wide
    trigger: circuitBreakerTriggerEnum('trigger').notNull(),
    reason: text('reason').notNull(),
    activatedAt: timestamp('activated_at', { withTimezone: true }).notNull(),
    activatedBy: uuid('activated_by').references(() => users.id),
    deactivatedAt: timestamp('deactivated_at', { withTimezone: true }),
    deactivatedBy: uuid('deactivated_by').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        symbolIdx: index('idx_circuit_breaker_symbol').on(table.symbol),
        activeIdx: index('idx_circuit_breaker_active').on(table.symbol, table.deactivatedAt),
    };
});

/**
 * Order Attempts - Rate limiting tracking
 *
 * Records every order attempt (successful or not) for rate limiting.
 * Should be periodically cleaned up to prevent unbounded growth.
 */
export const orderAttempts = pgTable('order_attempts', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    symbol: varchar('symbol', { length: 32 }),
    wasApproved: boolean('was_approved').default(true).notNull(),
    rejectionCode: varchar('rejection_code', { length: 32 }),
    attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull(),
}, (table) => {
    return {
        userTimeIdx: index('idx_order_attempts_user_time').on(table.userId, table.attemptedAt),
    };
});

/**
 * Daily User PnL - Aggregated daily P&L for loss limit tracking
 *
 * Pre-aggregated table to avoid expensive real-time queries.
 * Updated by trade settlement process.
 */
export const dailyUserPnl = pgTable('daily_user_pnl', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    date: date('date').notNull(),
    realizedPnl: numeric('realized_pnl', { precision: 28, scale: 2 }).default('0').notNull(),
    tradingFees: numeric('trading_fees', { precision: 28, scale: 2 }).default('0').notNull(),
    tradeCount: integer('trade_count').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        userDateIdx: uniqueIndex('uq_daily_user_pnl_user_date').on(table.userId, table.date),
    };
});


// =============================================================================
// ADMIN DOMAIN TABLES
// =============================================================================

/**
 * Admin Audit Log - Immutable record of all admin actions
 *
 * CRITICAL TABLE - This is the compliance and security audit trail.
 * Every admin action (user suspensions, balance adjustments, config changes)
 * must be recorded here with:
 * - Who did it (adminUserId)
 * - What they did (action)
 * - What was affected (targetType, targetId)
 * - Before/after state (oldValue, newValue)
 * - Why they did it (reason - REQUIRED)
 * - Context (ipAddress, userAgent)
 *
 * This table is APPEND-ONLY. Records are NEVER updated or deleted.
 */
export const adminAuditLog = pgTable('admin_audit_log', {
    id: uuid('id').defaultRandom().primaryKey(),
    adminUserId: uuid('admin_user_id').notNull().references(() => users.id),
    adminEmail: varchar('admin_email', { length: 255 }), // Denormalized for easy reading
    action: varchar('action', { length: 100 }).notNull(),
    targetType: varchar('target_type', { length: 50 }).notNull(),
    targetId: uuid('target_id'),
    targetIdentifier: varchar('target_identifier', { length: 255 }), // Human-readable identifier
    oldValue: jsonb('old_value'), // State before action
    newValue: jsonb('new_value'), // State after action
    reason: varchar('reason', { length: 1000 }).notNull(),
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: varchar('user_agent', { length: 500 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => {
    return {
        adminUserIdx: index('idx_admin_audit_admin').on(table.adminUserId),
        actionIdx: index('idx_admin_audit_action').on(table.action),
        targetIdx: index('idx_admin_audit_target').on(table.targetType, table.targetId),
        timeIdx: index('idx_admin_audit_time').on(table.createdAt),
    };
});

/**
 * Symbols - Trading pair configuration
 *
 * Defines all tradeable symbols/pairs with their configuration.
 * Admins can enable/disable trading and adjust fees/limits.
 */
export const symbols = pgTable('symbols', {
    symbol: varchar('symbol', { length: 20 }).primaryKey(),
    baseCurrency: varchar('base_currency', { length: 10 }).notNull(),
    quoteCurrency: varchar('quote_currency', { length: 10 }).notNull(),
    tradingEnabled: boolean('trading_enabled').default(true).notNull(),
    minOrderSize: numeric('min_order_size', { precision: 24, scale: 8 }).default('0.0001').notNull(),
    maxOrderSize: numeric('max_order_size', { precision: 24, scale: 8 }).default('1000').notNull(),
    makerFee: numeric('maker_fee', { precision: 8, scale: 6 }).default('0.001').notNull(), // 0.1%
    takerFee: numeric('taker_fee', { precision: 8, scale: 6 }).default('0.002').notNull(), // 0.2%
    priceDecimals: integer('price_decimals').default(2).notNull(),
    quantityDecimals: integer('quantity_decimals').default(8).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
