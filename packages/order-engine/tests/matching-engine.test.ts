/**
 * Matching Engine Tests
 * =====================
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MatchingEngine } from '../src/domains/matching/matching-engine.js';
import type { EngineOrder } from '../src/types/order.types.js';

describe('MatchingEngine', () => {
  let engine: MatchingEngine;

  beforeEach(() => {
    engine = new MatchingEngine('BTC-USD');
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

  describe('Limit Orders', () => {
    it('should add limit order to book when no match', () => {
      const order = createOrder({ side: 'buy', price: 50000 });
      const result = engine.processOrder(order, 'GTC');

      expect(result.status).toBe('open');
      expect(result.trades.length).toBe(0);
      expect(engine.orderBook.getBestBid()).toBe(50000);
    });

    it('should match buy order against sell orders', () => {
      // Add sell order
      const sellOrder = createOrder({
        id: 'sell-1',
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      });
      engine.processOrder(sellOrder, 'GTC');

      // Add buy order that crosses
      const buyOrder = createOrder({
        id: 'buy-1',
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 1,
      });
      const result = engine.processOrder(buyOrder, 'GTC');

      expect(result.status).toBe('filled');
      expect(result.trades.length).toBe(1);
      expect(result.trades[0]?.price).toBe(50000);
      expect(result.trades[0]?.quantity).toBe(1);
    });

    it('should match at maker price', () => {
      // Sell at 50000
      const sellOrder = createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      });
      engine.processOrder(sellOrder, 'GTC');

      // Buy at 50100 (willing to pay more)
      const buyOrder = createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50100,
        quantity: 1,
      });
      const result = engine.processOrder(buyOrder, 'GTC');

      // Trade at maker (sell) price
      expect(result.trades[0]?.price).toBe(50000);
    });

    it('should partially fill order', () => {
      // Sell 1
      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      // Buy 2
      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 2,
      }), 'GTC');

      expect(result.status).toBe('partially_filled');
      expect(result.filledQuantity).toBe(1);
      expect(result.remainingQuantity).toBe(1);
    });

    it('should match multiple makers', () => {
      // Add multiple sell orders
      engine.processOrder(createOrder({
        accountId: 'seller1',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      engine.processOrder(createOrder({
        accountId: 'seller2',
        side: 'sell',
        price: 50100,
        quantity: 1,
      }), 'GTC');

      // Buy 2
      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50200,
        quantity: 2,
      }), 'GTC');

      expect(result.status).toBe('filled');
      expect(result.trades.length).toBe(2);
      expect(result.filledQuantity).toBe(2);
    });
  });

  describe('Market Orders', () => {
    it('should reject market order with no liquidity', () => {
      const order = createOrder({ type: 'market', price: 0 });
      const result = engine.processOrder(order, 'GTC');

      expect(result.status).toBe('rejected');
      expect(result.rejectReason).toContain('liquidity');
    });

    it('should execute market order at best price', () => {
      // Add sell orders
      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      // Market buy
      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        type: 'market',
        quantity: 1,
      }), 'GTC');

      expect(result.status).toBe('filled');
      expect(result.trades[0]?.price).toBe(50000);
    });

    it('should execute market order across multiple price levels', () => {
      engine.processOrder(createOrder({
        accountId: 'seller1',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      engine.processOrder(createOrder({
        accountId: 'seller2',
        side: 'sell',
        price: 50100,
        quantity: 1,
      }), 'GTC');

      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        type: 'market',
        quantity: 2,
      }), 'GTC');

      expect(result.status).toBe('filled');
      expect(result.trades.length).toBe(2);
    });
  });

  describe('Time In Force', () => {
    it('IOC should cancel unfilled portion', () => {
      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 2,
      }), 'IOC');

      expect(result.status).toBe('partially_filled');
      expect(result.filledQuantity).toBe(1);
      // Remaining is cancelled, not added to book
      expect(engine.orderBook.getBestBid()).toBeNull();
    });

    it('FOK should reject if cannot fill entirely', () => {
      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 2,
      }), 'FOK');

      expect(result.status).toBe('rejected');
      expect(result.rejectReason).toContain('FOK');
    });

    it('FOK should fill if liquidity is sufficient', () => {
      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 2,
      }), 'GTC');

      const result = engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 2,
      }), 'FOK');

      expect(result.status).toBe('filled');
    });
  });

  describe('Cancel Order', () => {
    it('should cancel order and remove from book', () => {
      const order = createOrder({ side: 'buy', price: 50000 });
      engine.processOrder(order, 'GTC');

      const result = engine.cancelOrder(order.id);

      expect(result.status).toBe('cancelled');
      expect(engine.orderBook.getBestBid()).toBeNull();
    });

    it('should fail to cancel non-existent order', () => {
      const result = engine.cancelOrder('non-existent');

      expect(result.status).toBe('rejected');
      expect(result.rejectReason).toContain('not found');
    });
  });

  describe('Events', () => {
    it('should emit trade events', () => {
      const events: any[] = [];
      engine.onEvent((event) => events.push(event));

      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      const tradeEvents = events.filter((e) => e.type === 'trade');
      expect(tradeEvents.length).toBe(1);
    });

    it('should emit order_filled event', () => {
      const events: any[] = [];
      engine.onEvent((event) => events.push(event));

      engine.processOrder(createOrder({
        accountId: 'seller',
        side: 'sell',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      engine.processOrder(createOrder({
        accountId: 'buyer',
        side: 'buy',
        price: 50000,
        quantity: 1,
      }), 'GTC');

      const filledEvents = events.filter((e) => e.type === 'order_filled');
      expect(filledEvents.length).toBe(2); // Both maker and taker filled
    });
  });
});
