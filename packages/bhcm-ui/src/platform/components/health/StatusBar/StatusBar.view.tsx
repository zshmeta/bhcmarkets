import { useState } from 'react';
import { Icons } from '../Icons';
import type { LogEntry, HealthCheck, SessionStat, ObservabilityTranslations } from './useStatusBar';
import {
    Container, Header, Tabs, Tab, MetricsContent, Section, SectionTitle,
    HealthGrid, HealthItem, HealthIcons, StatsGrid, StatItem, StatLabel, StatValue,
    LogsContent, LogFilters, FilterBtn, ClearBtn, LogList, EmptyLogs,
    LogItem, LogHeader, LogIcons, LogCategory, LogEvent, LogTime, LogData,
} from './StatusBar.styles';

/* ═══════════════════════════════════════════════════════════
 * PURE PRESENTATIONAL COMPONENT
 * ═══════════════════════════════════════════════════════════
 */

function LogItemComponent({ log }: { log: LogEntry }) {
    const [expanded, setExpanded] = useState(false);
    const levelIconsMap = { debug: 'search' as const, info: 'info' as const, warn: 'alert-triangle' as const, error: 'x' as const };

    return (
        <LogItem $level={log.level} onClick={() => setExpanded(!expanded)}>
            <LogHeader>
                <LogIcons><Icons name={levelIconsMap[log.level]} size="sm" /></LogIcons>
                <LogCategory>[{log.category}]</LogCategory>
                <LogEvent>{log.event}</LogEvent>
                {log.timestamp && <LogTime className="tabular-nums">{new Date(log.timestamp).toLocaleTimeString()}</LogTime>}
            </LogHeader>
            {expanded && Object.keys(log.data).length > 0 && <LogData>{JSON.stringify(log.data, null, 2)}</LogData>}
        </LogItem>
    );
}

export interface StatusBarViewProps {
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

const StatusBarView = ({
    activeTab, logFilter, logsCount, filteredLogs, healthChecks, sessionStats,
    onTabChange, onFilterChange, onClearLogs, translations: t,
}: StatusBarViewProps) => {
    return (
        <Container className="card">
            <Header className="card-header">
                <span><Icons name="activity" size="sm" style={{ marginRight: '8px', verticalAlign: 'middle' }} />{t.title}</span>
                <Tabs>
                    <Tab $active={activeTab === 'metrics'} onClick={() => onTabChange('metrics')}>{t.metrics}</Tab>
                    <Tab $active={activeTab === 'logs'} onClick={() => onTabChange('logs')}>{t.logs} ({logsCount})</Tab>
                </Tabs>
            </Header>

            {activeTab === 'metrics' ? (
                <MetricsContent>
                    <Section>
                        <SectionTitle>{t.systemHealth}</SectionTitle>
                        <HealthGrid>
                            {healthChecks.map((check, i) => (
                                <HealthItem key={i}>
                                    <HealthIcons $healthy={check.healthy}><Icons name={check.healthy ? 'check' : 'x'} size="sm" /></HealthIcons>
                                    <span>{check.label}</span>
                                </HealthItem>
                            ))}
                        </HealthGrid>
                    </Section>
                    <Section>
                        <SectionTitle>{t.sessionStats}</SectionTitle>
                        <StatsGrid>
                            {sessionStats.map((stat, i) => (
                                <StatItem key={i}>
                                    <StatLabel>{stat.label}</StatLabel>
                                    <StatValue className="tabular-nums" $warning={stat.warning} $level={stat.level}>{stat.value}</StatValue>
                                </StatItem>
                            ))}
                        </StatsGrid>
                    </Section>
                </MetricsContent>
            ) : (
                <LogsContent>
                    <LogFilters>
                        <FilterBtn $active={logFilter === 'all'} onClick={() => onFilterChange('all')}>{t.all}</FilterBtn>
                        <FilterBtn $active={logFilter === 'warn'} onClick={() => onFilterChange('warn')}>{t.warnPlus}</FilterBtn>
                        <FilterBtn $active={logFilter === 'error'} onClick={() => onFilterChange('error')}>{t.error}</FilterBtn>
                        <ClearBtn onClick={onClearLogs}>{t.clear}</ClearBtn>
                    </LogFilters>
                    <LogList>
                        {filteredLogs.length === 0 ? <EmptyLogs>{t.noLogs}</EmptyLogs> : filteredLogs.map((log, i) => <LogItemComponent key={i} log={log} />)}
                    </LogList>
                </LogsContent>
            )}
        </Container>
    );
}

export { StatusBarView };
