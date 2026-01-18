// services/marketDataService.ts - Stub market data service
export interface MarketTicker {
    symbol: string;
    price: number;
    priceChangePercent: number;
    quoteVolume24h: number;
}

export interface MarketLineChart {
    prices: number[];
}

export interface MarketIndicators {
    rsi14: number | null;
    momentum: 'bullish' | 'bearish';
}

export async function fetchAllTickers(): Promise<MarketTicker[]> {
    // Stub - return mock data
    return [
        { symbol: 'BTCUSD', price: 95000, priceChangePercent: 1.5, quoteVolume24h: 5000000000 },
        { symbol: 'ETHUSD', price: 3400, priceChangePercent: 2.1, quoteVolume24h: 2000000000 },
        { symbol: 'EURUSD', price: 1.0850, priceChangePercent: 0.2, quoteVolume24h: 100000000 },
    ];
}

export async function fetchLineChart(symbol: string): Promise<MarketLineChart> {
    // Stub - return mock sparkline data
    const base = symbol === 'BTCUSD' ? 95000 : 3400;
    return {
        prices: Array.from({ length: 24 }, (_, i) => base + (Math.random() - 0.5) * base * 0.02)
    };
}

export async function calculateIndicators(symbol: string): Promise<MarketIndicators> {
    return {
        rsi14: 50 + Math.random() * 30,
        momentum: Math.random() > 0.5 ? 'bullish' : 'bearish'
    };
}

export function formatVolume(volume: number): string {
    if (volume >= 1000000000) return `${(volume / 1000000000).toFixed(2)}B`;
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(2)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(2)}K`;
    return volume.toFixed(2);
}

export function formatPrice(price: number): string {
    if (price >= 1000) return price.toFixed(2);
    if (price >= 1) return price.toFixed(4);
    return price.toFixed(6);
}

export function parseSymbol(symbol: string): { base: string; quote: string } {
    // Simple parser - remove common quote suffixes
    const quotes = ['USD', 'USD', 'EUR', 'BTC', 'ETH'];
    for (const quote of quotes) {
        if (symbol.endsWith(quote)) {
            return { base: symbol.slice(0, -quote.length), quote };
        }
    }
    return { base: symbol, quote: '' };
}
