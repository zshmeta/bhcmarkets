import { useMemo } from 'react';
import { useMarketStore, selectLevel2Book, selectMetrics, selectRecentPositions } from '../../store/marketStore';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useDepthChart Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from DepthChart component:
 * - Store subscriptions (order book, metrics, recent trades)
 * - Depth calculations (cumulative quantities)
 * - Log scaling for bar widths
 * - Translations
 */

const DEPTH_LEVELS = 15;

export interface DepthLevel {
    price: number;
    quantity: number;
    cumulative: number;
}

export interface TradeIndicator {
    price: number;
    isBuy: boolean;
}

export interface DepthChartData {
    midPrice: number;
    bidLevels: DepthLevel[];
    askLevels: DepthLevel[];
    maxCumulative: number;
    RecentPositionsPrices: TradeIndicator[];
}

export interface UseDepthChartReturn {
    /** Chart data (null if loading) */
    data: DepthChartData | null;
    /** Whether data is ready */
    isReady: boolean;
    /** Calculate log-scaled width percentage */
    scaleWidth: (cumulative: number) => number;
    /** Translations */
    translations: {
        title: string;
        midPrice: string;
        bids: string;
        asks: string;
        RecentPositions: string;
        loading: string;
    };
}

const useDepthChart = (): UseDepthChartReturn => {
    const { t } = useI18n();
    const Level2Book = useMarketStore(selectLevel2Book);
    const metrics = useMarketStore(selectMetrics);
    const RecentPositions = useMarketStore(selectRecentPositions);

    const data = useMemo<DepthChartData | null>(() => {
        if (!Level2Book || !metrics) return null;

        const midPrice = parseFloat(metrics.mid);
        if (midPrice === 0) return null;

        const bids = Level2Book.bids.slice(0, DEPTH_LEVELS);
        const asks = Level2Book.asks.slice(0, DEPTH_LEVELS);

        // Calculate cumulative quantities
        let bidCumulative = 0;
        let askCumulative = 0;

        const bidLevels = bids.map((level) => {
            const price = parseFloat(level.price);
            const qty = parseFloat(level.quantity);
            bidCumulative += qty;
            return { price, quantity: qty, cumulative: bidCumulative };
        });

        const askLevels = asks.map((level) => {
            const price = parseFloat(level.price);
            const qty = parseFloat(level.quantity);
            askCumulative += qty;
            return { price, quantity: qty, cumulative: askCumulative };
        });

        const maxCumulative = Math.max(
            bidLevels[bidLevels.length - 1]?.cumulative ?? 0,
            askLevels[askLevels.length - 1]?.cumulative ?? 0
        );

        const RecentPositionsPrices = RecentPositions.slice(0, 20).map((trade) => ({
            price: parseFloat(trade.price),
            isBuy: !trade.isBuyerMaker,
        }));

        return { midPrice, bidLevels, askLevels, maxCumulative, RecentPositionsPrices };
    }, [Level2Book, metrics, RecentPositions]);

    // Log scale function to prevent large orders from dominating
    const scaleWidth = (cumulative: number): number => {
        if (!data || data.maxCumulative === 0) return 0;
        const logMax = Math.log10(data.maxCumulative + 1);
        const logCum = Math.log10(cumulative + 1);
        return (logCum / logMax) * 100;
    };

    const translations = {
        title: t.depthChart?.title || 'Depth Chart',
        midPrice: t.Level2Book?.midPrice || 'Mid',
        bids: t.depthChart?.bids || 'Bids',
        asks: t.depthChart?.asks || 'Asks',
        RecentPositions: t.RecentPositions?.title || 'Trades',
        loading: t.common?.loading || 'Loading...',
    };

    return {
        data,
        isReady: data !== null,
        scaleWidth,
        translations,
    };
}

export default useDepthChart;
