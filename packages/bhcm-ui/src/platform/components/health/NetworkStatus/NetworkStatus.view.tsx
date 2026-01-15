import { Icons } from '../Icons';
import type { ConfidenceLevel } from './useNetworkStatus';
import {
    Bar,
    StatusSection,
    StatusInfo,
    StatusText,
    StatusReason,
    Divider,
    MetricsSection,
    Metric,
    MetricIcons,
    DiagnosticsButton,
} from './NetworkStatus.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 */

export interface NetworkStatusViewProps {
    level: ConfidenceLevel;
    reason?: string;
    statusText: string;
    lastUpdateTime: string;
    latency: string;
    messageRate: string;
    onOpenDrawer: () => void;
    translations: { diagnostics: string };
}

const NetworkStatusView = ({
    level,
    reason,
    statusText,
    lastUpdateTime,
    latency,
    messageRate,
    onOpenDrawer,
    translations: t,
}: NetworkStatusViewProps) => {
    return (
        <Bar $level={level}>
            <StatusSection>
                <StatusInfo>
                    <StatusText $level={level}>{statusText}</StatusText>
                    {reason && <StatusReason>{reason}</StatusReason>}
                </StatusInfo>
            </StatusSection>

            <Divider />

            <MetricsSection>
                <Metric>
                    <MetricIcons><Icons name="clock" size="xs" /></MetricIcons>
                    <span>{lastUpdateTime}</span>
                </Metric>
                <Metric>
                    <MetricIcons><Icons name="zap" size="xs" /></MetricIcons>
                    <span>{latency}</span>
                </Metric>
                <Metric>
                    <MetricIcons><Icons name="bar-chart-2" size="xs" /></MetricIcons>
                    <span>{messageRate}</span>
                </Metric>
            </MetricsSection>

            <DiagnosticsButton onClick={onOpenDrawer} title={t.diagnostics}>
                <Icons name="info" size="sm" />
            </DiagnosticsButton>
        </Bar>
    );
}

export default NetworkStatusView;
