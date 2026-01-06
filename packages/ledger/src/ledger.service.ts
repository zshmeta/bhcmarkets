/**
 * Ledger Service
 * ==============
 *
 * Enterprise-grade financial ledger service with double-entry bookkeeping.
 *
 * FEATURES:
 * - Double-entry bookkeeping (every credit has a debit)
 * - Immutable ledger entries (append-only audit trail)
 * - Balance holds for pending orders
 * - Atomic trade settlements
 * - Event-driven architecture for real-time updates
 * - Idempotency support for safe retries
 *
 * USAGE:
 * ```typescript
 * const ledger = createLedgerService({ db, logger });
 *
 * // Get balance
 * const balance = await ledger.getBalance(accountId, 'USD');
 *
 * // Create hold for order
 * await ledger.createHold({ accountId, asset: 'USD', amount: '1000', orderId });
 *
 * // Settle trade
 * await ledger.settleTrade({ buyerAccountId, sellerAccountId, ... });
 * ```
 */

import type {
    Balance,
    BalanceChange,
    Hold,
    HoldRequest,
    LedgerEntry,
    LedgerEvent,
    LedgerRepositoryInterface,
    TradeSettlementInput,
    AccountSummary,
} from './ledger.types.js';
import { LedgerRepository } from './ledger.repository.js';
import type { Sql } from 'postgres';

// =============================================================================
// TYPES
// =============================================================================

/**
 * Event handler function type.
 */
export type LedgerEventHandler = (event: LedgerEvent) => void;

/**
 * Logger interface for dependency injection.
 */
interface Logger {
    debug: (obj: unknown, msg?: string) => void;
    info: (obj: unknown, msg?: string) => void;
    warn: (obj: unknown, msg?: string) => void;
    error: (obj: unknown, msg?: string) => void;
}

/**
 * Configuration for creating a ledger service.
 */
export interface LedgerServiceConfig {
    /** PostgreSQL client */
    db: Sql;

    /** Optional logger (defaults to console) */
    logger?: Logger;

    /** Optional custom repository (for testing) */
    repository?: LedgerRepositoryInterface;
}

// =============================================================================
// SERVICE CLASS
// =============================================================================

/**
 * Enterprise-grade ledger service.
 */
export class LedgerService {
    private repo: LedgerRepositoryInterface;
    private log: Logger;
    private eventHandlers: LedgerEventHandler[] = [];

    constructor(config: LedgerServiceConfig) {
        this.repo = config.repository ?? new LedgerRepository(config.db);
        this.log = config.logger ?? createDefaultLogger();
    }

    // ===========================================================================
    // BALANCE QUERIES
    // ===========================================================================

    /**
     * Get balance for an account and asset.
     * Returns a zero balance if no record exists.
     */
    async getBalance(accountId: string, asset: string): Promise<Balance> {
        const balance = await this.repo.getBalance(accountId, asset);

        if (!balance) {
            return {
                accountId,
                asset,
                available: '0',
                held: '0',
                total: '0',
                updatedAt: new Date(),
            };
        }

        return balance;
    }

    /**
     * Get all balances for an account.
     */
    async getAccountBalances(accountId: string): Promise<Balance[]> {
        return this.repo.getAccountBalances(accountId);
    }

    /**
     * Get account summary with all balances.
     */
    async getAccountSummary(accountId: string): Promise<AccountSummary> {
        const balances = await this.repo.getAccountBalances(accountId);

        return {
            accountId,
            balances,
            updatedAt: new Date(),
        };
    }

    /**
     * Check if account has sufficient available balance.
     */
    async hasAvailableBalance(
        accountId: string,
        asset: string,
        amount: string
    ): Promise<boolean> {
        const balance = await this.getBalance(accountId, asset);
        return parseFloat(balance.available) >= parseFloat(amount);
    }

    // ===========================================================================
    // BALANCE OPERATIONS
    // ===========================================================================

    /**
     * Credit an account (add funds).
     */
    async credit(change: BalanceChange): Promise<Balance> {
        if (parseFloat(change.amount) <= 0) {
            throw new Error('Credit amount must be positive');
        }

        const newBalance = await this.repo.withTransaction(async (tx) => {
            // Update balance
            const balance = await tx.updateBalance(
                change.accountId,
                change.asset,
                change.amount,
                '0'
            );

            // Record ledger entry
            await tx.insertEntry({
                accountId: change.accountId,
                asset: change.asset,
                type: change.type,
                amount: change.amount,
                balanceAfter: balance.available,
                referenceId: change.referenceId,
                referenceType: change.referenceType,
                description: change.description,
                status: 'completed',
            });

            return balance;
        });

        this.emit({
            type: 'balance_updated',
            accountId: change.accountId,
            asset: change.asset,
            change: change.amount,
            newBalance,
            timestamp: Date.now(),
        });

        this.log.debug({ change, newBalance }, 'Account credited');
        return newBalance;
    }

    /**
     * Debit an account (remove funds).
     */
    async debit(change: BalanceChange): Promise<Balance> {
        const amount = parseFloat(change.amount);
        if (amount >= 0) {
            throw new Error('Debit amount must be negative');
        }

        const newBalance = await this.repo.withTransaction(async (tx) => {
            // Update balance (will throw if insufficient)
            const balance = await tx.updateBalance(
                change.accountId,
                change.asset,
                change.amount,
                '0'
            );

            // Record ledger entry
            await tx.insertEntry({
                accountId: change.accountId,
                asset: change.asset,
                type: change.type,
                amount: change.amount,
                balanceAfter: balance.available,
                referenceId: change.referenceId,
                referenceType: change.referenceType,
                description: change.description,
                status: 'completed',
            });

            return balance;
        });

        this.emit({
            type: 'balance_updated',
            accountId: change.accountId,
            asset: change.asset,
            change: change.amount,
            newBalance,
            timestamp: Date.now(),
        });

        this.log.debug({ change, newBalance }, 'Account debited');
        return newBalance;
    }

    // ===========================================================================
    // HOLD MANAGEMENT
    // ===========================================================================

    /**
     * Create a hold on funds for a pending order.
     */
    async createHold(hold: HoldRequest): Promise<boolean> {
        const success = await this.repo.withTransaction(async (tx) => {
            return tx.createHold(hold);
        });

        if (success) {
            const balance = await this.getBalance(hold.accountId, hold.asset);

            this.emit({
                type: 'hold_created',
                accountId: hold.accountId,
                asset: hold.asset,
                change: `-${hold.amount}`,
                newBalance: balance,
                timestamp: Date.now(),
                metadata: { orderId: hold.orderId },
            });

            this.log.debug({ hold }, 'Hold created');
        } else {
            this.log.warn({ hold }, 'Failed to create hold: insufficient balance');
        }

        return success;
    }

    /**
     * Release a hold (order cancelled or expired).
     */
    async releaseHold(orderId: string): Promise<boolean> {
        const hold = await this.repo.getHold(orderId);
        if (!hold) {
            this.log.warn({ orderId }, 'Hold not found for release');
            return false;
        }

        const success = await this.repo.withTransaction(async (tx) => {
            return tx.releaseHold(orderId);
        });

        if (success) {
            const balance = await this.getBalance(hold.accountId, hold.asset);

            this.emit({
                type: 'hold_released',
                accountId: hold.accountId,
                asset: hold.asset,
                change: hold.amount,
                newBalance: balance,
                timestamp: Date.now(),
                metadata: { orderId },
            });

            this.log.debug({ orderId, hold }, 'Hold released');
        }

        return success;
    }

    /**
     * Consume a hold (order filled).
     */
    async consumeHold(orderId: string, amount?: string): Promise<boolean> {
        const hold = await this.repo.getHold(orderId);
        if (!hold) {
            this.log.warn({ orderId }, 'Hold not found for consumption');
            return false;
        }

        const success = await this.repo.withTransaction(async (tx) => {
            return tx.consumeHold(orderId, amount);
        });

        if (success) {
            const balance = await this.getBalance(hold.accountId, hold.asset);

            this.emit({
                type: 'hold_consumed',
                accountId: hold.accountId,
                asset: hold.asset,
                change: `-${amount ?? hold.amount}`,
                newBalance: balance,
                timestamp: Date.now(),
                metadata: { orderId },
            });

            this.log.debug({ orderId, amount }, 'Hold consumed');
        }

        return success;
    }

    /**
     * Get hold for an order.
     */
    async getHold(orderId: string): Promise<Hold | null> {
        return this.repo.getHold(orderId);
    }

    /**
     * Get all holds for an account.
     */
    async getAccountHolds(accountId: string): Promise<Hold[]> {
        return this.repo.getAccountHolds(accountId);
    }

    // ===========================================================================
    // TRADE SETTLEMENT
    // ===========================================================================

    /**
     * Settle a trade between buyer and seller.
     *
     * This is an atomic operation that:
     * 1. Debits buyer's quote currency (+ fee)
     * 2. Credits buyer's base currency
     * 3. Debits seller's base currency
     * 4. Credits seller's quote currency (- fee)
     * 5. Records all ledger entries
     */
    async settleTrade(settlement: TradeSettlementInput): Promise<void> {
        const [baseAsset, quoteAsset] = settlement.symbol.split('-');

        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid symbol format: ${settlement.symbol}`);
        }

        const price = parseFloat(settlement.price);
        const quantity = parseFloat(settlement.quantity);
        const buyerFee = parseFloat(settlement.buyerFee);
        const sellerFee = parseFloat(settlement.sellerFee);
        const tradeValue = price * quantity;

        await this.repo.withTransaction(async (tx) => {
            // === BUYER SIDE ===
            // Debit quote currency (what they pay)
            const buyerQuoteAmount = -(tradeValue + buyerFee);
            await tx.updateBalance(
                settlement.buyerAccountId,
                quoteAsset,
                buyerQuoteAmount.toString(),
                '0'
            );

            await tx.insertEntry({
                accountId: settlement.buyerAccountId,
                asset: quoteAsset,
                type: 'trade_buy',
                amount: buyerQuoteAmount.toString(),
                balanceAfter: '0', // Will be updated
                referenceId: settlement.tradeId,
                referenceType: 'trade',
                description: `Buy ${quantity} ${baseAsset} @ ${price}`,
                status: 'completed',
            });

            // Credit base currency (what they receive)
            await tx.updateBalance(
                settlement.buyerAccountId,
                baseAsset,
                quantity.toString(),
                '0'
            );

            await tx.insertEntry({
                accountId: settlement.buyerAccountId,
                asset: baseAsset,
                type: 'trade_buy',
                amount: quantity.toString(),
                balanceAfter: '0',
                referenceId: settlement.tradeId,
                referenceType: 'trade',
                description: `Received ${quantity} ${baseAsset}`,
                status: 'completed',
            });

            // Record buyer fee entry if > 0
            if (buyerFee > 0) {
                await tx.insertEntry({
                    accountId: settlement.buyerAccountId,
                    asset: quoteAsset,
                    type: 'fee',
                    amount: (-buyerFee).toString(),
                    balanceAfter: '0',
                    referenceId: settlement.tradeId,
                    referenceType: 'trade',
                    description: `Trading fee`,
                    status: 'completed',
                });
            }

            // === SELLER SIDE ===
            // Debit base currency (what they give)
            await tx.updateBalance(
                settlement.sellerAccountId,
                baseAsset,
                (-quantity).toString(),
                '0'
            );

            await tx.insertEntry({
                accountId: settlement.sellerAccountId,
                asset: baseAsset,
                type: 'trade_sell',
                amount: (-quantity).toString(),
                balanceAfter: '0',
                referenceId: settlement.tradeId,
                referenceType: 'trade',
                description: `Sell ${quantity} ${baseAsset} @ ${price}`,
                status: 'completed',
            });

            // Credit quote currency (what they receive)
            const sellerQuoteAmount = tradeValue - sellerFee;
            await tx.updateBalance(
                settlement.sellerAccountId,
                quoteAsset,
                sellerQuoteAmount.toString(),
                '0'
            );

            await tx.insertEntry({
                accountId: settlement.sellerAccountId,
                asset: quoteAsset,
                type: 'trade_sell',
                amount: sellerQuoteAmount.toString(),
                balanceAfter: '0',
                referenceId: settlement.tradeId,
                referenceType: 'trade',
                description: `Received ${sellerQuoteAmount} ${quoteAsset}`,
                status: 'completed',
            });

            // Record seller fee entry if > 0
            if (sellerFee > 0) {
                await tx.insertEntry({
                    accountId: settlement.sellerAccountId,
                    asset: quoteAsset,
                    type: 'fee',
                    amount: (-sellerFee).toString(),
                    balanceAfter: '0',
                    referenceId: settlement.tradeId,
                    referenceType: 'trade',
                    description: `Trading fee`,
                    status: 'completed',
                });
            }

            // Consume buyer hold if exists
            if (settlement.buyerOrderId) {
                await tx.consumeHold(settlement.buyerOrderId, (tradeValue + buyerFee).toString());
            }

            // Consume seller hold if exists
            if (settlement.sellerOrderId) {
                await tx.consumeHold(settlement.sellerOrderId, quantity.toString());
            }
        });

        // Emit events for both parties
        const buyerBalance = await this.getBalance(settlement.buyerAccountId, quoteAsset);
        const sellerBalance = await this.getBalance(settlement.sellerAccountId, quoteAsset);

        this.emit({
            type: 'trade_settled',
            accountId: settlement.buyerAccountId,
            asset: quoteAsset,
            change: (-tradeValue - buyerFee).toString(),
            newBalance: buyerBalance,
            timestamp: Date.now(),
            metadata: {
                tradeId: settlement.tradeId,
                role: 'buyer',
                symbol: settlement.symbol,
                price: settlement.price,
                quantity: settlement.quantity,
            },
        });

        this.emit({
            type: 'trade_settled',
            accountId: settlement.sellerAccountId,
            asset: quoteAsset,
            change: (tradeValue - sellerFee).toString(),
            newBalance: sellerBalance,
            timestamp: Date.now(),
            metadata: {
                tradeId: settlement.tradeId,
                role: 'seller',
                symbol: settlement.symbol,
                price: settlement.price,
                quantity: settlement.quantity,
            },
        });

        this.log.info(
            {
                tradeId: settlement.tradeId,
                symbol: settlement.symbol,
                buyer: settlement.buyerAccountId,
                seller: settlement.sellerAccountId,
                price: settlement.price,
                quantity: settlement.quantity,
            },
            'Trade settled'
        );
    }

    // ===========================================================================
    // DEPOSITS & WITHDRAWALS
    // ===========================================================================

    /**
     * Process a deposit.
     */
    async deposit(
        accountId: string,
        asset: string,
        amount: string,
        referenceId?: string
    ): Promise<Balance> {
        const balance = await this.credit({
            accountId,
            asset,
            amount,
            type: 'deposit',
            referenceId,
            referenceType: 'deposit',
            description: `Deposit ${amount} ${asset}`,
        });

        this.emit({
            type: 'deposit_completed',
            accountId,
            asset,
            change: amount,
            newBalance: balance,
            timestamp: Date.now(),
            metadata: { referenceId },
        });

        return balance;
    }

    /**
     * Process a withdrawal.
     */
    async withdraw(
        accountId: string,
        asset: string,
        amount: string,
        referenceId?: string
    ): Promise<Balance> {
        const balance = await this.debit({
            accountId,
            asset,
            amount: `-${amount}`,
            type: 'withdrawal',
            referenceId,
            referenceType: 'withdrawal',
            description: `Withdrawal ${amount} ${asset}`,
        });

        this.emit({
            type: 'withdrawal_completed',
            accountId,
            asset,
            change: `-${amount}`,
            newBalance: balance,
            timestamp: Date.now(),
            metadata: { referenceId },
        });

        return balance;
    }

    // ===========================================================================
    // LEDGER ENTRIES
    // ===========================================================================

    /**
     * Get ledger entries for an account.
     */
    async getEntries(
        accountId: string,
        options?: {
            asset?: string;
            type?: LedgerEntry['type'];
            limit?: number;
            offset?: number;
            startTime?: Date;
            endTime?: Date;
        }
    ): Promise<LedgerEntry[]> {
        return this.repo.getEntries(accountId, options);
    }

    // ===========================================================================
    // INITIALIZATION & TESTING
    // ===========================================================================

    /**
     * Initialize a balance (for setup/migration).
     */
    async initializeBalance(
        accountId: string,
        asset: string,
        available: string,
        held: string = '0'
    ): Promise<Balance> {
        return this.repo.upsertBalance(accountId, asset, available, held);
    }

    // ===========================================================================
    // EVENT HANDLING
    // ===========================================================================

    /**
     * Register event handler.
     */
    onEvent(handler: LedgerEventHandler): () => void {
        this.eventHandlers.push(handler);
        return () => {
            const index = this.eventHandlers.indexOf(handler);
            if (index !== -1) this.eventHandlers.splice(index, 1);
        };
    }

    /**
     * Emit an event to all handlers.
     */
    private emit(event: LedgerEvent): void {
        for (const handler of this.eventHandlers) {
            try {
                handler(event);
            } catch (error) {
                this.log.error({ error, event }, 'Error in ledger event handler');
            }
        }
    }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a ledger service instance.
 */
export function createLedgerService(config: LedgerServiceConfig): LedgerService {
    return new LedgerService(config);
}

// =============================================================================
// DEFAULT LOGGER
// =============================================================================

function createDefaultLogger(): Logger {
    return {
        debug: (obj, msg) => console.debug(msg, obj),
        info: (obj, msg) => console.info(msg, obj),
        warn: (obj, msg) => console.warn(msg, obj),
        error: (obj, msg) => console.error(msg, obj),
    };
}
