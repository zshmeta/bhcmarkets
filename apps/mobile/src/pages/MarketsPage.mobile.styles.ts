import styled, { css } from 'styled-components';

/**
 * Mobile Markets Page Styles
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent → #3B82F6
 * --color-positive/negative/warning → #3FB950 / #F85149 / #D29922
 */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
  overflow: hidden;
`;

/* ═══════════════════════════════════════════════════════════
 * SEARCH
 * ═══════════════════════════════════════════════════════════
 */
export const SearchToggle = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  border-radius: 0.25rem;

  &:active {
    background: var(--surface-hover, #262C36);
  }
`;

export const SearchBar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
`;

export const SearchIcons = styled.div`
  color: var(--text-tertiary, #6E7681);
  opacity: 0.6;
`;

export const SearchInput = styled.input`
  flex: 1;
  height: 36px;
  padding: 0 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 0.875rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3B82F6;
    background: var(--bg-primary, #0D1117);
  }

  &::placeholder {
    color: var(--text-muted, #484F58);
  }
`;

export const ClearBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: var(--surface-hover, #262C36);
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 50%;
`;

/* ═══════════════════════════════════════════════════════════
 * CATEGORY NAV
 * ═══════════════════════════════════════════════════════════
 */
export const CategoryNav = styled.div`
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;
  padding-top: 0.25rem;
`;

/* ═══════════════════════════════════════════════════════════
 * LIST
 * ═══════════════════════════════════════════════════════════
 */
export const List = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
`;

export const Loading = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0.25rem;
  gap: 0.25rem;
`;

export const SkeletonItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--bg-primary, #0D1117);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  height: 300px;
  color: var(--text-tertiary, #6E7681);
  text-align: center;
  padding: 2rem;

  span {
    font-size: 1rem;
    font-weight: 500;
    max-width: 200px;
    line-height: 1.5;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * MARKET ITEM
 * ═══════════════════════════════════════════════════════════
 */
export const MarketItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--bg-primary, #0D1117);
  border-bottom: 1px solid var(--border-subtle, #262C36);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, transparent 60%, var(--bg-secondary, #161B22) 100%);
    opacity: 0.4;
    pointer-events: none;
  }

  &:active {
    background: var(--bg-secondary, #161B22);
  }
`;

export const Watermark = styled.div`
  position: absolute;
  right: -8px;
  bottom: -15px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  pointer-events: none;
  z-index: 0;
  user-select: none;
  overflow: hidden;
`;

export const WatermarkText = styled.span`
  font-size: 64px;
  font-weight: 900;
  font-style: italic;
  line-height: 0.8;
  text-transform: uppercase;
  background: linear-gradient(
    to top right,
    var(--text-primary, #E6EDF3) 0%,
    transparent 70%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  opacity: 0.05;
  filter: blur(0.5px);
  transform: rotate(-5deg);
  transition: transform 0.3s ease;

  ${MarketItem}:hover & {
    transform: rotate(-3deg) scale(1.05);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ASSET INFO
 * ═══════════════════════════════════════════════════════════
 */
export const AssetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
`;

export const AssetName = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  line-height: 1.2;
`;

export const AssetQuoteRow = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

export const AssetQuote = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
`;

export const Volume = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

/* ═══════════════════════════════════════════════════════════
 * LineChart & PRICE
 * ═══════════════════════════════════════════════════════════
 */
export const LineChartCol = styled.div`
  position: absolute;
  right: -5px;
  bottom: -5px;
  width: 200px;
  height: 100%;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  opacity: 0.4;
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(to top left, black 0%, transparent 85%);
  -webkit-mask-image: linear-gradient(to top left, black 0%, transparent 85%);
  filter: saturate(1.4) blur(0.2px);
`;

export const PriceCol = styled.div`
  width: 100px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  position: relative;
  z-index: 1;
`;

export const Price = styled.span`
  font-size: 1rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  line-height: 1.2;
`;

interface ChangeBadgeProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const ChangeBadge = styled.div<ChangeBadgeProps>`
  min-width: 72px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  font-size: 11px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  text-align: center;

  ${({ $positive }) => $positive && css`
    background: rgba(63, 185, 80, 0.15);
    color: var(--color-positive, #3FB950);
  `}

  ${({ $negative }) => $negative && css`
    background: rgba(248, 81, 73, 0.15);
    color: var(--color-negative, #F85149);
  `}
`;

/* ═══════════════════════════════════════════════════════════
 * SWIPE HINT
 * ═══════════════════════════════════════════════════════════
 */
export const SwipeHint = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: var(--bg-tertiary, #1C2128);
  border-top: 1px solid var(--border-subtle, #262C36);
  flex-shrink: 0;

  span {
    font-size: 9px;
    color: var(--text-muted, #484F58);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * FAVORITES SEGMENT
 * ═══════════════════════════════════════════════════════════
 */
interface FavoritesSegmentProps {
  $active?: boolean;
}

export const FavoritesSegment = styled.div<FavoritesSegmentProps>`
  color: var(--color-warning, #D29922) !important;
  font-size: 1.2rem !important;
  min-width: 48px !important;
  position: relative;
  background: transparent !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 0 0.5rem !important;
  transition: all 0.2s ease !important;
  opacity: 1 !important;

  &::after {
    content: '';
    position: absolute;
    right: 0;
    top: 25%;
    bottom: 25%;
    width: 1px;
    background: var(--border-subtle, #262C36);
    opacity: 0.5;
  }

  ${({ $active }) => $active && css`
    background: rgba(255, 171, 0, 0.05) !important;
  `}
`;

export const FavoritesBadge = styled.span`
  position: absolute !important;
  top: 2px !important;
  right: 2px !important;
  background: var(--color-warning, #D29922) !important;
  color: var(--bg-primary, #0D1117) !important;
  font-size: 9px !important;
  min-width: 14px !important;
  height: 14px !important;
  padding: 0 2px !important;
  border: 1.5px solid var(--bg-secondary, #161B22);
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  transform: scale(0.8);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;
