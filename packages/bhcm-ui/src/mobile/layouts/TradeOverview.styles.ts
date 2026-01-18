import styled, { css } from 'styled-components';

/* TradeOverview - Mobile trading dashboard */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary, #0D1117);
  min-height: 100%;
`;

export const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const TitleGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const SectionTitle = styled.h3`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin: 0;
`;

export const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
`;

export const MetricItem = styled.div`
  background: var(--bg-secondary, #161B22);
  padding: 0.75rem;
  border-radius: 0.375rem;
  border: 1px solid var(--border-subtle, #262C36);
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const MetricLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
`;

interface MetricValueProps {
  $trend?: 'up' | 'down' | 'neutral';
}

export const MetricValue = styled.span<MetricValueProps>`
  font-size: 0.875rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
  color: ${({ $trend }) => {
    switch ($trend) {
      case 'up': return 'var(--color-positive, #3FB950)';
      case 'down': return 'var(--color-negative, #F85149)';
      default: return 'var(--text-primary, #E6EDF3)';
    }
  }};
`;

interface PositionCardProps {
  $positive: boolean;
}

export const PositionCard = styled.div<PositionCardProps>`
  background: var(--bg-secondary, #161B22);
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-subtle, #262C36);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0; left: 0;
    width: 4px; height: 100%;
    background: ${({ $positive }) => $positive ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
  }

  ${({ $positive }) => $positive && css`
    background: linear-gradient(to bottom right, var(--bg-secondary, #161B22), rgba(63, 185, 80, 0.05));
  `}
  ${({ $positive }) => !$positive && css`
    background: linear-gradient(to bottom right, var(--bg-secondary, #161B22), rgba(248, 81, 73, 0.05));
  `}
`;

export const PosHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  z-index: 1;
`;

export const PosSymbol = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const PosBase = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
`;

export const PosSide = styled.span<PositionCardProps>`
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 700;
  background: ${({ $positive }) => $positive ? 'rgba(63, 185, 80, 0.2)' : 'rgba(248, 81, 73, 0.2)'};
  color: ${({ $positive }) => $positive ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
`;

export const PosPnl = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`;

export const PnlVal = styled.span`
  font-size: 1.25rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
`;

export const PnlPct = styled.span<PositionCardProps>`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ $positive }) => $positive ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
`;

export const PosGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  z-index: 1;
`;

export const PosItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const PosLabel = styled.span`
  font-size: 10px;
  color: var(--text-tertiary, #6E7681);
`;

export const PosValue = styled.span`
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 500;
`;

export const PosActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  z-index: 1;
`;

interface PosActionBtnProps {
  $marketClose?: boolean;
}

export const PosActionBtn = styled.button<PosActionBtnProps>`
  flex: 1;
  height: 40px;
  border-radius: 0.375rem;
  border: 1px solid var(--border-subtle, #262C36);
  background: var(--bg-primary, #0D1117);
  color: var(--text-primary, #E6EDF3);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.1s ease-out;

  &:active { transform: scale(0.97); }

  ${({ $marketClose }) => $marketClose && css`
    background: var(--color-negative, #F85149);
    color: white;
    border-color: var(--color-negative, #F85149);
  `}
`;

export const EmptyState = styled.div`
  background: var(--bg-secondary, #161B22);
  padding: 1.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px dashed var(--border-subtle, #262C36);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  p {
    color: var(--text-tertiary, #6E7681);
    font-size: 0.75rem;
    margin: 0;
  }
`;

export const QuickActions = styled.div`
  display: flex;
  justify-content: center;
`;

export const QuickBuy = styled.button`
  background: var(--color-positive, #3FB950);
  color: white;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 9999px;
  font-weight: 700;
  font-size: 0.75rem;
  cursor: pointer;
`;

export const BalanceInfo = styled.div`
  background: var(--surface-subtle, #1C2128);
  padding: 1rem;
  border-radius: 0.375rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

export const BalanceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const BalanceLabel = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const BalanceValue = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  font-family: 'IBM Plex Mono', monospace;
`;

export const RiskCard = styled.div`
  background: var(--bg-secondary, #161B22);
  border-radius: 0.5rem;
  overflow: hidden;
  border: 1px solid var(--border-subtle, #262C36);
`;

interface ConfidenceBadgeProps {
  $level: 'degraded' | 'resyncing' | 'stale' | 'live';
}

export const ConfidenceBadge = styled.div<ConfidenceBadgeProps>`
  font-size: 10px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 4px;
  ${({ $level }) => {
    switch ($level) {
      case 'degraded': return css`background: rgba(210, 153, 34, 0.1); color: var(--color-warning, #D29922);`;
      case 'resyncing': return css`background: rgba(88, 166, 255, 0.1); color: var(--color-info, #58A6FF);`;
      case 'stale': return css`background: rgba(248, 81, 73, 0.1); color: var(--color-negative, #F85149);`;
      default: return css`display: none;`;
    }
  }}
`;
