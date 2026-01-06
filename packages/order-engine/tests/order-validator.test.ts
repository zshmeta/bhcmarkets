/**
 * Order Validator Tests
 * =====================
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { OrderValidator, destroyOrderValidator } from '../src/domains/orders/order-validator.js';

describe('OrderValidator', () => {
  let validator: OrderValidator;

  beforeEach(() => {
    validator = new OrderValidator({
      minQuantity: 0.001,
      maxQuantity: 1000,
      minPrice: 0.01,
      maxPrice: 100000,
      priceDeviationTolerance: 0.1, // 10%
    });
  });

  afterEach(() => {
    validator.destroy();
    destroyOrderValidator();
  });

  describe('Schema Validation', () => {
    it('should validate valid limit order', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
      });

      expect(result.valid).toBe(true);
      expect(result.order).toBeDefined();
    });

    it('should reject invalid account ID', () => {
      const result = validator.validate({
        accountId: 'invalid',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(expect.stringContaining('account'));
    });

    it('should reject invalid symbol format', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC USD!!',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('symbol'))).toBe(true);
    });

    it('should reject invalid order side', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'invalid',
        type: 'limit',
        quantity: 1,
        price: 50000,
      });

      expect(result.valid).toBe(false);
    });

    it('should require price for limit orders', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.toLowerCase().includes('price'))).toBe(true);
    });

    it('should not require price for market orders', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 1,
      });

      expect(result.valid).toBe(true);
    });

    it('should require stopPrice for stop orders', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'stop',
        quantity: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.toLowerCase().includes('price'))).toBe(true);
    });

    it('should require both price and stopPrice for stop_limit orders', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'stop_limit',
        quantity: 1,
        stopPrice: 50000,
        // Missing price
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Quantity Validation', () => {
    it('should reject quantity below minimum', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 0.0001, // Below 0.001 min
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('minimum'))).toBe(true);
    });

    it('should reject quantity above maximum', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 10000, // Above 1000 max
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('maximum'))).toBe(true);
    });

    it('should reject negative quantity', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: -1,
      });

      expect(result.valid).toBe(false);
    });
  });

  describe('Price Validation', () => {
    it('should reject price below minimum', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 0.001, // Below 0.01 min
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('minimum'))).toBe(true);
    });

    it('should reject price above maximum', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 200000, // Above 100000 max
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('maximum'))).toBe(true);
    });
  });

  describe('Price Deviation Check', () => {
    it('should reject price with high deviation from market', () => {
      validator.setMarketPrice('BTC-USD', 50000);

      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 60000, // 20% deviation
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('deviates'))).toBe(true);
    });

    it('should accept price within deviation tolerance', () => {
      validator.setMarketPrice('BTC-USD', 50000);

      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 52000, // 4% deviation (within 10%)
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Symbol Validation', () => {
    it('should reject unknown symbol when allowedSymbols is set', () => {
      validator.setAllowedSymbols(['BTC-USD', 'ETH-USD']);

      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'DOGE-USD',
        side: 'buy',
        type: 'market',
        quantity: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('not available'))).toBe(true);
    });

    it('should accept allowed symbol', () => {
      validator.setAllowedSymbols(['BTC-USD', 'ETH-USD']);

      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 1,
      });

      expect(result.valid).toBe(true);
    });
  });

  describe('Trading Enabled', () => {
    it('should reject all orders when trading disabled', () => {
      validator.setTradingEnabled(false);

      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 1,
      });

      expect(result.valid).toBe(false);
      expect(result.errors?.some(e => e.includes('disabled'))).toBe(true);
    });
  });

  describe('Time In Force', () => {
    it('should default to GTC', () => {
      const result = validator.validate({
        accountId: '00000000-0000-0000-0000-000000000001',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'market',
        quantity: 1,
      });

      expect(result.valid).toBe(true);
      expect(result.order?.timeInForce).toBe('GTC');
    });

    it('should accept valid time in force values', () => {
      for (const tif of ['GTC', 'IOC', 'FOK', 'GTD']) {
        const result = validator.validate({
          accountId: '00000000-0000-0000-0000-000000000001',
          symbol: 'BTC-USD',
          side: 'buy',
          type: 'market',
          quantity: 1,
          timeInForce: tif,
        });

        expect(result.valid).toBe(true);
      }
    });
  });
});
