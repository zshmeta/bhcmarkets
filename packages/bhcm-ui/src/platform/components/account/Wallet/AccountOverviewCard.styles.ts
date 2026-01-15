import styled from 'styled-components';

/* AccountOverviewCard - Total equity with pie chart */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const Content = styled.div`
  padding: 1rem;
`;

export const TopSection = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const EquitySection = styled.div`
  flex: 1;
`;

export const EquityLabel = styled.div`
  font-size: 0.6875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary, #6E7681);
  margin-bottom: 0.25rem;
`;

export const EquityValue = styled.div`
  display: flex;
  align-items: baseline;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', monospace;
`;

export const CurrencySymbol = styled.span`
  font-size: 1rem;
  color: var(--text-tertiary, #6E7681);
  margin-right: 2px;
`;

export const ChartSection = styled.div`
  width: 64px;
  height: 64px;
`;

export const PieChart = styled.svg`
  transform: rotate(-90deg);
`;

export const DetailsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const DetailLabel = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const DetailValue = styled.span`
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  font-family: 'IBM Plex Mono', monospace;
`;

interface StatusBadgeProps {
  $color?: string;
}

export const StatusBadge = styled.span<StatusBadgeProps>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${({ $color }) => $color || 'var(--text-secondary, #9AA5B1)'};
`;

export const StatusDot = styled.span<StatusBadgeProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color || 'var(--text-secondary, #9AA5B1)'};
`;

export const AllocationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
`;

export const AllocationItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.6875rem;
`;

export const AllocationLabel = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary, #9AA5B1);
`;

interface ColorDotProps {
  $color: string;
}

export const ColorDot = styled.span<ColorDotProps>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

export const AllocationValue = styled.div`
  color: var(--text-primary, #E6EDF3);
  font-weight: 500;
`;

export const EmptyState = styled.div`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  text-align: center;
  padding: 0.5rem 0;
`;
