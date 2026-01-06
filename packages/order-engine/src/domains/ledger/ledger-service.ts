/**
 * Ledger Service
 * ==============
 *
 * Manages account balances and transaction history.
 *
 * PRINCIPLES:
 * - Double-entry bookkeeping (every credit has a debit)
 * - Immutable ledger entries (append-only)
 * - Balance holds for pending orders
 * - Atomic settlements
 *
 * BALANCE MODEL:
 * - Available: Funds that can be used for new orders
 * - Held: Funds reserved for pending orders
 * - Total: Available + Held
 */

import { randomUUID } from 'crypto';
import type {
  Balance,
  LedgerEntry,
  BalanceChange,
  HoldRequest,
  TradeSettlementInput,
  AccountSummary,
  LedgerEvent,
} from './ledger.types.js';
import { logger } from '../../utils/logger.js';

const log = logger.child({ component: 'ledger-service' });

type LedgerEventHandler = (event: LedgerEvent) => void;

/**
 * In-memory balance tracker.
 * In production, this would be backed by PostgreSQL with proper locking.
 */
interface BalanceState {
  available: number;
  held: number;
}

export class LedgerService {
  // accountId:asset -> balance state
  private balances: Map<string, BalanceState> = new Map();
  // orderId -> hold info
  private holds: Map<string, { accountId: string; asset: string; amount: number }> = new Map();
  private eventHandlers: LedgerEventHandler[] = [];

  constructor() {}

  // ===========================================================================
  // BALANCE QUERIES
  // ===========================================================================

  /**
   * Get balance for an account and asset.
   */
  getBalance(accountId: string, asset: string): Balance {
    const key = this.getKey(accountId, asset);
    const state = this.balances.get(key) ?? { available: 0, held: 0 };

    return {
      accountId,
      asset,
      available: state.available,
      held: state.held,
      total: state.available + state.held,
      updatedAt: new Date(),
    };
  }

  /**
   * Get all balances for an account.
   */
  getAccountBalances(accountId: string): Balance[] {
    const balances: Balance[] = [];

    for (const [key, state] of this.balances) {
      if (key.startsWith(accountId + ':')) {
        const asset = key.split(':')[1]!;
        balances.push({
          accountId,
          asset,
          available: state.available,
          held: state.held,
          total: state.available + state.held,
          updatedAt: new Date(),
        });
      }
    }

    return balances;
  }

  /**
   * Get account summary.
   */
  getAccountSummary(accountId: string): AccountSummary {
    return {
      accountId,
      balances: this.getAccountBalances(accountId),
      updatedAt: new Date(),
    };
  }

  /**
   * Check if account has sufficient available balance.
   */
  hasAvailableBalance(accountId: string, asset: string, amount: number): boolean {
    const balance = this.getBalance(accountId, asset);
    return balance.available >= amount;
  }

  // ===========================================================================
  // BALANCE OPERATIONS
  // ===========================================================================

  /**
   * Credit an account (add funds).
   */
  credit(change: BalanceChange): Balance {
    if (change.amount <= 0) {
      throw new Error('Credit amount must be positive');
    }

    const key = this.getKey(change.accountId, change.asset);
    const state = this.balances.get(key) ?? { available: 0, held: 0 };

    state.available += change.amount;
    this.balances.set(key, state);

    const newBalance = this.getBalance(change.accountId, change.asset);

    this.emit({
      type: 'balance_updated',
      accountId: change.accountId,
      asset: change.asset,
      change: change.amount,
      newBalance,
      timestamp: Date.now(),
    });

    log.debug({
      accountId: change.accountId,
      asset: change.asset,
      amount: change.amount,
      type: change.type,
    }, 'Account credited');

    return newBalance;
  }

  /**
   * Debit an account (remove funds).
   */
  debit(change: BalanceChange): Balance {
    if (change.amount >= 0) {
      throw new Error('Debit amount must be negative');
    }

    const key = this.getKey(change.accountId, change.asset);
    const state = this.balances.get(key);

    if (!state || state.available < Math.abs(change.amount)) {
      throw new Error(`Insufficient balance: ${change.asset}`);
    }

    state.available += change.amount; // amount is negative
    this.balances.set(key, state);

    const newBalance = this.getBalance(change.accountId, change.asset);

    this.emit({
      type: 'balance_updated',
      accountId: change.accountId,
      asset: change.asset,
      change: change.amount,
      newBalance,
      timestamp: Date.now(),
    });

    log.debug({
      accountId: change.accountId,
      asset: change.asset,
      amount: change.amount,
      type: change.type,
    }, 'Account debited');

    return newBalance;
  }

  // ===========================================================================
  // HOLD MANAGEMENT
  // ===========================================================================

  /**
   * Place a hold on funds for a pending order.
   */
  createHold(hold: HoldRequest): boolean {
    const key = this.getKey(hold.accountId, hold.asset);
    const state = this.balances.get(key);

    if (!state || state.available < hold.amount) {
      log.warn({ hold }, 'Insufficient balance for hold');
      return false;
    }

    // Move from available to held
    state.available -= hold.amount;
    state.held += hold.amount;
    this.balances.set(key, state);

    // Track hold
    this.holds.set(hold.orderId, {
      accountId: hold.accountId,
      asset: hold.asset,
      amount: hold.amount,
    });

    const newBalance = this.getBalance(hold.accountId, hold.asset);

    this.emit({
      type: 'hold_created',
      accountId: hold.accountId,
      asset: hold.asset,
      change: -hold.amount,
      newBalance,
      timestamp: Date.now(),
    });

    log.debug({ hold }, 'Hold created');
    return true;
  }

  /**
   * Release a hold (order cancelled or expired).
   */
  releaseHold(orderId: string): boolean {
    const hold = this.holds.get(orderId);
    if (!hold) return false;

    const key = this.getKey(hold.accountId, hold.asset);
    const state = this.balances.get(key);

    if (!state) return false;

    // Move from held back to available
    state.held -= hold.amount;
    state.available += hold.amount;
    this.balances.set(key, state);

    // Remove hold
    this.holds.delete(orderId);

    const newBalance = this.getBalance(hold.accountId, hold.asset);

    this.emit({
      type: 'hold_released',
      accountId: hold.accountId,
      asset: hold.asset,
      change: hold.amount,
      newBalance,
      timestamp: Date.now(),
    });

    log.debug({ orderId, hold }, 'Hold released');
    return true;
  }

  /**
   * Consume a hold (order filled).
   */
  consumeHold(orderId: string, amount?: number): boolean {
    const hold = this.holds.get(orderId);
    if (!hold) return false;

    const key = this.getKey(hold.accountId, hold.asset);
    const state = this.balances.get(key);

    if (!state) return false;

    const consumeAmount = amount ?? hold.amount;

    // Remove from held
    state.held -= consumeAmount;

    // If partial consumption, release remainder
    if (amount && amount < hold.amount) {
      const remainder = hold.amount - amount;
      state.available += remainder;
      this.holds.set(orderId, { ...hold, amount: 0 });
    } else {
      this.holds.delete(orderId);
    }

    this.balances.set(key, state);

    log.debug({ orderId, consumeAmount }, 'Hold consumed');
    return true;
  }

  /**
   * Get hold for an order.
   */
  getHold(orderId: string): { accountId: string; asset: string; amount: number } | null {
    return this.holds.get(orderId) ?? null;
  }

  // ===========================================================================
  // TRADE SETTLEMENT
  // ===========================================================================

  /**
   * Settle a trade between buyer and seller.
   */
  async recordTrade(settlement: TradeSettlementInput): Promise<void> {
    const [baseAsset, quoteAsset] = settlement.symbol.split('-');

    if (!baseAsset || !quoteAsset) {
      throw new Error(`Invalid symbol format: ${settlement.symbol}`);
    }

    const tradeValue = settlement.price * settlement.quantity;

    // Buyer:
    // - Pays quote currency (+ fee)
    // - Receives base currency
    this.debit({
      accountId: settlement.buyerAccountId,
      asset: quoteAsset,
      amount: -(tradeValue + settlement.buyerFee),
      type: 'trade_buy',
      referenceId: settlement.tradeId,
      referenceType: 'trade',
    });

    this.credit({
      accountId: settlement.buyerAccountId,
      asset: baseAsset,
      amount: settlement.quantity,
      type: 'trade_buy',
      referenceId: settlement.tradeId,
      referenceType: 'trade',
    });

    // Seller:
    // - Pays base currency
    // - Receives quote currency (- fee)
    this.debit({
      accountId: settlement.sellerAccountId,
      asset: baseAsset,
      amount: -settlement.quantity,
      type: 'trade_sell',
      referenceId: settlement.tradeId,
      referenceType: 'trade',
    });

    this.credit({
      accountId: settlement.sellerAccountId,
      asset: quoteAsset,
      amount: tradeValue - settlement.sellerFee,
      type: 'trade_sell',
      referenceId: settlement.tradeId,
      referenceType: 'trade',
    });

    log.info({
      tradeId: settlement.tradeId,
      symbol: settlement.symbol,
      buyer: settlement.buyerAccountId,
      seller: settlement.sellerAccountId,
      price: settlement.price,
      quantity: settlement.quantity,
    }, 'Trade settled');
  }

  // ===========================================================================
  // DEPOSITS & WITHDRAWALS
  // ===========================================================================

  /**
   * Process a deposit.
   */
  deposit(accountId: string, asset: string, amount: number, referenceId?: string): Balance {
    return this.credit({
      accountId,
      asset,
      amount,
      type: 'deposit',
      referenceId,
      referenceType: 'deposit',
    });
  }

  /**
   * Process a withdrawal.
   */
  withdraw(accountId: string, asset: string, amount: number, referenceId?: string): Balance {
    return this.debit({
      accountId,
      asset,
      amount: -amount,
      type: 'withdrawal',
      referenceId,
      referenceType: 'withdrawal',
    });
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

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initialize balance from storage.
   */
  initializeBalance(accountId: string, asset: string, available: number, held: number = 0): void {
    const key = this.getKey(accountId, asset);
    this.balances.set(key, { available, held });
  }

  /**
   * Clear all data (for testing).
   */
  clear(): void {
    this.balances.clear();
    this.holds.clear();
  }

  // ===========================================================================
  // PRIVATE HELPERS
  // ===========================================================================

  private getKey(accountId: string, asset: string): string {
    return `${accountId}:${asset}`;
  }

  private emit(event: LedgerEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (error) {
        log.error({ error, event }, 'Error in ledger event handler');
      }
    }
  }
}
