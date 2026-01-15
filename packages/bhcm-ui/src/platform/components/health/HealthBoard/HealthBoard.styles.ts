import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-secondary/tertiary → #161B22 / #1C2128
 * --border-subtle        → var(--border-subtle, #262C36)
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-info           → #58A6FF
 * --color-warning        → #D29922
 * --color-negative       → #F85149
 * --space-1/2/3/4        → 0.25/0.5/0.75/1rem
 * --font-size-xs/sm      → 0.6875/0.75rem
 * --radius-sm            → 0.25rem
 * --shadow-md            → 0 4px 6px rgba(0, 0, 0, 0.1)
 * --transition-fast      → 0.1s ease-out
 */

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
interface ContainerProps {
  $degraded?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;

  ${({ $degraded }) =>
    $degraded &&
    css`
      border-color: var(--color-warning, #D29922);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * GRID LAYOUT
 * ═══════════════════════════════════════════════════════════
 */
export const Grid = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * METRIC ITEM
 * ═══════════════════════════════════════════════════════════
 */
interface MetricItemProps {
  $uncertain?: boolean;
}

export const MetricItem = styled.div<MetricItemProps>`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: 1;
  min-width: fit-content;
  padding: 0 0.5rem;
  border-right: 1px solid var(--border-subtle, #262C36);
  align-items: center;
  text-align: center;

  &:last-child {
    border-right: none;
  }

  ${({ $uncertain }) =>
    $uncertain &&
    css`
      opacity: 0.7;
    `}
`;

export const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const Label = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
`;

export const InfoButton = styled.button`
  background: none;
  border: none;
  padding: 2px;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.6;
  transition: all 0.1s ease-out;

  &:hover {
    opacity: 1;
    color: #58A6FF;
  }
`;

export const UncertainIcons = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  font-size: 10px;
  font-weight: bold;
  background: rgba(210, 153, 34, 0.15);
  color: var(--color-warning, #D29922);
  border-radius: 50%;
  cursor: help;
`;

export const ValueRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

interface ValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const Value = styled.span<ValueProps>`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--color-price-up, #3FB950);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--color-price-down, #F85149);
    `}
`;

export const Unit = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * TOOLTIP
 * ═══════════════════════════════════════════════════════════
 */
export const Tooltip = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.25rem;
  padding: 0.5rem;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  line-height: 1.4;
  z-index: 100;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

/* ═══════════════════════════════════════════════════════════
 * DEPTH INFO FOOTER
 * ═══════════════════════════════════════════════════════════
 */
export const DepthInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-top: 1px solid var(--border-subtle, #262C36);
  background: var(--bg-tertiary, #1C2128);
  font-size: 10px;
`;

export const DepthLabel = styled.span`
  color: var(--text-tertiary, #6E7681);
`;

export const DepthValue = styled.span`
  color: var(--text-secondary, #9AA5B1);
`;

/* ═══════════════════════════════════════════════════════════
 * CONFIDENCE BADGE
 * ═══════════════════════════════════════════════════════════
 */
type ConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

interface ConfidenceBadgeProps {
  $level: ConfidenceLevel;
}

export const ConfidenceBadge = styled.span<ConfidenceBadgeProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  font-size: 12px;
  border-radius: 50%;
  margin-left: auto;
  cursor: help;

  ${({ $level }) =>
    $level === 'degraded' &&
    css`
      background: rgba(210, 153, 34, 0.15);
    `}

  ${({ $level }) =>
    $level === 'resyncing' &&
    css`
      background: rgba(249, 115, 22, 0.15);
      animation: ${pulse} 1.5s ease-in-out infinite;
    `}

  ${({ $level }) =>
    $level === 'stale' &&
    css`
      background: rgba(248, 81, 73, 0.15);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * COMPACT MODE
 * ═══════════════════════════════════════════════════════════
 */
export const CompactContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #161B22);
  border-top: 1px solid var(--border-subtle, #262C36);
  font-size: 0.6875rem;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

export const CompactMetric = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
`;

export const CompactLabel = styled.span`
  color: var(--text-tertiary, #6E7681);
  font-size: 10px;
  text-transform: uppercase;
`;

export const CompactValue = styled.span`
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 500;
`;

export const CompactDivider = styled.span`
  color: var(--border-subtle, #262C36);
`;

/* ═══════════════════════════════════════════════════════════
 * LOADING STATE
 * ═══════════════════════════════════════════════════════════
 */
export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 80px;
  color: var(--text-tertiary, #6E7681);
`;
