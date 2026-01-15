import styled from 'styled-components';

/* AssetBalancesPanel - Table with search and filter */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
`;

export const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.5rem;
  background: var(--surface, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  height: 28px;
  color: var(--text-tertiary, #6E7681);
`;

export const SearchInput = styled.input`
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-primary, #E6EDF3);
  font-size: 0.6875rem;
  width: 120px;

  &::placeholder {
    color: var(--text-tertiary, #6E7681);
  }
`;

export const FilterBar = styled.div`
  display: flex;
  padding: 0.5rem 1rem;
  background: var(--surface-hover, #262C36);
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.6875rem;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;

  input {
    cursor: pointer;
  }
`;

export const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover:not(:disabled) {
    color: var(--text-primary, #E6EDF3);
    border-color: var(--text-secondary, #9AA5B1);
    background: var(--surface-hover, #262C36);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const TableWrapper = styled.div`
  overflow-x: auto;
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.75rem;

  th, td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle, #262C36);
  }

  th {
    font-weight: 500;
    color: var(--text-secondary, #9AA5B1);
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  tbody tr:hover {
    background: var(--surface-hover, #262C36);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export const NumericHeader = styled.th`
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
`;

export const NumericCell = styled.td`
  text-align: right;
  font-family: 'IBM Plex Mono', monospace;
`;

interface FrozenValueProps {
  $frozen?: boolean;
}

export const FrozenCell = styled(NumericCell) <FrozenValueProps>`
  color: ${({ $frozen }) => $frozen ? 'var(--color-warning, #D29922)' : 'inherit'};
`;

export const AssetCell = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

export const AssetIcons = styled.div`
  width: 24px;
  height: 24px;
  background: rgba(88, 166, 255, 0.1);
  color: var(--accent, #58A6FF);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.6875rem;
`;

export const AssetName = styled.span`
  font-weight: 500;
  color: var(--text-primary, #E6EDF3);
`;

export const EmptyRow = styled.tr`
  td {
    padding: 2rem 1rem;
  }
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: var(--text-tertiary, #6E7681);

  svg {
    opacity: 0.5;
  }
`;

export const DepositButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: #FFFFFF;
  background: var(--accent, #58A6FF);
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: opacity 0.1s ease-out;

  &:hover {
    opacity: 0.9;
  }
`;
