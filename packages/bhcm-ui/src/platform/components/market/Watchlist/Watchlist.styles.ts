import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border/border-subtle      → #30363D / #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent                    → #3B82F6
 * --accent-alpha              → rgba(59, 130, 246, 0.15)
 * --color-warning             → #D29922
 * --buy/sell                  → #3FB950 / #F85149
 * --space-1/2/3/6             → 0.25/0.5/0.75/1.5rem
 * --radius-xs/sm              → 0.125/0.25rem
 * --transition-fast           → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
interface ContainerProps {
  $collapsed?: boolean;
}

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--card-bg, #161B22);
  overflow: hidden;

  ${({ $collapsed }) =>
    $collapsed &&
    css`
      width: 48px;
      border-right: 1px solid var(--border-subtle, #262C36);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * SEARCH
 * ═══════════════════════════════════════════════════════════
 */
export const SearchWrapper = styled.div`
  position: relative;
  padding: 0.5rem 0.75rem;
  border-bottom: 5px solid var(--border, #30363D);
`;

export const SearchIcons = styled.span`
  position: absolute;
  left: calc(0.75rem + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary, #6E7681);
  display: flex;
  align-items: center;
  pointer-events: none;
`;

export const SearchInput = styled.input`
  width: 75%;
  padding: 0.5rem 0.75rem;
  padding-left: calc(0.5rem + 24px);
  padding-right: 1.5rem;
  background: var(--surface, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  font-size: 0.75rem;
  color: var(--text-primary, #E6EDF3);
  transition: border-color 0.15s, box-shadow 0.15s;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
  }

  &::placeholder {
    color: var(--text-tertiary, #6E7681);
  }
`;

export const ClearButton = styled.button`
  position: absolute;
  right: calc(0.75rem + 0.5rem);
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 0.125rem;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, #262C36);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * FILTER BUTTON
 * ═══════════════════════════════════════════════════════════
 */
interface FilterBtnProps {
  $active?: boolean;
}

export const FilterBtn = styled.button<FilterBtnProps>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  background: var(--surface, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, #262C36);
  }

  ${({ $active }) =>
    $active &&
    css`
      color: var(--color-warning, #D29922);
      background: rgba(255, 180, 50, 0.1);
      border-color: var(--color-warning, #D29922);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * LIST
 * ═══════════════════════════════════════════════════════════
 */
export const List = styled.div`
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;

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
 * LIST ITEM
 * ═══════════════════════════════════════════════════════════
 */
interface ItemProps {
  $selected?: boolean;
}

export const Item = styled.div<ItemProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.25rem 0.75rem;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-light, #21262D);
  min-height: 42px;

  &:hover {
    background: var(--surface-hover, #262C36);
  }

  ${({ $selected }) =>
    $selected &&
    css`
      background: rgba(59, 130, 246, 0.15);

      &:hover {
        background: rgba(59, 130, 246, 0.15);
      }
    `}
`;

export const ItemLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 1;
`;

export const ItemRight = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0;
  flex-shrink: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * FAVORITE BUTTON
 * ═══════════════════════════════════════════════════════════
 */
interface FavoriteProps {
  $active?: boolean;
}

export const FavoriteBtn = styled.button<FavoriteProps>`
  background: none;
  border: none;
  padding: 0;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 0.125rem;
  transition: color 0.15s, transform 0.15s;
  flex-shrink: 0;

  &:hover {
    color: var(--color-warning, #D29922);
    transform: scale(1.1);
  }

  ${({ $active }) =>
    $active &&
    css`
      color: var(--color-warning, #D29922);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * SYMBOL INFO
 * ═══════════════════════════════════════════════════════════
 */
export const SymbolInfo = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  min-width: 0;
  flex: 1;
`;

export const SymbolHeader = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
  min-width: 0;
  line-height: 1.2;
`;

export const SymbolName = styled.span`
  font-weight: 600;
  font-size: 12px;
  color: var(--text-primary, #E6EDF3);
  display: flex;
  align-items: center;
  gap: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const SymbolQuote = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  white-space: nowrap;
`;

export const PnlRow = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  line-height: 1;
  margin-top: -1px;
`;

export const PnlLabel = styled.span`
  font-size: 9px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

interface PnlValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const PnlValue = styled.span<PnlValueProps>`
  font-size: 9px;
  font-weight: 600;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--buy, #3FB950);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--sell, #F85149);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * PRICE DISPLAY
 * ═══════════════════════════════════════════════════════════
 */
export const Price = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  line-height: 1.2;
`;

interface PriceChangeProps {
  $up?: boolean;
  $down?: boolean;
}

export const PriceChange = styled.span<PriceChangeProps>`
  font-size: 7px;
  font-weight: 600;
  line-height: 1;

  ${({ $up }) =>
    $up &&
    css`
      color: var(--buy, #3FB950);
    `}

  ${({ $down }) =>
    $down &&
    css`
      color: var(--sell, #F85149);
    `}
`;

export const NoPrice = styled.span`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * EMPTY / FOOTER
 * ═══════════════════════════════════════════════════════════
 */
export const Empty = styled.div`
  padding: 1.5rem;
  text-align: center;
  color: var(--text-tertiary, #6E7681);
  font-size: 0.75rem;
`;

export const Footer = styled.div`
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--border, #30363D);
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const Count = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * COLLAPSED MODE
 * ═══════════════════════════════════════════════════════════
 */
export const ItemCollapsed = styled.div`
  padding: 0.5rem;
  justify-content: center;
  height: 40px;
  position: relative;
`;

export const SymbolIconsCollapsed = styled.div`
  width: 24px;
  height: 24px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-secondary, #9AA5B1);
`;

export const PositionIndicator = styled.div`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: #3B82F6;
  border-radius: 50%;
  border: 1px solid var(--bg-secondary, #161B22);
`;

/* ═══════════════════════════════════════════════════════════
 * TAB BAR
 * ═══════════════════════════════════════════════════════════
 */
export const TabBar = styled.div`
  display: flex;
  border-bottom: 1px solid var(--border, #30363D);
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  text-transform: uppercase;
  letter-spacing: 0.04em;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: rgba(255, 255, 255, 0.02);
  }

  ${({ $active }) =>
    $active &&
    css`
      color: var(--text-primary, #E6EDF3);
      background: rgba(59, 130, 246, 0.08);

      &::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 2px;
        background: var(--accent, #3B82F6);
      }
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * CATEGORY HEADERS
 * ═══════════════════════════════════════════════════════════
 */
interface CategoryHeaderProps {
  $expanded?: boolean;
  $nested?: boolean;
}

export const CategoryHeader = styled.div<CategoryHeaderProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: var(--surface, #1C2128);
  cursor: pointer;
  user-select: none;
  transition: background 0.1s;

  ${({ $nested }) =>
    $nested &&
    css`
      padding-left: 1.5rem;
      font-size: 0.6875rem;
      color: var(--text-tertiary, #6E7681);
    `}

  &:hover {
    background: var(--surface-hover, #262C36);
  }

  svg {
    transition: transform 0.15s ease;
    transform: ${({ $expanded }) => ($expanded ? 'rotate(90deg)' : 'rotate(0deg)')};
    flex-shrink: 0;
    opacity: 0.7;
  }
`;

export const CategoryActions = styled.div`
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
`;

export const CategoryBtn = styled.button`
  background: none;
  border: none;
  padding: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  display: flex;
  align-items: center;
  border-radius: 0.125rem;
  transition: color 0.15s, background 0.15s;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: rgba(255, 255, 255, 0.05);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * SYMBOL ROW (Enhanced with sparkline & bid/ask)
 * ═══════════════════════════════════════════════════════════
 */
export const SymbolRow = styled.div<{ $selected?: boolean }>`
  display: grid;
  grid-template-columns: 14px minmax(50px, 1fr) 44px 50px 36px 36px;
  align-items: center;
  gap: 6px;
  padding: 1px 6px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--border-light, #21262D);
  min-height: 36px;

  &:hover {
    background: var(--surface-hover, #262C36);
  }

  ${({ $selected }) =>
    $selected &&
    css`
      background: rgba(59, 130, 246, 0.12);

      &:hover {
        background: rgba(59, 130, 246, 0.15);
      }
    `}
`;

export const SymbolCell = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
`;

export const CategoryContent = styled.div`
  max-height: 180px;
  overflow-y: auto;
  overflow-x: hidden;

  &::-webkit-scrollbar {
    width: 3px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 2px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`;

export const FavoriteIcon = styled.button<{ $active?: boolean }>`
  background: none;
  border: none;
  padding: 0;
  color: ${({ $active }) => ($active ? 'var(--color-warning, #D29922)' : 'var(--text-tertiary, #6E7681)')};
  cursor: pointer;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s, transform 0.15s;

  &:hover {
    color: var(--color-warning, #D29922);
    transform: scale(1.1);
  }
`;

export const InWatchlistIcon = styled.span`
  color: var(--buy, #3FB950);
  display: flex;
  align-items: center;
  flex-shrink: 0;
`;

export const SymbolLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ChangeCell = styled.span<{ $positive?: boolean; $negative?: boolean }>`
  font-size: 0.6875rem;
  font-weight: 500;
  text-align: right;
  white-space: nowrap;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--buy, #3FB950);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--sell, #F85149);
    `}
`;

export const SparklineCell = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const BidAskCell = styled.span<{ $type?: 'bid' | 'ask' }>`
  font-size: 0.6875rem;
  font-weight: 500;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: ${({ $type }) =>
    $type === 'bid' ? 'var(--sell, #F85149)' : $type === 'ask' ? 'var(--buy, #3FB950)' : 'var(--text-secondary, #9AA5B1)'};
`;

/* ═══════════════════════════════════════════════════════════
 * TABLE HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 14px minmax(50px, 1fr) 44px 50px 36px 36px;
  gap: 6px;
  padding: 3px 6px;
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--border, #30363D);
  background: var(--surface, #1C2128);

  span:nth-child(4),
  span:nth-child(5) {
    text-align: right;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ADD WATCHLIST BUTTON
 * ═══════════════════════════════════════════════════════════
 */
export const AddListButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  border-top: 1px solid var(--border, #30363D);
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: rgba(255, 255, 255, 0.02);
  }
`;
