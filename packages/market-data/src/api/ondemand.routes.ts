/**
 * On-Demand Data Routes
 * =====================
 *
 * REST API endpoints that fetch data on-demand when called.
 * Data is NOT continuously polled - only fetched when requested.
 *
 * ENDPOINTS:
 * - GET /api/fetch/quote/:symbol     - Fetch stock quote
 * - GET /api/fetch/forex/:pair       - Fetch forex rate (e.g., EUR/USD)
 * - GET /api/fetch/crypto/:symbol    - Fetch crypto price
 * - GET /api/fetch/batch             - Fetch multiple symbols
 * - GET /api/fetch/stats             - API call statistics
 *
 * DATA SOURCES:
 * - Primary: FMP (Financial Modeling Prep)
 * - Fallback: Yahoo Finance
 *
 * BENEFITS:
 * - Only uses API calls when actually needed
 * - Better for FMP's 250 calls/day limit
 * - Lower server resource usage
 */

import http from 'http';
import { URL } from 'url';
import { getFmpService } from '../domains/collectors/fmp.service.js';
import { logger } from '../utils/logger.js';
import type { NormalizedTick } from '../domains/collectors/collector.types.js';

const log = logger.child({ component: 'on-demand-api' });

/**
 * Response wrapper for on-demand endpoints.
 */
interface OnDemandResponse<T> {
    success: boolean;
    data: T | null;
    source: 'fmp' | 'yahoo' | 'cache';
    fetchedAt: number;
    cached: boolean;
    error?: string;
}

/**
 * Simple in-memory cache for recent fetches.
 * Prevents redundant API calls for the same symbol within a short window.
 */
class QuoteCache {
    private cache = new Map<string, { data: NormalizedTick; fetchedAt: number }>();
    private readonly ttlMs: number;

    constructor(ttlMs = 30000) {
        this.ttlMs = ttlMs;
    }

    get(key: string): NormalizedTick | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        if (Date.now() - entry.fetchedAt > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    set(key: string, data: NormalizedTick): void {
        this.cache.set(key, { data, fetchedAt: Date.now() });
    }

    clear(): void {
        this.cache.clear();
    }

    size(): number {
        return this.cache.size;
    }
}

// Cache with 30-second TTL
const quoteCache = new QuoteCache(30000);

/**
 * Handle on-demand fetch requests.
 *
 * @param req - HTTP request
 * @param res - HTTP response
 * @returns true if request was handled, false otherwise
 */
export async function handleOnDemandRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
): Promise<boolean> {
    const baseUrl = `http://${req.headers.host}`;
    const url = new URL(req.url || '/', baseUrl);
    const pathname = url.pathname;

    // Only handle /api/fetch/* routes
    if (!pathname.startsWith('/api/fetch/')) {
        return false;
    }

    res.setHeader('Content-Type', 'application/json');

    try {
        // GET /api/fetch/quote/:symbol
        const quoteMatch = pathname.match(/^\/api\/fetch\/quote\/(.+)$/);
        if (quoteMatch && quoteMatch[1]) {
            const symbol = decodeURIComponent(quoteMatch[1]).toUpperCase();
            const result = await fetchStockQuote(symbol);
            res.writeHead(result.success ? 200 : 404);
            res.end(JSON.stringify(result));
            return true;
        }

        // GET /api/fetch/forex/:pair (e.g., EUR/USD or EURUSD)
        const forexMatch = pathname.match(/^\/api\/fetch\/forex\/(.+)$/);
        if (forexMatch && forexMatch[1]) {
            const pair = decodeURIComponent(forexMatch[1]).toUpperCase();
            const result = await fetchForexRate(pair);
            res.writeHead(result.success ? 200 : 404);
            res.end(JSON.stringify(result));
            return true;
        }

        // GET /api/fetch/crypto/:symbol
        const cryptoMatch = pathname.match(/^\/api\/fetch\/crypto\/(.+)$/);
        if (cryptoMatch && cryptoMatch[1]) {
            const symbol = decodeURIComponent(cryptoMatch[1]).toUpperCase();
            const result = await fetchCryptoPrice(symbol);
            res.writeHead(result.success ? 200 : 404);
            res.end(JSON.stringify(result));
            return true;
        }

        // GET /api/fetch/batch?symbols=AAPL,GOOGL,MSFT
        if (pathname === '/api/fetch/batch') {
            const symbolsParam = url.searchParams.get('symbols');
            if (!symbolsParam) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Missing symbols parameter' }));
                return true;
            }

            const symbols = symbolsParam.split(',').map(s => s.trim().toUpperCase());
            const result = await fetchBatchQuotes(symbols);
            res.writeHead(200);
            res.end(JSON.stringify(result));
            return true;
        }

        // GET /api/fetch/stats
        if (pathname === '/api/fetch/stats') {
            const fmp = getFmpService();
            const stats = fmp.getStats();
            res.writeHead(200);
            res.end(JSON.stringify({
                fmp: stats,
                cache: {
                    size: quoteCache.size(),
                    ttlMs: 30000,
                },
                configured: fmp.isConfigured(),
            }));
            return true;
        }

        // Unknown /api/fetch/* route
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Unknown fetch endpoint' }));
        return true;

    } catch (error) {
        log.error({ error, pathname }, 'On-demand fetch error');
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Internal server error' }));
        return true;
    }
}

// ============================================================
// FETCH FUNCTIONS
// ============================================================

/**
 * Fetch stock quote with caching.
 */
async function fetchStockQuote(symbol: string): Promise<OnDemandResponse<NormalizedTick>> {
    const cacheKey = `stock:${symbol}`;

    // Check cache first
    const cached = quoteCache.get(cacheKey);
    if (cached) {
        return {
            success: true,
            data: cached,
            source: 'cache',
            fetchedAt: cached.timestamp,
            cached: true,
        };
    }

    // Try FMP first
    const fmp = getFmpService();
    if (fmp.isConfigured()) {
        const quote = await fmp.getQuote(symbol);
        if (quote) {
            quoteCache.set(cacheKey, quote);
            return {
                success: true,
                data: quote,
                source: 'fmp',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    }

    // Fallback to Yahoo
    try {
        const yahooFinance = await import('yahoo-finance2').then(m => m.default);
        const yahooQuote = await yahooFinance.quote(symbol);

        if (yahooQuote && yahooQuote.regularMarketPrice) {
            const tick: NormalizedTick = {
                symbol,
                last: yahooQuote.regularMarketPrice,
                bid: yahooQuote.bid || yahooQuote.regularMarketPrice,
                ask: yahooQuote.ask || yahooQuote.regularMarketPrice,
                volume: yahooQuote.regularMarketVolume || 0,
                changePercent: yahooQuote.regularMarketChangePercent || 0,
                timestamp: Date.now(),
                source: 'yahoo',
            };

            quoteCache.set(cacheKey, tick);
            return {
                success: true,
                data: tick,
                source: 'yahoo',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    } catch (error) {
        log.debug({ error, symbol }, 'Yahoo fallback failed');
    }

    return {
        success: false,
        data: null,
        source: 'fmp',
        fetchedAt: Date.now(),
        cached: false,
        error: 'Symbol not found',
    };
}

/**
 * Fetch forex rate.
 */
async function fetchForexRate(pair: string): Promise<OnDemandResponse<NormalizedTick>> {
    // Parse pair - handle both EUR/USD and EURUSD formats
    let from: string, to: string;
    if (pair.includes('/')) {
        [from, to] = pair.split('/');
    } else if (pair.length === 6) {
        from = pair.slice(0, 3);
        to = pair.slice(3, 6);
    } else {
        return {
            success: false,
            data: null,
            source: 'fmp',
            fetchedAt: Date.now(),
            cached: false,
            error: 'Invalid forex pair format. Use EUR/USD or EURUSD',
        };
    }

    const cacheKey = `forex:${from}/${to}`;
    const cached = quoteCache.get(cacheKey);
    if (cached) {
        return {
            success: true,
            data: cached,
            source: 'cache',
            fetchedAt: cached.timestamp,
            cached: true,
        };
    }

    // Try FMP
    const fmp = getFmpService();
    if (fmp.isConfigured()) {
        const rate = await fmp.getForexRate(from, to);
        if (rate) {
            quoteCache.set(cacheKey, rate);
            return {
                success: true,
                data: rate,
                source: 'fmp',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    }

    // Fallback to Yahoo
    try {
        const yahooFinance = await import('yahoo-finance2').then(m => m.default);
        const yahooSymbol = `${from}${to}=X`;
        const yahooQuote = await yahooFinance.quote(yahooSymbol);

        if (yahooQuote && yahooQuote.regularMarketPrice) {
            const tick: NormalizedTick = {
                symbol: `${from}/${to}`,
                last: yahooQuote.regularMarketPrice,
                bid: yahooQuote.bid || yahooQuote.regularMarketPrice,
                ask: yahooQuote.ask || yahooQuote.regularMarketPrice,
                volume: 0,
                changePercent: yahooQuote.regularMarketChangePercent || 0,
                timestamp: Date.now(),
                source: 'yahoo',
            };

            quoteCache.set(cacheKey, tick);
            return {
                success: true,
                data: tick,
                source: 'yahoo',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    } catch (error) {
        log.debug({ error, from, to }, 'Yahoo forex fallback failed');
    }

    return {
        success: false,
        data: null,
        source: 'fmp',
        fetchedAt: Date.now(),
        cached: false,
        error: 'Forex pair not found',
    };
}

/**
 * Fetch crypto price.
 */
async function fetchCryptoPrice(symbol: string): Promise<OnDemandResponse<NormalizedTick>> {
    const cacheKey = `crypto:${symbol}`;
    const cached = quoteCache.get(cacheKey);
    if (cached) {
        return {
            success: true,
            data: cached,
            source: 'cache',
            fetchedAt: cached.timestamp,
            cached: true,
        };
    }

    // Try FMP
    const fmp = getFmpService();
    if (fmp.isConfigured()) {
        const price = await fmp.getCryptoPrice(symbol);
        if (price) {
            quoteCache.set(cacheKey, price);
            return {
                success: true,
                data: price,
                source: 'fmp',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    }

    // Fallback to Yahoo
    try {
        const yahooFinance = await import('yahoo-finance2').then(m => m.default);
        const yahooSymbol = `${symbol}-USD`;
        const yahooQuote = await yahooFinance.quote(yahooSymbol);

        if (yahooQuote && yahooQuote.regularMarketPrice) {
            const tick: NormalizedTick = {
                symbol: `${symbol}/USD`,
                last: yahooQuote.regularMarketPrice,
                bid: yahooQuote.regularMarketPrice,
                ask: yahooQuote.regularMarketPrice,
                volume: yahooQuote.regularMarketVolume || 0,
                changePercent: yahooQuote.regularMarketChangePercent || 0,
                timestamp: Date.now(),
                source: 'yahoo',
            };

            quoteCache.set(cacheKey, tick);
            return {
                success: true,
                data: tick,
                source: 'yahoo',
                fetchedAt: Date.now(),
                cached: false,
            };
        }
    } catch (error) {
        log.debug({ error, symbol }, 'Yahoo crypto fallback failed');
    }

    return {
        success: false,
        data: null,
        source: 'fmp',
        fetchedAt: Date.now(),
        cached: false,
        error: 'Crypto not found',
    };
}

/**
 * Fetch multiple quotes in batch.
 */
async function fetchBatchQuotes(symbols: string[]): Promise<{
    success: boolean;
    data: Record<string, NormalizedTick>;
    sources: Record<string, string>;
    fetchedAt: number;
    fromCache: number;
    fromApi: number;
}> {
    const result: Record<string, NormalizedTick> = {};
    const sources: Record<string, string> = {};
    let fromCache = 0;
    let fromApi = 0;

    const fmp = getFmpService();
    const symbolsToFetch: string[] = [];

    // Check cache for each symbol
    for (const symbol of symbols) {
        const cacheKey = `stock:${symbol}`;
        const cached = quoteCache.get(cacheKey);
        if (cached) {
            result[symbol] = cached;
            sources[symbol] = 'cache';
            fromCache++;
        } else {
            symbolsToFetch.push(symbol);
        }
    }

    // Batch fetch remaining symbols from FMP
    if (symbolsToFetch.length > 0 && fmp.isConfigured()) {
        const quotes = await fmp.getQuotes(symbolsToFetch);
        for (const [symbol, tick] of quotes) {
            result[symbol] = tick;
            sources[symbol] = 'fmp';
            quoteCache.set(`stock:${symbol}`, tick);
            fromApi++;
        }

        // Check for symbols not returned by FMP
        for (const symbol of symbolsToFetch) {
            if (!result[symbol]) {
                sources[symbol] = 'not_found';
            }
        }
    }

    return {
        success: Object.keys(result).length > 0,
        data: result,
        sources,
        fetchedAt: Date.now(),
        fromCache,
        fromApi,
    };
}
