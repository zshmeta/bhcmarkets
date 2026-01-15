import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle        → var(--border-subtle, #262C36)
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-info           → #58A6FF
 * --color-positive       → #3FB950
 * --color-warning        → #D29922
 * --color-negative       → #F85149
 * --space-1/2/3          → 0.25/0.5/0.75rem
 * --font-size-xs/sm      → 0.6875/0.75rem
 * --radius-sm            → 0.25rem
 * --font-mono            → 'IBM Plex Mono', monospace
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 400px;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

/* ═══════════════════════════════════════════════════════════
 * TABS
 * ═══════════════════════════════════════════════════════════
 */
export const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  background: transparent;
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: rgba(88, 166, 255, 0.15);
      border-color: #58A6FF;
      color: #58A6FF;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * METRICS CONTENT
 * ═══════════════════════════════════════════════════════════
 */
export const MetricsContent = styled.div`
  padding: 0.75rem;
  overflow-y: auto;
`;

export const Section = styled.div`
  margin-bottom: 1rem;
`;

export const SectionTitle = styled.h4`
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0 0 0.5rem;
`;

/* ═══════════════════════════════════════════════════════════
 * HEALTH GRID
 * ═══════════════════════════════════════════════════════════
 */
export const HealthGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

interface HealthItemProps {
  $healthy?: boolean;
}

export const HealthItem = styled.div<HealthItemProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.25rem;
  font-size: 0.75rem;
`;

export const HealthIcons = styled.span<HealthItemProps>`
  font-weight: bold;
  color: ${({ $healthy }) =>
    $healthy ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * STATS GRID
 * ═══════════════════════════════════════════════════════════
 */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.25rem;
`;

export const StatLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

type ConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

interface StatValueProps {
  $warning?: boolean;
  $level?: ConfidenceLevel;
}

export const StatValue = styled.span<StatValueProps>`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);

  ${({ $warning }) =>
    $warning &&
    css`
      color: var(--color-warning, #D29922);
    `}

  ${({ $level }) =>
    $level === 'live' &&
    css`
      color: var(--color-positive, #3FB950);
    `}

  ${({ $level }) =>
    $level === 'degraded' &&
    css`
      color: var(--color-warning, #D29922);
    `}

  ${({ $level }) =>
    $level === 'resyncing' &&
    css`
      color: #f97316;
    `}

  ${({ $level }) =>
    $level === 'stale' &&
    css`
      color: var(--color-negative, #F85149);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * LOGS CONTENT
 * ═══════════════════════════════════════════════════════════
 */
export const LogsContent = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
`;

export const LogFilters = styled.div`
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

interface FilterBtnProps {
  $active?: boolean;
}

export const FilterBtn = styled.button<FilterBtnProps>`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  background: transparent;
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: var(--bg-tertiary, #1C2128);
      border-color: var(--text-secondary, #9AA5B1);
      color: var(--text-primary, #E6EDF3);
    `}
`;

export const ClearBtn = styled.button`
  margin-left: auto;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  background: transparent;
  border: 1px solid var(--color-negative, #F85149);
  border-radius: 0.25rem;
  color: var(--color-negative, #F85149);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: rgba(248, 81, 73, 0.15);
  }
`;

export const LogList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
`;

export const EmptyLogs = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100px;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.75rem;
`;

/* ═══════════════════════════════════════════════════════════
 * LOG ITEM
 * ═══════════════════════════════════════════════════════════
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogItemProps {
  $level: LogLevel;
}

const logLevelColors: Record<LogLevel, string> = {
  debug: '#6E7681',
  info: '#58A6FF',
  warn: '#D29922',
  error: '#F85149',
};

export const LogItem = styled.div<LogItemProps>`
  padding: 0.5rem;
  margin-bottom: 0.25rem;
  background: var(--bg-secondary, #161B22);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: background 0.1s ease-out;
  border-left: 3px solid ${({ $level }) => logLevelColors[$level]};

  &:hover {
    background: var(--bg-tertiary, #1C2128);
  }
`;

export const LogHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
`;

export const LogIcons = styled.span`
  font-size: 12px;
`;

export const LogCategory = styled.span`
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const LogEvent = styled.span`
  color: var(--text-primary, #E6EDF3);
  flex: 1;
`;

export const LogTime = styled.span`
  color: var(--text-tertiary, #6E7681);
  font-size: 10px;
`;

export const LogData = styled.pre`
  margin: 0.5rem 0 0;
  padding: 0.5rem;
  background: var(--bg-primary, #0D1117);
  border-radius: 0.25rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
`;
