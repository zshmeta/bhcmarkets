
import { TradingService } from './trading.service.js';
import { AccountServiceInterface } from '../../account/core/account.types.js';
import { EngineClient } from './engine.client.js';
import { getSymbolDef } from '../../../../../market-data/src/config/symbols.js';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock dependencies
const mockAccountService = {
  getAccount: vi.fn(),
  lockFunds: vi.fn(),
  unlockFunds: vi.fn(),
} as unknown as AccountServiceInterface;

const mockEngineClient = {
  placeOrder: vi.fn(),
} as unknown as EngineClient;

describe('TradingService', () => {
  let service: TradingService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TradingService(mockAccountService, mockEngineClient);
  });

  describe('calculateLockAmount', () => {
    it('should calculate lock amount for SELL order (Base currency)', () => {
      // BTC/USD: Base=BTC, Quote=USD
      const input = {
        accountId: 'u1',
        symbol: 'BTC/USD',
        side: 'sell' as const,
        type: 'limit' as const,
        quantity: 1.5,
        price: 50000,
      };

      const result = service.calculateLockAmount(input);
      
      expect(result).toEqual({
        currency: 'BTC',
        amount: '1.5000000000',
      });
    });

    it('should calculate lock amount for BUY LIMIT order (Quote currency)', () => {
      // BTC/USD: Base=BTC, Quote=USD
      const input = {
        accountId: 'u1',
        symbol: 'BTC/USD',
        side: 'buy' as const,
        type: 'limit' as const,
        quantity: 1.5,
        price: 50000,
      };

      const result = service.calculateLockAmount(input);
      
      expect(result).toEqual({
        currency: 'USD',
        amount: '75000.0000000000', // 1.5 * 50000
      });
    });

    it('should calculate lock amount for BUY MARKET order (Quote currency)', () => {
      // BTC/USD: Base=BTC, Quote=USD
      const input = {
        accountId: 'u1',
        symbol: 'BTC/USD',
        side: 'buy' as const,
        type: 'market' as const,
        quantity: 1.5,
        price: 51000, // Estimated/Cap price
      };

      const result = service.calculateLockAmount(input);
      
      expect(result).toEqual({
        currency: 'USD',
        amount: '76500.0000000000', // 1.5 * 51000
      });
    });

    it('should throw error if BUY LIMIT order has no price', () => {
      const input = {
        accountId: 'u1',
        symbol: 'BTC/USD',
        side: 'buy' as const,
        type: 'limit' as const,
        quantity: 1.5,
      };

      expect(() => service.calculateLockAmount(input)).toThrow('Price is required for limit orders');
    });

    it('should throw error for invalid symbol', () => {
      const input = {
        accountId: 'u1',
        symbol: 'INVALID/PAIR',
        side: 'buy' as const,
        type: 'limit' as const,
        quantity: 1,
        price: 100,
      };

      expect(() => service.calculateLockAmount(input)).toThrow('Invalid symbol: INVALID/PAIR');
    });

  describe('placeOrder', () => {
    const orderInput = {
      accountId: 'u1',
      symbol: 'BTC/USD',
      side: 'buy' as const,
      type: 'limit' as const,
      quantity: 1,
      price: 50000,
      clientOrderId: 'order-123',
    };

    const mockAccount = {
      id: 'acc-usd-1',
      userId: 'u1',
      currency: 'USD',
      balance: '100000',
      locked: '0',
    };

    beforeEach(() => {
      mockAccountService.getAccount.mockResolvedValue(mockAccount as any);
      mockAccountService.lockFunds.mockResolvedValue({ ...mockAccount, locked: '50000' } as any);
      mockEngineClient.placeOrder.mockResolvedValue({ success: true, orderId: 'eng-1' });
    });

    it('should successfully place an order', async () => {
      const result = await service.placeOrder(orderInput);

      // 1. Calculate lock amount: 1 * 50000 = 50000 USD
      // 2. Get account
      expect(mockAccountService.getAccount).toHaveBeenCalledWith('u1', 'USD');
      
      // 3. Lock funds
      expect(mockAccountService.lockFunds).toHaveBeenCalledWith({
        accountId: 'acc-usd-1',
        amount: '50000.0000000000',
      });

      // 4. Call engine
      expect(mockEngineClient.placeOrder).toHaveBeenCalledWith(orderInput);

      // 5. Return success
      expect(result).toEqual({ success: true, orderId: 'eng-1' });
    });

    it('should unlock funds if engine fails', async () => {
      // Setup engine failure
      mockEngineClient.placeOrder.mockResolvedValue({ success: false, error: 'Engine error' });

      const result = await service.placeOrder(orderInput);

      // Verify lock happened
      expect(mockAccountService.lockFunds).toHaveBeenCalled();

      // Verify unlock happened
      expect(mockAccountService.unlockFunds).toHaveBeenCalledWith({
        accountId: 'acc-usd-1',
        amount: '50000.0000000000',
      });

      // Verify result
      expect(result).toEqual({ success: false, error: 'Engine error' });
    });

    it('should throw if account fetch fails', async () => {
      mockAccountService.getAccount.mockRejectedValue(new Error('Account not found'));

      await expect(service.placeOrder(orderInput)).rejects.toThrow('Account not found');
      
      // Verify no lock or engine call
      expect(mockAccountService.lockFunds).not.toHaveBeenCalled();
      expect(mockEngineClient.placeOrder).not.toHaveBeenCalled();
    });

    it('should throw if lock funds fails', async () => {
      mockAccountService.lockFunds.mockRejectedValue(new Error('Insufficient balance'));

      await expect(service.placeOrder(orderInput)).rejects.toThrow('Insufficient balance');

      // Verify no engine call
      expect(mockEngineClient.placeOrder).not.toHaveBeenCalled();
    });

    it('should unlock funds and rethrow if engine throws network error', async () => {
      // Setup engine network error
      const networkError = new Error('Network timeout');
      mockEngineClient.placeOrder.mockRejectedValue(networkError);

      await expect(service.placeOrder(orderInput)).rejects.toThrow('Network timeout');

      // Verify lock happened
      expect(mockAccountService.lockFunds).toHaveBeenCalled();

      // Verify unlock happened
      expect(mockAccountService.unlockFunds).toHaveBeenCalledWith({
        accountId: 'acc-usd-1',
        amount: '50000.0000000000',
      });
    });
  });
});
});
