import { useState, useCallback } from 'react';
import { useMarketStore, selectConnectionStatus, selectDataConfidence, selectNetworkHealth } from '@repo/sdk';
import { useI18n, type Locale } from '../../i18n';
import type { NetworkEvent, NetworkEventType } from '../../../../../../sdk/utils/types/market';

/* ═══════════════════════════════════════════════════════════
 * useNetworkHealth Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface HealthCheck {
    label: string;
    passed: boolean;
}

export interface StatItem {
    label: string;
    value: string;
}

export interface ScoreComponent {
    label: string;
    value: number;
    max: number;
}

export interface NetworkHealthData {
    score: number;
    trend: 'improving' | 'stable' | 'degrading';
    scoreLabel: string;
    scoreLevel: 'excellent' | 'good' | 'fair' | 'poor';
    components: ScoreComponent[];
    events: NetworkEvent[];
}

export interface DiagnosticsTranslations {
    title: string;
    close: string;
    systemStatus: string;
    sessionStats: string;
    networkHealth: string;
    truthTimeline: string;
    reconnect: string;
    forceResync: string;
    noEvents: string;
    passed: string;
    failed: string;
}

export interface UseNetworkHealthReturn {
    healthChecks: HealthCheck[];
    stats: StatItem[];
    networkHealth: NetworkHealthData | null;
    onReconnect: () => void;
    onForceResync: () => void;
    translations: DiagnosticsTranslations;
    getEventType: (type: NetworkEventType) => 'good' | 'bad' | 'warning' | 'default';
    getEventTypeName: (type: NetworkEventType) => string;
}

const useNetworkHealth = (onClose: () => void): UseNetworkHealthReturn => {
    const { t } = useI18n();
    const connectionStatus = useMarketStore(selectConnectionStatus);
    const dataConfidence = useMarketStore(selectDataConfidence);
    const networkHealth = useMarketStore(selectNetworkHealth);
    const subscribe = useMarketStore((state) => state.subscribe);
    const Level2Book = useMarketStore((state) => state.Level2Book);

    const handleReconnect = useCallback(() => {
        if (Level2Book?.symbol) subscribe(Level2Book.symbol);
        onClose();
    }, [Level2Book, subscribe, onClose]);

    const handleForceResync = useCallback(() => {
        if (Level2Book?.symbol) subscribe(Level2Book.symbol);
        onClose();
    }, [Level2Book, subscribe, onClose]);

    const formatUptime = (startTime: number) => {
        const duration = Date.now() - startTime;
        const minutes = Math.floor(duration / 60000);
        const seconds = Math.floor((duration % 60000) / 1000);
        if (minutes > 0) return `${minutes}m ${seconds}s`;
        return `${seconds}s`;
    };

    const healthChecks: HealthCheck[] = [
        { label: t.dataConfidence.wsConnection, passed: dataConfidence.details.wsConnected },
        { label: t.dataConfidence.sequenceCheck, passed: dataConfidence.details.sequenceContinuous },
        { label: t.dataConfidence.latencyCheck, passed: dataConfidence.details.latencyOk },
        { label: t.dataConfidence.updateFrequency, passed: dataConfidence.details.updateFrequencyOk },
        { label: t.dataConfidence.queueHealth, passed: dataConfidence.details.queueHealthy },
    ];

    const stats: StatItem[] = [
        { label: t.networkHealth?.sessionDuration || 'Session', value: networkHealth?.stats.sessionStartTime ? formatUptime(networkHealth.stats.sessionStartTime) : '—' },
        { label: t.networkHealth?.uptime || 'Uptime', value: networkHealth?.stats.uptimePercent ? `${networkHealth.stats.uptimePercent.toFixed(1)}%` : '—' },
        { label: t.dataConfidence.reconnectCount, value: `${networkHealth?.stats.totalReconnects ?? connectionStatus.reconnectCount}` },
        { label: t.dataConfidence.gapCount, value: `${networkHealth?.stats.totalGaps ?? connectionStatus.gapCount}` },
        { label: t.networkHealth?.avgLatency || 'Avg Latency', value: networkHealth?.stats.avgLatency ? `${Math.round(networkHealth.stats.avgLatency)}ms` : '—' },
        { label: t.networkHealth?.p95Latency || 'P95 Latency', value: networkHealth?.stats.latencyP95 ? `${Math.round(networkHealth.stats.latencyP95)}ms` : '—' },
        { label: t.networkHealth?.minLatency || 'Min', value: networkHealth?.stats.minLatency ? `${Math.round(networkHealth.stats.minLatency)}ms` : '—' },
        { label: t.networkHealth?.maxLatency || 'Max', value: networkHealth?.stats.maxLatency ? `${Math.round(networkHealth.stats.maxLatency)}ms` : '—' },
    ];

    const getScoreLevel = (score: number): 'excellent' | 'good' | 'fair' | 'poor' => {
        if (score >= 80) return 'excellent';
        if (score >= 60) return 'good';
        if (score >= 40) return 'fair';
        return 'poor';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 80) return t.networkHealth?.excellent || 'Excellent';
        if (score >= 60) return t.networkHealth?.good || 'Good';
        if (score >= 40) return t.networkHealth?.fair || 'Fair';
        return t.networkHealth?.poor || 'Poor';
    };

    const networkHealthData: NetworkHealthData | null = networkHealth ? {
        score: networkHealth.score,
        trend: networkHealth.trend,
        scoreLabel: getScoreLabel(networkHealth.score),
        scoreLevel: getScoreLevel(networkHealth.score),
        components: [
            { label: t.networkHealth?.latencyScore || 'Latency', value: networkHealth.scoreComponents.latency, max: 30 },
            { label: t.networkHealth?.stabilityScore || 'Stability', value: networkHealth.scoreComponents.stability, max: 30 },
            { label: t.networkHealth?.throughputScore || 'Throughput', value: networkHealth.scoreComponents.throughput, max: 20 },
            { label: t.networkHealth?.reliabilityScore || 'Reliability', value: networkHealth.scoreComponents.reliability, max: 20 },
        ],
        events: networkHealth.recentEvents || [],
    } : null;

    const getEventType = (type: NetworkEventType): 'good' | 'bad' | 'warning' | 'default' => {
        switch (type) {
            case 'connected': case 'resync_complete': case 'latency_normal': case 'rate_normal': return 'good';
            case 'disconnected': case 'latency_spike': case 'gap_detected': case 'rate_drop': return 'bad';
            case 'reconnecting': case 'resync_start': return 'warning';
            default: return 'default';
        }
    };

    const getEventTypeName = (type: NetworkEventType): string => {
        const names: Record<NetworkEventType, string> = {
            connected: (t as any).networkHealth?.events?.connected || 'Connected',
            disconnected: (t as any).networkHealth?.events?.disconnected || 'Disconnected',
            reconnecting: (t as any).networkHealth?.events?.reconnecting || 'Reconnecting',
            latency_spike: (t as any).networkHealth?.events?.latencySpike || 'Latency Spike',
            latency_normal: (t as any).networkHealth?.events?.latencyNormal || 'Latency Normal',
            gap_detected: (t as any).networkHealth?.events?.gapDetected || 'Gap Detected',
            resync_start: (t as any).networkHealth?.events?.resyncStart || 'Resync Started',
            resync_complete: (t as any).networkHealth?.events?.resyncComplete || 'Resync Complete',
            rate_drop: (t as any).networkHealth?.events?.rateDrop || 'Rate Drop',
            rate_normal: (t as any).networkHealth?.events?.rateNormal || 'Rate Normal',
        };
        return names[type] || type;
    };

    const translations: DiagnosticsTranslations = {
        title: t.dataConfidence.diagnostics,
        close: t.common.close,
        systemStatus: t.dataConfidence.systemStatus,
        sessionStats: t.dataConfidence.sessionStats,
        networkHealth: t.networkHealth?.title || 'Network Health',
        truthTimeline: t.dataConfidence.truthTimeline,
        reconnect: t.dataConfidence.reconnect,
        forceResync: t.dataConfidence.forceResync,
        noEvents: t.networkHealth?.noEvents || 'No events yet',
        passed: t.dataConfidence.passed,
        failed: t.dataConfidence.failed,
    };

    return {
        healthChecks,
        stats,
        networkHealth: networkHealthData,
        onReconnect: handleReconnect,
        onForceResync: handleForceResync,
        translations,
        getEventType,
        getEventTypeName,
    };
}

export { useNetworkHealth };
