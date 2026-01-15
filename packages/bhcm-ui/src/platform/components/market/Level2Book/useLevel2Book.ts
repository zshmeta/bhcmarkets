import { useRef, useEffect, useMemo } from 'react';
import { useMarketStore, selectLevel2Book, selectMetrics, selectDataConfidence } from '../../store/marketStore';
import { useI18n } from '../../i18n';
import type { Level2BookLevel } from '../../types/market';
import type { ConfidenceLevel } from './Level2Book.styles';

/* ═══════════════════════════════════════════════════════════
 * useLevel2Book Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all business logic from Level2Book component:
 * - Store subscriptions (order book data, metrics, confidence)
 * - Depth calculations (max quantity for bar scaling)
 * - Price change tracking for flash animations
 * - Spread computations
 */

export interface Level2BookData {
    bids: Level2BookLevel[];
    asks: Level2BookLevel[];
    symbol: string;
}

export interface Level2BookMetrics {
    spread: number;
    spreadBps: number;
}

export interface DataConfidenceState {
    level: ConfidenceLevel;
    reason: string;
    isResyncing: boolean;
    isStale: boolean;
}

export interface UseLevel2BookReturn {
    /** Order book data (null if loading) */
    Level2Book: Level2BookData | null;
    /** Computed metrics */
    metrics: Level2BookMetrics;
    /** Data freshness state */
    confidence: DataConfidenceState;
    /** Max quantities for depth bar scaling */
    maxQuantities: { bids: number; asks: number };
    /** Previous prices for change detection (keyed by "side-index") */
    prevPriceMap: Map<string, string>;
    /** Translations for the component */
    translations: {
        title: string;
        price: string;
        amount: string;
        buyOrders: string;
        sellOrders: string;
    };
}

const useLevel2Book = (): UseLevel2BookReturn => {
    const { t } = useI18n();

    // Store subscriptions
    const Level2Book = useMarketStore(selectLevel2Book);
    const storeMetrics = useMarketStore(selectMetrics);
    const dataConfidence = useMarketStore(selectDataConfidence);

    // Track previous order book for change detection
    const prevLevel2BookRef = useRef<typeof Level2Book>(null);

    useEffect(() => {
        prevLevel2BookRef.current = Level2Book;
    }, [Level2Book]);

    // Calculate max quantity for depth bar scaling
    const maxQuantities = useMemo(() => {
        if (!Level2Book) return { bids: 1, asks: 1 };

        let max = 0.001;
        Level2Book.bids.forEach(lvl => max = Math.max(max, parseFloat(lvl.quantity)));
        Level2Book.asks.forEach(lvl => max = Math.max(max, parseFloat(lvl.quantity)));

        return { bids: max, asks: max };
    }, [Level2Book]);

    // Map previous prices for change detection
    const prevPriceMap = useMemo(() => {
        const map = new Map<string, string>();
        const prev = prevLevel2BookRef.current;
        if (prev) {
            prev.bids.forEach((l, i) => map.set(`bid-${i}`, l.price));
            prev.asks.forEach((l, i) => map.set(`ask-${i}`, l.price));
        }
        return map;
    }, [Level2Book]);

    // Compute metrics
    const metrics: Level2BookMetrics = useMemo(() => ({
        spread: storeMetrics?.spread ? parseFloat(storeMetrics.spread) : 0,
        spreadBps: storeMetrics?.spreadBps ?? 0,
    }), [storeMetrics]);

    // Confidence state
    const confidence: DataConfidenceState = useMemo(() => ({
        level: dataConfidence.level as ConfidenceLevel,
        reason: dataConfidence.reason,
        isResyncing: dataConfidence.level === 'resyncing',
        isStale: dataConfidence.level === 'stale',
    }), [dataConfidence]);

    // Translations
    const translations = useMemo(() => ({
        title: t.Level2Book.title,
        price: t.Level2Book.price,
        amount: t.Level2Book.amount,
        buyOrders: t.Level2Book?.buyOrders || 'Bids',
        sellOrders: t.Level2Book?.sellOrders || 'Asks',
    }), [t]);

    return {
        Level2Book,
        metrics,
        confidence,
        maxQuantities,
        prevPriceMap,
        translations,
    };
}

export { useLevel2Book };
