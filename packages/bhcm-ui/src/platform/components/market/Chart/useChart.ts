import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { UTCTimestamp } from 'lightweight-charts';
import { handleApiError, logError } from '../../../../../../sdk/utils/errorHandler';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { useAutomationStore } from '@repo/sdk';
import { useTradingStore } from '@repo/sdk';
import { useIsMobile } from '../../hooks/useMediaQuery';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useChart Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all Chart business logic:
 * - Kline data fetching and caching
 * - Indicator calculations (MA, EMA, BOLL)
 * - Chart state (type, time range, fullscreen)
 * - Price line data (triggers, orders)
 */

export type ChartType = 'line' | 'candlestick';
export type TimeRange = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
export type Indicator = 'MA' | 'EMA' | 'BOLL' | 'VOL';

export interface KlineData {
    time: UTCTimestamp;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

export interface CrosshairData {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    change: number;
    changePercent: number;
}

export interface PriceInfo {
    current: number;
    high24h: number;
    low24h: number;
    change: number;
    changePercent: number;
    volume: number;
    amplitude: number;
}

export interface PriceLine {
    price: number;
    color: string;
    title: string;
    style: number;
}

export interface UseChartReturn {
    // State
    chartType: ChartType;
    timeRange: TimeRange;
    activeIndicators: Set<Indicator>;
    klines: KlineData[];
    loading: boolean;
    error: string | null;
    crosshairData: CrosshairData | null;
    isFullscreen: boolean;
    chartReady: boolean;

    // Derived
    selectedSymbol: string;
    priceInfo: PriceInfo | null;
    priceLines: PriceLine[];
    isMobile: boolean;

    // Actions
    setChartType: (type: ChartType) => void;
    setTimeRange: (range: TimeRange) => void;
    toggleIndicator: (indicator: Indicator) => void;
    setCrosshairData: (data: CrosshairData | null) => void;
    setChartReady: (ready: boolean) => void;
    toggleFullscreen: () => void;
    handleReset: () => void;
    fetchKlines: (symbol: string, interval: string, retryCount?: number) => Promise<void>;
    formatTime: (timestamp: number) => string;

    // Indicator calculations
    calculateMA: (data: KlineData[], period: number) => { time: UTCTimestamp; value: number }[];
    calculateEMA: (data: KlineData[], period: number) => { time: UTCTimestamp; value: number }[];
    calculateBOLL: (data: KlineData[], period?: number, stdDev?: number) => {
        upper: { time: UTCTimestamp; value: number }[];
        middle: { time: UTCTimestamp; value: number }[];
        lower: { time: UTCTimestamp; value: number }[];
    };

    // Translations
    translations: {
        lineChart: string;
        candlestickChart: string;
    };
}

const INTERVAL_MAP: Record<TimeRange, string> = {
    '1m': '1m', '5m': '5m', '15m': '15m', '1h': '1h', '4h': '4h', '1d': '1d'
};

const CHART_COLORS = {
    buy: '#3FB950',
    sell: '#F85149',
};

const CACHE_TTL = 60000;

const useChart = (): UseChartReturn => {
    const { t } = useI18n();
    const isMobile = useIsMobile();

    // Store subscriptions
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);
    const triggers = useAutomationStore((state) => state.triggers);
    const CurrentOrders = useTradingStore((state) => state.orders.filter(o => o.status === 'open'));

    // State
    const [chartType, setChartType] = useState<ChartType>('candlestick');
    const [timeRange, setTimeRange] = useState<TimeRange>('15m');
    const [klines, setKlines] = useState<KlineData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeIndicators, setActiveIndicators] = useState<Set<Indicator>>(new Set(['MA', 'VOL']));
    const [crosshairData, setCrosshairData] = useState<CrosshairData | null>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [chartReady, setChartReady] = useState(false);

    // Refs
    const klinesCacheRef = useRef<Map<string, { data: KlineData[]; timestamp: number }>>(new Map());

    // Toggle indicator
    const toggleIndicator = useCallback((indicator: Indicator) => {
        setActiveIndicators(prev => {
            const s = new Set(prev);
            s.has(indicator) ? s.delete(indicator) : s.add(indicator);
            return s;
        });
    }, []);

    // Fetch klines
    const fetchKlines = useCallback(async (symbol: string, interval: string, retryCount = 0) => {
        const cacheKey = `${symbol}-${interval}`;
        const cached = klinesCacheRef.current.get(cacheKey);
        const now = Date.now();

        if (cached && now - cached.timestamp < CACHE_TTL) {
            setKlines(cached.data);
            setLoading(false);
            setError(null);
            return;
        }

        if (klines.length === 0) setLoading(true);

        try {
            // Use local market-data service (proxied via /market)
            // This handles symbol resolution (BTC/USD -> BTCUSDT) and auto-backfilling
            const url = `/market/candles/${encodeURIComponent(symbol)}?timeframe=${interval}&limit=500`;
            const response = await fetch(url);
            if (!response.ok) throw response;

            const data = await response.json();

            // Map the local API Candle objects to KlineData format
            const formattedData: KlineData[] = data.map((k: any) => ({
                time: Math.floor(k.timestamp / 1000) as UTCTimestamp,
                open: k.open,
                high: k.high,
                low: k.low,
                close: k.close,
                volume: k.volume,
            }));

            klinesCacheRef.current.set(cacheKey, { data: formattedData, timestamp: now });
            setKlines(formattedData);
            setError(null);
            setLoading(false);
        } catch (err) {
            const appError = handleApiError(err);
            logError(appError);

            if (cached) {
                setKlines(cached.data);
                setError(null);
                setLoading(false);
                return;
            }

            if (retryCount < 3) {
                setTimeout(() => fetchKlines(symbol, interval, retryCount + 1), 2000 * (retryCount + 1));
                return;
            }

            setError(appError.message);
            setLoading(false);
        }
    }, [klines.length]);

    // Auto-fetch on symbol/timeRange change
    useEffect(() => {
        if (selectedSymbol) fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange]);
    }, [selectedSymbol, timeRange, fetchKlines]);

    // Periodic refresh
    useEffect(() => {
        if (!selectedSymbol) return;
        const i = setInterval(() => fetchKlines(selectedSymbol, INTERVAL_MAP[timeRange]), 60000);
        return () => clearInterval(i);
    }, [selectedSymbol, timeRange, fetchKlines]);

    // Format time
    const formatTime = useCallback((timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleString('en-US', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    }, []);

    // Indicator calculations
    const calculateMA = useCallback((data: KlineData[], period: number) => {
        const result: { time: UTCTimestamp; value: number }[] = [];
        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                const item = data[i - j];
                if (item) sum += item.close;
            }
            const current = data[i];
            if (current) result.push({ time: current.time, value: sum / period });
        }
        return result;
    }, []);

    const calculateEMA = useCallback((data: KlineData[], period: number) => {
        const result: { time: UTCTimestamp; value: number }[] = [];
        const multiplier = 2 / (period + 1);
        let ema = data[0]?.close || 0;

        for (let i = 0; i < data.length; i++) {
            const current = data[i];
            if (!current) continue;
            ema = i === 0 ? current.close : (current.close - ema) * multiplier + ema;
            if (i >= period - 1) result.push({ time: current.time, value: ema });
        }
        return result;
    }, []);

    const calculateBOLL = useCallback((data: KlineData[], period = 20, stdDev = 2) => {
        const upper: { time: UTCTimestamp; value: number }[] = [];
        const middle: { time: UTCTimestamp; value: number }[] = [];
        const lower: { time: UTCTimestamp; value: number }[] = [];

        for (let i = period - 1; i < data.length; i++) {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                const item = data[i - j];
                if (item) sum += item.close;
            }
            const ma = sum / period;

            let squaredDiffSum = 0;
            for (let j = 0; j < period; j++) {
                const item = data[i - j];
                if (item) squaredDiffSum += Math.pow(item.close - ma, 2);
            }
            const std = Math.sqrt(squaredDiffSum / period);

            const current = data[i];
            if (current) {
                middle.push({ time: current.time, value: ma });
                upper.push({ time: current.time, value: ma + stdDev * std });
                lower.push({ time: current.time, value: ma - stdDev * std });
            }
        }
        return { upper, middle, lower };
    }, []);

    // Price info
    const priceInfo = useMemo((): PriceInfo | null => {
        if (klines.length === 0) return null;

        const lastKline = klines[klines.length - 1];
        const firstKline = klines[0];
        if (!lastKline || !firstKline) return null;

        const current = lastKline.close;
        const first = firstKline.open;
        const high24h = Math.max(...klines.map(k => k.high));
        const low24h = Math.min(...klines.map(k => k.low));
        const totalVolume = klines.reduce((sum, k) => sum + k.volume, 0);

        return {
            current,
            high24h,
            low24h,
            change: current - first,
            changePercent: ((current - first) / first) * 100,
            volume: totalVolume,
            amplitude: ((high24h - low24h) / low24h) * 100,
        };
    }, [klines]);

    // Price lines (triggers + orders)
    const priceLines = useMemo((): PriceLine[] => {
        const lines: PriceLine[] = [];

        triggers
            .filter(t => t.enabled && t.symbol === selectedSymbol)
            .forEach(trigger => {
                const triggerPrice = trigger.triggerPrice || trigger.condition.threshold;
                const side = trigger.action.side;
                const type = trigger.action.type;
                lines.push({
                    price: parseFloat(triggerPrice),
                    color: side === 'buy' ? CHART_COLORS.buy : CHART_COLORS.sell,
                    title: `T: ${type.toUpperCase()}${side ? ` ${side.toUpperCase()}` : ''}`,
                    style: 2,
                });
            });

        CurrentOrders
            .filter(o => o.symbol === selectedSymbol && o.price)
            .forEach(order => {
                lines.push({
                    price: parseFloat(order.price!),
                    color: order.side === 'buy' ? CHART_COLORS.buy : CHART_COLORS.sell,
                    title: `${order.side.toUpperCase()} @ ${order.price}`,
                    style: 1,
                });
            });

        return lines;
    }, [triggers, CurrentOrders, selectedSymbol]);

    // Actions
    const toggleFullscreen = useCallback(() => setIsFullscreen(prev => !prev), []);
    const handleReset = useCallback(() => { }, []); // Will be handled by view via chart ref

    return {
        chartType,
        timeRange,
        activeIndicators,
        klines,
        loading,
        error,
        crosshairData,
        isFullscreen,
        chartReady,
        selectedSymbol,
        priceInfo,
        priceLines,
        isMobile,
        setChartType,
        setTimeRange,
        toggleIndicator,
        setCrosshairData,
        setChartReady,
        toggleFullscreen,
        handleReset,
        fetchKlines,
        formatTime,
        calculateMA,
        calculateEMA,
        calculateBOLL,
        translations: {
            lineChart: t.chart?.lineChart || 'Line',
            candlestickChart: t.chart?.candlestickChart || 'Candle',
        },
    };
}

export { useChart };
