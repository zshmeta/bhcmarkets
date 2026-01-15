import styled, { css, keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --color-bg-secondary   → var(--bg-secondary, #161B22)
 * --color-bg-hover       → var(--bg-hover, #262C36)
 * --color-success        → var(--color-success, #3FB950)
 * --color-warning        → var(--color-warning, #D29922)
 * --color-error          → var(--color-error, #F85149)
 * --color-text-primary   → var(--text-primary, #E6EDF3)
 * --color-text-secondary → var(--text-secondary, #9AA5B1)
 * --color-text-tertiary  → var(--text-tertiary, #6E7681)
 * --color-border-subtle  → var(--border-subtle, #262C36)
 * --space-1/2/4/6        → 0.25/0.5/1/1.5rem
 * --font-size-xs         → 0.6875rem
 * --font-mono            → 'IBM Plex Mono', monospace
 * --radius-sm            → 0.25rem
 * --transition-fast/normal → 0.1s/0.15s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * CONFIDENCE LEVELS
 * ═══════════════════════════════════════════════════════════
 * Color scheme for each data confidence state.
 * Orange (#f97316) is hardcoded as it's not in tokens.css.
 */
export type ConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

const LEVEL_COLORS = {
  live: { border: 'var(--color-success, #3FB950)', bg: 'rgba(22, 163, 74, 0.08)' },
  degraded: { border: 'var(--color-warning, #D29922)', bg: 'rgba(202, 138, 4, 0.08)' },
  resyncing: { border: '#f97316', bg: 'rgba(249, 115, 22, 0.08)' },
  stale: { border: 'var(--color-error, #F85149)', bg: 'rgba(220, 38, 38, 0.08)' },
} as const;

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

/* ═══════════════════════════════════════════════════════════
 * MAIN BAR CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Horizontal status bar at the top of the trading interface.
 * Border color and background indicate current confidence level.
 */
interface BarProps {
  $level: ConfidenceLevel;
}

export const Bar = styled.div<BarProps>`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 1.5rem; /* 24px */
  height: 28px;
  padding: 0 1rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid;
  transition: all 0.15s ease-out;
  overflow: hidden;

  /* Dynamic styling based on confidence level */
  ${({ $level }) => css`
    border-bottom-color: ${LEVEL_COLORS[$level].border};
    background: ${LEVEL_COLORS[$level].bg};
  `}
`;

/* ═══════════════════════════════════════════════════════════
 * STATUS SECTION (Left)
 * ═══════════════════════════════════════════════════════════
 * Displays current state text and optional reason.
 */
export const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SpinningIcons = styled.span`
  display: flex;
  animation: ${spin} 1s linear infinite;
`;

export const StatusInfo = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
`;

interface StatusTextProps {
  $level: ConfidenceLevel;
}

export const StatusText = styled.span<StatusTextProps>`
  font-size: 0.6875rem; /* 11px */
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;

  /* Color matches the confidence level */
  color: ${({ $level }) => LEVEL_COLORS[$level].border};
`;

export const StatusReason = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  opacity: 0.8;
  white-space: nowrap;

  /* Dot separator before the reason text */
  &::before {
    content: "·";
    margin-right: 0.5rem;
  }

  /* Hide on mobile to save space */
  @media (max-width: 768px) {
    display: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * DIVIDER
 * ═══════════════════════════════════════════════════════════
 * Vertical line separating status from metrics.
 */
export const Divider = styled.div`
  width: 1px;
  height: 12px;
  background: var(--border-subtle, #262C36);
  margin: 0 0.5rem;
`;

/* ═══════════════════════════════════════════════════════════
 * METRICS SECTION (Right)
 * ═══════════════════════════════════════════════════════════
 * Quick stats: last update, latency, message rate.
 */
export const MetricsSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-left: auto; /* Push to right side */

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

export const Metric = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;

  & > span {
    font-size: 0.6875rem;
    color: var(--text-secondary, #9AA5B1);
    font-family: 'IBM Plex Mono', ui-monospace, monospace;
  }
`;

export const MetricIcons = styled.span`
  color: var(--text-tertiary, #6E7681);
  opacity: 0.7;
  display: flex;
`;

/* ═══════════════════════════════════════════════════════════
 * DIAGNOSTICS BUTTON
 * ═══════════════════════════════════════════════════════════
 * Opens the diagnostics drawer for detailed connection info.
 */
export const DiagnosticsButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;
  flex-shrink: 0;
  margin-left: 0.5rem;

  &:hover {
    background: var(--bg-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;
