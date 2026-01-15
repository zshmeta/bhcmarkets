import styled, { keyframes } from 'styled-components';
import type { ToastType } from '../../store/notificationStore';

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideOut = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUp = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
`;

const colorForType = (type: ToastType) => {
  switch (type) {
    case 'success':
      return 'var(--color-positive)';
    case 'error':
      return 'var(--color-negative)';
    case 'warning':
      return 'var(--color-warning)';
    case 'info':
    default:
      return 'var(--color-info)';
  }
};

export const ToastContainerRoot = styled.div`
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-width: 400px;
  pointer-events: none;

  @media (max-width: 768px) {
    top: calc(48px + 0.5rem);
    left: 0.5rem;
    right: 0.5rem;
    max-width: none;
  }
`;

export const ToastRoot = styled.div<{ $type: ToastType; $isExiting: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-elevated);
  border: 1px solid var(--border-default);
  border-left: 3px solid ${(p) => colorForType(p.$type)};
  border-radius: 0.375rem;
  box-shadow: var(--shadow-lg);
  font-size: var(--font-size-sm);
  pointer-events: auto;
  backdrop-filter: blur(8px);
  animation: ${(p) => (p.$isExiting ? slideOut : slideIn)} 0.3s
    ${(p) => (p.$isExiting ? 'ease-in' : 'ease-out')} ${(p) => (p.$isExiting ? 'forwards' : 'none')};

  @media (max-width: 768px) {
    width: 100%;
    animation: ${(p) => (p.$isExiting ? slideUp : slideDown)} 0.3s
      ${(p) => (p.$isExiting ? 'ease-in' : 'ease-out')} ${(p) => (p.$isExiting ? 'forwards' : 'none')};
  }
`;

export const IconBadge = styled.span<{ $type: ToastType }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => colorForType(p.$type)};
  color: white;
`;

export const Message = styled.span`
  flex: 1;
  color: var(--text-primary);
  line-height: 1.4;
  min-width: 0;
`;

export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: var(--text-tertiary);
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all var(--transition-fast);
  flex-shrink: 0;

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;
