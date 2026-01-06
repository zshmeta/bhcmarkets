/**
 * Order Book Tests
 * ================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { OrderBook } from '../src/domains/matching/order-book.js';
import type { EngineOrder } from '../src/types/order.types.js';

describe('OrderBook', () => {
  let orderBook: OrderBook;

  beforeEach(() => {
    orderBook = new OrderBook('BTC-USD');
  });

  const createOrder = (overrides: Partial<EngineOrder> = {}): EngineOrder => ({
    id: crypto.randomUUID(),
    accountId: 'account-1',
    symbol: 'BTC-USD',
    side: 'buy',
    type: 'limit',
    quantity: 1,
    filledQuantity: 0,
    price: 50000,
    timestamp: Date.now(),
    ...overrides,
  });

  describe('addOrder', () => {
    it('should add a buy order to bids', () => {
      const order = createOrder({ side: 'buy', price: 50000 });
      orderBook.addOrder(order);

      expect(orderBook.getBestBid()).toBe(50000);
    });

    it('should add a sell order to asks', () => {
      const order = createOrder({ side: 'sell', price: 51000 });
      orderBook.addOrder(order);

      expect(orderBook.getBestAsk()).toBe(51000);
    });

    it('should maintain price priority for bids (highest first)', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'buy', price: 51000 }));
      orderBook.addOrder(createOrder({ side: 'buy', price: 49000 }));

      expect(orderBook.getBestBid()).toBe(51000);
    });

    it('should maintain price priority for asks (lowest first)', () => {
      orderBook.addOrder(createOrder({ side: 'sell', price: 51000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 52000 }));

      expect(orderBook.getBestAsk()).toBe(50000);
    });

    it('should aggregate orders at same price level', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000, quantity: 1 }));
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000, quantity: 2 }));

      const snapshot = orderBook.getSnapshot(1);
      expect(snapshot.bids[0]?.quantity).toBe(3);
    });
  });

  describe('removeOrder', () => {
    it('should remove order and update level', () => {
      const order1 = createOrder({ side: 'buy', price: 50000, quantity: 1 });
      const order2 = createOrder({ side: 'buy', price: 50000, quantity: 2 });

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      orderBook.removeOrder(order1.id);

      const snapshot = orderBook.getSnapshot(1);
      expect(snapshot.bids[0]?.quantity).toBe(2);
    });

    it('should remove entire level when last order removed', () => {
      const order = createOrder({ side: 'buy', price: 50000 });
      orderBook.addOrder(order);
      orderBook.removeOrder(order.id);

      expect(orderBook.getBestBid()).toBeNull();
    });

    it('should return null for non-existent order', () => {
      const update = orderBook.removeOrder('non-existent');
      expect(update).toBeNull();
    });
  });

  describe('getSpread', () => {
    it('should return null when no orders', () => {
      expect(orderBook.getSpread()).toBeNull();
    });

    it('should return spread between best bid and ask', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100 }));

      expect(orderBook.getSpread()).toBe(100);
    });
  });

  describe('getMidPrice', () => {
    it('should return null when no orders', () => {
      expect(orderBook.getMidPrice()).toBeNull();
    });

    it('should return mid price', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100 }));

      expect(orderBook.getMidPrice()).toBe(50050);
    });
  });

  describe('getSnapshot', () => {
    it('should return correct snapshot', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000, quantity: 1 }));
      orderBook.addOrder(createOrder({ side: 'buy', price: 49900, quantity: 2 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100, quantity: 3 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50200, quantity: 4 }));

      const snapshot = orderBook.getSnapshot();

      expect(snapshot.symbol).toBe('BTC-USD');
      expect(snapshot.bids.length).toBe(2);
      expect(snapshot.asks.length).toBe(2);
      expect(snapshot.bids[0]?.price).toBe(50000);
      expect(snapshot.asks[0]?.price).toBe(50100);
    });

    it('should limit depth', () => {
      for (let i = 0; i < 50; i++) {
        orderBook.addOrder(createOrder({ side: 'buy', price: 50000 - i * 10 }));
        orderBook.addOrder(createOrder({ side: 'sell', price: 50100 + i * 10 }));
      }

      const snapshot = orderBook.getSnapshot(10);

      expect(snapshot.bids.length).toBe(10);
      expect(snapshot.asks.length).toBe(10);
    });
  });

  describe('getMatchingOrders', () => {
    it('should yield sell orders for buy side', () => {
      const order1 = createOrder({ side: 'sell', price: 50000, quantity: 1 });
      const order2 = createOrder({ side: 'sell', price: 50100, quantity: 2 });

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const matches = Array.from(orderBook.getMatchingOrders('buy'));

      expect(matches.length).toBe(2);
      expect(matches[0]?.price).toBe(50000); // Best ask first
    });

    it('should yield buy orders for sell side', () => {
      const order1 = createOrder({ side: 'buy', price: 50000, quantity: 1 });
      const order2 = createOrder({ side: 'buy', price: 50100, quantity: 2 });

      orderBook.addOrder(order1);
      orderBook.addOrder(order2);

      const matches = Array.from(orderBook.getMatchingOrders('sell'));

      expect(matches.length).toBe(2);
      expect(matches[0]?.price).toBe(50100); // Best bid first
    });

    it('should respect limit price for buy orders', () => {
      orderBook.addOrder(createOrder({ side: 'sell', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50200 }));

      const matches = Array.from(orderBook.getMatchingOrders('buy', 50100));

      expect(matches.length).toBe(2); // Only 50000 and 50100
    });
  });

  describe('flushUpdates', () => {
    it('should return and clear pending updates', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100 }));

      const updates1 = orderBook.flushUpdates();
      expect(updates1.length).toBe(2);

      const updates2 = orderBook.flushUpdates();
      expect(updates2.length).toBe(0);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000, quantity: 1 }));
      orderBook.addOrder(createOrder({ side: 'buy', price: 50000, quantity: 2 }));
      orderBook.addOrder(createOrder({ side: 'sell', price: 50100, quantity: 3 }));

      const stats = orderBook.getStats();

      expect(stats.bidLevels).toBe(1);
      expect(stats.askLevels).toBe(1);
      expect(stats.bidOrders).toBe(2);
      expect(stats.askOrders).toBe(1);
      expect(stats.totalBidVolume).toBe(3);
      expect(stats.totalAskVolume).toBe(3);
    });
  });
});
