import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const pulse = keyframes`
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
`;

export const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export const Overlay = styled.div<{ $variant?: 'component' | 'page' }>`
  position: absolute;
  inset: 0;
  z-index: 100;
  background: ${({ $variant }) =>
        $variant === 'page'
            ? 'rgba(13, 17, 23, 0.65)'
            : 'rgba(13, 17, 23, 0.55)'
    };
  backdrop-filter: blur(${({ $variant }) => $variant === 'page' ? '4px' : '3px'});
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  animation: ${fadeIn} 0.3s ease-out;
  border-radius: inherit;
  overflow: hidden;

  /* Subtle gradient overlay */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(
      ellipse at center,
      rgba(88, 166, 255, 0.06) 0%,
      transparent 70%
    );
    pointer-events: none;
  }
`;

export const LockIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(59, 130, 246, 0.12) 100%);
  border: 1px solid rgba(88, 166, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-primary);
  animation: ${pulse} 2s ease-in-out infinite;
`;

export const Message = styled.div`
  text-align: center;
  z-index: 1;
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: 0.02em;
`;

export const Description = styled.p`
  margin: 6px 0 0;
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 280px;
`;

export const LoginButton = styled.button`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%);
  border: 1px solid rgba(88, 166, 255, 0.35);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: linear-gradient(135deg, rgba(88, 166, 255, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%);
    border-color: rgba(88, 166, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(88, 166, 255, 0.15);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const DemoHint = styled.span`
  font-size: 10px;
  color: var(--text-tertiary);
  margin-top: 4px;
  z-index: 1;
`;
