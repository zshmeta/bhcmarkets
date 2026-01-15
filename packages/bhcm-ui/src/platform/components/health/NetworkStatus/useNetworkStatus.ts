import { useState, useEffect, useCallback } from 'react';
import { useMarketStore, selectConnectionStatus, selectDataConfidence } from '../../store/marketStore';
import { useI18n } from '../../i18n';
import { formatLastUpdateTime } from '../../utils';

/* ═══════════════════════════════════════════════════════════
 * useNetworkStatus Hook
 * ═══════════════════════════════════════════════════════════
 */

export type ConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

export interface UseNetworkStatusReturn {
    level: ConfidenceLevel;
    reason?: string;
    statusText: string;
    lastUpdateTime: string;
    latency: string;
    messageRate: string;
    showDrawer: boolean;
    onOpenDrawer: () => void;
    onCloseDrawer: () => void;
    translations: {
        diagnostics: string;
    };
}

const useNetworkStatus = (): UseNetworkStatusReturn => {
    const { t } = useI18n();
    const connectionStatus = useMarketStore(selectConnectionStatus);
    const dataConfidence = useMarketStore(selectDataConfidence);
    const [showDrawer, setShowDrawer] = useState(false);
    const [lastUpdateTime, setLastUpdateTime] = useState('');

    const { level, reason } = dataConfidence;

    useEffect(() => {
        if (connectionStatus.lastMessageTime > 0) {
            const updateTime = () => {
                setLastUpdateTime(formatLastUpdateTime(connectionStatus.lastMessageTime));
            };
            updateTime();
            const interval = setInterval(updateTime, 1000);
            return () => clearInterval(interval);
        } else {
            setLastUpdateTime('—');
        }
    }, [connectionStatus.lastMessageTime]);

    const getStatusText = () => {
        switch (level) {
            case 'live': return t.dataConfidence.live;
            case 'degraded': return t.dataConfidence.degraded;
            case 'resyncing': return t.dataConfidence.resyncing;
            case 'stale': return t.dataConfidence.stale;
            default: return '';
        }
    };

    const getLatencyDisplay = () => {
        if (connectionStatus.state !== 'connected') return '—';
        if (connectionStatus.latencyMs < 1) return '<1ms';
        return `${Math.round(connectionStatus.latencyMs)}ms`;
    };

    return {
        level: level as ConfidenceLevel,
        reason,
        statusText: getStatusText(),
        lastUpdateTime,
        latency: getLatencyDisplay(),
        messageRate: `${connectionStatus.messageRate}/s`,
        showDrawer,
        onOpenDrawer: useCallback(() => setShowDrawer(true), []),
        onCloseDrawer: useCallback(() => setShowDrawer(false), []),
        translations: { diagnostics: t.dataConfidence.diagnostics },
    };
}

export { useNetworkStatus };
