import { useState } from 'react';
import { Icons } from '../Icons';
import type { DataConfidenceLevel } from '../../types/market';
import type { MetricItem, HealthBoardTranslations } from './useHealthBoard';
import {
    Container,
    Grid,
    MetricItem as MetricItemStyled,
    LabelRow,
    Label,
    InfoButton,
    UncertainIcons,
    ValueRow,
    Value,
    Unit,
    Tooltip,
    DepthInfo,
    DepthLabel,
    DepthValue,
    ConfidenceBadge,
    CompactContainer,
    CompactMetric,
    CompactLabel,
    CompactValue,
    CompactDivider,
    Loading,
} from './HealthBoard.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 * HealthBoard.view.tsx - Dumb component with no store hooks.
 * All data and callbacks passed via props.
 */

/* ═══════════════════════════════════════════════════════════
 * METRIC ITEM SUB-COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
interface MetricItemComponentProps {
    metric: MetricItem;
    confidenceLevel: DataConfidenceLevel;
    metricsUncertainText: string;
    infoText: string;
}

const MetricItemComponent = ({
    metric,
    confidenceLevel,
    metricsUncertainText,
    infoText,
}: MetricItemComponentProps) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const shouldDim = metric.isUncertain && confidenceLevel !== 'live';
    const showUncertainBadge = shouldDim && (confidenceLevel === 'degraded' || confidenceLevel === 'resyncing');

    return (
        <MetricItemStyled
            $uncertain={shouldDim}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
        >
            <LabelRow>
                <Label>{metric.label}</Label>
                {showUncertainBadge && (
                    <UncertainIcons title={metricsUncertainText}>?</UncertainIcons>
                )}
                {metric.tooltip && (
                    <InfoButton aria-label={infoText}>
                        <Icons name="info" size="xs" />
                    </InfoButton>
                )}
            </LabelRow>
            <ValueRow>
                <Value
                    $positive={metric.colorClass === 'positive'}
                    $negative={metric.colorClass === 'negative'}
                    className="tabular-nums"
                >
                    {confidenceLevel === 'stale' && metric.isUncertain ? '—' : metric.value}
                </Value>
                {metric.unit && <Unit>{metric.unit}</Unit>}
            </ValueRow>
            {showTooltip && metric.tooltip && <Tooltip>{metric.tooltip}</Tooltip>}
        </MetricItemStyled>
    );
}

/* ═══════════════════════════════════════════════════════════
 * VIEW PROPS INTERFACE
 * ═══════════════════════════════════════════════════════════
 */
export interface HealthBoardViewProps {
    /** Whether data is available */
    hasData: boolean;
    /** Array of metric items to display */
    metrics: MetricItem[];
    /** Compact mode values */
    compactMetrics: { mid: string; spread: string; volume: string } | null;
    /** Order book depth */
    depth: number;
    /** Last update time string */
    lastUpdateTime: string;
    /** Current confidence level */
    confidenceLevel: DataConfidenceLevel;
    /** Whether metrics can be trusted */
    canTrustMetrics: boolean;
    /** Reason for confidence level */
    confidenceReason?: string;
    /** Translations */
    translations: HealthBoardTranslations;
    /** Compact mode */
    compact?: boolean;
}

/* ═══════════════════════════════════════════════════════════
 * MAIN VIEW COMPONENT
 * ═══════════════════════════════════════════════════════════
 */
const HealthBoardView = ({
    hasData,
    metrics,
    compactMetrics,
    depth,
    lastUpdateTime,
    confidenceLevel,
    canTrustMetrics,
    confidenceReason,
    translations: t,
    compact = false,
}: HealthBoardViewProps) => {
    // Loading state
    if (!hasData) {
        if (compact) return null;
        return (
            <Container className="card">
                <div className="card-header">{t.title}</div>
                <Loading className="card-body">
                    <span>{t.loading}</span>
                </Loading>
            </Container>
        );
    }

    // Compact mode
    if (compact && compactMetrics) {
        return (
            <CompactContainer>
                <CompactMetric>
                    <CompactLabel>Mid</CompactLabel>
                    <CompactValue>{compactMetrics.mid}</CompactValue>
                </CompactMetric>
                <CompactDivider>|</CompactDivider>
                <CompactMetric>
                    <CompactLabel>Spread</CompactLabel>
                    <CompactValue>{compactMetrics.spread}</CompactValue>
                </CompactMetric>
                <CompactDivider>|</CompactDivider>
                <CompactMetric>
                    <CompactLabel>Vol</CompactLabel>
                    <CompactValue>{compactMetrics.volume}</CompactValue>
                </CompactMetric>
            </CompactContainer>
        );
    }

    // Full panel
    return (
        <Container className="card" $degraded={!canTrustMetrics}>
            <div className="card-header" style={{ padding: '0.25rem 0.25rem', minHeight: '20px', fontSize: '9px' }}>
                <span>{t.title}</span>
                {!canTrustMetrics && (
                    <ConfidenceBadge $level={confidenceLevel} title={confidenceReason} style={{ width: 10, height: 10, marginLeft: 5 }}>
                        <Icons name={confidenceLevel === 'stale' ? 'pause' : 'zap'} size="xs" />
                    </ConfidenceBadge>
                )}
            </div>

            <Grid>
                {metrics.map((metric, i) => (
                    <MetricItemComponent
                        key={i}
                        metric={metric}
                        confidenceLevel={confidenceLevel}
                        metricsUncertainText={t.metricsUncertain}
                        infoText={t.info}
                    />
                ))}
            </Grid>

            <DepthInfo>
                <DepthLabel>{t.depthLevels}:</DepthLabel>
                <DepthValue className="tabular-nums">{depth}</DepthValue>
                <DepthLabel>{t.lastUpdate}:</DepthLabel>
                <DepthValue className="tabular-nums">{lastUpdateTime}</DepthValue>
            </DepthInfo>
        </Container>
    );
}

export { HealthBoardView };
export default HealthBoardView;
