import styled, { css, keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --bg-secondary      → var(--bg-secondary, #161B22)
 * --bg-tertiary       → var(--bg-tertiary, #1C2128)
 * --surface-hover     → var(--surface-hover, #262C36)
 * --border-subtle     → var(--border-subtle, #262C36)
 * --text-primary      → var(--text-primary, #E6EDF3)
 * --text-secondary    → var(--text-secondary, #9AA5B1)
 * --text-tertiary     → var(--text-tertiary, #6E7681)
 * --color-price-up    → var(--color-price-up, #3FB950)
 * --color-price-down  → var(--color-price-down, #F85149)
 * --color-info        → var(--color-info, #58A6FF)
 * --color-error       → var(--color-error, #F85149)
 * --radius-sm         → 0.25rem
 * --font-mono         → 'IBM Plex Mono', monospace
 * --transition-fast   → 0.1s ease-out
 * --transition-normal → 0.15s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const pulse = keyframes`
  0%, 100% { opacity: 0.8; }
  50% { opacity: 0.5; }
`;

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
`;

export const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const HeaderTitle = styled.span`
  font-size: 10px;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.04em;
`;

export const OrderCount = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  margin-left: 6px;
`;

/* ═══════════════════════════════════════════════════════════
 * SCROLLABLE BODY
 * ═══════════════════════════════════════════════════════════
 */
export const Body = styled.div`
  flex: 1;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.06) transparent;

  &::-webkit-scrollbar {
    width: 4px;
    height: 4px;
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
 * TABLE COMPONENTS
 * ═══════════════════════════════════════════════════════════
 */
export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
`;

export const TableHead = styled.thead`
  position: sticky;
  top: 0;
  background: var(--bg-secondary, #161B22);
  z-index: 1;

  th {
    padding: 6px 8px;
    font-size: 9px;
    font-weight: 600;
    color: var(--text-tertiary, #6E7681);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle, #262C36);
    white-space: nowrap;

    &:last-child {
      text-align: right;
    }
  }
`;

interface TableRowProps {
  $status?: string;
}

export const TableBody = styled.tbody<TableRowProps>`
  tr {
    border-bottom: 1px solid var(--border-subtle, #262C36);
    transition: background 0.1s ease-out;

    &:hover {
      background: var(--surface-hover, #262C36);
    }
  }

  td {
    padding: 8px;
    vertical-align: middle;
    white-space: nowrap;
  }
`;

export const TableRow = styled.tr<TableRowProps>`
  ${({ $status }) =>
    $status === 'pending' &&
    css`
      opacity: 0.6;
    `}

  ${({ $status }) =>
    $status === 'submitted' &&
    css`
      animation: ${pulse} 1.5s infinite;
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * SIDE BADGE (Buy/Sell indicator)
 * ═══════════════════════════════════════════════════════════
 */
export const SideCell = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

interface SideBadgeProps {
  $isBuy: boolean;
}

export const SideBadge = styled.span<SideBadgeProps>`
  font-size: 9px;
  font-weight: 700;
  padding: 2px 5px;
  border-radius: 2px;
  text-transform: uppercase;

  ${({ $isBuy }) =>
    $isBuy
      ? css`
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-price-up, #3FB950);
        `
      : css`
          background: rgba(239, 68, 68, 0.15);
          color: var(--color-price-down, #F85149);
        `}
`;

export const TypeBadge = styled.span`
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

export const Symbol = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const NumericCell = styled.td`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-secondary, #9AA5B1);
`;

/* ═══════════════════════════════════════════════════════════
 * STATUS BADGE
 * ═══════════════════════════════════════════════════════════
 */
export const StatusCell = styled.td`
  text-align: center;
`;

interface StatusBadgeProps {
  $status: string;
}

export const StatusBadge = styled.span<StatusBadgeProps>`
  font-size: 9px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 0.25rem;
  text-transform: uppercase;

  ${({ $status }) => {
    switch ($status) {
      case 'pending':
        return css`
          background: var(--bg-tertiary, #1C2128);
          color: var(--text-tertiary, #6E7681);
        `;
      case 'submitted':
      case 'open':
        return css`
          background: rgba(37, 99, 235, 0.1);
          color: var(--color-info, #58A6FF);
        `;
      case 'partial':
        return css`
          background: rgba(34, 197, 94, 0.15);
          color: var(--color-price-up, #3FB950);
        `;
      default:
        return '';
    }
  }}
`;

/* ═══════════════════════════════════════════════════════════
 * FILLED BAR (Progress indicator for partial fills)
 * ═══════════════════════════════════════════════════════════
 */
export const FilledBar = styled.div`
  width: 40px;
  height: 3px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 2px;
  overflow: hidden;
  display: inline-block;
  vertical-align: middle;
  margin-left: 4px;
`;

interface FilledBarInnerProps {
  $percent: number;
  $isBuy: boolean;
}

export const FilledBarInner = styled.div<FilledBarInnerProps>`
  height: 100%;
  border-radius: 2px;
  transition: width 0.15s ease-out;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $isBuy }) =>
    $isBuy
      ? 'var(--color-price-up, #3FB950)'
      : 'var(--color-price-down, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * CANCEL BUTTON
 * ═══════════════════════════════════════════════════════════
 */
export const CancelButton = styled.button`
  padding: 3px 8px;
  font-size: 9px;
  font-weight: 600;
  background: transparent;
  border: 1px solid var(--color-error, #F85149);
  border-radius: 0.25rem;
  color: var(--color-error, #F85149);
  cursor: pointer;
  transition: all 0.1s ease-out;
  text-transform: uppercase;

  &:hover {
    background: var(--color-error, #F85149);
    color: white;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * EMPTY STATE
 * ═══════════════════════════════════════════════════════════
 */
export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 24px;
  color: var(--text-tertiary, #6E7681);
  font-size: 11px;
`;
