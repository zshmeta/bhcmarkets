
import { AccountServiceInterface, CurrencyCode } from '../../account/core/account.types.js';
import { EngineClient, PlaceOrderInput, EnginePlaceOrderResponse } from './engine.client.js';
import { getSymbolDef } from '@repo/market-data/config/symbols.js';

// Helper for safe decimal multiplication
// TODO: Replace with BigInt/Decimal library for production precision
function multiplyToFixed(a: number | string, b: number | string): string {
  const valA = typeof a === 'string' ? parseFloat(a) : a;
  const valB = typeof b === 'string' ? parseFloat(b) : b;
  return (valA * valB).toFixed(10);
}

export class TradingService {
  constructor(
    private readonly accountService: AccountServiceInterface,
    private readonly engineClient: EngineClient
  ) {}

  calculateLockAmount(input: Partial<PlaceOrderInput>): { currency: string; amount: string } {
    if (!input.symbol) throw new Error('Symbol is required');
    if (!input.side) throw new Error('Side is required');
    if (!input.type) throw new Error('Type is required');
    if (input.quantity === undefined) throw new Error('Quantity is required');

    const symbolDef = getSymbolDef(input.symbol);
    if (!symbolDef) {
      throw new Error(`Invalid symbol: ${input.symbol}`);
    }

    if (input.side === 'sell') {
      // Lock Base currency
      return {
        currency: symbolDef.base,
        amount: input.quantity.toFixed(10),
      };
    } else {
      // Buy
      if (!input.price) {
        // Market orders might not have price, but we need an estimated price or cap.
        // Limit orders MUST have price.
        if (input.type === 'limit' || input.type === 'stop_limit') {
          throw new Error('Price is required for limit orders');
        }
        // For market orders, if no price is provided, we can't calculate lock amount without a feed.
        throw new Error('Price (or estimated price) is required for buy orders to calculate lock amount');
      }

      const total = multiplyToFixed(input.quantity, input.price);
      return {
        currency: symbolDef.quote,
        amount: total,
      };
    }
  }

  async placeOrder(userId: string, input: PlaceOrderInput): Promise<EnginePlaceOrderResponse> {
    const lock = this.calculateLockAmount(input);

    // Note: We use the userId to find the correct currency account dynamically
    const account = await this.accountService.getAccount(userId, lock.currency as CurrencyCode);

    await this.accountService.lockFunds({
      accountId: account.id,
      amount: lock.amount,
    });

    try {
      const response = await this.engineClient.placeOrder({
        ...input,
        accountId: account.id,
      });

      if (!response.success) {
        // Rollback lock if engine rejected
        await this.rollbackLock(account.id, lock.amount);
      }

      return response;
    } catch (error) {
      await this.rollbackLock(account.id, lock.amount);
      throw error;
    }
  }

  private async rollbackLock(accountId: string, amount: string): Promise<void> {
    await this.accountService.unlockFunds({
      accountId,
      amount,
    });
  }
}
