
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TradingService } from '../../src/domains/trading/core/trading.service';
import { createAccountService } from '../../src/domains/account/core/account.service';
import { EngineClient } from '../../src/domains/trading/core/engine.client';
import { 
  AccountRepository, 
  AccountEntity, 
  CreateAccountInput, 
  AccountStatus,
  CurrencyCode,
  DecimalString,
  UUID
} from '../../src/domains/account/core/account.types';

// --- InMemory Account Repository ---
class InMemoryAccountRepository implements AccountRepository {
  private accounts = new Map<string, AccountEntity>();

  async getById(id: UUID): Promise<AccountEntity | null> {
    return this.accounts.get(id) || null;
  }

  async getByUserAndCurrency(userId: UUID, currency: CurrencyCode): Promise<AccountEntity | null> {
    for (const account of this.accounts.values()) {
      if (account.userId === userId && account.currency === currency) {
        return account;
      }
    }
    return null;
  }

  async listByUser(userId: UUID): Promise<AccountEntity[]> {
    const result: AccountEntity[] = [];
    for (const account of this.accounts.values()) {
      if (account.userId === userId) {
        result.push(account);
      }
    }
    return result;
  }

  async exists(userId: UUID, currency: CurrencyCode): Promise<boolean> {
    const account = await this.getByUserAndCurrency(userId, currency);
    return !!account;
  }

  async create(input: CreateAccountInput): Promise<AccountEntity> {
    const id = `acc-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    const account: AccountEntity = {
      id,
      userId: input.userId,
      currency: input.currency,
      balance: input.initialBalance || '0',
      locked: '0',
      accountType: input.accountType || 'spot',
      status: 'active',
      createdAt: now,
      updatedAt: now,
    };
    this.accounts.set(id, account);
    return account;
  }

  async updateBalance(id: UUID, newBalance: DecimalString): Promise<AccountEntity> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    account.balance = newBalance;
    account.updatedAt = new Date();
    this.accounts.set(id, account);
    return { ...account };
  }

  async updateLocked(id: UUID, newLocked: DecimalString): Promise<AccountEntity> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    account.locked = newLocked;
    account.updatedAt = new Date();
    this.accounts.set(id, account);
    return { ...account };
  }

  async updateBalanceAndLocked(
    id: UUID,
    newBalance: DecimalString,
    newLocked: DecimalString
  ): Promise<AccountEntity> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    account.balance = newBalance;
    account.locked = newLocked;
    account.updatedAt = new Date();
    this.accounts.set(id, account);
    return { ...account };
  }

  async setStatus(id: UUID, status: AccountStatus): Promise<AccountEntity> {
    const account = this.accounts.get(id);
    if (!account) throw new Error('Account not found');
    account.status = status;
    account.updatedAt = new Date();
    this.accounts.set(id, account);
    return { ...account };
  }
}

// --- Integration Test ---
describe('Trading Gateway Integration (End-to-End Flow)', () => {
  let tradingService: TradingService;
  let accountService: ReturnType<typeof createAccountService>;
  let engineClientMock: EngineClient;
  let accountRepo: InMemoryAccountRepository;

  const TEST_USER_ID = 'user-123';
  const USD_ACCOUNT_ID = 'acc-usd'; 

  beforeEach(async () => {
    // 1. Setup Dependencies
    accountRepo = new InMemoryAccountRepository();
    accountService = createAccountService({ repository: accountRepo });
    
    // Mock EngineClient
    engineClientMock = {
      placeOrder: vi.fn(),
    } as unknown as EngineClient;

    tradingService = new TradingService(accountService, engineClientMock);

    // 2. Setup Test Data
    // Create USD Account manually via service or repo to ensure it exists
    await accountService.createAccount({
        userId: TEST_USER_ID,
        currency: 'USD',
        initialBalance: '0'
    });
    
    // Deposit 10,000 USD
    // First we need to find the account ID created above
    const account = await accountService.getAccount(TEST_USER_ID, 'USD');
    await accountService.deposit({
        accountId: account.id,
        amount: '10000'
    });
  });

  it('Test 1: Should successfully place order and lock funds', async () => {
    // Setup Engine Success
    (engineClientMock.placeOrder as any).mockResolvedValue({
        success: true,
        orderId: 'order-1'
    });

    // Call TradingService.placeOrder
    // Buy BTC/USD Limit @ 50,000, Qty 0.1 -> Cost 5,000 USD
    const response = await tradingService.placeOrder(TEST_USER_ID, {
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 0.1,
        price: 50000,
    });

    // Assert Response
    expect(response.success).toBe(true);

    // Assert Account State
    const account = await accountService.getAccount(TEST_USER_ID, 'USD');
    
    // Cost = 0.1 * 50,000 = 5,000
    // Locked should be 5000.0000000000 (10 decimal places)
    expect(parseFloat(account.locked)).toBe(5000); 
    
    // Balance should still be 10,000 (funds are locked, not deducted yet until fill)
    expect(parseFloat(account.balance)).toBe(10000);

    // Available should be 5000
    const available = await accountService.getAvailableBalance(account.id);
    expect(parseFloat(available)).toBe(5000);
  });

  it('Test 2: Should unlock funds if engine fails', async () => {
    // Setup Engine Failure
    (engineClientMock.placeOrder as any).mockResolvedValue({
        success: false,
        error: 'Engine rejected order'
    });

    // Call TradingService.placeOrder
    await tradingService.placeOrder(TEST_USER_ID, {
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 0.1,
        price: 50000,
    });

    // Assert Account State
    const account = await accountService.getAccount(TEST_USER_ID, 'USD');
    
    // Locked should be 0 (returned)
    expect(parseFloat(account.locked)).toBe(0);
    
    // Balance should remain 10,000
    expect(parseFloat(account.balance)).toBe(10000);
  });

  it('Test 3: Should fail if insufficient funds', async () => {
    // Attempt to buy more than balance
    // Balance 10,000. Try to buy 1 BTC @ 50,000 (Cost 50,000)
    
    await expect(tradingService.placeOrder(TEST_USER_ID, {
        symbol: 'BTC/USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
    })).rejects.toThrow(); // Should throw error (likely INSUFFICIENT_BALANCE or similar from AccountService)

    // Assert Account State
    const account = await accountService.getAccount(TEST_USER_ID, 'USD');
    
    // Locked should be 0
    expect(parseFloat(account.locked)).toBe(0);
    
    // Balance should be 10,000
    expect(parseFloat(account.balance)).toBe(10000);
    
    // Verify engine was NOT called
    expect(engineClientMock.placeOrder).not.toHaveBeenCalled();
  });
});
