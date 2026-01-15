import styled, { css, keyframes } from 'styled-components';

/* StatusCard - Status states with progress */

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

interface ContainerProps {
  $status: 'pending' | 'processing' | 'success' | 'error';
}

const statusStyles = {
  pending: css`
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid var(--color-info, #58A6FF);
  `,
  processing: css`
    background: rgba(88, 166, 255, 0.1);
    border: 1px solid var(--color-info, #58A6FF);
  `,
  success: css`
    background: rgba(63, 185, 80, 0.1);
    border: 1px solid var(--color-success, #3FB950);
  `,
  error: css`
    background: rgba(248, 81, 73, 0.1);
    border: 1px solid var(--color-error, #F85149);
  `,
};

export const Container = styled.div<ContainerProps>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem;
  border-radius: 0.5rem;
  text-align: center;
  ${({ $status }) => statusStyles[$status]}
`;

interface IconsWrapperProps {
  $status: 'pending' | 'processing' | 'success' | 'error';
  $spinning?: boolean;
}

export const IconsWrapper = styled.div<IconsWrapperProps>`
  margin-bottom: 0.75rem;
  color: ${({ $status }) => {
    switch ($status) {
      case 'pending':
      case 'processing':
        return 'var(--color-info, #58A6FF)';
      case 'success':
        return 'var(--color-success, #3FB950)';
      case 'error':
        return 'var(--color-error, #F85149)';
    }
  }};
  
  ${({ $spinning }) => $spinning && css`
    animation: ${spin} 1s linear infinite;
  `}
`;

export const Content = styled.div`
  margin-bottom: 1rem;
`;

export const Title = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #E6EDF3);
  margin-bottom: 0.25rem;
`;

export const Subtitle = styled.div`
  font-size: 0.75rem;
  color: var(--text-secondary, #9AA5B1);
`;

export const ProgressSection = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

export const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: var(--border, #30363D);
  border-radius: 9999px;
  overflow: hidden;
`;

interface ProgressFillProps {
  $width: number;
}

export const ProgressFill = styled.div<ProgressFillProps>`
  height: 100%;
  background: var(--accent, #58A6FF);
  border-radius: 9999px;
  transition: width 0.1s linear;
  width: ${({ $width }) => $width}%;
`;

export const ProgressText = styled.div`
  font-size: 0.6875rem;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-secondary, #9AA5B1);
  min-width: 32px;
`;

export const DemoSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
`;

export const DemoButton = styled.button`
  padding: 0.5rem 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px dashed var(--border, #30363D);
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    border-color: var(--text-secondary, #9AA5B1);
    border-style: solid;
  }
`;

export const DemoHint = styled.div`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;
