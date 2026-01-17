import { useMemo } from 'react';
import { useMarketStore, selectMetrics, selectLevel2Book, selectDataConfidence, selectCanTrustMetrics } from '@repo/sdk';
import { useI18n } from '../../i18n';
import { formatPrice, formatVolume } from '../../../../../../sdk/utils';
import type { DataConfidenceLevel } from '../../types/market';

/* ═══════════════════════════════════════════════════════════
 * useHealthBoard Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all HealthBoard business logic:
 * - Market metrics from store
 * - Data confidence checks
 * - Formatting utilities
 * - Derived values (imbalance, liquidity classes)
 */

export interface MetricItem {
    label: string;
    value: string | number;
    unit?: string;
    tooltip?: string;
    colorClass?: 'positive' | 'negative';
    isUncertain?: boolean;
}

export interface HealthBoardTranslations {
    title: string;
    midPrice: string;
    midPriceDesc?: string;
    spread: string;
    spreadDesc?: string;
    spreadBps: string;
    imbalance: string;
    imbalanceDesc?: string;
    volatility: string;
    volatilityDesc?: string;
    tradeIntensity: string;
    tradeIntensityDesc?: string;
    vwap: string;
    vwapDesc?: string;
    liquidityScore: string;
    liquidityScoreDesc?: string;
    slippageEst: string;
    slippageEstDesc?: string;
    depthLevels: string;
    lastUpdate: string;
    loading: string;
    info: string;
    metricsUncertain: string;
}

export interface UseHealthBoardReturn {
    // Data available
    hasData: boolean;

    // Metrics
    metrics: MetricItem[];

    // Compact mode values
    compactMetrics: {
        mid: string;
        spread: string;
        volume: string;
    } | null;

    // Depth info
    depth: number;
    lastUpdateTime: string;

    // Confidence
    confidenceLevel: DataConfidenceLevel;
    canTrustMetrics: boolean;
    confidenceReason?: string;

    // Translations
    translations: HealthBoardTranslations;
}

// formatPrice and formatVolume are now imported from centralized utils

const useHealthBoard = (): UseHealthBoardReturn => {
    const { t } = useI18n();

    // Store subscriptions
    const storeMetrics = useMarketStore(selectMetrics);
    const Level2Book = useMarketStore(selectLevel2Book);
    const dataConfidence = useMarketStore(selectDataConfidence);
    const canTrustMetrics = useMarketStore(selectCanTrustMetrics);

    const level = dataConfidence?.level || 'stale';
    const hasData = !!(storeMetrics && Level2Book);

    // Derive metrics array
    const metrics = useMemo((): MetricItem[] => {
        if (!storeMetrics) return [];

        const imbalanceValue = (storeMetrics.bidAskImbalance || 0) * 100;
        const imbalanceClass: 'positive' | 'negative' | undefined =
            imbalanceValue > 10 ? 'positive' : imbalanceValue < -10 ? 'negative' : undefined;

        const liquidityValue = storeMetrics.liquidityScore || 0;
        const liquidityClass: 'positive' | 'negative' | undefined =
            liquidityValue >= 70 ? 'positive' : liquidityValue <= 30 ? 'negative' : undefined;

        return [
            {
                label: t.metrics?.spread || 'Spread',
                value: (storeMetrics.spreadBps || 0).toFixed(2),
                unit: t.Level2Book?.spreadBps || 'bps',
                tooltip: t.metrics?.spreadDesc,
                isUncertain: true,
            },
            {
                label: t.metrics?.imbalance || 'Imbalance',
                value: imbalanceValue.toFixed(1),
                unit: '%',
                colorClass: imbalanceClass,
                tooltip: t.metrics?.imbalanceDesc,
                isUncertain: true,
            },
            // {
            //     label: t.metrics?.volatility || 'Volatility',
            //     value: (storeMetrics.microVolatility || 0).toFixed(4),
            //     tooltip: t.metrics?.volatilityDesc,
            // },
            {
                label: t.metrics?.tradeIntensity || 'Intensity',
                value: storeMetrics.tradeIntensity || 0,
                unit: '/10s',
                tooltip: t.metrics?.tradeIntensityDesc,
                isUncertain: true,
            },
            {
                label: t.metrics?.liquidityScore || 'Liquidity',
                value: liquidityValue.toFixed(0),
                unit: '/100',
                colorClass: liquidityClass,
                tooltip: t.metrics?.liquidityScoreDesc,
                isUncertain: true,
            },
            {
                label: t.metrics?.slippageEst || 'Slippage',
                value: storeMetrics.slippageEst === 'N/A' ? 'N/A' : storeMetrics.slippageEst,
                unit: storeMetrics.slippageEst === 'N/A' ? '' : (t.Level2Book?.spreadBps || 'bps'),
                tooltip: t.metrics?.slippageEstDesc,
                isUncertain: true,
            },
        ];
    }, [storeMetrics, t]);

    // Compact mode metrics
    const compactMetrics = useMemo(() => {
        if (!storeMetrics) return null;
        return {
            mid: formatPrice(storeMetrics.mid),
            spread: `${(storeMetrics.spreadBps || 0).toFixed(1)} bps`,
            volume: formatVolume(parseFloat(storeMetrics.bidDepthVolume) + parseFloat(storeMetrics.askDepthVolume)),
        };
    }, [storeMetrics]);

    // Depth info
    const depth = Level2Book?.depth || 0;
    const lastUpdateTime = new Date(Level2Book?.localUpdateTime || Date.now()).toLocaleTimeString();

    // Translations
    const translations: HealthBoardTranslations = {
        title: t.metrics?.title || 'Metrics',
        midPrice: t.metrics?.midPrice || 'Mid Price',
        midPriceDesc: t.metrics?.midPriceDesc,
        spread: t.metrics?.spread || 'Spread',
        spreadDesc: t.metrics?.spreadDesc,
        spreadBps: t.Level2Book?.spreadBps || 'bps',
        imbalance: t.metrics?.imbalance || 'Imbalance',
        imbalanceDesc: t.metrics?.imbalanceDesc,
        volatility: t.metrics?.volatility || 'Volatility',
        volatilityDesc: t.metrics?.volatilityDesc,
        tradeIntensity: t.metrics?.tradeIntensity || 'Intensity',
        tradeIntensityDesc: t.metrics?.tradeIntensityDesc,
        vwap: t.metrics?.vwap || 'VWAP',
        vwapDesc: t.metrics?.vwapDesc,
        liquidityScore: t.metrics?.liquidityScore || 'Liquidity',
        liquidityScoreDesc: t.metrics?.liquidityScoreDesc,
        slippageEst: t.metrics?.slippageEst || 'Slippage',
        slippageEstDesc: t.metrics?.slippageEstDesc,
        depthLevels: t.Level2Book?.depthLevels || 'Depth',
        lastUpdate: t.dataConfidence?.lastUpdate || 'Update',
        loading: t.common?.loading || 'Loading...',
        info: t.common?.info || 'Info',
        metricsUncertain: t.dataConfidence?.metricsUncertain || 'May be inaccurate',
    };

    return {
        hasData,
        metrics,
        compactMetrics,
        depth,
        lastUpdateTime,
        confidenceLevel: level,
        canTrustMetrics,
        confidenceReason: dataConfidence?.reason,
        translations,
    };
}

export { useHealthBoard };

