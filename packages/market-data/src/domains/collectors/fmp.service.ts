/**
 * FMP (Financial Modeling Prep) Service
 * ======================================
 *
 * On-demand data fetching from Financial Modeling Prep API.
 * Unlike the continuous collectors, this service only fetches
 * data when explicitly requested.
 *
 * FREE TIER: 250 API calls per day
 *
 * SUPPORTED ENDPOINTS:
 * - /quote/{symbol} - Real-time quote
 * - /fx/{pair} - Forex rates
 * - /quote/{crypto}USD - Crypto prices
 * - /historical-price-full/{symbol} - Historical data
 *
 * USAGE:
 * ```typescript
 * const fmp = new FmpService('your-api-key');
 * const quote = await fmp.getQuote('AAPL');
 * const forex = await fmp.getForexRate('EUR', 'USD');
 * const crypto = await fmp.getCryptoPrice('BTC');
 * ```
 */

import { logger } from '../../utils/logger.js';
import { retry } from '../../utils/retry.js';
import type { NormalizedTick } from '../collectors/collector.types.js';

const log = logger.child({ component: 'fmp-service' });

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

/**
 * FMP Quote response structure.
 */
interface FmpQuote {
    symbol: string;
    name: string;
    price: number;
    changesPercentage: number;
    change: number;
    dayLow: number;
    dayHigh: number;
    yearHigh: number;
    yearLow: number;
    marketCap: number;
    priceAvg50: number;
    priceAvg200: number;
    volume: number;
    avgVolume: number;
    exchange: string;
    open: number;
    previousClose: number;
    eps: number;
    pe: number;
    earningsAnnouncement: string;
    sharesOutstanding: number;
    timestamp: number;
}

/**
 * FMP Forex response structure.
 */
interface FmpForex {
    ticker: string;
    bid: number;
    ask: number;
    open: number;
    low: number;
    high: number;
    changes: number;
    date: string;
}

/**
 * Service statistics.
 */
interface FmpStats {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    lastCallAt: number | null;
    remainingCalls: number; // Estimated based on 250/day limit
}

/**
 * On-demand data fetching service using FMP API.
 */
export class FmpService {
    private apiKey: string;
    private stats: FmpStats = {
        totalCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        lastCallAt: null,
        remainingCalls: 250,
    };

    // Track daily reset
    private dailyResetDate: string = new Date().toISOString().split('T')[0] as string;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.FMP_API_KEY || '';

        if (!this.apiKey) {
            log.warn('FMP_API_KEY not configured - FMP service will not work');
        }
    }

    /**
     * Check if the service is configured.
     */
    isConfigured(): boolean {
        return this.apiKey.length > 0;
    }

    /**
     * Get a stock quote.
     *
     * @param symbol - Stock symbol (e.g., 'AAPL', 'GOOGL')
     */
    async getQuote(symbol: string): Promise<NormalizedTick | null> {
        if (!this.isConfigured()) {
            log.warn('FMP not configured');
            return null;
        }

        try {
            const data = await this.fetchWithRetry<FmpQuote[]>(
                `/quote/${symbol.toUpperCase()}`
            );

            if (!data || data.length === 0) {
                return null;
            }

            const quote = data[0];
            if (!quote) return null;
            return this.normalizeStockQuote(quote);
        } catch (error) {
            log.error({ error, symbol }, 'Failed to fetch FMP quote');
            return null;
        }
    }

    /**
     * Get multiple stock quotes in one call.
     *
     * @param symbols - Array of stock symbols
     */
    async getQuotes(symbols: string[]): Promise<Map<string, NormalizedTick>> {
        if (!this.isConfigured() || symbols.length === 0) {
            return new Map();
        }

        try {
            const symbolList = symbols.map(s => s.toUpperCase()).join(',');
            const data = await this.fetchWithRetry<FmpQuote[]>(`/quote/${symbolList}`);

            const result = new Map<string, NormalizedTick>();
            if (data) {
                for (const quote of data) {
                    const tick = this.normalizeStockQuote(quote);
                    if (tick) {
                        result.set(tick.symbol, tick);
                    }
                }
            }
            return result;
        } catch (error) {
            log.error({ error, symbols }, 'Failed to fetch FMP quotes');
            return new Map();
        }
    }

    /**
     * Get forex rate.
     *
     * @param from - Base currency (e.g., 'EUR')
     * @param to - Quote currency (e.g., 'USD')
     */
    async getForexRate(from: string, to: string): Promise<NormalizedTick | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const pair = `${from.toUpperCase()}${to.toUpperCase()}`;
            const data = await this.fetchWithRetry<FmpForex[]>(`/fx/${pair}`);

            if (!data || data.length === 0) {
                return null;
            }

            const rate = data[0];
            if (!rate) return null;
            return this.normalizeForexQuote(rate, from, to);
        } catch (error) {
            log.error({ error, from, to }, 'Failed to fetch FMP forex rate');
            return null;
        }
    }

    /**
     * Get all major forex rates.
     */
    async getAllForexRates(): Promise<Map<string, NormalizedTick>> {
        if (!this.isConfigured()) {
            return new Map();
        }

        try {
            const data = await this.fetchWithRetry<FmpForex[]>('/fx');
            const result = new Map<string, NormalizedTick>();

            if (data) {
                for (const rate of data) {
                    // Parse ticker like "EUR/USD"
                    const [from, to] = rate.ticker.split('/');
                    if (from && to) {
                        const tick = this.normalizeForexQuote(rate, from, to);
                        if (tick) {
                            result.set(tick.symbol, tick);
                        }
                    }
                }
            }
            return result;
        } catch (error) {
            log.error({ error }, 'Failed to fetch FMP forex rates');
            return new Map();
        }
    }

    /**
     * Get cryptocurrency price.
     *
     * @param symbol - Crypto symbol (e.g., 'BTC', 'ETH')
     */
    async getCryptoPrice(symbol: string): Promise<NormalizedTick | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            // FMP uses format like 'BTCUSD' for crypto
            const pair = `${symbol.toUpperCase()}USD`;
            const data = await this.fetchWithRetry<FmpQuote[]>(`/quote/${pair}`);

            if (!data || data.length === 0) {
                return null;
            }

            const quote = data[0];
            if (!quote) return null;
            return this.normalizeCryptoQuote(quote, symbol);
        } catch (error) {
            log.error({ error, symbol }, 'Failed to fetch FMP crypto price');
            return null;
        }
    }

    /**
     * Get commodity price.
     *
     * @param symbol - Commodity symbol (e.g., 'GCUSD' for gold)
     */
    async getCommodityPrice(symbol: string): Promise<NormalizedTick | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            const data = await this.fetchWithRetry<FmpQuote[]>(`/quote/${symbol}`);

            if (!data || data.length === 0) {
                return null;
            }

            const quote = data[0];
            if (!quote) return null;
            return this.normalizeCommodityQuote(quote);
        } catch (error) {
            log.error({ error, symbol }, 'Failed to fetch FMP commodity price');
            return null;
        }
    }

    /**
     * Get index value.
     *
     * @param symbol - Index symbol (e.g., '^GSPC' for S&P 500)
     */
    async getIndexValue(symbol: string): Promise<NormalizedTick | null> {
        if (!this.isConfigured()) {
            return null;
        }

        try {
            // FMP uses different format for indices
            const fmpSymbol = symbol.replace('^', '%5E');
            const data = await this.fetchWithRetry<FmpQuote[]>(`/quote/${fmpSymbol}`);

            if (!data || data.length === 0) {
                return null;
            }

            const quote = data[0];
            if (!quote) return null;
            return this.normalizeIndexQuote(quote, symbol);
        } catch (error) {
            log.error({ error, symbol }, 'Failed to fetch FMP index value');
            return null;
        }
    }

    /**
     * Get service statistics.
     */
    getStats(): FmpStats {
        // Reset daily counter if it's a new day
        const today = new Date().toISOString().split('T')[0] as string;
        if (today !== this.dailyResetDate) {
            this.dailyResetDate = today;
            this.stats.remainingCalls = 250;
            this.stats.totalCalls = 0;
            this.stats.successfulCalls = 0;
            this.stats.failedCalls = 0;
        }
        return { ...this.stats };
    }

    // ============================================================
    // PRIVATE METHODS
    // ============================================================

    /**
     * Fetch data from FMP API with retry logic.
     */
    private async fetchWithRetry<T>(endpoint: string): Promise<T | null> {
        const url = `${FMP_BASE_URL}${endpoint}?apikey=${this.apiKey}`;

        this.stats.totalCalls++;
        this.stats.remainingCalls = Math.max(0, this.stats.remainingCalls - 1);
        this.stats.lastCallAt = Date.now();

        try {
            const result = await retry(
                async () => {
                    const response = await fetch(url);

                    if (!response.ok) {
                        if (response.status === 429) {
                            throw new Error('Rate limited');
                        }
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    return response.json() as Promise<T>;
                },
                {
                    maxAttempts: 3,
                    initialDelay: 1000,
                    isRetryable: (error) => {
                        if (error instanceof Error) {
                            return error.message.includes('Rate limited') ||
                                error.message.includes('fetch failed');
                        }
                        return false;
                    },
                }
            );

            this.stats.successfulCalls++;
            return result;
        } catch (error) {
            this.stats.failedCalls++;
            throw error;
        }
    }

    /**
     * Normalize FMP stock quote to our standard format.
     */
    private normalizeStockQuote(quote: FmpQuote): NormalizedTick {
        return {
            symbol: quote.symbol,
            last: quote.price,
            bid: quote.price - 0.01, // FMP doesn't provide bid/ask for stocks
            ask: quote.price + 0.01,
            volume: quote.volume,
            changePercent: quote.changesPercentage,
            timestamp: quote.timestamp * 1000 || Date.now(),
            source: 'fmp',
        };
    }

    /**
     * Normalize FMP forex quote.
     */
    private normalizeForexQuote(
        rate: FmpForex,
        from: string,
        to: string
    ): NormalizedTick {
        const mid = (rate.bid + rate.ask) / 2;
        return {
            symbol: `${from}/${to}`,
            last: mid,
            bid: rate.bid,
            ask: rate.ask,
            volume: 0,
            changePercent: rate.changes,
            timestamp: Date.now(),
            source: 'fmp',
        };
    }

    /**
     * Normalize FMP crypto quote.
     */
    private normalizeCryptoQuote(quote: FmpQuote, symbol: string): NormalizedTick {
        return {
            symbol: `${symbol}/USD`,
            last: quote.price,
            bid: quote.price * 0.9999,
            ask: quote.price * 1.0001,
            volume: quote.volume,
            changePercent: quote.changesPercentage,
            timestamp: quote.timestamp * 1000 || Date.now(),
            source: 'fmp',
        };
    }

    /**
     * Normalize FMP commodity quote.
     */
    private normalizeCommodityQuote(quote: FmpQuote): NormalizedTick {
        return {
            symbol: quote.symbol,
            last: quote.price,
            bid: quote.price,
            ask: quote.price,
            volume: quote.volume,
            changePercent: quote.changesPercentage,
            timestamp: quote.timestamp * 1000 || Date.now(),
            source: 'fmp',
        };
    }

    /**
     * Normalize FMP index quote.
     */
    private normalizeIndexQuote(quote: FmpQuote, originalSymbol: string): NormalizedTick {
        return {
            symbol: originalSymbol,
            last: quote.price,
            bid: quote.price,
            ask: quote.price,
            volume: quote.volume,
            changePercent: quote.changesPercentage,
            timestamp: quote.timestamp * 1000 || Date.now(),
            source: 'fmp',
        };
    }
}

// Singleton instance
let fmpServiceInstance: FmpService | null = null;

/**
 * Get or create the FMP service singleton.
 */
export function getFmpService(apiKey?: string): FmpService {
    if (!fmpServiceInstance) {
        fmpServiceInstance = new FmpService(apiKey);
    }
    return fmpServiceInstance;
}
