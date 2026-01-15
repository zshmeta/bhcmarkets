import styled, { keyframes } from 'styled-components';

/* MobileActionSheet - iOS-style action sheet */

const fadeIn = keyframes`from { opacity: 0; } to { opacity: 1; }`;
const slideUp = keyframes`from { transform: translateY(100%); } to { transform: translateY(0); }`;

export const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);
  z-index: 200;
  animation: ${fadeIn} 0.2s ease;
`;

export const Sheet = styled.div`
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 201;
  padding: 0.5rem;
  padding-bottom: calc(0.5rem + env(safe-area-inset-bottom));
  animation: ${slideUp} 0.3s cubic-bezier(0.32, 0.72, 0, 1);
`;

export const Content = styled.div`
  background: var(--bg-secondary, #161B22);
  border-radius: 1rem;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

export const Header = styled.div`
  padding: 1rem;
  text-align: center;
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const Title = styled.h3`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
`;

export const Message = styled.p`
  margin: 0.25rem 0 0;
  font-size: 0.6875rem;
  color: var(--text-tertiary, #6E7681);
`;

export const Actions = styled.div`
  display: flex;
  flex-direction: column;
`;

interface ActionBtnProps {
  $destructive?: boolean;
}

export const ActionBtn = styled.button<ActionBtnProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: transparent;
  border: none;
  border-bottom: 1px solid var(--border-subtle, #262C36);
  color: ${({ $destructive }) => $destructive ? 'var(--color-error, #F85149)' : 'var(--accent, #58A6FF)'};
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.1s ease-out;

  &:last-child { border-bottom: none; }
  &:active { background: var(--surface-hover, #262C36); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

export const CancelBtn = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 1rem;
  background: var(--bg-secondary, #161B22);
  border: none;
  border-radius: 1rem;
  color: var(--accent, #58A6FF);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.1s ease-out;

  &:active { background: var(--surface-hover, #262C36); }
`;
