import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --surface              → var(--surface, #1C2128)
 * --border               → var(--border, #30363D)
 * --border-subtle        → var(--border-subtle, #262C36)
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent               → #3B82F6
 * --accent-alpha         → rgba(59, 130, 246, 0.15)
 * --color-price-up/down  → #3FB950 / #F85149
 * --color-warning        → #D29922
 * --space-1/2/3/4        → 0.25/0.5/0.75/1rem
 * --radius-sm/md/lg      → 0.25/0.375/0.5rem
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0% { opacity: 0.6; }
  50% { opacity: 0.3; }
  100% { opacity: 0.6; }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  animation: ${fadeIn} 0.4s ease-out;
`;

/* ═══════════════════════════════════════════════════════════
 * DASHBOARD STATISTICS
 * ═══════════════════════════════════════════════════════════
 */
export const Dashboard = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

interface StatCardProps {
  $clickable?: boolean;
}

export const StatCard = styled.div<StatCardProps>`
  background: var(--surface, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, #3B82F6 0%, transparent 100%);
    opacity: 0.5;
  }

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;
      transition: all 0.1s ease-out;

      &:hover {
        border-color: #3B82F6;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
    `}
`;

export const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const StatLabel = styled.span`
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.08em;
`;

interface SentimentBadgeProps {
  $sentiment: 'bullish' | 'bearish';
}

export const SentimentBadge = styled.span<SentimentBadgeProps>`
  font-size: 9px;
  font-weight: 800;
  padding: 3px 8px;
  border-radius: 0.25rem;
  letter-spacing: 0.05em;

  ${({ $sentiment }) =>
    $sentiment === 'bullish'
      ? css`
          background: rgba(63, 185, 80, 0.15);
          color: var(--color-price-up, #3FB950);
        `
      : css`
          background: rgba(248, 81, 73, 0.15);
          color: var(--color-price-down, #F85149);
        `}
`;

export const PairCount = styled.span`
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const Timeframe = styled.span`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.125rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const StatValue = styled.span`
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  letter-spacing: -0.02em;
`;

export const VolumeSubtext = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
  margin-top: auto;
`;

export const BreadthBar = styled.div`
  height: 6px;
  background: rgba(248, 81, 73, 0.15);
  border-radius: 3px;
  overflow: hidden;
`;

export const BreadthUp = styled.div<{ $width: number }>`
  height: 100%;
  background: linear-gradient(90deg, var(--color-price-up, #3FB950) 0%, var(--color-price-up, #3FB950) 100%);
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  border-radius: 3px;
  width: ${({ $width }) => $width}%;
`;

export const BreadthLegend = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const LegendDot = styled.div<{ $color: 'up' | 'down' }>`
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: ${({ $color }) =>
    $color === 'up' ? 'var(--color-price-up, #3FB950)' : 'var(--color-price-down, #F85149)'};
`;

export const LegendValue = styled.span`
  font-size: 14px;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const LegendLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

/* ═══════════════════════════════════════════════════════════
 * ASSET HIGHLIGHT
 * ═══════════════════════════════════════════════════════════
 */
export const AssetHighlight = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const AssetMain = styled.div`
  display: flex;
  align-items: baseline;
  gap: 4px;
`;

export const AssetSymbol = styled.span`
  font-size: 22px;
  font-weight: 800;
  color: var(--text-primary, #E6EDF3);
  letter-spacing: -0.02em;
`;

export const AssetQuote = styled.span`
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
`;

export const AssetMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

interface ChangeValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const ChangeValue = styled.span<ChangeValueProps>`
  font-size: 18px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;

  ${({ $positive }) => $positive && css`color: var(--color-price-up, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-price-down, #F85149);`}
`;

export const VolumeValue = styled.span`
  font-size: 16px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const PriceValue = styled.span`
  font-size: 13px;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-secondary, #9AA5B1);
`;

/* ═══════════════════════════════════════════════════════════
 * TOOLBAR
 * ═══════════════════════════════════════════════════════════
 */
export const MainCard = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 600px;
  overflow: hidden;
`;

export const Toolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
  background: var(--surface-secondary, #161B22);
  gap: 1rem;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
`;

interface TabProps {
  $active?: boolean;
  $variant?: 'gainer' | 'loser';
}

export const Tab = styled.button<TabProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
  }

  ${({ $active, $variant }) =>
    $active &&
    css`
      background: ${$variant === 'gainer'
        ? 'rgba(63, 185, 80, 0.15)'
        : $variant === 'loser'
          ? 'rgba(248, 81, 73, 0.15)'
          : 'rgba(59, 130, 246, 0.15)'};
      color: ${$variant === 'gainer'
        ? 'var(--color-price-up, #3FB950)'
        : $variant === 'loser'
          ? 'var(--color-price-down, #F85149)'
          : '#3B82F6'};
    `}
`;

export const TabCount = styled.span<{ $active?: boolean }>`
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 10px;
  color: var(--text-tertiary, #6E7681);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  min-width: 18px;
  text-align: center;

  ${({ $active }) =>
    $active &&
    css`
      background: rgba(255, 255, 255, 0.15);
      color: inherit;
    `}
`;

export const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  max-width: 300px;
`;

export const SearchIcons = styled.span`
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-tertiary, #6E7681);
`;

export const Search = styled.input`
  width: 100%;
  height: 32px;
  padding: 0 12px 0 32px;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-primary, #E6EDF3);
  font-size: 13px;

  &:focus {
    outline: none;
    border-color: #3B82F6;
  }
`;

export const ViewToggle = styled.div`
  display: flex;
  gap: 2px;
  background: var(--bg-tertiary, #1C2128);
  padding: 2px;
  border-radius: 0.25rem;
`;

interface ToggleBtnProps {
  $active?: boolean;
}

export const ToggleBtn = styled.button<ToggleBtnProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 0.125rem;

  ${({ $active }) =>
    $active &&
    css`
      background: var(--surface, #1C2128);
      color: #3B82F6;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * TABLE
 * ═══════════════════════════════════════════════════════════
 */
export const TableArea = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHead = styled.thead`
  th {
    position: sticky;
    top: 0;
    background: var(--surface, #1C2128);
    z-index: 5;
    padding: 12px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-tertiary, #6E7681);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--border-subtle, #262C36);
  }
`;

export const Sortable = styled.th`
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--text-primary, #E6EDF3);
  }
`;

export const TableBody = styled.tbody`
  tr {
    cursor: pointer;
    transition: background 0.1s;
  }

  tr:hover {
    background: var(--bg-tertiary, #1C2128);
  }

  td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--border-secondary, #262C36);
    font-size: 14px;
  }
`;

export const AssetCell = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

export const Base = styled.span`
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const Quote = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

export const FavBtn = styled.button<{ $isFav?: boolean }>`
  background: transparent;
  border: none;
  color: var(--text-muted, #484F58);
  cursor: pointer;
  transition: all 0.2s;

  ${({ $isFav }) =>
    $isFav &&
    css`
      color: var(--color-warning, #D29922);
    `}
`;

export const IndicatorCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

interface BadgeProps {
  $warn?: boolean;
}

export const Badge = styled.span<BadgeProps>`
  font-size: 10px;
  font-weight: 800;
  padding: 2px 6px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 4px;
  color: var(--text-secondary, #9AA5B1);

  ${({ $warn }) =>
    $warn &&
    css`
      color: var(--color-warning, #D29922);
      background: rgba(210, 153, 34, 0.15);
    `}
`;

export const TradeBtn = styled.button`
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 0.25rem;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  opacity: 0;
  transition: all 0.2s;

  tr:hover & {
    opacity: 1;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * GRID VIEW
 * ═══════════════════════════════════════════════════════════
 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
  padding: 1rem;
`;

export const Card = styled.div`
  background: var(--surface, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  position: relative;
  overflow: hidden;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px);
    border-color: #3B82F6;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  }
`;

export const CardChart = styled.div`
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 180px;
  height: 60%;
  opacity: 0.35;
  pointer-events: none;
  z-index: 0;
  mask-image: linear-gradient(to top left, black 0%, transparent 85%);
  -webkit-mask-image: linear-gradient(to top left, black 0%, transparent 85%);
  filter: saturate(1.4) blur(0.2px);
`;

export const CardTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const CardSymbol = styled.span`
  font-weight: 800;
  font-size: 16px;
  color: var(--text-primary, #E6EDF3);
`;

export const CardChange = styled.span<ChangeValueProps>`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-weight: 700;
  font-size: 13px;

  ${({ $positive }) => $positive && css`color: var(--color-price-up, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-price-down, #F85149);`}
`;

export const CardPrice = styled.span`
  font-size: 24px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const CardFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  font-weight: 600;
`;

export const MiniTradeBtn = styled.button`
  background: var(--bg-tertiary, #1C2128);
  color: var(--text-primary, #E6EDF3);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
`;

/* ═══════════════════════════════════════════════════════════
 * SKELETONS
 * ═══════════════════════════════════════════════════════════
 */
export const SkeletonSmall = styled.div`
  width: 60px;
  height: 16px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 4px;
  animation: ${pulse} 1.5s infinite;
`;

export const SkeletonWide = styled.div`
  width: 100px;
  height: 24px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 4px;
  animation: ${pulse} 1.5s infinite;
`;

export const SkeletonLarge = styled.div`
  height: 48px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  animation: ${pulse} 1.5s infinite;
`;
