import styled, { css } from 'styled-components';

/* TriggerList - Automation triggers list */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
`;

export const TriggerItem = styled.div`
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 6px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.2s;

  &:hover { border-color: var(--accent, #58A6FF); }
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const SymbolType = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const Symbol = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  font-weight: 600;
  font-size: 13px;
  color: var(--text-primary, #E6EDF3);
`;

export const Type = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
  background: var(--bg-tertiary, #1C2128);
  padding: 2px 6px;
  border-radius: 4px;
`;

interface StatusProps {
  $status: 'armed' | 'paused' | 'blocked' | 'triggered' | 'completed' | 'failed' | 'cancelled' | 'expired';
}

export const Status = styled.div<StatusProps>`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: ${({ $status }) => {
    switch ($status) {
      case 'armed': case 'completed': return 'var(--color-positive, #3FB950)';
      case 'paused': return 'var(--text-tertiary, #6E7681)';
      case 'blocked': return '#f0883e';
      case 'triggered': return 'var(--accent, #58A6FF)';
      case 'failed': return 'var(--color-negative, #F85149)';
      default: return 'var(--text-tertiary, #6E7681)';
    }
  }};
`;

export const StatusDot = styled.div<StatusProps>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $status }) => {
    switch ($status) {
      case 'armed': return 'var(--color-positive, #3FB950)';
      case 'paused': return 'var(--text-tertiary, #6E7681)';
      case 'blocked': return '#f0883e';
      case 'triggered': return 'var(--accent, #58A6FF)';
      default: return 'transparent';
    }
  }};
  ${({ $status }) => $status === 'paused' && css`border: 1px solid var(--border, #30363D);`}
`;

export const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const Condition = styled.div`
  font-size: 13px;
  color: var(--text-primary, #E6EDF3);
  display: flex;
  align-items: center;
  gap: 6px;
`;

export const Action = styled.div`
  font-size: 12px;
  color: var(--text-secondary, #9AA5B1);
`;

export const BuyText = styled.span`color: var(--color-positive, #3FB950);`;
export const SellText = styled.span`color: var(--color-negative, #F85149);`;

export const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
  padding-top: 8px;
  border-top: 1px solid var(--border, #30363D);
`;

export const Time = styled.span`
  font-size: 11px;
  color: var(--text-tertiary, #6E7681);
`;

export const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

interface ActionBtnProps {
  $delete?: boolean;
}

export const ActionBtn = styled.button<ActionBtnProps>`
  background: transparent;
  border: none;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: ${({ $delete }) => $delete ? 'var(--color-negative, #F85149)' : 'var(--text-primary, #E6EDF3)'};
  }
`;

interface EmptyStateProps {
  $compact?: boolean;
}

export const EmptyState = styled.div<EmptyStateProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${({ $compact }) => $compact ? '16px' : '32px 16px'};
  color: var(--text-tertiary, #6E7681);
  font-size: ${({ $compact }) => $compact ? '11px' : '13px'};
  gap: ${({ $compact }) => $compact ? '8px' : '12px'};
`;

export const CompactContainer = styled.div`
  height: 100%;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(255, 255, 255, 0.06) transparent;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.06); border-radius: 2px; }
  &::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.12); }
`;

export const CompactTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 10px;

  thead {
    position: sticky;
    top: 0;
    background: var(--bg-tertiary, #1C2128);
    z-index: 1;
  }

  th {
    padding: 6px 8px;
    font-size: 9px;
    font-weight: 600;
    color: var(--text-tertiary, #6E7681);
    text-transform: uppercase;
    letter-spacing: 0.03em;
    text-align: left;
    border-bottom: 1px solid var(--border-subtle, #262C36);
    &:last-child { text-align: right; }
  }
`;

export const CompactRow = styled.tr`
  border-bottom: 1px solid var(--border-subtle, #262C36);
  transition: background 0.1s ease-out;

  &:hover { background: var(--surface-hover, #262C36); }

  td { padding: 8px; vertical-align: middle; }
`;

export const CompactSymbol = styled.span`
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  font-family: 'IBM Plex Mono', monospace;
`;

export const CompactCondition = styled.span`
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-secondary, #9AA5B1);
`;

interface CompactActionProps {
  $buy?: boolean;
}

export const CompactAction = styled.span<CompactActionProps>`
  font-weight: 600;
  color: ${({ $buy }) => $buy ? 'var(--color-positive, #3FB950)' : 'var(--color-negative, #F85149)'};
`;

export const CompactStatus = styled.span<StatusProps>`
  font-size: 9px;
  font-weight: 600;
  padding: 2px 5px;
  border-radius: 0.25rem;
  text-transform: uppercase;
  ${({ $status }) => {
    switch ($status) {
      case 'armed': return css`background: rgba(63, 185, 80, 0.15); color: var(--color-positive, #3FB950);`;
      case 'paused': return css`background: var(--bg-tertiary, #1C2128); color: var(--text-tertiary, #6E7681);`;
      case 'blocked': return css`background: rgba(240, 136, 62, 0.15); color: #f0883e;`;
      case 'triggered': return css`background: rgba(88, 166, 255, 0.15); color: var(--accent, #58A6FF);`;
      default: return '';
    }
  }}
`;

export const CompactActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 4px;
`;

export const CompactActionBtn = styled.button<ActionBtnProps>`
  padding: 3px;
  background: transparent;
  border: none;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  border-radius: 0.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: ${({ $delete }) => $delete ? 'var(--color-negative, #F85149)' : 'var(--text-primary, #E6EDF3)'};
  }
`;
