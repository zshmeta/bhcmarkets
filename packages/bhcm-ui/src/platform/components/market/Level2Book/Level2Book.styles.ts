import styled, { css, keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --bg-secondary          → var(--bg-secondary, #161B22)
 * --bg-tertiary           → var(--bg-tertiary, #1C2128)
 * --bg-hover              → var(--bg-hover, #262C36)
 * --color-border-secondary → var(--border-subtle, #262C36)
 * --color-text-primary    → var(--text-primary, #E6EDF3)
 * --color-text-secondary  → var(--text-secondary, #9AA5B1)
 * --color-text-tertiary   → var(--text-tertiary, #6E7681)
 * --color-price-up        → var(--color-price-up, #3FB950)
 * --color-price-down      → var(--color-price-down, #F85149)
 * --color-warning         → var(--color-warning, #D29922)
 * --color-negative        → var(--color-error, #F85149)
 * --space-1/2/3           → 0.25/0.5/0.75rem
 * --font-size-2xs/xs/sm   → 0.625/0.6875/0.75rem
 * --radius-sm             → 0.25rem
 * --transition-fast       → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

/* ═══════════════════════════════════════════════════════════
 * CONFIDENCE LEVEL TYPES
 * ═══════════════════════════════════════════════════════════
 */
export type ConfidenceLevel = 'live' | 'degraded' | 'resyncing' | 'stale';

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
interface ContainerProps {
  $level?: ConfidenceLevel;
  $compact?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  border: 1px solid var(--border-subtle, #21262D);
  border-radius: 0;
  background: var(--bg-secondary, #161B22);

  ${({ $compact }) =>
    $compact &&
    css`
      background: var(--bg-primary, #0D1117);
      border: none;
    `}
`;

export const Body = styled.div<{ $isStale?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;

  ${({ $isStale }) =>
    $isStale &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

export const Header = styled.div<{ $compact?: boolean }>`
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary, #484F58);
  text-transform: uppercase;
  font-family: monospace;
  color: #0000CD;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle, #21262D);
  flex-shrink: 0;

  ${({ $compact }) =>
    $compact &&
    css`
      display: none;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * ASKS/BIDS SECTIONS
 * ═══════════════════════════════════════════════════════════
 */
export const AsksSection = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

export const BidsSection = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
`;

export const ScrollContent = styled.div`
  overflow-y: hidden;
  scrollbar-width: none;
  scrollbar-color: rgba(255, 255, 255, 0.06) transparent;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE LEVEL ROW
 * ═══════════════════════════════════════════════════════════
 */
interface LevelProps {
  $compact?: boolean;
}

export const Level = styled.div<LevelProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1px 6px;
  position: relative;
  height: 18px;
  cursor: pointer;
  transition: background-color 0.06s;

  &:hover {
    background: var(--bg-hover, #1C2128);
  }

  &:active {
    background: rgba(59, 130, 246, 0.08);
  }

  ${({ $compact }) =>
    $compact &&
    css`
      height: 16px;
      padding: 0 6px;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * DEPTH BAR (Visual representation of order quantity)
 * ═══════════════════════════════════════════════════════════
 */
interface DepthBarProps {
  $side: 'bid' | 'ask';
  $width: number;
}

export const DepthBar = styled.div<DepthBarProps>`
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  opacity: 0.15;
  transition: width 0.2s ease-out;
  width: ${({ $width }) => $width}%;
  background: ${({ $side }) =>
    $side === 'bid'
      ? 'var(--color-price-up, #3FB950)'
      : 'var(--color-price-down, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE & QUANTITY TEXT
 * ═══════════════════════════════════════════════════════════
 */
interface PriceProps {
  $side: 'bid' | 'ask';
  $compact?: boolean;
}

export const Price = styled.span<PriceProps>`
  font-size: 11px;
  font-weight: 500;
  z-index: 1;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;
  color: ${({ $side }) =>
    $side === 'bid'
      ? 'var(--color-price-up, #3FB950)'
      : 'var(--color-price-down, #F85149)'};

  ${({ $compact }) =>
    $compact &&
    css`
      font-size: 10px;
    `}
`;

export const Quantity = styled.span<{ $compact?: boolean }>`
  font-size: 11px;
  color: var(--text-secondary, #8B949E);
  z-index: 1;
  font-variant-numeric: tabular-nums;
  font-family: 'SF Mono', 'Fira Code', 'Consolas', monospace;

  ${({ $compact }) =>
    $compact &&
    css`
      font-size: 10px;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * SPREAD SECTION
 * ═══════════════════════════════════════════════════════════
 */
export const SpreadSection = styled.div<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
  padding: 0.5px 1px;
  background: transparent;
  border-top: 1px solid rgba(255, 255, 255, 0.04);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  ${({ $compact }) =>
    $compact &&
    css`
      padding: 1px 6px;
    `}
`;

export const SpreadLabel = styled.span`
  font-size: 5px;
  color: var(--text-tertiary, #484F58);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

export const SpreadValue = styled.div<{ $compact?: boolean }>`
  font-size: 7px;
  color: var(--text-primary, #E6EDF3);
  font-weight: 600;
  font-variant-numeric: tabular-nums;

  ${({ $compact }) =>
    $compact &&
    css`
      font-size: 11px;
    `}
`;

export const SpreadBps = styled.span<{ $compact?: boolean }>`
  font-size: 5px;
  color: var(--text-tertiary, #484F58);
  margin-left: 4px;

  ${({ $compact }) =>
    $compact &&
    css`
      font-size: 9px;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * LOADING STATE
 * ═══════════════════════════════════════════════════════════
 */
export const Loading = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--text-tertiary, #6E7681);
`;

export const Spinner = styled.span`
  animation: ${spin} 1s linear infinite;
  display: flex;
`;

/* ═══════════════════════════════════════════════════════════
 * CONFIDENCE BADGE
 * ═══════════════════════════════════════════════════════════
 */
interface ConfidenceBadgeProps {
  $level: ConfidenceLevel;
}

export const ConfidenceBadge = styled.div<ConfidenceBadgeProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border-radius: 2px;

  ${({ $level }) =>
    $level === 'degraded' &&
    css`
      color: var(--color-warning, #D29922);
      background: rgba(210, 153, 34, 0.12);
    `}

  ${({ $level }) =>
    $level === 'resyncing' &&
    css`
      color: #f97316;
      background: rgba(249, 115, 22, 0.12);

      svg {
        animation: ${spin} 1s linear infinite;
      }
    `}

  ${({ $level }) =>
    $level === 'stale' &&
    css`
      color: var(--color-error, #F85149);
      background: rgba(248, 81, 73, 0.12);
      animation: ${pulse} 1s ease-in-out infinite;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * RESYNC OVERLAY
 * ═══════════════════════════════════════════════════════════
 */
export const ResyncOverlay = styled.div`
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, transparent, #f97316, transparent);
  background-size: 200% 100%;
  animation: ${shimmer} 1.5s ease-in-out infinite;
  z-index: 10;
`;

/* ═══════════════════════════════════════════════════════════
 * EMBEDDED MODE STYLES
 * ═══════════════════════════════════════════════════════════
 */
export const EmbeddedContainer = styled.div<{ $level?: ConfidenceLevel }>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: var(--bg-secondary, #161B22);
  position: relative;
`;

export const EmbeddedBody = styled.div<{ $isStale?: boolean }>`
  flex: 1;
  display: flex;
  min-height: 0;
  overflow: hidden;

  ${({ $isStale }) =>
    $isStale &&
    css`
      opacity: 0.5;
      pointer-events: none;
    `}
`;

export const EmbeddedColumn = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
`;

export const EmbeddedHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary, #484F58);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle, #21262D);
  flex-shrink: 0;
  gap: 4px;

  span:first-child {
    font-weight: 600;
  }
`;

export const EmbeddedScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.06) transparent;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.06);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

export const EmbeddedSpread = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px;
  background: var(--bg-tertiary, #1C2128);
  border-left: 1px solid var(--border-subtle, #21262D);
  border-right: 1px solid var(--border-subtle, #21262D);
  min-width: 80px;
`;

export const EmbeddedSpreadValue = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
`;

export const ConfidenceIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const EmbeddedLevel = styled(Level)`
  height: 16px;
  padding: 0 6px;
`;
