import styled, { css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle/light   → #262C36 / #21262D
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --accent                → #3B82F6
 * --accent-alpha          → rgba(59, 130, 246, 0.15)
 * --color-success/error   → #3FB950 / #F85149
 * --color-warning         → #D29922
 * --space-1..6            → 0.25..1.5rem
 * --radius-sm/md/lg       → 0.25/0.375/0.5rem
 * --font-mono             → 'IBM Plex Mono', monospace
 */

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 1.25rem 1.5rem;
  min-height: 100%;
  overflow-y: auto;
  background: var(--bg-primary, #0D1117);
`;

/* ═══════════════════════════════════════════════════════════
 * HERO SECTION
 * ═══════════════════════════════════════════════════════════
 */
export const HeroSection = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1.8fr auto;
  gap: 1.25rem;
  padding: 1.25rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
  align-items: stretch;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
  }
`;

export const HeroMain = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  min-height: 100%;
`;

export const PortfolioHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

export const PortfolioLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;

  svg {
    color: #3B82F6;
  }
`;

export const AccountBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

export const SimulatedTag = styled.span`
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 600;
  color: var(--color-warning, #D29922);
  background: rgba(210, 153, 34, 0.15);
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const PortfolioValue = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
`;

export const Currency = styled.span`
  font-size: 1.25rem;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
`;

export const Amount = styled.span`
  font-size: 36px;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
  letter-spacing: -1px;
`;

export const PortfolioMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.75rem 0;
`;

interface ChangeIndicatorProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const ChangeIndicator = styled.div<ChangeIndicatorProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  border-radius: 0.375rem;
  border: 1px solid transparent;
  transition: all 0.1s ease-out;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--color-success, #3FB950);
      background: linear-gradient(135deg, rgba(63, 185, 80, 0.15), rgba(63, 185, 80, 0.05));
      border-color: rgba(63, 185, 80, 0.2);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--color-error, #F85149);
      background: linear-gradient(135deg, rgba(248, 81, 73, 0.15), rgba(248, 81, 73, 0.05));
      border-color: rgba(248, 81, 73, 0.2);
    `}
`;

export const ChangeLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: 400;
  opacity: 0.7;
  margin-left: 0.25rem;
`;

export const PnLIndicator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.375rem;
  border: 1px solid var(--border-light, #21262D);
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-hover, #262C36);
    border-color: #3B82F6;
    transform: translateY(-1px);
  }
`;

export const PnLValue = styled.span<ChangeIndicatorProps>`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  line-height: 1.2;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--color-success, #3FB950);
      text-shadow: 0 0 8px rgba(63, 185, 80, 0.15);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--color-error, #F85149);
      text-shadow: 0 0 8px rgba(248, 81, 73, 0.15);
    `}
`;

export const PnLLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

/* ═══════════════════════════════════════════════════════════
 * METRICS GRID
 * ═══════════════════════════════════════════════════════════
 */
export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle, #262C36);

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

export const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, var(--bg-tertiary, #1C2128) 0%, rgba(28, 33, 40, 0.8) 100%);
  border: 1px solid var(--border-light, #21262D);
  border-radius: 0.375rem;
  transition: all 0.1s ease-out;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #3B82F6, transparent);
    opacity: 0;
    transition: opacity 0.1s ease-out;
  }

  &:hover {
    background: var(--bg-hover, #262C36);
    border-color: #3B82F6;
    transform: translateY(-2px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:hover::before {
    opacity: 1;
  }
`;

export const MetricIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 0.25rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.1));
  color: #3B82F6;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

export const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
  flex: 1;
`;

export const MetricValue = styled.span<ChangeIndicatorProps>`
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;

  ${({ $positive }) =>
    $positive &&
    css`
      color: var(--color-success, #3FB950);
      text-shadow: 0 0 8px rgba(63, 185, 80, 0.2);
    `}

  ${({ $negative }) =>
    $negative &&
    css`
      color: var(--color-error, #F85149);
      text-shadow: 0 0 8px rgba(248, 81, 73, 0.2);
    `}
`;

export const MetricLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
`;

/* ═══════════════════════════════════════════════════════════
 * HERO CHART
 * ═══════════════════════════════════════════════════════════
 */
export const HeroChart = styled.div`
  display: flex;
  flex-direction: column;
  padding: 0 1rem;
  border-left: 1px solid var(--border-subtle, #262C36);
  border-right: 1px solid var(--border-subtle, #262C36);
  min-width: 480px;
  align-self: stretch;
  min-height: 0;

  @media (max-width: 1400px) {
    border-left: none;
    border-right: none;
    border-top: 1px solid var(--border-subtle, #262C36);
    min-width: auto;
    padding: 1rem 0 0;
  }
`;

export const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-shrink: 0;
`;

export const ChartTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const TimeRangeSelector = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
`;

interface TimeRangeBtnProps {
  $active?: boolean;
}

export const TimeRangeBtn = styled.button<TimeRangeBtnProps>`
  padding: 0.25rem 0.5rem;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  border-radius: 0.125rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
  }

  ${({ $active }) =>
    $active &&
    css`
      color: var(--text-primary, #E6EDF3);
      background: var(--bg-secondary, #161B22);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `}
`;

export const ChartContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: stretch;
  justify-content: center;
  min-height: 0;
  overflow: hidden;
`;

export const ChartStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  flex-shrink: 0;
`;

export const ChartStatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  text-align: center;
`;

export const ChartStatLabel = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
`;

export const ChartStatValue = styled.span<ChangeIndicatorProps>`
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;
  line-height: 1.3;

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

/* ═══════════════════════════════════════════════════════════
 * HERO ACTIONS
 * ═══════════════════════════════════════════════════════════
 */
export const HeroActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  min-width: 140px;

  @media (max-width: 1400px) {
    flex-direction: row;
  }
`;

export const PrimaryAction = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;
  background: #3B82F6;
  color: white;
  border: none;

  &:hover {
    filter: brightness(1.1);
  }
`;

export const SecondaryAction = styled(PrimaryAction)`
  background: var(--color-success, #3FB950);
`;

export const TertiaryAction = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;
  background: var(--bg-tertiary, #1C2128);
  color: var(--text-primary, #E6EDF3);
  border: 1px solid var(--border-subtle, #262C36);

  &:hover {
    border-color: #3B82F6;
    color: #3B82F6;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * SECTION COMPONENTS
 * ═══════════════════════════════════════════════════════════
 */
export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

export const ViewAllBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: #3B82F6;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    opacity: 0.8;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * MARKET SECTION
 * ═══════════════════════════════════════════════════════════
 */
export const MarketSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const MarketCards = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const MarketCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    border-color: #3B82F6;
    transform: translateY(-2px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
`;

export const MarketHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const MarketIcons = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 0.375rem;
`;

export const MarketInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const MarketSymbol = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const MarketName = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const MarketBody = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

export const MarketPrice = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const MarketChange = styled.span<ChangeIndicatorProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const MarketChartContainer = styled.div`
  height: 32px;
`;

/* ═══════════════════════════════════════════════════════════
 * STATS SECTION
 * ═══════════════════════════════════════════════════════════
 */
export const StatsSection = styled.section`
  margin-bottom: 0.5rem;
`;

export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 0.75rem;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

interface StatCardProps {
  $clickable?: boolean;
}

export const StatCard = styled.div<StatCardProps>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
  transition: all 0.1s ease-out;

  ${({ $clickable }) =>
    $clickable &&
    css`
      cursor: pointer;

      &:hover {
        border-color: #3B82F6;
        transform: translateY(-1px);
      }
    `}
`;

export const StatIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.375rem;
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
`;

export const StatContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const StatLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const StatSub = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
`;

/* ═══════════════════════════════════════════════════════════
 * MAIN GRID
 * ═══════════════════════════════════════════════════════════
 */
export const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.25rem;
  flex: 1;
  min-height: 0;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

export const AssetsSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
  min-height: 0;
`;

export const TableControls = styled.div`
  display: flex;
  gap: 0.75rem;
`;

export const SearchBox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.375rem;
  transition: all 0.1s ease-out;

  &:focus-within {
    border-color: #3B82F6;
  }

  svg {
    color: var(--text-tertiary, #6E7681);
  }

  input {
    background: none;
    border: none;
    outline: none;
    font-size: 0.75rem;
    color: var(--text-primary, #E6EDF3);
    width: 160px;

    &::placeholder {
      color: var(--text-muted, #484F58);
    }
  }
`;

export const TableWrapper = styled.div`
  flex: 1;
  overflow-y: auto;
`;

export const AssetTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    position: sticky;
    top: 0;
    padding: 0.5rem 0.75rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-tertiary, #6E7681);
    background: var(--bg-secondary, #161B22);
    border-bottom: 1px solid var(--border-subtle, #262C36);
    z-index: 10;
  }

  th.sortable {
    cursor: pointer;
    user-select: none;

    &:hover {
      color: var(--text-primary, #E6EDF3);
    }
  }

  td {
    padding: 0.75rem;
    font-size: 0.75rem;
    color: var(--text-primary, #E6EDF3);
    border-bottom: 1px solid var(--border-light, #21262D);
    vertical-align: middle;
  }

  tbody tr {
    transition: background 0.1s ease-out;
  }

  tbody tr:hover {
    background: var(--bg-hover, #262C36);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ROI INDICATOR
 * ═══════════════════════════════════════════════════════════
 */
export const RoiIndicator = styled.div`
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 0.5rem 0.75rem;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 0.375rem;
  border: 1px solid var(--border-light, #21262D);
`;

interface RoiValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const RoiValue = styled.span<RoiValueProps>`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  line-height: 1.2;
  color: var(--text-primary, #E6EDF3);

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const RoiLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

/* ═══════════════════════════════════════════════════════════
 * MARKET CARD VARIANTS
 * ═══════════════════════════════════════════════════════════
 */
export const MarketCardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const MarketCardIcons = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
  font-weight: 700;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 0.375rem;
`;

export const MarketCardInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

export const MarketCardSymbol = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const MarketCardName = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const MarketCardBody = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
`;

export const MarketCardPrice = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

interface MarketCardChangeProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const MarketCardChange = styled.span<MarketCardChangeProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const MarketCardChart = styled.div`
  height: 32px;
`;

/* ═══════════════════════════════════════════════════════════
 * STAT CARD VARIANTS
 * ═══════════════════════════════════════════════════════════
 */
export const StatCardIcons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 0.375rem;
  background: rgba(59, 130, 246, 0.15);
  color: #3B82F6;
`;

export const StatCardContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const StatCardValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const StatCardLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const StatCardSub = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
`;

/* ═══════════════════════════════════════════════════════════
 * TABLE ELEMENTS
 * ═══════════════════════════════════════════════════════════
 */
export const SortableHeader = styled.th`
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    color: var(--text-primary, #E6EDF3);
  }

  svg {
    opacity: 0.7;
  }
`;

export const AssetCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AssetIconsCircle = styled.div`
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.15);
  border-radius: 50%;
`;

export const AssetInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const AssetSymbolText = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const AssetAlloc = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
`;

export const NumericCell = styled.td`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  text-align: right;
`;

export const BalanceValue = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const ValueAmount = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const PriceValueText = styled.span`
  color: var(--text-secondary, #9AA5B1);
`;

interface PnLCellProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const PnLCell = styled.div<PnLCellProps>`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const PnLPercent = styled.span`
  font-size: 10px;
  opacity: 0.8;
`;

export const LineChartCell = styled.div`
  display: flex;
  justify-content: center;
`;

export const TradeBtn = styled.button`
  padding: 0.375rem 0.75rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: #3B82F6;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3B82F6;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * SIDE PANEL
 * ═══════════════════════════════════════════════════════════
 */
export const SidePanel = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const AllocationCard = styled.div`
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
`;

export const CardTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 0.75rem 0;
`;

export const AllocationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const AllocItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
`;

export const AllocHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const AllocBullet = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
`;

export const AllocSymbol = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  flex: 1;
`;

export const AllocPercent = styled.span`
  font-size: 0.6875rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-secondary, #9AA5B1);
`;

export const AllocBar = styled.div`
  height: 4px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 2px;
  overflow: hidden;
`;

export const AllocBarFill = styled.div`
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease-out;
`;

/* ═══════════════════════════════════════════════════════════
 * ACTIVITY CARD
 * ═══════════════════════════════════════════════════════════
 */
export const ActivityCard = styled.div`
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
`;

export const ActivityHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
`;

export const ActivityList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const ActivityItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
`;

export const ActivityItemIcons = styled.div`
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.25rem;
  color: white;
  flex-shrink: 0;
`;

export const ActivityContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ActivityItemHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ActivityItemTitle = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const ActivityTime = styled.span`
  font-size: 10px;
  color: var(--text-muted, #484F58);
`;

export const ActivityDesc = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

interface ActivityValueProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const ActivityValue = styled.span<ActivityValueProps>`
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const EmptyActivity = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem;
  text-align: center;

  svg {
    color: var(--text-muted, #484F58);
  }

  p {
    font-size: 0.75rem;
    color: var(--text-tertiary, #6E7681);
    margin: 0;
  }

  button {
    padding: 0.375rem 0.75rem;
    font-size: 0.6875rem;
    font-weight: 600;
    color: #3B82F6;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 0.25rem;
    cursor: pointer;

    &:hover {
      background: rgba(59, 130, 246, 0.2);
    }
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PERFORMER CARD
 * ═══════════════════════════════════════════════════════════
 */
export const PerformerCard = styled.div`
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.5rem;
`;

export const PerformerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const PerformerIcons = styled.div`
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-success, #3FB950);
  background: rgba(63, 185, 80, 0.15);
  border-radius: 0.375rem;
`;

export const PerformerInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const PerformerSymbol = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

interface PerformerPnLProps {
  $positive?: boolean;
  $negative?: boolean;
}

export const PerformerPnL = styled.span<PerformerPnLProps>`
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;

  ${({ $positive }) => $positive && css`color: var(--color-success, #3FB950);`}
  ${({ $negative }) => $negative && css`color: var(--color-error, #F85149);`}
`;

export const PerformerTradeBtn = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  background: var(--color-success, #3FB950);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    filter: brightness(1.1);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * PORTFOLIO CHART
 * ═══════════════════════════════════════════════════════════
 */
export const PortfolioChart = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
`;

export const ChartSvg = styled.svg`
  width: 100%;
  height: auto;
`;

export const ChartTooltip = styled.div`
  position: absolute;
  padding: 0.375rem 0.5rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  pointer-events: none;
  transform: translateX(-50%);
  z-index: 100;
`;

export const TooltipValue = styled.span`
  display: block;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const TooltipIndex = styled.span`
  display: block;
  font-size: 10px;
  color: var(--text-muted, #484F58);
`;
