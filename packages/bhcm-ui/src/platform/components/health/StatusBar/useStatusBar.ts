import { useState, useMemo, useCallback } from 'react';
import { useMarketStore, selectConnectionStatus, selectDataConfidence, selectLogs } from '../../store/marketStore';
import { useI18n } from '../../i18n';

/* ═══════════════════════════════════════════════════════════
 * useStatusBar Hook
 * ═══════════════════════════════════════════════════════════
 */

export interface LogEntry {
    level: 'debug' | 'info' | 'warn' | 'error';
    category: string;
    event: string;
    data: Record<string, unknown>;
    timestamp?: number;
}

export interface HealthCheck {
    label: string;
    healthy: boolean;
}

export interface SessionStat {
    label: string;
    value: string;
    warning?: boolean;
    level?: string;
}

export interface ObservabilityTranslations {
    title: string;
    metrics: string;
    logs: string;
    systemHealth: string;
    sessionStats: string;
    all: string;
    warnPlus: string;
    error: string;
    clear: string;
    noLogs: string;
}

export interface UseStatusBarReturn {
    activeTab: 'metrics' | 'logs';
    logFilter: 'all' | 'warn' | 'error';
    logsCount: number;
    filteredLogs: LogEntry[];
    healthChecks: HealthCheck[];
    sessionStats: SessionStat[];
    onTabChange: (tab: 'metrics' | 'logs') => void;
    onFilterChange: (filter: 'all' | 'warn' | 'error') => void;
    onClearLogs: () => void;
    translations: ObservabilityTranslations;
}

const useStatusBar = (): UseStatusBarReturn => {
    const { t } = useI18n();
    const connectionStatus = useMarketStore(selectConnectionStatus);
    const dataConfidence = useMarketStore(selectDataConfidence);
    const logs = useMarketStore(selectLogs);
    const clearLogs = useMarketStore((state) => state.clearLogs);

    const [activeTab, setActiveTab] = useState<'metrics' | 'logs'>('metrics');
    const [logFilter, setLogFilter] = useState<'all' | 'warn' | 'error'>('all');

    const sessionStatsData = useMemo(() => ({
        totalGaps: connectionStatus.gapCount,
        totalResyncs: connectionStatus.resyncCount,
        totalReconnects: connectionStatus.reconnectCount,
    }), [connectionStatus]);

    const healthChecks: HealthCheck[] = [
        { label: t.observability?.wsConnection || 'WebSocket Connection', healthy: connectionStatus.state === 'connected' },
        { label: t.observability?.sequenceCheck || 'Sequence Check', healthy: dataConfidence.details.sequenceContinuous },
        { label: t.observability?.latencyCheck || 'Latency Check', healthy: dataConfidence.details.latencyOk },
        { label: t.observability?.updateFrequency || 'Update Frequency', healthy: dataConfidence.details.updateFrequencyOk },
    ];

    const sessionStats: SessionStat[] = [
        { label: t.observability?.latency || 'Latency', value: `${connectionStatus.latencyMs.toFixed(0)}ms` },
        { label: t.observability?.messageRate || 'Message Rate', value: `${connectionStatus.messageRate}/s` },
        { label: t.observability?.gapCount || 'Gaps', value: `${sessionStatsData.totalGaps}`, warning: sessionStatsData.totalGaps > 0 },
        { label: t.observability?.resyncCount || 'Resyncs', value: `${sessionStatsData.totalResyncs}`, warning: sessionStatsData.totalResyncs > 0 },
        { label: t.observability?.reconnectCount || 'Reconnects', value: `${sessionStatsData.totalReconnects}`, warning: sessionStatsData.totalReconnects > 0 },
        { label: t.observability?.confidence || 'Confidence', value: dataConfidence.level.toUpperCase(), level: dataConfidence.level },
    ];

    const filteredLogs = useMemo(() => {
        if (logFilter === 'all') return logs as LogEntry[];
        if (logFilter === 'warn') return (logs as LogEntry[]).filter((l) => l.level === 'warn' || l.level === 'error');
        return (logs as LogEntry[]).filter((l) => l.level === 'error');
    }, [logs, logFilter]);

    const translations: ObservabilityTranslations = {
        title: t.observability?.title || 'Observability',
        metrics: t.observability?.metrics || 'Metrics',
        logs: t.observability?.logs || 'Logs',
        systemHealth: t.observability?.systemHealth || 'System Health',
        sessionStats: t.observability?.sessionStats || 'Session Statistics',
        all: t.observability?.all || 'All',
        warnPlus: t.observability?.warnPlus || 'Warn+',
        error: t.observability?.error || 'Error',
        clear: t.observability?.clear || 'Clear',
        noLogs: t.observability?.noLogs || 'No logs',
    };

    return {
        activeTab,
        logFilter,
        logsCount: logs.length,
        filteredLogs,
        healthChecks,
        sessionStats,
        onTabChange: useCallback((tab: 'metrics' | 'logs') => setActiveTab(tab), []),
        onFilterChange: useCallback((filter: 'all' | 'warn' | 'error') => setLogFilter(filter), []),
        onClearLogs: clearLogs,
        translations,
    };
}

export default useStatusBar;
