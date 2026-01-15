import styled, { keyframes } from 'styled-components';

/**
 * Token Mapping Reference (from tokens.css):
 * --bg-primary      → var(--bg-primary, #0D1117)
 * --bg-secondary    → var(--bg-secondary, #161B22)
 * --bg-tertiary     → var(--bg-tertiary, #1C2128)
 * --border-subtle   → var(--border-subtle, #262C36)
 * --border          → var(--border, #30363D)
 * --text-primary    → var(--text-primary, #E6EDF3)
 * --text-secondary  → var(--text-secondary, #9AA5B1)
 * --text-tertiary   → var(--text-tertiary, #6E7681)
 * --radius-sm       → 0.25rem
 * --radius-lg       → 0.5rem
 * --shadow-xl       → 0 20px 25px rgba(0, 0, 0, 0.4)
 * --font-mono       → 'IBM Plex Mono', monospace
 * --font-size-xs    → 0.6875rem
 * --font-size-sm    → 0.75rem
 * --font-size-md    → 0.8125rem
 * --space-1         → 0.25rem
 * --space-2         → 0.5rem
 * --space-3         → 0.75rem
 * --space-4         → 1rem
 * --transition-fast → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * ANIMATIONS
 * ═══════════════════════════════════════════════════════════
 */

/** Overlay fade-in for smooth modal appearance */
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

/** Panel scale-in for subtle "pop" effect */
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * TRIGGER BUTTON
 * ═══════════════════════════════════════════════════════════
 * Small square button that opens the shortcuts modal.
 * Matches other header toolbar buttons for consistency.
 */
export const TriggerButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border-subtle, #262C36);
  border-radius: 0.25rem; /* 4px */

  color: var(--text-secondary, #9AA5B1);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
    border-color: var(--border, #30363D);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * MODAL OVERLAY
 * ═══════════════════════════════════════════════════════════
 * Full-screen backdrop that dims the page content.
 * Clicking anywhere on the overlay closes the modal.
 * backdrop-filter adds a subtle blur for depth perception.
 */
export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;

  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(2px);

  display: flex;
  align-items: center;
  justify-content: center;

  z-index: 9000; /* Above most content, below tooltips */
  animation: ${fadeIn} 0.2s ease-out;
`;

/* ═══════════════════════════════════════════════════════════
 * MODAL PANEL
 * ═══════════════════════════════════════════════════════════
 * The actual shortcuts card. Constrained width with responsive
 * sizing. e.stopPropagation() on click prevents overlay close.
 */
export const ModalPanel = styled.div`
  background: var(--bg-primary, #0D1117);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.5rem; /* 8px */
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.4);

  width: 90%;
  max-width: 360px;

  animation: ${slideIn} 0.2s ease-out;
`;

/* ═══════════════════════════════════════════════════════════
 * HEADER SECTION
 * ═══════════════════════════════════════════════════════════
 * Title and close button row at the top of the panel.
 */
export const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem; /* 16px */
  border-bottom: 1px solid var(--border-subtle, #262C36);
`;

export const PanelTitle = styled.h3`
  font-size: 0.8125rem; /* 13px */
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0;
`;

/* ═══════════════════════════════════════════════════════════
 * CLOSE BUTTON
 * ═══════════════════════════════════════════════════════════
 * Semi-transparent close button with hover state.
 */
export const CloseButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  background: none;
  border: none;
  color: var(--text-tertiary, #6E7681);
  font-size: 20px;
  cursor: pointer;
  border-radius: 0.25rem;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ITEMS LIST (Help actions)
 * ═══════════════════════════════════════════════════════════
 * Vertical list of help actions with consistent spacing.
 */
export const ItemsList = styled.div`
  padding: 0.75rem 1rem; /* 12px 16px */
  display: flex;
  flex-direction: column;
  gap: 0.5rem; /* 8px between items */
`;

export const ItemRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem; /* 12px between key and description */
  padding: 0.5rem 0; /* 8px vertical padding */
`;

/* ═══════════════════════════════════════════════════════════
 * ITEM BADGE
 * ═══════════════════════════════════════════════════════════
 * Small icon badge shown at the start of each row.
 */
export const ItemBadge = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  background: var(--bg-tertiary, #1C2128);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.25rem;

  color: var(--text-primary, #E6EDF3);
`;

export const ItemContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.125rem; /* 2px */
  flex: 1;
  min-width: 0;
`;

export const ItemTitle = styled.span`
  font-size: 0.75rem; /* 12px */
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

export const ItemDescription = styled.span`
  font-size: 0.75rem; /* 12px */
  color: var(--text-secondary, #9AA5B1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ActionBase = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
  }
`;

export const ItemLink = styled(ActionBase)`
  text-decoration: none;
`;

export const ItemButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;

  background: none;
  border: none;
  border-radius: 0.25rem;
  color: var(--text-tertiary, #6E7681);
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    background: var(--bg-tertiary, #1C2128);
    color: var(--text-primary, #E6EDF3);
  }
`;

// Legacy aliases (pre-help-modal)
export const ShortcutsList = ItemsList;
export const ShortcutItem = ItemRow;
export const KeyBadge = ItemBadge;
export const KeyDescription = ItemDescription;

/* ═══════════════════════════════════════════════════════════
 * FOOTER SECTION
 * ═══════════════════════════════════════════════════════════
 * Helper hint at the bottom of the modal.
 */
export const PanelFooter = styled.div`
  padding: 0.75rem 1rem; /* 12px 16px */
  border-top: 1px solid var(--border-subtle, #262C36);
  text-align: center;
`;

export const FooterHint = styled.span`
  font-size: 0.6875rem; /* 11px */
  color: var(--text-tertiary, #6E7681);
`;
