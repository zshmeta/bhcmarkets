import styled, { css, keyframes } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --color-bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --color-border-primary/secondary → #30363D / #262C36
 * --color-text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-info        → #58A6FF
 * --color-warning     → #D29922
 * --color-success     → #3FB950
 * --color-error       → #F85149
 * --color-price-up/down → #3FB950 / #F85149
 * --space-1..10       → 0.25..2.5rem
 * --radius-sm/md/lg/full → 0.25/0.375/0.5/9999px
 * --font-mono         → 'IBM Plex Mono', monospace
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 */
export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.5rem;
  min-height: 100%;
  background: var(--color-bg-primary, #0D1117);
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER
 * ═══════════════════════════════════════════════════════════
 */
export const Header = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

export const HeaderTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TitleSection = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const PageTitle = styled.h1`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary, #E6EDF3);
  margin: 0;

  svg {
    color: var(--color-info, #58A6FF);
  }
`;

export const SimulatedBadge = styled.span`
  padding: 4px 10px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--color-warning, #D29922);
  background: rgba(210, 153, 34, 0.15);
  border: 1px solid rgba(210, 153, 34, 0.3);
  border-radius: 9999px;
`;

export const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

export const ExportBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #9AA5B1);
  background: var(--color-bg-secondary, #161B22);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--color-bg-hover, #262C36);
    color: var(--color-text-primary, #E6EDF3);
    border-color: var(--color-border-primary, #30363D);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * STATS GRID
 * ═══════════════════════════════════════════════════════════
 */
export const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.75rem;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

interface StatCardProps {
  $highlight?: boolean;
}

export const StatCard = styled.div<StatCardProps>`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary, #161B22);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.5rem;
  transition: all 0.1s ease-out;

  &:hover {
    border-color: var(--color-border-primary, #30363D);
  }

  ${({ $highlight }) =>
    $highlight &&
    css`
      border-color: var(--color-info, #58A6FF);
      background: linear-gradient(
        135deg,
        var(--color-bg-secondary, #161B22) 0%,
        rgba(88, 166, 255, 0.05) 100%
      );
    `}
`;

export const StatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const StatIcons = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const StatLabel = styled.span`
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const StatBody = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
`;

export const StatValue = styled.span`
  font-size: 1.125rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--color-text-primary, #E6EDF3);
`;

export const StatSubValue = styled.span`
  font-size: 0.6875rem;
  color: var(--color-text-tertiary, #6E7681);
`;

export const LineChart = styled.div`
  flex-shrink: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * TOOLBAR
 * ═══════════════════════════════════════════════════════════
 */
export const Toolbar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-secondary, #161B22);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.5rem;
`;

export const Tabs = styled.div`
  display: flex;
  gap: 0.25rem;
  border-bottom: 1px solid var(--color-border-secondary, #262C36);
  padding-bottom: 0.75rem;
`;

interface TabProps {
  $active?: boolean;
}

export const Tab = styled.button<TabProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-secondary, #9AA5B1);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--color-bg-hover, #262C36);
    color: var(--color-text-primary, #E6EDF3);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: var(--color-bg-tertiary, #1C2128);
      color: var(--color-text-primary, #E6EDF3);

      svg {
        color: var(--color-info, #58A6FF);
      }
    `}

  svg {
    color: inherit;
    opacity: 0.7;
  }
`;

export const Badge = styled.span`
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  background: var(--color-warning, #D29922);
  color: var(--color-bg-primary, #0D1117);
  border-radius: 9999px;
  min-width: 18px;
  text-align: center;
`;

export const Filters = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

export const SearchWrapper = styled.div`
  position: relative;
  flex: 0 0 200px;
`;

export const SearchIcons = styled.span`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary, #6E7681);
  pointer-events: none;
`;

export const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 32px;
  font-size: 0.75rem;
  color: var(--color-text-primary, #E6EDF3);
  background: var(--color-bg-tertiary, #1C2128);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.375rem;
  outline: none;
  transition: all 0.1s ease-out;

  &::placeholder {
    color: var(--color-text-tertiary, #6E7681);
  }

  &:focus {
    border-color: var(--color-info, #58A6FF);
    background: var(--color-bg-primary, #0D1117);
  }
`;

export const FilterSelect = styled.select`
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
  color: var(--color-text-primary, #E6EDF3);
  background: var(--color-bg-tertiary, #1C2128);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.375rem;
  cursor: pointer;
  outline: none;
  transition: all 0.1s ease-out;

  &:hover {
    border-color: var(--color-border-primary, #30363D);
  }

  &:focus {
    border-color: var(--color-info, #58A6FF);
  }
`;

export const TimeFilters = styled.div`
  display: flex;
  gap: 2px;
  padding: 2px;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.375rem;
`;

interface TimeFilterProps {
  $active?: boolean;
}

export const TimeFilter = styled.button<TimeFilterProps>`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--color-text-secondary, #9AA5B1);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--color-text-primary, #E6EDF3);
  }

  ${({ $active }) =>
    $active &&
    css`
      background: var(--color-bg-secondary, #161B22);
      color: var(--color-text-primary, #E6EDF3);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * CONTENT / TABLE
 * ═══════════════════════════════════════════════════════════
 */
export const Content = styled.div`
  flex: 1;
  background: var(--color-bg-secondary, #161B22);
  border: 1px solid var(--color-border-secondary, #262C36);
  border-radius: 0.5rem;
  overflow: hidden;
`;

export const TableContainer = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

export const TableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;

  th {
    padding: 0.75rem 1rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-align: left;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-tertiary, #6E7681);
    background: var(--color-bg-tertiary, #1C2128);
    border-bottom: 1px solid var(--color-border-secondary, #262C36);
    white-space: nowrap;
  }
`;

export const TableBody = styled.tbody`
  tr {
    transition: background 0.1s ease-out;
  }

  tr:hover {
    background: var(--color-bg-hover, #262C36);
  }

  tr:last-child td {
    border-bottom: none;
  }

  td {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    color: var(--color-text-primary, #E6EDF3);
    border-bottom: 1px solid rgba(38, 44, 54, 0.5);
    vertical-align: middle;
  }
`;

export const TimeCell = styled.td`
  white-space: nowrap;
`;

export const TimeMain = styled.span`
  color: var(--color-text-secondary, #9AA5B1);
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
`;

export const SymbolCell = styled.td`
  min-width: 100px;
`;

export const SymbolWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: 2px;
`;

export const SymbolName = styled.span`
  font-weight: 600;
  color: var(--color-text-primary, #E6EDF3);
`;

export const SymbolQuote = styled.span`
  font-size: 0.6875rem;
  color: var(--color-text-tertiary, #6E7681);
`;

interface SideBadgeProps {
  $side: 'buy' | 'sell';
}

export const SideBadge = styled.span<SideBadgeProps>`
  display: inline-flex;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 700;
  border-radius: 0.25rem;
  text-transform: uppercase;
  letter-spacing: 0.02em;

  ${({ $side }) =>
    $side === 'buy'
      ? css`
          background: rgba(63, 185, 80, 0.15);
          color: var(--color-price-up, #3FB950);
        `
      : css`
          background: rgba(248, 81, 73, 0.15);
          color: var(--color-price-down, #F85149);
        `}
`;

export const TypeBadge = styled.span`
  display: inline-flex;
  padding: 3px 8px;
  font-size: 10px;
  font-weight: 500;
  color: var(--color-text-secondary, #9AA5B1);
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.25rem;
  text-transform: uppercase;
`;

export const PriceCell = styled.td`
  text-align: right;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const AmountCell = styled.td`
  text-align: right;
`;

export const AmountWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
`;

export const AmountDivider = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const AmountTotal = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const FillProgress = styled.div`
  height: 2px;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 1px;
  margin-top: 4px;
  overflow: hidden;
`;

export const FillProgressBar = styled.div<{ $width: number; $side: 'buy' | 'sell' }>`
  height: 100%;
  border-radius: 1px;
  transition: width 0.15s ease-out;
  width: ${({ $width }) => $width}%;
  background: ${({ $side }) =>
    $side === 'buy' ? 'var(--color-price-up, #3FB950)' : 'var(--color-price-down, #F85149)'};
`;

/* ═══════════════════════════════════════════════════════════
 * STATUS BADGES
 * ═══════════════════════════════════════════════════════════
 */
type StatusType = 'pending' | 'submitted' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';

interface StatusBadgeProps {
  $variant: StatusType;
}

const statusColors: Record<StatusType, { bg: string; color: string }> = {
  pending: { bg: 'rgba(210, 153, 34, 0.15)', color: '#D29922' },
  submitted: { bg: 'rgba(210, 153, 34, 0.15)', color: '#D29922' },
  open: { bg: 'rgba(88, 166, 255, 0.15)', color: '#58A6FF' },
  partial: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8B5CF6' },
  filled: { bg: 'rgba(63, 185, 80, 0.15)', color: '#3FB950' },
  cancelled: { bg: 'var(--color-bg-tertiary, #1C2128)', color: '#6E7681' },
  rejected: { bg: 'rgba(248, 81, 73, 0.15)', color: '#F85149' },
};

export const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 4px 10px;
  font-size: 0.6875rem;
  font-weight: 500;
  border-radius: 9999px;
  background: ${({ $variant }) => statusColors[$variant].bg};
  color: ${({ $variant }) => statusColors[$variant].color};
`;

export const ActionsCell = styled.td`
  width: 80px;
  text-align: right;
`;

export const CancelBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;
  color: var(--color-error, #F85149);
  background: transparent;

  &:hover {
    background: rgba(248, 81, 73, 0.15);
  }
`;

export const DetailsBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;
  color: var(--color-text-secondary, #9AA5B1);
  background: transparent;

  &:hover {
    background: var(--color-bg-hover, #262C36);
    color: var(--color-text-primary, #E6EDF3);
  }
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
  gap: 0.75rem;
  padding: 2.5rem 1.5rem;
  text-align: center;

  svg {
    color: var(--color-text-muted, #484F58);
    opacity: 0.5;
  }

  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--color-text-secondary, #9AA5B1);
    margin: 0;
  }

  p {
    font-size: 0.75rem;
    color: var(--color-text-tertiary, #6E7681);
    margin: 0;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * DRAWER
 * ═══════════════════════════════════════════════════════════
 */
export const DrawerOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  animation: ${fadeIn} 0.15s ease-out;
`;

export const Drawer = styled.div`
  width: 400px;
  max-width: 90vw;
  height: 100%;
  background: var(--color-bg-secondary, #161B22);
  border-left: 1px solid var(--color-border-secondary, #262C36);
  display: flex;
  flex-direction: column;
  animation: ${slideIn} 0.2s ease-out;
`;

export const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border-secondary, #262C36);
`;

export const DrawerTitle = styled.h2`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-primary, #E6EDF3);
  margin: 0;
`;

export const DrawerClose = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--color-text-secondary, #9AA5B1);
  background: transparent;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--color-bg-hover, #262C36);
    color: var(--color-text-primary, #E6EDF3);
  }
`;

export const DrawerBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 1.25rem;
`;

export const DetailSection = styled.div`
  padding: 1rem 0;
  border-bottom: 1px solid rgba(38, 44, 54, 0.5);

  &:last-child {
    border-bottom: none;
  }
`;

export const SectionTitle = styled.h3`
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary, #6E7681);
  margin: 0 0 0.75rem 0;
`;

export const DetailRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0;
`;

export const DetailLabel = styled.span`
  font-size: 0.75rem;
  color: var(--color-text-secondary, #9AA5B1);
`;

export const DetailValue = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-primary, #E6EDF3);
`;

export const OrderId = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  word-break: break-all;
`;

/* ═══════════════════════════════════════════════════════════
 * FILLS LIST
 * ═══════════════════════════════════════════════════════════
 */
export const FillsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const FillItem = styled.div`
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.375rem;
`;

export const FillMain = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-primary, #E6EDF3);
`;

export const FillAt = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const FillMeta = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.25rem;
  font-size: 0.6875rem;
  color: var(--color-text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * AUTOMATION LAYOUT
 * ═══════════════════════════════════════════════════════════
 */
export const AutomationLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  padding: 1rem;
  height: 100%;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const AutomationMain = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const AutomationSidebar = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

export const AutomationSection = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.5rem;
  overflow: hidden;
`;

export const AutomationSectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--color-border-secondary, #262C36);
`;

export const AutomationSectionTitle = styled.h3`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-primary, #E6EDF3);
  margin: 0;

  svg {
    color: var(--color-info, #58A6FF);
  }
`;

export const SectionCount = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #9AA5B1);
`;

export const TabBadge = styled.span`
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 700;
  background: var(--color-warning, #D29922);
  color: var(--color-bg-primary, #0D1117);
  border-radius: 9999px;
  min-width: 18px;
  text-align: center;
  margin-left: 0.25rem;
`;

export const FillTime = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const FillFee = styled.span`
  color: var(--color-text-tertiary, #6E7681);
`;

export const OrderIdText = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.6875rem;
  color: var(--color-text-secondary, #9AA5B1);
  word-break: break-all;
`;

export const SectionTitleText = styled.h3`
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--color-text-tertiary, #6E7681);
  margin: 0 0 0.75rem 0;
`;

/* ═══════════════════════════════════════════════════════════
 * ANALYTICS
 * ═══════════════════════════════════════════════════════════
 */
export const AnalyticsPanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
`;

export const AnalyticsRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

export const AnalyticsStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem 1rem;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.375rem;
  min-width: 120px;
`;

export const AnalyticsLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--color-text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.03em;
`;

export const AnalyticsValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--color-text-primary, #E6EDF3);
`;

export const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

export const AnalyticsCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--color-bg-tertiary, #1C2128);
  border-radius: 0.5rem;
`;

export const AnalyticsCardTitle = styled.h4`
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-primary, #E6EDF3);
  margin: 0;
`;

export const RatioBar = styled.div`
  height: 8px;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-bg-secondary, #161B22);
`;

export const RatioBarBuy = styled.div`
  height: 100%;
  background: var(--color-price-up, #3FB950);
  transition: width 0.3s ease-out;
`;

export const RatioBarSell = styled.div`
  height: 100%;
  background: var(--color-price-down, #F85149);
  transition: width 0.3s ease-out;
`;

export const RatioLabels = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
`;

export const RatioLabelBuy = styled.span`
  font-size: 0.6875rem;
  color: var(--color-price-up, #3FB950);
`;

export const RatioLabelSell = styled.span`
  font-size: 0.6875rem;
  color: var(--color-price-down, #F85149);
`;

export const RatioValues = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--color-text-secondary, #9AA5B1);
`;

export const SymbolList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const SymbolItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem;
  background: var(--color-bg-secondary, #161B22);
  border-radius: 0.25rem;
`;

export const SymbolInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const SymbolTrades = styled.span`
  font-size: 0.6875rem;
  color: var(--color-text-tertiary, #6E7681);
`;

export const SymbolVolume = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--color-text-primary, #E6EDF3);
`;

export const BarChart = styled.div`
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 80px;
  padding-top: 0.5rem;
`;

export const BarWrapper = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

interface BarProps {
  $height: number;
}

export const Bar = styled.div<BarProps>`
  width: 100%;
  height: ${({ $height }) => $height}%;
  min-height: 4px;
  background: var(--color-info, #58A6FF);
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease-out;
`;

export const BarLabel = styled.span`
  font-size: 10px;
  color: var(--color-text-tertiary, #6E7681);
`;

export const EmptyState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  color: var(--color-text-tertiary, #6E7681);
  font-size: 0.75rem;
`;

export const CompletionStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
`;

export const CompletionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  background: var(--color-bg-secondary, #161B22);
  border-radius: 0.25rem;
`;

export const CompletionLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--color-text-secondary, #9AA5B1);
`;

interface CompletionValueProps {
  $variant?: 'filled' | 'cancelled' | 'rejected' | 'open';
}

export const CompletionValue = styled.span<CompletionValueProps>`
  font-size: 0.875rem;
  font-weight: 600;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;

  ${({ $variant }) => {
    switch ($variant) {
      case 'filled': return css`color: var(--color-success, #3FB950);`;
      case 'cancelled': return css`color: var(--color-text-tertiary, #6E7681);`;
      case 'rejected': return css`color: var(--color-error, #F85149);`;
      case 'open': return css`color: var(--color-info, #58A6FF);`;
      default: return css`color: var(--color-text-primary, #E6EDF3);`;
    }
  }}
`;

