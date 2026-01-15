import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-secondary         → var(--bg-secondary, #161B22)
 * --border-subtle        → var(--border-subtle, #262C36)
 * --radius-md            → 0.375rem
 * --text-primary         → var(--text-primary, #E6EDF3)
 * --text-tertiary        → var(--text-tertiary, #6E7681)
 * --color-price-up       → var(--color-price-up, #3FB950)
 * --color-price-down     → var(--color-price-down, #F85149)
 * --color-warning        → var(--color-warning, #D29922)
 * --space-1/2/3          → 0.25/0.5/0.75rem
 * --font-size-xs/sm      → 0.6875/0.75rem
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Horizontal ribbon showing account metrics. Scrollable when
 * content overflows on smaller screens.
 */
export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.375rem;
  height: 48px;
  flex-shrink: 0;
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 1400px) {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  @media (max-width: 1280px) {
    justify-content: space-between;
    flex-wrap: wrap;
    height: auto;
    min-height: 48px;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * METRIC ITEM
 * ═══════════════════════════════════════════════════════════
 */
export const Item = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex-shrink: 0;

  @media (max-width: 1280px) {
    flex: 1 1 auto;
    min-width: 70px;
    text-align: center;
  }
`;

export const Label = styled.span`
  font-size: 9px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;

  @media (max-width: 1400px) {
    font-size: 8px;
  }
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
  display: flex;
  align-items: baseline;
  gap: 0.25rem;

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

  @media (max-width: 1400px) {
    font-size: 0.6875rem;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PNL DISPLAY
 * ═══════════════════════════════════════════════════════════
 */
export const PnlValue = styled.span`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

export const PnlPercent = styled.span`
  font-size: 0.6875rem;
  opacity: 0.8;

  @media (max-width: 1400px) {
    font-size: 10px;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * DIVIDER
 * ═══════════════════════════════════════════════════════════
 */
export const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: var(--border-subtle, #262C36);
  flex-shrink: 0;

  @media (max-width: 1280px) {
    display: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * WARNING INDICATOR
 * ═══════════════════════════════════════════════════════════
 */
export const WarningIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-warning, #D29922);
  flex-shrink: 0;
`;
