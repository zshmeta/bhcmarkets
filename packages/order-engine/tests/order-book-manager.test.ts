/**
 * Order Book Manager Tests
 * ========================
 *
 * These tests focus on multi-symbol behavior (routing + stats aggregation)
 * and the "symbol-tagged" event forwarding.
 */

import { describe, it, expect } from 'vitest';
import { randomUUID } from 'crypto';
import { OrderBookManager } from '../src/domains/matching/order-book-manager.js';
import type { EngineOrder } from '../src/types/order.types.js';

function createOrder(overrides: Partial<EngineOrder> = {}): EngineOrder {
  return {
    id: randomUUID(),
    accountId: 'account-1',
    symbol: 'BTC-USD',
    side: 'buy',
    type: 'limit',
    stopPrice: 0,
    quantity: 1,
    filledQuantity: 0,
    price: 50000,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe('OrderBookManager', () => {
  it('aggregates stats across symbols', () => {
    const manager = new OrderBookManager();

    // BTC: 2 bids @ 1 and 2 qty
    manager.processOrder(createOrder({ symbol: 'BTC-USD', side: 'buy', price: 50000, quantity: 1 }));
    manager.processOrder(createOrder({ symbol: 'BTC-USD', side: 'buy', price: 50000, quantity: 2 }));

    // ETH: 1 ask @ 3 qty
    manager.processOrder(createOrder({ symbol: 'ETH-USD', side: 'sell', price: 3000, quantity: 3 }));

    const stats = manager.getStats();

    expect(stats.totalSymbols).toBe(2);
    expect(stats.totalBidOrders).toBe(2);
    expect(stats.totalAskOrders).toBe(1);
    expect(stats.totalBidVolume).toBe(3);
    expect(stats.totalAskVolume).toBe(3);

    expect(stats.symbolStats.get('BTC-USD')?.bidOrders).toBe(2);
    expect(stats.symbolStats.get('BTC-USD')?.bidVolume).toBe(3);

    expect(stats.symbolStats.get('ETH-USD')?.askOrders).toBe(1);
    expect(stats.symbolStats.get('ETH-USD')?.askVolume).toBe(3);
  });

  it('forwards events with symbol context', () => {
    const manager = new OrderBookManager();

    const seen: Array<{ type: string; symbol: string }> = [];
    manager.onEvent((event) => {
      seen.push({ type: event.type, symbol: event.symbol });
    });

    manager.processOrder(createOrder({ symbol: 'BTC-USD', side: 'buy', price: 50000 }));

    // We don’t assert exact event ordering here, just that events carry symbol.
    expect(seen.length).toBeGreaterThan(0);
    expect(seen.every((e) => e.symbol === 'BTC-USD')).toBe(true);
  });
});
