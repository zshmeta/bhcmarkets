/**
 * Ledger Service Tests
 * ====================
 *
 * Comprehensive tests for the ledger service.
 * Uses a mock repository for isolated unit testing.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LedgerService } from '../src/ledger.service.js';
import type {
    Balance,
    Hold,
    LedgerEntry,
    LedgerRepositoryInterface,
    HoldRequest,
    TransactionType,
} from '../src/ledger.types.js';

// =============================================================================
// MOCK REPOSITORY
// =============================================================================

function createMockRepository(): LedgerRepositoryInterface & {
    _balances: Map<string, Balance>;
    _holds: Map<string, Hold>;
    _entries: LedgerEntry[];
} {
    const balances = new Map<string, Balance>();
    const holds = new Map<string, Hold>();
    const entries: LedgerEntry[] = [];

    const getKey = (accountId: string, asset: string) => `${accountId}:${asset}`;

    const repo: LedgerRepositoryInterface & {
        _balances: Map<string, Balance>;
        _holds: Map<string, Hold>;
        _entries: LedgerEntry[];
    } = {
        _balances: balances,
        _holds: holds,
        _entries: entries,

        async getBalance(accountId: string, asset: string): Promise<Balance | null> {
            return balances.get(getKey(accountId, asset)) ?? null;
        },

        async getAccountBalances(accountId: string): Promise<Balance[]> {
            return Array.from(balances.values()).filter(b => b.accountId === accountId);
        },

        async upsertBalance(accountId: string, asset: string, available: string, held: string): Promise<Balance> {
            const balance: Balance = {
                accountId,
                asset,
                available,
                held,
                total: (parseFloat(available) + parseFloat(held)).toString(),
                updatedAt: new Date(),
            };
            balances.set(getKey(accountId, asset), balance);
            return balance;
        },

        async updateBalance(accountId: string, asset: string, availableDelta: string, heldDelta = '0'): Promise<Balance> {
            const key = getKey(accountId, asset);
            const existing = balances.get(key);

            let currentAvailable = 0;
            let currentHeld = 0;

            if (existing) {
                currentAvailable = parseFloat(existing.available);
                currentHeld = parseFloat(existing.held);
            }

            const newAvailable = currentAvailable + parseFloat(availableDelta);
            const newHeld = currentHeld + parseFloat(heldDelta);

            if (newAvailable < -0.0000001) { // Allow tiny floating point errors
                throw new Error('Insufficient balance');
            }

            const updated: Balance = {
                accountId,
                asset,
                available: newAvailable.toString(),
                held: newHeld.toString(),
                total: (newAvailable + newHeld).toString(),
                updatedAt: new Date(),
            };
            balances.set(key, updated);
            return updated;
        },

        async createHold(hold: HoldRequest): Promise<boolean> {
            const key = getKey(hold.accountId, hold.asset);
            const balance = balances.get(key);

            if (!balance || parseFloat(balance.available) < parseFloat(hold.amount)) {
                return false;
            }

            // Move from available to held
            const newAvailable = parseFloat(balance.available) - parseFloat(hold.amount);
            const newHeld = parseFloat(balance.held) + parseFloat(hold.amount);

            balances.set(key, {
                ...balance,
                available: newAvailable.toString(),
                held: newHeld.toString(),
                total: (newAvailable + newHeld).toString(),
                updatedAt: new Date(),
            });

            holds.set(hold.orderId, {
                orderId: hold.orderId,
                accountId: hold.accountId,
                asset: hold.asset,
                amount: hold.amount,
                createdAt: new Date(),
            });

            return true;
        },

        async releaseHold(orderId: string): Promise<boolean> {
            const hold = holds.get(orderId);
            if (!hold) return false;

            const key = getKey(hold.accountId, hold.asset);
            const balance = balances.get(key);
            if (!balance) return false;

            const newAvailable = parseFloat(balance.available) + parseFloat(hold.amount);
            const newHeld = parseFloat(balance.held) - parseFloat(hold.amount);

            balances.set(key, {
                ...balance,
                available: newAvailable.toString(),
                held: newHeld.toString(),
                total: (newAvailable + newHeld).toString(),
                updatedAt: new Date(),
            });

            holds.delete(orderId);
            return true;
        },

        async consumeHold(orderId: string, amount?: string): Promise<boolean> {
            const hold = holds.get(orderId);
            if (!hold) return false;

            const key = getKey(hold.accountId, hold.asset);
            const balance = balances.get(key);
            if (!balance) return false;

            const consumeAmount = amount ?? hold.amount;
            const newHeld = parseFloat(balance.held) - parseFloat(consumeAmount);

            balances.set(key, {
                ...balance,
                held: newHeld.toString(),
                total: (parseFloat(balance.available) + newHeld).toString(),
                updatedAt: new Date(),
            });

            if (parseFloat(consumeAmount) >= parseFloat(hold.amount)) {
                holds.delete(orderId);
            } else {
                holds.set(orderId, {
                    ...hold,
                    amount: (parseFloat(hold.amount) - parseFloat(consumeAmount)).toString(),
                });
            }

            return true;
        },

        async getHold(orderId: string): Promise<Hold | null> {
            return holds.get(orderId) ?? null;
        },

        async getAccountHolds(accountId: string): Promise<Hold[]> {
            return Array.from(holds.values()).filter(h => h.accountId === accountId);
        },

        async insertEntry(entry: Omit<LedgerEntry, 'id' | 'createdAt'>): Promise<LedgerEntry> {
            const newEntry: LedgerEntry = {
                ...entry,
                id: `entry-${entries.length + 1}`,
                createdAt: new Date(),
            };
            entries.push(newEntry);
            return newEntry;
        },

        async getEntries(accountId: string, options?: {
            asset?: string;
            type?: TransactionType;
            limit?: number;
            offset?: number;
        }): Promise<LedgerEntry[]> {
            let filtered = entries.filter(e => e.accountId === accountId);
            if (options?.asset) {
                filtered = filtered.filter(e => e.asset === options.asset);
            }
            if (options?.type) {
                filtered = filtered.filter(e => e.type === options.type);
            }
            const start = options?.offset ?? 0;
            const end = start + (options?.limit ?? 100);
            return filtered.slice(start, end);
        },

        async getEntryByIdempotencyKey(key: string): Promise<LedgerEntry | null> {
            return entries.find(e => e.referenceId === key) ?? null;
        },

        async withTransaction<T>(fn: (tx: LedgerRepositoryInterface) => Promise<T>): Promise<T> {
            return fn(this);
        },
    };

    return repo;
}

// =============================================================================
// TESTS
// =============================================================================

describe('LedgerService', () => {
    let service: LedgerService;
    let mockRepo: ReturnType<typeof createMockRepository>;
    const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    beforeEach(() => {
        mockRepo = createMockRepository();
        service = new LedgerService({
            db: {} as any,
            repository: mockRepo,
            logger: mockLogger,
        });
        vi.clearAllMocks();
    });

    describe('Balance Queries', () => {
        it('should return zero balance for non-existent account', async () => {
            const balance = await service.getBalance('account-1', 'USD');

            expect(balance.accountId).toBe('account-1');
            expect(balance.asset).toBe('USD');
            expect(balance.available).toBe('0');
            expect(balance.held).toBe('0');
            expect(balance.total).toBe('0');
        });

        it('should return existing balance', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');

            const balance = await service.getBalance('account-1', 'USD');

            expect(balance.available).toBe('1000');
            expect(balance.total).toBe('1000');
        });

        it('should return all account balances', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');
            await mockRepo.upsertBalance('account-1', 'BTC', '1.5', '0');
            await mockRepo.upsertBalance('account-2', 'USD', '500', '0');

            const balances = await service.getAccountBalances('account-1');

            expect(balances).toHaveLength(2);
            expect(balances.map(b => b.asset).sort()).toEqual(['BTC', 'USD']);
        });

        it('should check available balance correctly', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '500');

            expect(await service.hasAvailableBalance('account-1', 'USD', '500')).toBe(true);
            expect(await service.hasAvailableBalance('account-1', 'USD', '1000')).toBe(true);
            expect(await service.hasAvailableBalance('account-1', 'USD', '1001')).toBe(false);
        });
    });

    describe('Credits and Debits', () => {
        it('should credit an account', async () => {
            const balance = await service.credit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '1000',
                type: 'deposit',
            });

            expect(balance.available).toBe('1000');
            expect(balance.total).toBe('1000');
        });

        it('should reject non-positive credit', async () => {
            await expect(service.credit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '0',
                type: 'deposit',
            })).rejects.toThrow('Credit amount must be positive');

            await expect(service.credit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '-100',
                type: 'deposit',
            })).rejects.toThrow('Credit amount must be positive');
        });

        it('should debit an account', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');

            const balance = await service.debit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '-300',
                type: 'withdrawal',
            });

            expect(balance.available).toBe('700');
        });

        it('should reject non-negative debit', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');

            await expect(service.debit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '300',
                type: 'withdrawal',
            })).rejects.toThrow('Debit amount must be negative');
        });

        it('should reject debit exceeding available balance', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '100', '0');

            await expect(service.debit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '-200',
                type: 'withdrawal',
            })).rejects.toThrow('Insufficient balance');
        });

        it('should record ledger entries for credits and debits', async () => {
            await service.credit({
                accountId: 'account-1',
                asset: 'USD',
                amount: '1000',
                type: 'deposit',
                referenceId: 'dep-1',
            });

            expect(mockRepo._entries).toHaveLength(1);
            expect(mockRepo._entries[0]!.type).toBe('deposit');
            expect(mockRepo._entries[0]!.amount).toBe('1000');
            expect(mockRepo._entries[0]!.referenceId).toBe('dep-1');
        });
    });

    describe('Hold Management', () => {
        beforeEach(async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');
        });

        it('should create a hold', async () => {
            const success = await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '500',
                orderId: 'order-1',
            });

            expect(success).toBe(true);

            const balance = await service.getBalance('account-1', 'USD');
            expect(balance.available).toBe('500');
            expect(balance.held).toBe('500');
            expect(balance.total).toBe('1000');

            const hold = await service.getHold('order-1');
            expect(hold).not.toBeNull();
            expect(hold!.amount).toBe('500');
        });

        it('should fail to create hold with insufficient balance', async () => {
            const success = await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '1500',
                orderId: 'order-1',
            });

            expect(success).toBe(false);
        });

        it('should release a hold', async () => {
            await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '500',
                orderId: 'order-1',
            });

            const success = await service.releaseHold('order-1');

            expect(success).toBe(true);

            const balance = await service.getBalance('account-1', 'USD');
            expect(balance.available).toBe('1000');
            expect(balance.held).toBe('0');

            const hold = await service.getHold('order-1');
            expect(hold).toBeNull();
        });

        it('should consume a hold', async () => {
            await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '500',
                orderId: 'order-1',
            });

            const success = await service.consumeHold('order-1');

            expect(success).toBe(true);

            const balance = await service.getBalance('account-1', 'USD');
            expect(balance.available).toBe('500');
            expect(balance.held).toBe('0');
            expect(balance.total).toBe('500');

            const hold = await service.getHold('order-1');
            expect(hold).toBeNull();
        });

        it('should partially consume a hold', async () => {
            await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '500',
                orderId: 'order-1',
            });

            const success = await service.consumeHold('order-1', '200');

            expect(success).toBe(true);

            const balance = await service.getBalance('account-1', 'USD');
            expect(balance.available).toBe('500');
            expect(balance.held).toBe('300');

            const hold = await service.getHold('order-1');
            expect(hold).not.toBeNull();
            expect(hold!.amount).toBe('300');
        });
    });

    describe('Trade Settlement', () => {
        beforeEach(async () => {
            // Set up buyer with quote currency (USD) - needs enough for trade value + fee
            // Trade: 50000 * 0.5 + 50 = 25050 USD
            await mockRepo.upsertBalance('buyer-account', 'USD', '30000', '0');
            // Set up seller with base currency (BTC)
            await mockRepo.upsertBalance('seller-account', 'BTC', '1', '0');
        });

        it('should settle a trade between buyer and seller', async () => {
            await service.settleTrade({
                tradeId: 'trade-1',
                buyerAccountId: 'buyer-account',
                sellerAccountId: 'seller-account',
                symbol: 'BTC-USD',
                price: '50000',
                quantity: '0.5',
                buyerFee: '50',
                sellerFee: '25',
            });

            // Check buyer balances
            const buyerUSD = await service.getBalance('buyer-account', 'USD');
            const buyerBTC = await service.getBalance('buyer-account', 'BTC');

            // Buyer pays: 50000 * 0.5 + 50 = 25050 USD
            expect(parseFloat(buyerUSD.available)).toBeCloseTo(30000 - 25050, 2);
            // Buyer receives: 0.5 BTC
            expect(parseFloat(buyerBTC.available)).toBeCloseTo(0.5, 8);

            // Check seller balances
            const sellerBTC = await service.getBalance('seller-account', 'BTC');
            const sellerUSD = await service.getBalance('seller-account', 'USD');

            // Seller gives: 0.5 BTC
            expect(parseFloat(sellerBTC.available)).toBeCloseTo(0.5, 8);
            // Seller receives: 50000 * 0.5 - 25 = 24975 USD
            expect(parseFloat(sellerUSD.available)).toBeCloseTo(24975, 2);
        });

        it('should record ledger entries for trade settlement', async () => {
            await service.settleTrade({
                tradeId: 'trade-1',
                buyerAccountId: 'buyer-account',
                sellerAccountId: 'seller-account',
                symbol: 'BTC-USD',
                price: '50000',
                quantity: '0.5',
                buyerFee: '50',
                sellerFee: '25',
            });

            // Should have entries for:
            // - Buyer USD debit (trade_buy)
            // - Buyer BTC credit (trade_buy)
            // - Buyer fee (fee)
            // - Seller BTC debit (trade_sell)
            // - Seller USD credit (trade_sell)
            // - Seller fee (fee)
            expect(mockRepo._entries.length).toBeGreaterThanOrEqual(4);
        });

        it('should reject invalid symbol format', async () => {
            await expect(service.settleTrade({
                tradeId: 'trade-1',
                buyerAccountId: 'buyer-account',
                sellerAccountId: 'seller-account',
                symbol: 'BTCUSD', // Invalid - no separator
                price: '50000',
                quantity: '0.5',
                buyerFee: '50',
                sellerFee: '25',
            })).rejects.toThrow('Invalid symbol format');
        });
    });

    describe('Deposits and Withdrawals', () => {
        it('should process a deposit', async () => {
            const balance = await service.deposit('account-1', 'USD', '5000', 'dep-123');

            expect(balance.available).toBe('5000');
            expect(mockRepo._entries).toHaveLength(1);
            expect(mockRepo._entries[0]!.type).toBe('deposit');
        });

        it('should process a withdrawal', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '5000', '0');

            const balance = await service.withdraw('account-1', 'USD', '1000', 'wth-123');

            expect(balance.available).toBe('4000');
            expect(mockRepo._entries).toHaveLength(1);
            expect(mockRepo._entries[0]!.type).toBe('withdrawal');
        });

        it('should reject withdrawal exceeding balance', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '500', '0');

            await expect(
                service.withdraw('account-1', 'USD', '1000')
            ).rejects.toThrow();
        });
    });

    describe('Event Handling', () => {
        it('should emit events on balance changes', async () => {
            const events: any[] = [];
            service.onEvent((event) => events.push(event));

            await service.deposit('account-1', 'USD', '1000');

            expect(events).toHaveLength(2); // balance_updated + deposit_completed
            expect(events[0].type).toBe('balance_updated');
            expect(events[1].type).toBe('deposit_completed');
        });

        it('should emit events on hold creation', async () => {
            await mockRepo.upsertBalance('account-1', 'USD', '1000', '0');

            const events: any[] = [];
            service.onEvent((event) => events.push(event));

            await service.createHold({
                accountId: 'account-1',
                asset: 'USD',
                amount: '500',
                orderId: 'order-1',
            });

            expect(events.some(e => e.type === 'hold_created')).toBe(true);
        });

        it('should allow unsubscribing from events', async () => {
            const events: any[] = [];
            const unsubscribe = service.onEvent((event) => events.push(event));

            await service.deposit('account-1', 'USD', '1000');
            expect(events.length).toBeGreaterThan(0);

            const countBefore = events.length;
            unsubscribe();

            await service.deposit('account-1', 'USD', '500');
            expect(events.length).toBe(countBefore);
        });
    });
});
