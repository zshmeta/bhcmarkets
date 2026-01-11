/**
 * Order Manager Stop Orders Tests
 * ===============================
 *
 * This is a small end-to-end-ish unit test:
 * - place a maker limit order (liquidity)
 * - place a stop order
 * - move market price to trigger the stop
 * - ensure the book reflects the execution
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { OrderManager } from '../src/domains/orders/order-manager.js';

describe('OrderManager stop orders', () => {
  it('triggers a buy stop order when price crosses up', async () => {
    const manager = new OrderManager({
      enablePersistence: false,
      enableEventPublishing: false,
      // Keep this large so the internal flush path won't run during the test.
      tradeBatchSize: 10_000,
      tradeFlushIntervalMs: 60_000,
    });

    const buyerAccountId = randomUUID();
    const sellerAccountId = randomUUID();

    // Provide an initial market price so deviation checks (if enabled) have a baseline.
    await manager.updateMarketPrice('BTC-USD', 50_000);

    // 1) Maker liquidity: a resting sell limit.
    const sell = await manager.placeOrder({
      accountId: sellerAccountId,
      symbol: 'BTC-USD',
      side: 'sell',
      type: 'limit',
      quantity: 1,
      price: 51_000,
      timeInForce: 'GTC',
    } as any);

    expect(sell.success).toBe(true);

    // 2) Stop order (buy) that triggers at 51_000.
    const stopBuy = await manager.placeOrder({
      accountId: buyerAccountId,
      symbol: 'BTC-USD',
      side: 'buy',
      type: 'stop',
      quantity: 1,
      stopPrice: 51_000,
      timeInForce: 'GTC',
    } as any);

    expect(stopBuy.success).toBe(true);

    // 3) Move market price up to trigger.
    await manager.updateMarketPrice('BTC-USD', 51_000);

    // 4) The resting ask should be consumed by the triggered market buy.
    const snapshot = manager.getOrderBookSnapshot('BTC-USD', 5);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.asks.length).toBe(0);
  });
});
