import styled from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --bg-secondary         → var(--bg-secondary, #161B22)
 * --bg-tertiary          → var(--bg-tertiary, #1C2128)
 * --border-subtle        → var(--border-subtle, #262C36)
 * --border-default       → var(--border, #30363D)
 * --text-secondary       → var(--text-secondary, #9AA5B1)
 * --text-primary         → var(--text-primary, #E6EDF3)
 * --radius-sm            → 0.25rem
 * --space-1/2            → 0.25/0.5rem
 * --font-size-sm         → 0.75rem
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * TOGGLE BUTTON
 * ═══════════════════════════════════════════════════════════
 * Compact button showing current language with globe Icons.
 * Text hides on mobile to save space.
 */
export const ToggleButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem;
  color: var(--text-secondary, #9AA5B1);
  font-size: 0.75rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
    border-color: var(--border, #30363D);
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid var(--border-focus, #58A6FF);
    outline-offset: 2px;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * LANGUAGE TEXT
 * ═══════════════════════════════════════════════════════════
 * Shows the target language code. Hidden on mobile.
 */
export const LanguageText = styled.span`
  font-weight: 500;

  @media (max-width: 768px) {
    display: none;
  }
`;
