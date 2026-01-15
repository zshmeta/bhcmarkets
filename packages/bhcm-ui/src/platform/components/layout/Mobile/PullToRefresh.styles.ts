import styled, { keyframes } from 'styled-components';

/* PullToRefresh - Pull to refresh with spinner */

const spin = keyframes`to { transform: rotate(360deg); }`;

export const Container = styled.div`
  position: relative;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
`;

interface IndicatorProps {
  $visible: boolean;
}

export const Indicator = styled.div<IndicatorProps>`
  position: absolute;
  top: 0; left: 0; right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  z-index: 10;
  pointer-events: none;
  opacity: ${({ $visible }) => $visible ? 1 : 0};
  transform: translateY(-100%);
  transition: opacity 0.2s ease;
`;

interface SpinnerProps {
  $spinning: boolean;
}

export const Spinner = styled.div<SpinnerProps>`
  width: 32px; height: 32px;
  transition: transform 0.1s linear;
  ${({ $spinning }) => $spinning && `animation: ${spin} 0.8s linear infinite;`}
`;

export const SpinnerSvg = styled.svg`
  width: 100%;
  height: 100%;
`;

interface SpinnerCircleProps {
  $ready: boolean;
}

export const SpinnerCircle = styled.circle<SpinnerCircleProps>`
  stroke: ${({ $ready }) => $ready ? 'var(--accent, #58A6FF)' : 'var(--text-tertiary, #6E7681)'};
  stroke-dasharray: 60 40;
  stroke-linecap: round;
  transition: stroke 0.2s ease;
`;

export const Text = styled.span`
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
  transition: color 0.2s ease;
`;

export const Content = styled.div`
  min-height: 100%;
`;
