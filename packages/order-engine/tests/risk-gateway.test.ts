/**
 * Risk Gateway Tests
 * ==================
 *
 * Tests for the fast pre-trade risk gateway.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
    RiskGateway,
    createRiskGateway,
    getDefaultSymbolLimits,
    type RiskOrderInput,
    type CachedSymbolLimits,
} from '../src/risk-gateway.js';

describe('RiskGateway', () => {
    let gateway: RiskGateway;

    const mockOrder: RiskOrderInput = {
        accountId: 'account-1',
        userId: 'user-1',
        symbol: 'BTC-USD',
        side: 'buy',
        type: 'limit',
        quantity: 1,
        price: 50000,
    };

    const btcLimits: CachedSymbolLimits = {
        symbol: 'BTC-USD',
        tradingEnabled: true,
        minOrderSize: 1,
        maxOrderSize: 100,
        maxPriceDeviation: 0.1, // 10%
        maxUserPosition: 10,
        tickSize: 0.01,
        lotSize: 1, // Match test quantities for clean math
        updatedAt: new Date(),
    };

    beforeEach(() => {
        gateway = createRiskGateway();
        gateway.setSymbolLimits(btcLimits);
    });

    afterEach(() => {
        gateway.stopAutoRefresh();
    });

    describe('Basic Checks', () => {
        it('should approve valid order', async () => {
            const result = await gateway.quickCheck(mockOrder);
            expect(result.approved).toBe(true);
        });

        it('should reject when circuit breaker is active', async () => {
            gateway.activateCircuitBreaker();

            const result = await gateway.quickCheck(mockOrder);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('CIRCUIT_BREAKER_ACTIVE');
            }
        });

        it('should approve after circuit breaker deactivated', async () => {
            gateway.activateCircuitBreaker();
            gateway.deactivateCircuitBreaker();

            const result = await gateway.quickCheck(mockOrder);
            expect(result.approved).toBe(true);
        });

        it('should reject when global trading disabled', async () => {
            gateway.setGlobalTrading(false);

            const result = await gateway.quickCheck(mockOrder);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('TRADING_DISABLED');
            }
        });

        it('should reject unknown symbol', async () => {
            const order = { ...mockOrder, symbol: 'UNKNOWN-USD' };

            const result = await gateway.quickCheck(order);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('SYMBOL_NOT_CONFIGURED');
            }
        });

        it('should reject when symbol trading disabled', async () => {
            gateway.setSymbolLimits({ ...btcLimits, tradingEnabled: false });

            const result = await gateway.quickCheck(mockOrder);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('SYMBOL_NOT_TRADABLE');
            }
        });
    });

    describe('Order Size Validation', () => {
        it('should reject order below minimum size', async () => {
            const order = { ...mockOrder, quantity: 0.5 }; // Below 1 min

            const result = await gateway.quickCheck(order);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('ORDER_SIZE_TOO_SMALL');
            }
        });

        it('should reject order above maximum size', async () => {
            const order = { ...mockOrder, quantity: 150 }; // Above 100 max

            const result = await gateway.quickCheck(order);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('ORDER_SIZE_TOO_LARGE');
            }
        });

        it('should approve order at minimum size', async () => {
            const order = { ...mockOrder, quantity: 1 }; // Exactly at min

            const result = await gateway.quickCheck(order);
            expect(result.approved).toBe(true);
        });

        it('should approve order at maximum size', async () => {
            const order = { ...mockOrder, quantity: 100 };

            const result = await gateway.quickCheck(order);
            expect(result.approved).toBe(true);
        });
    });

    describe('Price Deviation Check', () => {
        beforeEach(() => {
            gateway.updatePrice('BTC-USD', 50000); // Set market price
        });

        it('should approve limit order within deviation', async () => {
            const order = { ...mockOrder, price: 52000 }; // 4% above market

            const result = await gateway.quickCheck(order);
            expect(result.approved).toBe(true);
        });

        it('should reject limit order exceeding deviation', async () => {
            const order = { ...mockOrder, price: 60000 }; // 20% above market

            const result = await gateway.quickCheck(order);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('PRICE_DEVIATION');
            }
        });

        it('should skip deviation check for market orders', async () => {
            const order: RiskOrderInput = {
                ...mockOrder,
                type: 'market',
                price: undefined,
            };

            const result = await gateway.quickCheck(order);
            expect(result.approved).toBe(true);
        });

        it('should skip deviation check when price unavailable', async () => {
            gateway = createRiskGateway(); // Fresh gateway with no price
            gateway.setSymbolLimits(btcLimits);

            const order = { ...mockOrder, price: 60000 };

            const result = await gateway.quickCheck(order);
            expect(result.approved).toBe(true);
            if (result.approved && result.warnings) {
                expect(result.warnings).toContain('Market price unavailable for deviation check');
            }
        });
    });

    describe('User Restrictions', () => {
        it('should reject restricted user', async () => {
            gateway.setUserLimits({
                userId: 'user-1',
                dailyLossLimit: 10000,
                maxOrdersPerMinute: 100,
                maxSymbolPositionValue: 1000000,
                tradingRestricted: true,
                updatedAt: new Date(),
            });

            const result = await gateway.quickCheck(mockOrder);

            expect(result.approved).toBe(false);
            if (!result.approved) {
                expect(result.code).toBe('ACCOUNT_RESTRICTED');
            }
        });

        it('should approve unrestricted user', async () => {
            gateway.setUserLimits({
                userId: 'user-1',
                dailyLossLimit: 10000,
                maxOrdersPerMinute: 100,
                maxSymbolPositionValue: 1000000,
                tradingRestricted: false,
                updatedAt: new Date(),
            });

            const result = await gateway.quickCheck(mockOrder);
            expect(result.approved).toBe(true);
        });
    });

    describe('Backend Delegation', () => {
        it('should delegate to backend when configured', async () => {
            const mockBackend = {
                validatePreTrade: vi.fn().mockResolvedValue({ approved: true }),
                getSymbolLimits: vi.fn(),
                getUserLimits: vi.fn(),
                getAllSymbolLimits: vi.fn(),
            };

            gateway = createRiskGateway({ riskService: mockBackend });
            gateway.setSymbolLimits(btcLimits);

            await gateway.quickCheck(mockOrder);

            expect(mockBackend.validatePreTrade).toHaveBeenCalledWith(mockOrder);
        });

        it('should delegate unknown symbols to backend', async () => {
            const mockBackend = {
                validatePreTrade: vi.fn().mockResolvedValue({ approved: true }),
                getSymbolLimits: vi.fn(),
                getUserLimits: vi.fn(),
                getAllSymbolLimits: vi.fn(),
            };

            gateway = createRiskGateway({ riskService: mockBackend });
            // Don't set limits for ETH-USD

            await gateway.quickCheck({ ...mockOrder, symbol: 'ETH-USD' });

            expect(mockBackend.validatePreTrade).toHaveBeenCalled();
        });
    });

    describe('Statistics', () => {
        it('should return correct stats', () => {
            gateway.setSymbolLimits(btcLimits);
            gateway.setSymbolLimits({ ...btcLimits, symbol: 'ETH-USD' });
            gateway.updatePrice('BTC-USD', 50000);

            const stats = gateway.getStats();

            expect(stats.symbolsInCache).toBe(2);
            expect(stats.pricesInCache).toBe(1);
            expect(stats.circuitBreakerActive).toBe(false);
            expect(stats.globalTradingEnabled).toBe(true);
        });
    });

    describe('Default Limits', () => {
        it('should return crypto defaults for BTC', () => {
            const limits = getDefaultSymbolLimits('BTC-USD');

            expect(limits.minOrderSize).toBe(0.0001);
            expect(limits.maxOrderSize).toBe(100);
            expect(limits.lotSize).toBe(0.0001);
        });

        it('should return forex defaults for EUR', () => {
            const limits = getDefaultSymbolLimits('EUR/USD');

            expect(limits.minOrderSize).toBe(0.01);
            expect(limits.maxOrderSize).toBe(10_000_000);
        });

        it('should return commodity defaults for unknown', () => {
            const limits = getDefaultSymbolLimits('GOLD-USD');

            expect(limits.minOrderSize).toBe(0.01);
            expect(limits.maxOrderSize).toBe(10000);
        });
    });
});
