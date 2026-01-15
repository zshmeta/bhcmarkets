import styled, { css } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --color-bg-secondary   → var(--bg-secondary, #161B22)
 * --color-bg-tertiary    → var(--bg-tertiary, #1C2128)
 * --color-bg-hover       → var(--bg-hover, #262C36)
 * --color-border-primary → var(--border, #30363D)
 * --color-border-focus   → var(--color-border-focus, #58A6FF)
 * --color-text-primary   → var(--text-primary, #E6EDF3)
 * --color-text-secondary → var(--text-secondary, #9AA5B1)
 * --color-info           → var(--color-info, #58A6FF)
 * --space-1/2/4          → 0.25/0.5/1rem
 * --font-size-xs/sm      → 0.6875/0.75rem
 * --font-mono            → 'IBM Plex Mono', monospace
 * --radius-sm            → 0.25rem
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * MAIN CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Horizontal layout containing input group and quick select.
 */
export const Container = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem; /* 16px */
  flex: 1;
`;

/* ═══════════════════════════════════════════════════════════
 * INPUT GROUP
 * ═══════════════════════════════════════════════════════════
 * Symbol input and connect/disconnect button.
 */
export const InputGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const SymbolInput = styled.input`
  width: 140px;
  height: 32px;
  padding: 0 0.5rem;
  
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  font-size: 0.75rem;
  color: var(--text-primary, #E6EDF3);
  
  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;

  &:focus {
    outline: none;
    border-color: var(--color-border-focus, #58A6FF);
    background: var(--bg-secondary, #161B22);
  }

  &:disabled {
    opacity: 0.6;
  }

  &::placeholder {
    color: var(--text-tertiary, #6E7681);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * CONNECT BUTTON
 * ═══════════════════════════════════════════════════════════
 * Primary action button for WebSocket connection.
 * Uses global .btn classes for base styling.
 */
export const ConnectButton = styled.button`
  min-width: 100px;
`;

/* ═══════════════════════════════════════════════════════════
 * QUICK SELECT
 * ═══════════════════════════════════════════════════════════
 * Row of popular symbol buttons for fast switching.
 */
export const QuickSelectRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

interface QuickButtonProps {
  $active?: boolean;
}

export const QuickButton = styled.button<QuickButtonProps>`
  padding: 0.25rem 0.5rem;
  font-size: 0.6875rem; /* 11px */
  font-weight: 500;
  color: var(--text-secondary, #9AA5B1);
  background: transparent;
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover:not(:disabled) {
    color: var(--text-primary, #E6EDF3);
    background: var(--bg-hover, #262C36);
    border-color: var(--color-border-focus, #58A6FF);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Active state: accent color scheme */
  ${({ $active }) =>
    $active &&
    css`
      color: var(--color-info, #58A6FF);
      border-color: var(--color-info, #58A6FF);
      background: rgba(37, 99, 235, 0.1);
    `}
`;
