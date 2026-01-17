import { useMemo, useEffect } from 'react';
import { useTradingStore } from '@repo/sdk';
import { useWalletStore, selectBalances } from '@repo/sdk';
import { useMarketStore, selectMetrics, selectLevel2Book } from '@repo/sdk';
import { useWatchlistStore, selectSelectedSymbol } from '@repo/sdk';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useRiskBanner Hook
 * ═══════════════════════════════════════════════════════════
 * Extracts all risk calculation logic:
 * - Position size calculations
 * - PnL calculations
 * - Volatility metrics
 * - Overall risk score
 * - Performance metrics
 */

export type RiskLevel = 'low' | 'medium' | 'high';

export interface RiskMetrics {
    positionSizePercent: number;
    unrealizedPnlPercent: number;
    volatilityRisk: number;
    hasRealTimePrice: boolean;
}

export interface PerformanceMetrics {
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
    totalRealizedPnl: string;
}

export interface MarketMetrics {
    microVolatility: number;
    liquidityScore: number;
}

export interface RiskBannerTranslations {
    title: string;
    low: string;
    medium: string;
    high: string;
    positionRatio: string;
    unrealizedPnL: string;
    winRate: string;
    profitFactor: string;
    maxDrawdown: string;
    totalRealizedPnl: string;
}

export interface UseRiskBannerReturn {
    // Risk data
    riskMetrics: RiskMetrics | null;
    overallRisk: number;
    riskLevel: RiskLevel;
    riskLabel: string;

    // Performance
    performanceMetrics: PerformanceMetrics;

    // Market metrics
    marketMetrics: MarketMetrics | null;

    // Description
    riskDescription: string;

    // Translations
    translations: RiskBannerTranslations;

    // Helpers
    getRiskLevel: (risk: number) => RiskLevel;
    getRiskLabel: (level: RiskLevel) => string;
}

const useRiskBanner = (): UseRiskBannerReturn => {
    const { t } = useI18n();

    // Store subscriptions
    const balances = useWalletStore(selectBalances);
    const performanceMetricsStore = useWalletStore((state) => state.performanceMetrics);
    const updatePerformanceMetrics = useWalletStore((state) => state.updatePerformanceMetrics);
    const positions = useTradingStore((state) => state.positions);
    const metrics = useMarketStore(selectMetrics);
    const Level2Book = useMarketStore(selectLevel2Book);
    const selectedSymbol = useWatchlistStore(selectSelectedSymbol);

    // Periodically update performance metrics
    useEffect(() => {
        if (!metrics) return;
        const prices: Record<string, string> = {};
        if (metrics.mid && Level2Book?.symbol) {
            prices[Level2Book.symbol] = metrics.mid;
        }
        updatePerformanceMetrics(prices);
    }, [metrics, Level2Book?.symbol, updatePerformanceMetrics]);

    const currentSymbol = Level2Book?.symbol || selectedSymbol;

    // Calculate risk metrics
    const riskMetrics = useMemo((): RiskMetrics | null => {
        if (!metrics) return null;

        const usdtBalance = balances.find((b) => b.asset === 'USDT');
        const usdtTotal = parseFloat(usdtBalance?.total ?? '0');

        let positionEntries: [string, any][] = [];
        if (positions instanceof Map) {
            positionEntries = Array.from(positions.entries());
        } else if (typeof positions === 'object' && positions !== null) {
            positionEntries = Object.entries(positions);
        }

        const activePosition = positionEntries.find(
            ([symbol, pos]) =>
                symbol === currentSymbol && pos.side === 'long' && parseFloat(pos.quantity) > 0
        );

        if (!activePosition) {
            const hasOtherPositions = positionEntries.some(
                ([_, pos]) => pos.side === 'long' && parseFloat(pos.quantity) > 0
            );
            return {
                positionSizePercent: 0,
                unrealizedPnlPercent: 0,
                volatilityRisk: 0,
                hasRealTimePrice: !hasOtherPositions,
            };
        }

        const [_, position] = activePosition;
        const qty = parseFloat(position.quantity);
        const avgEntry = parseFloat(position.avgEntryPrice);
        const currentPrice = parseFloat(metrics.mid);

        const positionValue = qty * currentPrice;
        const totalValue = usdtTotal + positionValue;
        const positionSizePercent = totalValue > 0 ? (positionValue / totalValue) * 100 : 0;
        const unrealizedPnlPercent = avgEntry > 0 ? ((currentPrice - avgEntry) / avgEntry) * 100 : 0;
        const volatility = metrics.microVolatility;
        const volatilityRisk = Math.min(100, (volatility / 100) * 100);

        return {
            positionSizePercent,
            unrealizedPnlPercent,
            volatilityRisk,
            hasRealTimePrice: currentPrice > 0,
        };
    }, [balances, positions, metrics, currentSymbol]);

    // Overall risk calculation
    const overallRisk = useMemo(() => {
        if (!riskMetrics) return 0;
        return Math.min(
            100,
            riskMetrics.positionSizePercent * 0.4 +
            Math.abs(riskMetrics.unrealizedPnlPercent) * 0.3 +
            riskMetrics.volatilityRisk * 0.3
        );
    }, [riskMetrics]);

    // Risk level helpers
    const getRiskLevel = (risk: number): RiskLevel => {
        if (risk < 30) return 'low';
        if (risk < 60) return 'medium';
        return 'high';
    };

    const getRiskLabel = (level: RiskLevel): string => {
        switch (level) {
            case 'low': return t.RiskBanner?.low || 'Low';
            case 'medium': return t.RiskBanner?.medium || 'Medium';
            case 'high': return t.RiskBanner?.high || 'High';
        }
    };

    const riskLevel = getRiskLevel(overallRisk);
    const riskLabel = getRiskLabel(riskLevel);

    // Risk description
    const riskDescription = useMemo(() => {
        switch (riskLevel) {
            case 'low': return 'Account in excellent condition, risk under control.';
            case 'medium': return 'Watch position size, volatility risk increasing.';
            case 'high': return 'High risk! Consider adjusting position or hedging.';
        }
    }, [riskLevel]);

    // Performance metrics
    const performanceMetrics: PerformanceMetrics = {
        winRate: performanceMetricsStore.winRate,
        profitFactor: performanceMetricsStore.profitFactor,
        maxDrawdown: performanceMetricsStore.maxDrawdown,
        totalRealizedPnl: performanceMetricsStore.totalRealizedPnl,
    };

    // Market metrics
    const marketMetrics: MarketMetrics | null = metrics ? {
        microVolatility: metrics.microVolatility,
        liquidityScore: metrics.liquidityScore,
    } : null;

    // Translations
    const translations: RiskBannerTranslations = {
        title: t.RiskBanner?.title || 'Risk Analysis',
        low: t.RiskBanner?.low || 'Low',
        medium: t.RiskBanner?.medium || 'Medium',
        high: t.RiskBanner?.high || 'High',
        positionRatio: t.RiskBanner?.positionRatio || 'Position Ratio',
        unrealizedPnL: t.RiskBanner?.unrealizedPnL || 'Unrealized P&L',
        winRate: t.RiskBanner?.winRate || 'Win Rate',
        profitFactor: t.RiskBanner?.profitFactor || 'Profit Factor',
        maxDrawdown: t.RiskBanner?.maxDrawdown || 'Max Drawdown',
        totalRealizedPnl: t.RiskBanner?.totalRealizedPnl || 'Total Realized P&L',
    };

    return {
        riskMetrics,
        overallRisk,
        riskLevel,
        riskLabel,
        performanceMetrics,
        marketMetrics,
        riskDescription,
        translations,
        getRiskLevel,
        getRiskLabel,
    };
}

export { useRiskBanner };
export default useRiskBanner;
