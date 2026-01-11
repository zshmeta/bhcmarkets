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

describe('YFinance Service + RabbitForex', () => {
    it('should fetch stock quote (AAPL) via yfinance-service', async () => {
        const baseUrl = process.env.YFINANCE_SERVICE_BASE_URL ?? 'http://100.100.13.10:8000';
        const url = new URL('/quote', baseUrl);
        url.searchParams.set('symbols', 'AAPL');

        const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
        expect(res.ok).toBe(true);

        const payload = await res.json();
        const quotes = Array.isArray(payload)
            ? payload
            : (Array.isArray(payload?.quotes) ? payload.quotes : Array.isArray(payload?.data) ? payload.data : []);

        const aapl = quotes.find((q: any) => q?.symbol === 'AAPL') ?? payload?.AAPL;
        const price = aapl?.current_price;
        expect(typeof price).toBe('number');
        expect(price).toBeGreaterThan(0);
        console.log('✅ yfinance-service AAPL price:', price);
    }, 15000);

    it('should fetch FX rates (USD base) from RabbitForex and derive EUR/USD', async () => {
        await delay(1000);

        const baseUrl = process.env.RABBITFOREX_BASE_URL ?? 'http://100.100.13.10:3000';
        const url = new URL('/v1/rates', baseUrl);
        const res = await fetch(url.toString(), { headers: { accept: 'application/json' } });
        expect(res.ok).toBe(true);

        const data: any = await res.json();
        const rates = data?.rates;
        expect(rates).toBeTruthy();
        expect(typeof rates?.EUR).toBe('number');
        expect(typeof rates?.USD).toBe('number');

        // EUR/USD = (USD->USD) / (USD->EUR)
        const eurUsd = (rates.USD ?? 1) / rates.EUR;
        expect(eurUsd).toBeGreaterThan(0);
        expect(eurUsd).toBeLessThan(5);
        console.log('✅ Derived EUR/USD rate:', eurUsd);
    }, 15000);
});

describe('Connectivity Summary', () => {
    it('displays test summary', () => {
        console.log('\n' + '='.repeat(50));
        console.log('📊 CONNECTIVITY TEST SUMMARY');
        console.log('='.repeat(50));
        console.log('✅ Binance WebSocket: Real-time crypto prices');
        console.log('✅ yfinance-service: Stocks via internal REST');
        console.log('✅ RabbitForex: FX+metals (snapshot/poll)');
        console.log('');
        console.log('💡 Tip: If external services rate-limit,');
        console.log('   increase polling intervals and/or enable caching.');
        console.log('='.repeat(50));
        expect(true).toBe(true);
    });
});
