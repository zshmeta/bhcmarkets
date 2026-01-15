import styled, { keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary           → var(--bg-primary, #0D1117)
 * --bg-secondary         → var(--bg-secondary, #161B22)
 * --bg-hover             → var(--bg-hover, #262C36)
 * --border-secondary     → var(--border-subtle, #262C36)
 * --text-secondary       → var(--text-secondary, #9AA5B1)
 * --text-tertiary        → var(--text-tertiary, #6E7681)
 * --space-1/2/3/4        → 0.25/0.5/0.75/1rem
 * --font-size-xs/sm      → 0.6875/0.75rem
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
interface ContainerProps {
  $compact?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  overflow: hidden;
  background: ${({ $compact }) => $compact ? 'var(--bg-primary, #0D1117)' : 'transparent'};
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER ROW
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div<ContainerProps>`
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 0.5rem;
  padding: ${({ $compact }) => $compact ? '0.25rem 0.75rem' : '0.5rem 0.75rem'};
  font-size: ${({ $compact }) => $compact ? '10px' : '0.6875rem'};
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border-subtle, #262C36);
  background: ${({ $compact }) => $compact ? 'var(--bg-secondary, #161B22)' : 'transparent'};
`;

/* ═══════════════════════════════════════════════════════════
 * BODY / LIST CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  min-height: 0;
`;

export const List = styled.div`
  /* Scrollable list container */
`;

/* ═══════════════════════════════════════════════════════════
 * TRADE ROW
 * ═══════════════════════════════════════════════════════════
 */
export const TradeRow = styled.div<ContainerProps>`
  display: grid;
  grid-template-columns: 1fr 1fr 80px;
  gap: 0.5rem;
  padding: ${({ $compact }) => $compact ? '0.25rem 0.75rem' : '0.25rem 0.75rem'};
  font-size: ${({ $compact }) => $compact ? '11px' : '0.75rem'};
  transition: background-color 0.1s ease-out;
  animation: ${fadeIn} 0.1s ease-out;
  cursor: pointer;

  &:hover {
    background: var(--bg-hover, #262C36);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE / QTY / TIME CELLS
 * ═══════════════════════════════════════════════════════════
 */
export const Price = styled.span`
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const TradeIcons = styled.span`
  font-size: 0.6875rem;
`;

export const Quantity = styled.span`
  color: var(--text-secondary, #9AA5B1);
  text-align: right;
`;

export const Time = styled.span<ContainerProps>`
  color: var(--text-tertiary, #6E7681);
  text-align: right;
  font-size: ${({ $compact }) => $compact ? '10px' : 'inherit'};
`;

/* ═══════════════════════════════════════════════════════════
 * EMPTY STATE
 * ═══════════════════════════════════════════════════════════
 */
export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.75rem;
`;

export const EmptyIcons = styled.span`
  opacity: 0.5;
`;
