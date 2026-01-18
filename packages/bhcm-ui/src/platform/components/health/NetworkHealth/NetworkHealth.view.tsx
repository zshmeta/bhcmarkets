import { Icons } from '../Icons';
import type { HealthCheck, StatItem, NetworkHealthData, DiagnosticsTranslations } from './useNetworkHealth';
import type { NetworkEvent, NetworkEventType } from '../../../../../../sdk/utils/types/market';
import {
    Overlay, Drawer, Header, Title, CloseBtn, Content, Section, SectionTitle,
    ChecksGrid, CheckItem as CheckItemStyled, CheckIcons, CheckLabel, CheckStatus,
    StatsGrid, StatItem as StatItemStyled, StatLabel, StatValue, Timeline, TimelineEvent, TimelineTime,
    TimelineIcons, TimelineContent, TimelineLevel, TimelineReason, Actions, ActionBtn,
    ScoreGauge, ScoreCircle, ScoreValue, ScoreMax, ScoreInfo, ScoreLabel, ScoreTrend,
    ScoreBreakdown, ScoreItem, ScoreItemLabel, ScoreBar, ScoreBarFill, ScoreItemValue,
    EmptyTimeline,
} from './NetworkHealth.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 */

function CheckItemComponent({ label, passed, translations }: { label: string; passed: boolean; translations: DiagnosticsTranslations }) {
    return (
        <CheckItemStyled>
            <CheckIcons $passed={passed}><Icons name={passed ? 'check' : 'x'} size="sm" /></CheckIcons>
            <CheckLabel>{label}</CheckLabel>
            <CheckStatus $passed={passed}>{passed ? translations.passed : translations.failed}</CheckStatus>
        </CheckItemStyled>
    );
}

function NetworkEventIcons({ type }: { type: NetworkEventType }) {
    const IconsMap: Record<NetworkEventType, string> = {
        connected: 'wifi', disconnected: 'wifi-off', reconnecting: 'refresh-cw',
        latency_spike: 'trending-up', latency_normal: 'trending-down', gap_detected: 'alert-triangle',
        resync_start: 'download', resync_complete: 'check-circle', rate_drop: 'arrow-down', rate_normal: 'arrow-up',
    };
    return <Icons name={(IconsMap[type] || 'circle') as any} size="sm" />;
}

export interface NetworkHealthViewProps {
    isOpen: boolean;
    onClose: () => void;
    healthChecks: HealthCheck[];
    stats: StatItem[];
    networkHealth: NetworkHealthData | null;
    onReconnect: () => void;
    onForceResync: () => void;
    translations: DiagnosticsTranslations;
    getEventType: (type: NetworkEventType) => 'good' | 'bad' | 'warning' | 'default';
    getEventTypeName: (type: NetworkEventType) => string;
}

const NetworkHealthView = ({
    isOpen, onClose, healthChecks, stats, networkHealth,
    onReconnect, onForceResync, translations: t, getEventType, getEventTypeName,
}: NetworkHealthViewProps) => {
    if (!isOpen) return null;

    return (
        <>
            <Overlay onClick={onClose} />
            <Drawer>
                <Header>
                    <Title>{t.title}</Title>
                    <CloseBtn onClick={onClose} aria-label={t.close}><Icons name="x" size="sm" /></CloseBtn>
                </Header>

                <Content>
                    {networkHealth && (
                        <Section>
                            <SectionTitle>{t.networkHealth}</SectionTitle>
                            <ScoreGauge>
                                <ScoreCircle $level={networkHealth.scoreLevel}>
                                    <ScoreValue>{networkHealth.score}</ScoreValue><ScoreMax>/100</ScoreMax>
                                </ScoreCircle>
                                <ScoreInfo>
                                    <ScoreLabel>{networkHealth.scoreLabel}</ScoreLabel>
                                    <ScoreTrend $trend={networkHealth.trend}>
                                        <Icons name={networkHealth.trend === 'improving' ? 'trending-up' : networkHealth.trend === 'degrading' ? 'trending-down' : 'minus'} size="sm" />
                                        {networkHealth.trend}
                                    </ScoreTrend>
                                </ScoreInfo>
                            </ScoreGauge>
                            <ScoreBreakdown>
                                {networkHealth.components.map((c, i) => (
                                    <ScoreItem key={i}>
                                        <ScoreItemLabel>{c.label}</ScoreItemLabel>
                                        <ScoreBar><ScoreBarFill $width={(c.value / c.max) * 100} /></ScoreBar>
                                        <ScoreItemValue>{c.value}/{c.max}</ScoreItemValue>
                                    </ScoreItem>
                                ))}
                            </ScoreBreakdown>
                        </Section>
                    )}

                    <Section>
                        <SectionTitle>{t.systemStatus}</SectionTitle>
                        <ChecksGrid>
                            {healthChecks.map((check, i) => <CheckItemComponent key={i} label={check.label} passed={check.passed} translations={t} />)}
                        </ChecksGrid>
                    </Section>

                    <Section>
                        <SectionTitle>{t.sessionStats}</SectionTitle>
                        <StatsGrid>
                            {stats.map((stat, i) => (
                                <StatItemStyled key={i}><StatLabel>{stat.label}</StatLabel><StatValue>{stat.value}</StatValue></StatItemStyled>
                            ))}
                        </StatsGrid>
                    </Section>

                    <Section>
                        <SectionTitle>{t.truthTimeline}</SectionTitle>
                        <Timeline>
                            {networkHealth?.events && networkHealth.events.length > 0 ? (
                                networkHealth.events.map((event, i) => {
                                    const eventType = getEventType(event.type);
                                    return (
                                        <TimelineEvent key={`${event.timestamp}-${i}`} $type={eventType}>
                                            <TimelineTime>{new Date(event.timestamp).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</TimelineTime>
                                            <TimelineIcons $type={eventType}><NetworkEventIcons type={event.type} /></TimelineIcons>
                                            <TimelineContent>
                                                <TimelineLevel>{getEventTypeName(event.type)}</TimelineLevel>
                                                {event.details && <TimelineReason>{event.details}</TimelineReason>}
                                            </TimelineContent>
                                        </TimelineEvent>
                                    );
                                })
                            ) : (
                                <EmptyTimeline>{t.noEvents}</EmptyTimeline>
                            )}
                        </Timeline>
                    </Section>

                    <Actions>
                        <ActionBtn onClick={onReconnect}>{t.reconnect}</ActionBtn>
                        <ActionBtn onClick={onForceResync}>{t.forceResync}</ActionBtn>
                    </Actions>
                </Content>
            </Drawer>
        </>
    );
}

export { NetworkHealthView };
