import styled, { css } from 'styled-components';

/* LedgerTable - Transaction history with filters */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const Filters = styled.div`
  display: flex;
  gap: 0.25rem;
`;

interface FilterButtonProps {
  $active?: boolean;
}

export const FilterButton = styled.button<FilterButtonProps>`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  background: transparent;
  border: none;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, #262C36);
  }

  ${({ $active }) => $active && css`
    color: var(--accent, #58A6FF);
    background: rgba(88, 166, 255, 0.1);
  `}
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  th, td {
    padding: 0.5rem 0.75rem;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle, #262C36);
    white-space: nowrap;
  }

  th {
    font-weight: 500;
    color: var(--text-tertiary, #6E7681);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    background: var(--surface, #0D1117);
    z-index: 1;
  }

  tbody tr:hover {
    background: var(--surface-hover, #262C36);
  }
`;

export const NumericHeader = styled.th`
  text-align: right;
`;

export const NumericCell = styled.td`
  text-align: right;
`;

export const TimeCell = styled.td`
  width: 100px;
`;

export const TimeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

export const TimeValue = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-primary, #E6EDF3);
`;

export const DateValue = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

interface TypeBadgeProps {
  $color: string;
}

export const TypeBadge = styled.span<TypeBadgeProps>`
  font-size: 0.6875rem;
  font-weight: 500;
  color: ${({ $color }) => $color};
`;

export const AssetCell = styled.td`
  font-weight: 500;
`;

interface AmountValueProps {
  $positive?: boolean;
}

export const AmountValue = styled.span<AmountValueProps>`
  font-family: 'IBM Plex Mono', monospace;
  color: ${({ $positive }) => $positive ? 'var(--color-success, #3FB950)' : 'var(--color-error, #F85149)'};
`;

export const FeeValue = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-tertiary, #6E7681);
`;

export const ReferenceCell = styled.td`
  max-width: 120px;
`;

export const ReferenceId = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  cursor: help;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 2.5rem;
  color: var(--text-tertiary, #6E7681);

  svg {
    opacity: 0.5;
  }
`;

export const LoadMore = styled.div`
  display: flex;
  justify-content: center;
  padding: 1rem;
  border-top: 1px solid var(--border-subtle, #262C36);
`;

export const LoadMoreButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px solid var(--border, #30363D);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    border-color: var(--text-secondary, #9AA5B1);
  }
`;
