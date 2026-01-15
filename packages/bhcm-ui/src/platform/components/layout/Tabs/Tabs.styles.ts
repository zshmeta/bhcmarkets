import styled, { css } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --card-bg         → var(--card-bg, #161B22)
 * --bg-secondary    → var(--bg-secondary, #161B22)
 * --bg-tertiary     → var(--bg-tertiary, #1C2128)
 * --border-subtle   → var(--border-subtle, #262C36)
 * --text-primary    → var(--text-primary, #E6EDF3)
 * --text-secondary  → var(--text-secondary, #9AA5B1)
 * --text-tertiary   → var(--text-tertiary, #6E7681)
 * --accent          → var(--accent, #58A6FF)
 * --accent-alpha    → var(--accent-alpha, rgba(88, 166, 255, 0.2))
 * --color-price-up  → var(--color-price-up, #3FB950)
 * --radius-md       → 0.375rem
 * --radius-full     → 9999px
 * --font-mono       → 'IBM Plex Mono', monospace
 * --transition-fast → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Flexbox column that fills available height.
 * min-height: 0 is crucial for nested flex scroll containers.
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0; /* Allows children to shrink below content size */
  background: var(--card-bg, #161B22);
  border-radius: 0.375rem; /* 6px */
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * TWO-COLUMN LAYOUT
 * ═══════════════════════════════════════════════════════════
 * Horizontal split layout for positions/orders (left) and 
 * automation (right). Uses 1px gap + bg color as divider.
 */
export const ColumnsWrapper = styled.div`
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 1px; /* Creates visual divider when combined with bg color */
  background: var(--border-subtle, #262C36); /* Shows through gap */

  /* Stack vertically on smaller screens */
  @media (max-width: 1200px) {
    flex-direction: column;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * COLUMN COMPONENTS
 * ═══════════════════════════════════════════════════════════
 * Left column is wider (60%), right column is constrained.
 * Both use column flex to stack header + content.
 */
export const LeftColumn = styled.div`
  flex: 1.2;
  display: flex;
  flex-direction: column;
  min-width: 0; /* Prevents flex item from overflowing */
  background: var(--card-bg, #161B22);
`;

export const RightColumn = styled.div`
  flex: 0.8;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 380px;
  background: var(--card-bg, #161B22);

  @media (max-width: 1200px) {
    max-width: none;
    min-width: 0;
    border-top: 1px solid var(--border-subtle, #262C36);
  }
`;

export const ColumnHeader = styled.div`
  flex-shrink: 0;
  background: var(--bg-tertiary, #1C2128);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const ColumnContent = styled.div`
  flex: 1;
  min-height: 0;
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * STATUS BAR
 * ═══════════════════════════════════════════════════════════
 * Automation status summary at bottom of right column.
 * Shows armed/paused/executed trigger counts.
 */
export const StatusBar = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 12px;
  background: var(--bg-tertiary, #1C2128);
  border-top: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const StatusItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const StatusLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

export const StatusValue = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

/* ═══════════════════════════════════════════════════════════
 * STATUS DOT
 * ═══════════════════════════════════════════════════════════
 * Small colored indicator for automation state.
 * Active state includes glow effect for visibility.
 */
interface StatusDotProps {
  $active?: boolean;
  $paused?: boolean;
}

export const StatusDot = styled.span<StatusDotProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;

  ${({ $active }) =>
    $active &&
    css`
      background: var(--color-price-up, #3FB950);
      box-shadow: 0 0 4px var(--color-price-up, #3FB950);
    `}

  ${({ $paused }) =>
    $paused &&
    css`
      background: var(--text-tertiary, #6E7681);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * TABS CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Horizontal row of tab buttons within column headers.
 */
export const TabsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 0 8px;
  height: 26px;
`;

/* ═══════════════════════════════════════════════════════════
 * TAB BUTTON
 * ═══════════════════════════════════════════════════════════
 * Individual tab with bottom border indicator for active state.
 */
interface TabButtonProps {
  $active?: boolean;
  $Level2BookTab?: boolean;
}

export const TabButton = styled.button<TabButtonProps>`
  display: flex;
  align-items: center;
  gap: 4px;
  height: 100%;
  padding: 0 8px;
  
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  white-space: nowrap;
  
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
  }

  /* Active state: accent color + bottom border */
  ${({ $active }) =>
    $active &&
    css`
      color: var(--accent, #58A6FF);
      border-bottom-color: var(--accent, #58A6FF);
    `}

  /* Level2Book tab: hidden by default, shown on smaller screens */
  ${({ $Level2BookTab }) =>
    $Level2BookTab &&
    css`
      display: none;

      @media (max-height: 900px) {
        display: flex;
      }

      @media (max-width: 1400px) {
        display: flex;
      }
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * BADGE
 * ═══════════════════════════════════════════════════════════
 * Count indicator pill next to tab labels.
 */
interface BadgeProps {
  $active?: boolean;
}

export const Badge = styled.span<BadgeProps>`
  font-size: 9px;
  padding: 0 4px;
  background: var(--bg-secondary, #161B22);
  border-radius: 9999px;
  color: var(--text-tertiary, #6E7681);
  min-width: 14px;
  text-align: center;

  /* Active state uses accent color scheme */
  ${({ $active }) =>
    $active &&
    css`
      background: var(--accent-alpha, rgba(88, 166, 255, 0.2));
      color: var(--accent, #58A6FF);
    `}
`;
