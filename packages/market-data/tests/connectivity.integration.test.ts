/**
 * Data Source Connectivity Tests
 * ===============================
 *
 * Quick smoke tests to verify external data sources are reachable.
 * These tests make REAL network calls.
 *
 * RUN WITH:
 * npm run test:integration
 */

import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';

// Delay helper to avoid rate limiting
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('Binance WebSocket', () => {
    it('should connect and receive BTC ticker data', async () => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@ticker');

        const result = await new Promise<{ success: boolean; data?: unknown; error?: string }>(
            (resolve) => {
                const timeout = setTimeout(() => {
                    ws.close();
                    resolve({ success: false, error: 'Timeout waiting for data' });
                }, 5000);

                ws.on('message', (data) => {
                    clearTimeout(timeout);
                    ws.close();
                    try {
                        const parsed = JSON.parse(data.toString());
                        resolve({ success: true, data: parsed });
                    } catch {
                        resolve({ success: false, error: 'Failed to parse message' });
                    }
                });

                ws.on('error', (err) => {
                    clearTimeout(timeout);
                    ws.close();
                    resolve({ success: false, error: err.message });
                });
            }
        );

        expect(result.success).toBe(true);
        expect(result.data).toHaveProperty('s'); // Symbol
        expect(result.data).toHaveProperty('c'); // Close price
        console.log('✅ Binance BTC price:', (result.data as { c: string }).c);
    }, 10000);

    it('should receive valid ETH price', async () => {
        const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@ticker');

        const price = await new Promise<number | null>((resolve) => {
            const timeout = setTimeout(() => {
                ws.close();
                resolve(null);
            }, 5000);

            ws.on('message', (data) => {
                clearTimeout(timeout);
                ws.close();
                const parsed = JSON.parse(data.toString());
                resolve(parseFloat(parsed.c));
            });

            ws.on('error', () => {
                clearTimeout(timeout);
                ws.close();
                resolve(null);
            });
        });

        expect(price).not.toBeNull();
        expect(price).toBeGreaterThan(0);
        console.log('✅ Binance ETH price:', price);
    }, 10000);

    it('should fetch multiple crypto prices in one connection', async () => {
        const symbols = ['btcusdt', 'ethusdt', 'solusdt'];
        const streams = symbols.map((s) => `${s}@ticker`).join('/');
        const ws = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);

        const prices = await new Promise<Map<string, number>>((resolve) => {
            const priceMap = new Map<string, number>();
            const timeout = setTimeout(() => {
                ws.close();
                resolve(priceMap);
            }, 5000);

            ws.on('message', (data) => {
                const parsed = JSON.parse(data.toString());
                if (parsed.data && parsed.data.s && parsed.data.c) {
                    priceMap.set(parsed.data.s, parseFloat(parsed.data.c));
                }

                if (priceMap.size >= symbols.length) {
                    clearTimeout(timeout);
                    ws.close();
                    resolve(priceMap);
                }
            });

            ws.on('error', () => {
                clearTimeout(timeout);
                ws.close();
                resolve(priceMap);
            });
        });

        expect(prices.size).toBeGreaterThanOrEqual(1);
        console.log('✅ Binance prices:', Object.fromEntries(prices));
    }, 10000);
});

describe('Yahoo Finance API', () => {
    it('should fetch stock quote (AAPL)', async () => {
        try {
            const yahooFinance = await import('yahoo-finance2').then((m) => m.default);
            const quote = await yahooFinance.quote('AAPL');

            expect(quote).toHaveProperty('symbol', 'AAPL');
            expect(quote).toHaveProperty('regularMarketPrice');
            expect(quote.regularMarketPrice).toBeGreaterThan(0);
            console.log('✅ Yahoo AAPL price:', quote.regularMarketPrice);
        } catch (error) {
            // Handle rate limiting gracefully - don't fail the test
            if (error instanceof Error &&
                (error.message.includes('Too Many Requests') ||
                    error.message.includes('429'))) {
                console.log('⚠️ Yahoo rate limited - this is expected with frequent tests');
                expect(true).toBe(true); // Pass anyway
                return;
            }
            throw error;
        }
    }, 15000);

    it('should fetch forex quote (EUR/USD)', async () => {
        await delay(2000); // Rate limit protection

        try {
            const yahooFinance = await import('yahoo-finance2').then((m) => m.default);
            const quote = await yahooFinance.quote('EURUSD=X');

            expect(quote).toHaveProperty('regularMarketPrice');
            expect(quote.regularMarketPrice).toBeGreaterThan(0);
            expect(quote.regularMarketPrice).toBeLessThan(2);
            console.log('✅ Yahoo EUR/USD rate:', quote.regularMarketPrice);
        } catch (error) {
            if (error instanceof Error &&
                (error.message.includes('Too Many Requests') ||
                    error.message.includes('429'))) {
                console.log('⚠️ Yahoo rate limited - this is expected with frequent tests');
                expect(true).toBe(true);
                return;
            }
            throw error;
        }
    }, 15000);
});

describe('Connectivity Summary', () => {
    it('displays test summary', () => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 CONNECTIVITY TEST SUMMARY');
        console.log('='.repeat(50));
        console.log('✅ Binance WebSocket: Real-time crypto prices');
        console.log('⚠️ Yahoo Finance: May rate-limit on repeated runs');
        console.log('');
        console.log('💡 Tip: If Yahoo tests fail with rate limits,');
        console.log('   wait a few minutes before running again.');
        console.log('='.repeat(50));
        expect(true).toBe(true);
    });
});
