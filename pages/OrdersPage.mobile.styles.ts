import styled, { css } from 'styled-components';

/**
 * Mobile Orders Page Styles
 * Token Reference (from tokens.css):
 * --bg-primary/secondary/tertiary → #0D1117 / #161B22 / #1C2128
 * --border-subtle → #262C36
 * --text-primary/secondary/tertiary → #E6EDF3 / #9AA5B1 / #6E7681
 * --color-positive/negative/warning → #3FB950 / #F85149 / #D29922
 */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-primary, #0D1117);
`;

/* ═══════════════════════════════════════════════════════════
 * STATS SUMMARY
 * ═══════════════════════════════════════════════════════════
 */
export const StatsSummary = styled.div`
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
`;

export const StatValue = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const StatLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

/* ═══════════════════════════════════════════════════════════
 * TAB NAV & CONTENT
 * ═══════════════════════════════════════════════════════════
 */
export const TabNav = styled.div`
  background: var(--bg-secondary, #161B22);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
`;

export const OrderList = styled.div`
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

export const Empty = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  height: 200px;
  color: var(--text-tertiary, #6E7681);
`;

/* ═══════════════════════════════════════════════════════════
 * ORDER CARD
 * ═══════════════════════════════════════════════════════════
 */
export const OrderCard = styled.div`
  background: var(--bg-secondary, #161B22);
  border-radius: 0.5rem;
  padding: 0.75rem;
  border: 1px solid var(--border-subtle, #262C36);

  &:active {
    background: var(--surface-hover, #262C36);
  }
`;

export const TradeCard = styled(OrderCard)``;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
`;

export const SymbolRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

export const SymbolName = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const SymbolQuote = styled.span`
  font-size: 0.875rem;
  color: var(--text-tertiary, #6E7681);
`;

interface SideBadgeProps {
    $buy?: boolean;
    $sell?: boolean;
}

export const SideBadge = styled.span<SideBadgeProps>`
  margin-left: 0.5rem;
  padding: 2px 6px;
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: 700;

  ${({ $buy }) => $buy && css`
    background: rgba(63, 185, 80, 0.15);
    color: var(--color-positive, #3FB950);
  `}

  ${({ $sell }) => $sell && css`
    background: rgba(248, 81, 73, 0.15);
    color: var(--color-negative, #F85149);
  `}
`;

interface StatusBadgeProps {
    $status?: 'pending' | 'submitted' | 'open' | 'partial' | 'filled' | 'cancelled' | 'rejected';
}

export const StatusBadge = styled.span<StatusBadgeProps>`
  padding: 2px 8px;
  border-radius: 0.25rem;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;

  ${({ $status }) => {
        switch ($status) {
            case 'pending':
            case 'submitted':
                return css`
          background: rgba(210, 153, 34, 0.15);
          color: var(--color-warning, #D29922);
        `;
            case 'open':
            case 'partial':
                return css`
          background: rgba(59, 130, 246, 0.15);
          color: #3B82F6;
        `;
            case 'filled':
                return css`
          background: rgba(63, 185, 80, 0.15);
          color: var(--color-success, #3FB950);
        `;
            case 'cancelled':
            case 'rejected':
                return css`
          background: rgba(248, 81, 73, 0.15);
          color: var(--color-error, #F85149);
        `;
            default:
                return '';
        }
    }}
`;

/* ═══════════════════════════════════════════════════════════
 * CARD BODY
 * ═══════════════════════════════════════════════════════════
 */
export const CardBody = styled.div`
  margin-bottom: 0.5rem;
`;

export const PriceRow = styled.div`
  display: flex;
  gap: 1rem;
`;

export const PriceItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const PriceLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

export const PriceValue = styled.span`
  font-size: 0.875rem;
  color: var(--text-primary, #E6EDF3);
`;

interface ProgressBarProps {
    $buy?: boolean;
    $sell?: boolean;
}

export const ProgressBar = styled.div`
  height: 3px;
  background: var(--bg-tertiary, #1C2128);
  border-radius: 2px;
  margin-top: 0.5rem;
  overflow: hidden;
`;

export const ProgressFill = styled.div<ProgressBarProps>`
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;

  ${({ $buy }) => $buy && css`background: var(--color-positive, #3FB950);`}
  ${({ $sell }) => $sell && css`background: var(--color-negative, #F85149);`}
`;

/* ═══════════════════════════════════════════════════════════
 * CARD FOOTER
 * ═══════════════════════════════════════════════════════════
 */
export const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const TimeText = styled.span`
  font-size: 0.75rem;
  color: var(--text-tertiary, #6E7681);
`;

export const CancelBtn = styled.button`
  padding: 0.25rem 0.75rem;
  background: transparent;
  border: 1px solid var(--color-error, #F85149);
  border-radius: 0.375rem;
  color: var(--color-error, #F85149);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;

  &:active {
    background: rgba(248, 81, 73, 0.15);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TRADE CARD
 * ═══════════════════════════════════════════════════════════
 */
export const TradeRow = styled.div`
  display: flex;
  justify-content: space-between;
`;

export const TradeItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const TradeLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

export const TradeValue = styled.span`
  font-size: 0.875rem;
  color: var(--text-primary, #E6EDF3);
`;

/* ═══════════════════════════════════════════════════════════
 * ORDER DETAIL
 * ═══════════════════════════════════════════════════════════
 */
export const OrderDetail = styled.div`
  padding: 1rem;
`;

export const DetailSection = styled.div`
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);

  &:last-child {
    border-bottom: none;
    margin-bottom: 0;
  }
`;

export const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
`;

export const DetailLabel = styled.span`
  font-size: 0.875rem;
  color: var(--text-tertiary, #6E7681);
`;

interface DetailValueProps {
    $buy?: boolean;
    $sell?: boolean;
}

export const DetailValue = styled.span<DetailValueProps>`
  font-size: 0.875rem;
  color: var(--text-primary, #E6EDF3);
  font-weight: 500;

  ${({ $buy }) => $buy && css`color: var(--color-positive, #3FB950);`}
  ${({ $sell }) => $sell && css`color: var(--color-negative, #F85149);`}
`;

export const OrderId = styled.span`
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.75rem;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
`;
