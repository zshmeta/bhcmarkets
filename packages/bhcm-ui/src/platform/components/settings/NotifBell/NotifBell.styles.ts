import styled, { css } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --bg-secondary     → var(--bg-secondary, #161B22)
 * --bg-tertiary      → var(--bg-tertiary, #1C2128)  
 * --border-subtle    → var(--border-subtle, #262C36)
 * --text-secondary   → var(--text-secondary, #9AA5B1)
 * --color-info       → var(--color-info, #58A6FF)
 * --color-info-bg    → var(--color-info-bg, rgba(88, 166, 255, 0.15))
 * --radius-sm        → 0.25rem (4px)
 * --transition-fast  → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * TOGGLE BUTTON WRAPPER
 * ═══════════════════════════════════════════════════════════
 * A square button that toggles sound feedback on/off.
 * Uses CSS custom properties for theme reactivity (light/dark).
 * The fallback values ensure no flash of unstyled content.
 */

interface ToggleButtonProps {
  /** Whether sound is currently enabled */
  $isActive?: boolean;
}

export const ToggleButton = styled.button<ToggleButtonProps>`
  /* Layout: centered flex container, fixed square dimensions */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  /* Appearance: subtle background with thin border */
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem; /* 4px - keeps corners slightly rounded */

  /* Text: muted color for inactive state */
  color: var(--text-secondary, #9AA5B1);

  /* Interaction: pointer cursor + smooth state transitions */
  cursor: pointer;
  transition: all 0.1s ease-out;

  /* ─── Hover State ───
   * Slightly darker background and more visible border
   * Provides feedback that the element is interactive
   */
  &:hover {
    background: var(--bg-tertiary, #1C2128);
    border-color: var(--border, #30363D);
  }

  /* ─── Active State ───
   * When sound is enabled: accent color treatment
   * The $isActive prop controls this via transient prop pattern
   */
  ${({ $isActive }) =>
    $isActive &&
    css`
      background: var(--color-info-bg, rgba(88, 166, 255, 0.15));
      border-color: var(--color-info, #58A6FF);
      color: var(--color-info, #58A6FF);
    `}
`;

/* ═══════════════════════════════════════════════════════════
 * Icons WRAPPER
 * ═══════════════════════════════════════════════════════════
 * Container for the bell Icons. Sets consistent sizing.
 * The Icons inherits color from parent ToggleButton.
 */

export const IconsWrapper = styled.span`
  /* Fixed size matching the "md" Icons size from design tokens */
  font-size: 1rem; /* 16px */
  
  /* Ensures Icons is vertically centered in flex parent */
  display: flex;
  align-items: center;
  justify-content: center;
`;
