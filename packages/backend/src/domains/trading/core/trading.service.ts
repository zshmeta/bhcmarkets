
import { AccountServiceInterface } from '../../account/core/account.types.js';
import { EngineClient, PlaceOrderInput } from './engine.client.js';
import { getSymbolDef } from '../../../../../market-data/src/config/symbols.js';

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
        amount: input.quantity.toString(),
      };
    } else {
      // Buy
      if (!input.price) {
        // Market orders might not have price, but we need an estimated price or cap.
        // For this task, prompt says "Assume price is passed as estimated/cap".
        // Limit orders MUST have price.
        if (input.type === 'limit' || input.type === 'stop_limit') {
          throw new Error('Price is required for limit orders');
        }
        // For market orders, if no price is provided, we can't calculate lock amount without a feed.
        // Prompt: "Assume price is passed... OR fetch live price... otherwise default to error"
        throw new Error('Price (or estimated price) is required for buy orders to calculate lock amount');
      }

      const total = input.quantity * input.price;
      return {
        currency: symbolDef.quote,
        amount: total.toString(),
      };
    }
  }

  async placeOrder(input: PlaceOrderInput): Promise<any> {
    const lock = this.calculateLockAmount(input);

    // Note: input.accountId is treated as userId here to find the correct currency account
    const account = await this.accountService.getAccount(input.accountId, lock.currency as any);

    await this.accountService.lockFunds({
      accountId: account.id,
      amount: lock.amount,
    });

    let response;
    try {
      response = await this.engineClient.placeOrder(input);
    } catch (error) {
      await this.accountService.unlockFunds({
        accountId: account.id,
        amount: lock.amount,
      });
      throw error;
    }

    if (!response.success) {
      // Rollback lock if engine rejected or failed
      await this.accountService.unlockFunds({
        accountId: account.id,
        amount: lock.amount,
      });
    }

    return response;
  }
}
