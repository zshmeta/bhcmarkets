import styled, { keyframes, css } from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-elevated         → var(--bg-tertiary, #1C2128)
 * --border-default      → var(--border, #30363D)
 * --radius-md           → 0.375rem
 * --shadow-lg           → 0 10px 15px rgba(0, 0, 0, 0.15)
 * --space-2/3/4         → 0.5/0.75/1rem
 * --font-size-sm        → 0.75rem
 * --text-primary        → var(--text-primary, #E6EDF3)
 * --text-tertiary       → var(--text-tertiary, #6E7681)
 * --color-positive      → var(--color-price-up, #3FB950)
 * --color-negative      → var(--color-error, #F85149)
 * --color-warning       → var(--color-warning, #D29922)
 * --color-info          → #58A6FF
 * --transition-fast     → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */
const slideInFromRight = keyframes`
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const slideOutToRight = keyframes`
  from {
    opacity: 1;
    transform: translateX(0);
  }
  to {
    opacity: 0;
    transform: translateX(100%);
  }
`;

const slideDownFromTop = keyframes`
  from {
    opacity: 0;
    transform: translateY(-100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideUpToTop = keyframes`
  from {
    opacity: 1;
    transform: translateY(0);
  }
  to {
    opacity: 0;
    transform: translateY(-100%);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Fixed position container that stacks toasts vertically.
 * pointer-events: none allows clicks to pass through empty space.
 */
export const ToastContainer = styled.div`
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
    top: calc(48px + 0.5rem); /* Below mobile header */
    left: 0.5rem;
    right: 0.5rem;
    max-width: none;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TOAST VARIANTS
 * ═══════════════════════════════════════════════════════════
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

const typeColors: Record<ToastType, string> = {
  success: '#3FB950',
  error: '#F85149',
  warning: '#D29922',
  info: '#58A6FF',
};

/* ═══════════════════════════════════════════════════════════
 * TOAST CARD
 * ═══════════════════════════════════════════════════════════
 */
interface ToastCardProps {
  $type: ToastType;
  $isExiting?: boolean;
}

export const ToastCard = styled.div<ToastCardProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-left: 3px solid ${({ $type }) => typeColors[$type]};
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
  font-size: 0.75rem;
  pointer-events: auto;
  backdrop-filter: blur(8px);
  animation: ${slideInFromRight} 0.3s ease-out;

  ${({ $isExiting }) =>
    $isExiting &&
    css`
      animation: ${slideOutToRight} 0.3s ease-in forwards;
    `}

  @media (max-width: 768px) {
    width: 100%;
    animation: ${slideDownFromTop} 0.3s ease-out;

    ${({ $isExiting }) =>
    $isExiting &&
    css`
        animation: ${slideUpToTop} 0.3s ease-in forwards;
      `}
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TOAST Icons
 * ═══════════════════════════════════════════════════════════
 */
interface IconsWrapperProps {
  $type: ToastType;
}

export const IconsWrapper = styled.span<IconsWrapperProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  font-size: 12px;
  font-weight: bold;
  flex-shrink: 0;
  background: ${({ $type }) => typeColors[$type]};
  color: white;
`;

/* ═══════════════════════════════════════════════════════════
 * MESSAGE TEXT
 * ═══════════════════════════════════════════════════════════
 */
export const MessageText = styled.span`
  flex: 1;
  color: var(--text-primary, #E6EDF3);
  line-height: 1.4;
`;

/* ═══════════════════════════════════════════════════════════
 * DISMISS BUTTON
 * ═══════════════════════════════════════════════════════════
 */
export const DismissButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  color: var(--text-tertiary, #6E7681);
  font-size: 16px;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;
  flex-shrink: 0;
  padding: 0;

  &:hover {
    background: var(--bg-hover, #262C36);
    color: var(--text-primary, #E6EDF3);
  }
`;
