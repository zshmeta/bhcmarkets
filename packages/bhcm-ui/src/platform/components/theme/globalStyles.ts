import { createGlobalStyle } from 'styled-components';

/**
 * Global styles with CSS variables matching the design tokens.
 * These provide the dark theme foundation for all styled-components.
 */
export const GlobalStyles = createGlobalStyle`
  :root {
    /* ─── Background Colors ─── */
    --bg-primary: #0D1117;
    --bg-secondary: #161B22;
    --bg-tertiary: #1C2128;
    --surface-hover: #262C36;
    --bg-hover: #262C36;

    /* ─── Border Colors ─── */
    --border: #30363D;
    --border-subtle: #262C36;

    /* ─── Text Colors ─── */
    --text-primary: #E6EDF3;
    --text-secondary: #9AA5B1;
    --text-tertiary: #6E7681;

    /* ─── Accent Colors ─── */
    --color-price-up: #3FB950;
    --color-price-down: #F85149;
    --color-error: #F85149;
    --color-warning: #D29922;
    --color-accent: #58A6FF;

    /* ─── Spacing ─── */
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;

    /* ─── Border Radius ─── */
    --radius-sm: 0.25rem;
    --radius-lg: 0.5rem;

    /* ─── Typography ─── */
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, monospace;

    /* ─── Transitions ─── */
    --transition-fast: 0.1s ease-out;

    /* ─── Z-index ─── */
    --z-modal: 1000;
  }

  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  body {
    font-family: var(--font-sans);
    background: var(--bg-primary);
    color: var(--text-primary);
    line-height: 1.5;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  /* ─── Utility classes used by components ─── */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  .price-up {
    color: var(--color-price-up) !important;
  }

  .price-down {
    color: var(--color-price-down) !important;
  }

  .text-warning {
    color: var(--color-warning);
  }

  /* ─── Card base styles (used by many components) ─── */
  .card {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border-bottom: 1px solid var(--border-subtle);
    font-size: 10px;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .card-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .card-body {
    padding: 12px;
  }

  /* ─── Input base styles ─── */
  .input {
    background: var(--bg-primary);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px;
    width: 100%;
    transition: border-color var(--transition-fast);

    &:focus {
      outline: none;
      border-color: var(--color-accent);
    }

    &::placeholder {
      color: var(--text-tertiary);
    }
  }

  /* ─── Animation classes ─── */
  .animate-fade {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .flash-up {
    animation: flashUp 0.3s ease-out;
  }

  .flash-down {
    animation: flashDown 0.3s ease-out;
  }

  @keyframes flashUp {
    0% { background: rgba(63, 185, 80, 0.3); }
    100% { background: transparent; }
  }

  @keyframes flashDown {
    0% { background: rgba(248, 81, 73, 0.3); }
    100% { background: transparent; }
  }

  /* ─── Scrollbar styling ─── */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;
