import styled from 'styled-components';

/**
 * Token Reference (from tokens.css):
 * --color-bg-primary     → var(--bg-primary, #0D1117)
 * --color-bg-secondary   → var(--bg-secondary, #161B22)
 * --card-bg              → var(--bg-secondary, #161B22)
 * --card-border          → var(--border, #30363D)
 * --card-shadow          → 0 4px 6px rgba(0, 0, 0, 0.15)
 * --color-error          → var(--color-error, #F85149)
 * --accent               → #3B82F6 (brand blue)
 * --radius-lg            → 0.5rem
 * --radius-sm/md         → 0.25/0.375rem
 * --space-2/3/4/6        → 0.5/0.75/1/1.5rem
 * --font-size-xs/sm/md/xl → 0.6875/0.75/0.8125/1.125rem
 * --font-mono            → 'IBM Plex Mono', monospace
 * --transition-fast      → 0.1s ease-out
 */

/* ═══════════════════════════════════════════════════════════
 * FULL-PAGE CONTAINER
 * ═══════════════════════════════════════════════════════════
 * Centers the error card in viewport. Used for fatal errors
 * that require a page reload to recover.
 */
export const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 1rem;
  background: var(--bg-primary, #0D1117);
`;

/* ═══════════════════════════════════════════════════════════
 * ERROR CARD
 * ═══════════════════════════════════════════════════════════
 * Prominent card with error details. Max-width prevents
 * overly wide content on large screens.
 */
export const Content = styled.div`
  max-width: 600px;
  text-align: center;
  padding: 1.5rem;
  background: var(--bg-secondary, #161B22);
  border: 1px solid var(--border, #30363D);
  border-radius: 0.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
`;

export const ErrorIcons = styled.div`
  color: var(--color-error, #F85149);
  margin-bottom: 1rem;
`;

export const Title = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #E6EDF3);
  margin: 0 0 0.5rem 0;
`;

export const Message = styled.p`
  font-size: 0.8125rem;
  color: var(--text-secondary, #9AA5B1);
  margin: 0 0 1rem 0;
  line-height: 1.5;
`;

/* ═══════════════════════════════════════════════════════════
 * ACTION BUTTONS
 * ═══════════════════════════════════════════════════════════
 */
export const Actions = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.75rem;
`;

export const ReloadButton = styled.button`
  padding: 0.5rem 1rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.1s ease-out;

  &:hover {
    filter: brightness(1.1);
  }

  &:focus-visible {
    outline: 2px solid #58A6FF;
    outline-offset: 2px;
  }
`;

/* ═══════════════════════════════════════════════════════════
 * ERROR DETAILS ACCORDION
 * ═══════════════════════════════════════════════════════════
 * Expandable section showing stack trace for debugging.
 */
export const Details = styled.details`
  margin-top: 1rem;
  text-align: left;

  & summary {
    cursor: pointer;
    color: var(--text-secondary, #9AA5B1);
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
    user-select: none;
  }
`;

export const StackTrace = styled.pre`
  background: var(--bg-tertiary, #1C2128);
  padding: 0.75rem;
  border-radius: 0.25rem;
  font-size: 0.6875rem;
  font-family: 'IBM Plex Mono', ui-monospace, monospace;
  color: var(--text-tertiary, #6E7681);
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
`;
