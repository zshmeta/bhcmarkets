/**
 * Ledger Types
 * ============
 *
 * Type definitions for the ledger system.
 * These types follow financial industry standards for balance tracking.
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Transaction types for ledger entries.
 * Each type represents a specific financial operation.
 */
export type TransactionType =
    | 'deposit'       // Funds added to account
    | 'withdrawal'    // Funds removed from account
    | 'trade_buy'     // Purchase in a trade
    | 'trade_sell'    // Sale in a trade
    | 'fee'           // Trading fee deduction
    | 'fee_rebate'    // Fee rebate (maker incentive)
    | 'transfer_in'   // Internal transfer received
    | 'transfer_out'  // Internal transfer sent
    | 'adjustment'    // Manual balance adjustment (admin)
    | 'hold'          // Funds held for pending order
    | 'release'       // Held funds released
    | 'margin_call'   // Margin requirement deduction
    | 'funding'       // Perpetual funding payment
    | 'bonus'         // Promotional credit
    | 'referral';     // Referral reward

/**
 * Transaction status for tracking lifecycle.
 */
export type TransactionStatus =
    | 'pending'     // Transaction initiated
    | 'completed'   // Transaction finalized
    | 'failed'      // Transaction failed
    | 'cancelled'   // Transaction cancelled
    | 'reversed';   // Transaction reversed

/**
 * Ledger event types for real-time streaming.
 */
export type LedgerEventType =
    | 'balance_updated'
    | 'hold_created'
    | 'hold_released'
    | 'hold_consumed'
    | 'trade_settled'
    | 'deposit_completed'
    | 'withdrawal_completed';

// =============================================================================
// CORE TYPES
// =============================================================================

/**
 * Account balance for a specific asset.
 *
 * BALANCE MODEL:
 * - Available: Funds that can be used for new orders
 * - Held: Funds reserved for pending orders
 * - Total: Available + Held (what the user "owns")
 */
export interface Balance {
    /** Unique account identifier (UUID) */
    accountId: string;

    /** Asset symbol (e.g., 'USD', 'BTC', 'ETH') */
    asset: string;

    /** Funds available for trading (not held) */
    available: string;

    /** Funds reserved for pending orders */
    held: string;

    /** Total balance (available + held) */
    total: string;

    /** Last balance update timestamp */
    updatedAt: Date;
}

/**
 * Ledger entry (immutable transaction record).
 *
 * This is the audit trail - entries are NEVER modified or deleted.
 * Each entry represents a single balance change with full context.
 */
export interface LedgerEntry {
    /** Unique entry identifier (UUID) */
    id: string;

    /** Account that was affected */
    accountId: string;

    /** Asset that was affected */
    asset: string;

    /** Type of transaction */
    type: TransactionType;

    /** Amount changed (positive for credits, negative for debits) */
    amount: string;

    /** Balance after this entry was applied */
    balanceAfter: string;

    /** Reference to the causing entity (order ID, trade ID, etc.) */
    referenceId?: string;

    /** Type of reference ('order', 'trade', 'deposit', etc.) */
    referenceType?: string;

    /** Human-readable description */
    description?: string;

    /** Transaction status */
    status: TransactionStatus;

    /** Entry creation timestamp (immutable) */
    createdAt: Date;
}

/**
 * Balance change request.
 * Used for credits and debits.
 */
export interface BalanceChange {
    /** Target account */
    accountId: string;

    /** Asset to modify */
    asset: string;

    /** Amount to change (positive for credit, use negative for debit) */
    amount: string;

    /** Transaction type */
    type: TransactionType;

    /** Optional reference to causing entity */
    referenceId?: string;

    /** Type of reference */
    referenceType?: string;

    /** Human-readable description */
    description?: string;

    /** Idempotency key to prevent duplicate transactions */
    idempotencyKey?: string;
}

/**
 * Hold request (reserve funds for pending order).
 */
export interface HoldRequest {
    /** Account to hold funds from */
    accountId: string;

    /** Asset to hold */
    asset: string;

    /** Amount to hold */
    amount: string;

    /** Order ID this hold is for */
    orderId: string;
}

/**
 * Active hold record.
 */
export interface Hold {
    /** Order ID this hold is for */
    orderId: string;

    /** Account holding funds */
    accountId: string;

    /** Asset being held */
    asset: string;

    /** Amount held */
    amount: string;

    /** When hold was created */
    createdAt: Date;
}

/**
 * Trade settlement input.
 * Contains all information needed to settle a trade between buyer and seller.
 */
export interface TradeSettlementInput {
    /** Unique trade identifier */
    tradeId: string;

    /** Buyer's account ID */
    buyerAccountId: string;

    /** Seller's account ID */
    sellerAccountId: string;

    /** Trading pair symbol (e.g., "BTC-USD", "ETH-USD") */
    symbol: string;

    /** Trade price */
    price: string;

    /** Trade quantity (in base currency) */
    quantity: string;

    /** Fee charged to buyer (in quote currency) */
    buyerFee: string;

    /** Fee charged to seller (in quote currency) */
    sellerFee: string;

    /** Order ID of the buyer's order */
    buyerOrderId?: string;

    /** Order ID of the seller's order */
    sellerOrderId?: string;

    /** Timestamp of the trade */
    timestamp?: Date;
}

/**
 * Account summary with all balances.
 */
export interface AccountSummary {
    /** Account identifier */
    accountId: string;

    /** All asset balances for this account */
    balances: Balance[];

    /** Estimated total value in USD (optional) */
    totalValueUsd?: string;

    /** Summary generation timestamp */
    updatedAt: Date;
}

/**
 * Ledger event for streaming updates.
 */
export interface LedgerEvent {
    /** Event type */
    type: LedgerEventType;

    /** Affected account */
    accountId: string;

    /** Affected asset */
    asset: string;

    /** Amount changed */
    change: string;

    /** New balance after change */
    newBalance: Balance;

    /** Event timestamp (Unix ms) */
    timestamp: number;

    /** Optional metadata */
    metadata?: Record<string, unknown>;
}

// =============================================================================
// REPOSITORY INTERFACE
// =============================================================================

/**
 * Ledger Repository Interface.
 * Defines the contract for ledger data persistence.
 */
export interface LedgerRepositoryInterface {
    // Balance operations
    getBalance(accountId: string, asset: string): Promise<Balance | null>;
    getAccountBalances(accountId: string): Promise<Balance[]>;
    upsertBalance(accountId: string, asset: string, available: string, held: string): Promise<Balance>;
    updateBalance(accountId: string, asset: string, availableDelta: string, heldDelta?: string): Promise<Balance>;

    // Hold operations
    createHold(hold: HoldRequest): Promise<boolean>;
    releaseHold(orderId: string): Promise<boolean>;
    consumeHold(orderId: string, amount?: string): Promise<boolean>;
    getHold(orderId: string): Promise<Hold | null>;
    getAccountHolds(accountId: string): Promise<Hold[]>;

    // Ledger entry operations
    insertEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry>;
    getEntries(accountId: string, options?: {
        asset?: string;
        type?: TransactionType;
        limit?: number;
        offset?: number;
        startTime?: Date;
        endTime?: Date;
    }): Promise<LedgerEntry[]>;
    getEntryByIdempotencyKey(key: string): Promise<LedgerEntry | null>;

    // Transaction support
    withTransaction<T>(fn: (tx: LedgerRepositoryInterface) => Promise<T>): Promise<T>;
}
