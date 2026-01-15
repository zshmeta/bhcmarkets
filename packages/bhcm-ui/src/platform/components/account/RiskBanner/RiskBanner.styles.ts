import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-primary/subtle         → #30363D / #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-success/warning/error   → #3FB950 / #D29922 / #F85149
 * --color-price-up/down           → #3FB950 / #F85149
 * --radius-xs/md/full             → 0.125rem / 0.375rem / 9999px
 * --space-2/3/4/6                 → 0.5/0.75/1/1.5rem
 * --font-size-xs/sm/base/2xl      → 0.6875/0.75/0.875/1.5rem
 * --transition-normal             → 0.15s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * RISK LEVEL TYPE
 * ═══════════════════════════════════════════════════════════
 */
export type RiskLevel = 'low' | 'medium' | 'high';

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const volatilePulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 transparent;
  }
  50% {
    box-shadow: 0 0 6px 1px var(--color-warning, #D29922);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
interface ContainerProps {
  $full?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px 10px;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;

  ${({ $full }) =>
    $full &&
    css`
      padding: 1rem;
      background: var(--bg-primary, #0D1117);
      border: none;
      gap: 1.5rem;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const RiskIcons = styled.span`
  color: var(--text-tertiary, #6E7681);
  opacity: 0.7;
`;

export const Title = styled.span`
  font-size: 9px;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

/* ═══════════════════════════════════════════════════════════
 * RISK LEVEL BADGE
 * ═══════════════════════════════════════════════════════════
 */
interface LevelBadgeProps {
  $level: RiskLevel;
}

const levelColors: Record<RiskLevel, { bg: string; color: string }> = {
  low: { bg: 'rgba(22, 163, 74, 0.15)', color: '#3FB950' },
  medium: { bg: 'rgba(202, 138, 4, 0.15)', color: '#D29922' },
  high: { bg: 'rgba(220, 38, 38, 0.15)', color: '#F85149' },
};

export const LevelBadge = styled.span<LevelBadgeProps>`
  font-size: 8px;
  font-weight: 800;
  padding: 1px 4px;
  border-radius: 0.125rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  background: ${({ $level }) => levelColors[$level].bg};
  color: ${({ $level }) => levelColors[$level].color};
`;

/* ═══════════════════════════════════════════════════════════
 * RISK RIBBON BAR
 * ═══════════════════════════════════════════════════════════
 */
export const RibbonBar = styled.div`
  height: 2px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 1px;
  overflow: hidden;
  position: relative;
`;

interface SegmentFillProps {
  $width: number;
  $profit?: boolean;
}

export const SegmentFill = styled.div<SegmentFillProps>`
  height: 100%;
  width: ${({ $width }) => Math.min($width, 100)}%;
  transition: width 0.15s ease-out;
  background: ${({ $profit }) =>
    $profit
      ? 'var(--color-price-up, #3FB950)'
      : 'var(--color-price-down, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * PERFORMANCE GRID
 * ═══════════════════════════════════════════════════════════
 */
export const PerfGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 2px;

  @media (max-width: 380px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
`;

export const PerfItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  min-width: 0;
  padding: 2px 0;

  @media (max-width: 380px) {
    flex-direction: row;
    justify-content: space-between;
    gap: 4px;
    padding: 2px 4px;
    background: var(--bg-tertiary, #1C2128);
    border-radius: 0.125rem;
  }
`;

export const PerfLabel = styled.span`
  font-size: 8px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.02em;
`;

interface PerfValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const PerfValue = styled.span<PerfValueProps>`
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary, #9AA5B1);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

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

/* ═══════════════════════════════════════════════════════════
 * COMPACT MODE
 * ═══════════════════════════════════════════════════════════
 */
export const CompactContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const CompactLevel = styled.span<LevelBadgeProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  color: ${({ $level }) => levelColors[$level].color};
`;

export const CompactDivider = styled.span`
  color: var(--border-subtle, #262C36);
`;

export const CompactMetric = styled.span<PerfValueProps>`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 11px;
  font-weight: 500;

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

/* ═══════════════════════════════════════════════════════════
 * FULL DASHBOARD MODE
 * ═══════════════════════════════════════════════════════════
 */
export const ScoreSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

export const GaugeContainer = styled.div<LevelBadgeProps>`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 8px solid var(--border-subtle, #262C36);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-color: ${({ $level }) => levelColors[$level].color};
`;

export const GaugeValue = styled.div`
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--text-primary, #E6EDF3);
  line-height: 1;
`;

export const GaugeLabel = styled.div`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  margin-top: 4px;
`;

export const StatusInfo = styled.div`
  flex: 1;
`;

export const StatusLevel = styled.div<LevelBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: ${({ $level }) => levelColors[$level].bg};
  color: ${({ $level }) => levelColors[$level].color};
`;

export const StatusDesc = styled.p`
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
  line-height: 1.5;
  margin: 0;
`;

export const Divider = styled.div`
  height: 1px;
  background: var(--border-subtle, #262C36);
`;

export const GridTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 0.75rem 0;
`;

export const FullGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

export const GridItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ItemLabel = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

export const ItemValue = styled.span<PerfValueProps>`
  font-size: 0.875rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);

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
