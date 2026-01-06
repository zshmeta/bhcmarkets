/**
 * @repo/ledger - Enterprise-Grade Financial Ledger Service
 * =========================================================
 *
 * A standalone package for managing account balances, transaction history,
 * and trade settlements using double-entry bookkeeping principles.
 *
 * PRINCIPLES:
 * - Double-entry bookkeeping (every credit has a debit)
 * - Immutable ledger entries (append-only audit trail)
 * - Balance holds for pending orders
 * - Atomic settlements with PostgreSQL transactions
 * - Event-driven architecture for real-time updates
 *
 * USAGE:
 * ```typescript
 * import {
 *   createLedgerService,
 *   type LedgerService,
 *   type Balance,
 * } from '@repo/ledger';
 *
 * const ledger = createLedgerService({ db });
 *
 * // Check balance
 * const balance = await ledger.getBalance(accountId, 'USD');
 *
 * // Create hold for order
 * await ledger.createHold({ accountId, asset: 'USD', amount: 1000, orderId });
 *
 * // Settle trade
 * await ledger.settleTrade({ buyerAccountId, sellerAccountId, ... });
 * ```
 */

// =============================================================================
// SERVICE EXPORTS
// =============================================================================

export { LedgerService, createLedgerService } from './ledger.service.js';
export type { LedgerServiceConfig, LedgerEventHandler } from './ledger.service.js';

// =============================================================================
// REPOSITORY EXPORTS
// =============================================================================

export { LedgerRepository, createLedgerRepository } from './ledger.repository.js';

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type {
    // Core types
    Balance,
    LedgerEntry,
    BalanceChange,
    HoldRequest,
    Hold,
    TradeSettlementInput,
    AccountSummary,
    LedgerEvent,
    // Enums
    TransactionType,
    TransactionStatus,
    LedgerEventType,
    // Repository interface
    LedgerRepositoryInterface,
} from './ledger.types.js';

// =============================================================================
// CONFIG EXPORTS
// =============================================================================

export { LEDGER_CONFIG, SUPPORTED_ASSETS } from './ledger.config.js';
