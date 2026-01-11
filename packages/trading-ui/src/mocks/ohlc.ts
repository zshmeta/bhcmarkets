/**
 * Mock OHLC/Candlestick Data Generator
 * 
 * Generates realistic historical candlestick data for charts.
 */

import type { OHLC, Timeframe } from '../types';
import { INITIAL_PRICES, VOLATILITY, getInstrumentBySymbol } from './symbols';

/** Timeframe to seconds mapping */
const TIMEFRAME_SECONDS: Record<Timeframe, number> = {
    '1m': 60,
    '5m': 300,
    '15m': 900,
    '30m': 1800,
    '1h': 3600,
    '4h': 14400,
    '1d': 86400,
    '1w': 604800,
    '1M': 2592000, // 30 days approximation
};

/**
 * Generate a random candle based on previous close.
 */
function generateCandle(
    prevClose: number,
    volatility: number,
    time: number
): OHLC {
    // Random movement for open (gap from previous close)
    const gapFactor = (Math.random() - 0.5) * 0.002;
    const open = prevClose * (1 + gapFactor);

    // Generate high, low, close with realistic constraints
    const range = volatility * (0.5 + Math.random());
    const direction = Math.random() > 0.5 ? 1 : -1;
    const change = direction * range * (0.5 + Math.random());

    const close = open + change;

    // High is always above open and close
    const highOffset = range * (0.2 + Math.random() * 0.3);
    const high = Math.max(open, close) + highOffset;

    // Low is always below open and close
    const lowOffset = range * (0.2 + Math.random() * 0.3);
    const low = Math.min(open, close) - lowOffset;

    // Volume varies randomly
    const volume = Math.floor(1000 + Math.random() * 10000);

    return {
        time,
        open,
        high,
        low,
        close,
        volume,
    };
}

/**
 * Generate historical OHLC data for a symbol.
 */
export function generateOHLCData(
    symbol: string,
    timeframe: Timeframe = '1h',
    count: number = 200
): OHLC[] {
    const instrument = getInstrumentBySymbol(symbol);
    const decimals = instrument?.decimals || 2;
    const startPrice = INITIAL_PRICES[symbol] || 100;
    const volatility = VOLATILITY[symbol] || startPrice * 0.001;

    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    const now = Math.floor(Date.now() / 1000);
    const startTime = now - intervalSeconds * count;

    const data: OHLC[] = [];
    let prevClose = startPrice;

    for (let i = 0; i < count; i++) {
        const time = startTime + intervalSeconds * i;
        const candle = generateCandle(prevClose, volatility, time);

        // Round to appropriate decimals
        data.push({
            time: candle.time,
            open: Number(candle.open.toFixed(decimals)),
            high: Number(candle.high.toFixed(decimals)),
            low: Number(candle.low.toFixed(decimals)),
            close: Number(candle.close.toFixed(decimals)),
            volume: candle.volume,
        });

        prevClose = candle.close;
    }

    return data;
}

/**
 * Generate a new candle to append to existing data (for real-time updates).
 */
export function generateNextCandle(
    symbol: string,
    lastCandle: OHLC,
    timeframe: Timeframe = '1h'
): OHLC {
    const instrument = getInstrumentBySymbol(symbol);
    const decimals = instrument?.decimals || 2;
    const volatility = VOLATILITY[symbol] || lastCandle.close * 0.001;
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];

    const newTime = lastCandle.time + intervalSeconds;
    const candle = generateCandle(lastCandle.close, volatility, newTime);

    return {
        time: candle.time,
        open: Number(candle.open.toFixed(decimals)),
        high: Number(candle.high.toFixed(decimals)),
        low: Number(candle.low.toFixed(decimals)),
        close: Number(candle.close.toFixed(decimals)),
        volume: candle.volume,
    };
}

/**
 * Update the last candle with new tick data (simulates in-progress candle).
 */
export function updateLastCandle(
    lastCandle: OHLC,
    newPrice: number,
    decimals: number = 2
): OHLC {
    return {
        ...lastCandle,
        high: Number(Math.max(lastCandle.high, newPrice).toFixed(decimals)),
        low: Number(Math.min(lastCandle.low, newPrice).toFixed(decimals)),
        close: Number(newPrice.toFixed(decimals)),
        volume: (lastCandle.volume || 0) + Math.floor(Math.random() * 100),
    };
}

/**
 * Create a chart data stream that updates the last candle and periodically adds new ones.
 */
export function createChartDataStream(
    symbol: string,
    timeframe: Timeframe,
    initialData: OHLC[],
    onUpdate: (data: OHLC[]) => void,
    updateIntervalMs: number = 1000
): () => void {
    let data = [...initialData];
    const instrument = getInstrumentBySymbol(symbol);
    const decimals = instrument?.decimals || 2;
    const intervalSeconds = TIMEFRAME_SECONDS[timeframe];
    const lastCandle = data[data.length - 1];
    const volatility = VOLATILITY[symbol] || (lastCandle ? lastCandle.close * 0.0001 : 0.01);

    const intervalId = setInterval(() => {
        const lastCandle = data[data.length - 1];
        if (!lastCandle) return;

        const now = Math.floor(Date.now() / 1000);

        // Check if we need a new candle
        if (now >= lastCandle.time + intervalSeconds) {
            // Add new candle
            const newCandle = generateNextCandle(symbol, lastCandle, timeframe);
            data = [...data.slice(-199), newCandle]; // Keep last 200 candles
            // Update last candle with price movement
            const priceChange = (Math.random() - 0.5) * volatility;
            const newPrice = lastCandle.close + priceChange;
            data = [
                ...data.slice(0, -1),
                updateLastCandle(lastCandle, newPrice, decimals),
            ];
        }

        onUpdate(data);
    }, updateIntervalMs);

    return () => clearInterval(intervalId);
}
