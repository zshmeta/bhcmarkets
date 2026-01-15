import styled from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --color-border-primary → var(--border, #30363D)
 * --radius-sm            → 0.25rem
 * --color-text-secondary → var(--text-secondary, #9AA5B1)
 * --color-text-primary   → var(--text-primary, #E6EDF3)
 * --color-bg-hover       → var(--bg-hover, #262C36)
 * --color-border-focus   → var(--border-focus, #58A6FF)
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * TOGGLE BUTTON
 * ═══════════════════════════════════════════════════════════
 * Circular Icons button that switches between light/dark themes.
 * Uses transparent background to blend with any surface.
 */
export const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    color: var(--text-primary, #E6EDF3);
    background: var(--bg-hover, #262C36);
    border-color: var(--border-focus, #58A6FF);
  }

  &:focus-visible {
    outline: 2px solid var(--border-focus, #58A6FF);
    outline-offset: 2px;
  }
`;
