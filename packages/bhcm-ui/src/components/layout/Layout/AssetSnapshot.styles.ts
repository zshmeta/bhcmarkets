import styled, { keyframes } from 'styled-components';

/* AssetSnapshot - Quick equity view in header */

const pulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.5; }
  100% { opacity: 1; }
`;

export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0 0.75rem;
  height: 32px;
  background: var(--surface-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;
  cursor: pointer;

  &:hover {
    background: var(--surface-hover, #262C36);
    border-color: var(--accent, #58A6FF);
  }
`;

export const Item = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

export const Label = styled.span`
  font-size: 8px;
  font-weight: 700;
  color: var(--text-tertiary, #6E7681);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  line-height: 1;
  margin-bottom: 2px;
`;

export const ValueWrapper = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
  line-height: 1;
`;

export const Value = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-primary, #E6EDF3);
`;

export const Unit = styled.span`
  font-size: 9px;
  font-weight: 500;
  color: var(--text-tertiary, #6E7681);
`;

export const Warning = styled.div`
  color: var(--color-warning, #D29922);
  display: flex;
  align-items: center;
  animation: ${pulse} 2s infinite;
`;
