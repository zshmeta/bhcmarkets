import styled, { css } from 'styled-components';

/* ExecutionLogList - Automation execution history */

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
`;

interface LogItemProps {
  $result: 'success' | 'failed' | 'blocked';
}

export const LogItem = styled.div<LogItemProps>`
  background: var(--bg-secondary, #161B22);
  border-left: 3px solid ${({ $result }) => {
    switch ($result) {
      case 'success': return 'var(--color-positive, #3FB950)';
      case 'failed': return 'var(--color-negative, #F85149)';
      case 'blocked': return '#f0883e';
      default: return 'var(--border, #30363D)';
    }
  }};
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
`;

export const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const Time = styled.span`
  color: var(--text-tertiary, #6E7681);
  font-size: 11px;
`;

export const Result = styled.span<LogItemProps>`
  font-weight: 600;
  text-transform: uppercase;
  font-size: 10px;
  color: ${({ $result }) => {
    switch ($result) {
      case 'success': return 'var(--color-positive, #3FB950)';
      case 'failed': return 'var(--color-negative, #F85149)';
      case 'blocked': return '#f0883e';
      default: return 'var(--text-tertiary, #6E7681)';
    }
  }};
`;

export const Reason = styled.div`
  color: var(--text-primary, #E6EDF3);
  line-height: 1.4;

  strong { font-weight: 600; }
`;

export const Details = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  color: var(--text-secondary, #9AA5B1);
  font-size: 11px;
  background: var(--bg-tertiary, #1C2128);
  padding: 4px 8px;
  border-radius: 4px;
`;

export const DetailItem = styled.div`
  display: flex;
  gap: 4px;
`;

export const DetailLabel = styled.span`
  color: var(--text-tertiary, #6E7681);
`;

export const OrderLink = styled.span`
  color: var(--accent, #58A6FF);
  text-decoration: underline;
  cursor: pointer;
`;

export const ErrorMessage = styled.div`
  color: var(--color-negative, #F85149);
  font-size: 11px;
  font-style: italic;
`;

export const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  color: var(--text-tertiary, #6E7681);
  font-size: 13px;
  gap: 12px;
`;
