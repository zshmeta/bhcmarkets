import { createGlobalStyle } from 'styled-components';

/**
 * Global styles with CSS variables matching the design tokens.
 * Ported from apps/template/src/styles/tokens.css and global.css
 * Dark Mode is set as the default in :root.
 */
export const GlobalStyles = createGlobalStyle`
  :root {
    /* ═══════════════════════════════════════════════════════════
     * DESIGN TOKENS (from tokens.css)
     * ═══════════════════════════════════════════════════════════
     */

    /* ===== Layout Constants ===== */
    --header-height: 3rem; /* 48px */
    --bottom-nav-height: 3.5rem; /* 56px */
    --tab-bar-height: 2.5rem; /* 40px */
  
    /* ===== Spacing (4px base) ===== */
    --space-0: 0;
    --space-1: 0.25rem;
    --space-2: 0.5rem;
    --space-3: 0.75rem;
    --space-4: 1rem;
    --space-5: 1.25rem;
    --space-6: 1.5rem;
    --space-8: 2rem;
    --space-10: 2.5rem;
  
    /* ===== Border Radius ===== */
    --radius-xs: 0.125rem;
    --radius-sm: 0.25rem;
    --radius-md: 0.375rem;
    --radius-lg: 0.5rem;
    --radius-xl: 0.75rem;
    --radius-full: 9999px;
  
    /* ===== Typography ===== */
    --font-sans: 'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, SFMono-Regular, 'SF Mono', monospace;
  
    --font-size-2xs: 0.625rem;
    --font-size-xs: 0.6875rem;
    --font-size-sm: 0.75rem;
    --font-size-md: 0.8125rem;
    --font-size-base: 0.875rem;
    --font-size-lg: 1rem;
    --font-size-xl: 1.125rem;
    --font-size-2xl: 1.25rem;
    --font-size-3xl: 1.5rem;
  
    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;
  
    --line-height-tight: 1.2;
    --line-height-snug: 1.375;
    --line-height-normal: 1.5;
    --line-height-relaxed: 1.625;
  
    /* ===== Transitions ===== */
    --transition-fast: 0.1s ease-out;
    --transition-normal: 0.15s ease-out;
    --transition-slow: 0.25s ease-out;
    --transition-spring: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  
    /* ===== Z-Index Layers ===== */
    --z-base: 0;
    --z-above: 10;
    --z-dropdown: 100;
    --z-sticky: 150;
    --z-modal: 200;
    --z-popover: 250;
    --z-toast: 300;
    --z-tooltip: 350;
  
    /* ===== Icon Sizes ===== */
    --icon-xs: 0.75rem;
    --icon-sm: 0.875rem;
    --icon-md: 1rem;
    --icon-lg: 1.25rem;
    --icon-xl: 1.5rem;

    /* 
     * DARK THEME VALUES (Default)
     * Copied from [data-theme='dark'] in tokens.css
     */
    --color-bg-primary: #0D1117;
    --color-bg-secondary: #161B22;
    --color-bg-tertiary: #1C2128;
    --color-bg-hover: #262C36;
    --color-bg-active: #2D333B;
  
    /* Semantic Background Aliases */
    --bg-primary: var(--color-bg-primary);
    --bg-secondary: var(--color-bg-secondary);
    --bg-tertiary: var(--color-bg-tertiary);
    --surface: var(--color-bg-secondary);
    --surface-hover: var(--color-bg-hover);
    --surface-active: var(--color-bg-active);
  
    /* Text */
    --color-text-primary: #E6EDF3;
    --color-text-secondary: #9AA5B1;
    --color-text-tertiary: #6E7681;
    --color-text-inverse: #0D1117;
    --color-text-muted: #484F58;
  
    /* Semantic Text Aliases */
    --text-primary: var(--color-text-primary);
    --text-secondary: var(--color-text-secondary);
    --text-tertiary: var(--color-text-tertiary);
    --text-muted: var(--color-text-muted);
  
    /* Border */
    --color-border-primary: #30363D;
    --color-border-secondary: #262C36;
    --color-border-focus: #58A6FF;
    --color-border-light: #21262D;
  
    /* Semantic Border Aliases */
    --border: var(--color-border-primary);
    --border-subtle: var(--color-border-secondary);
    --border-light: var(--color-border-light);
  
    /* Price Colors */
    --color-price-up: #3FB950;
    --color-price-up-bg: rgba(63, 185, 80, 0.12);
    --color-price-down: #F85149;
    --color-price-down-bg: rgba(248, 81, 73, 0.12);
  
    /* Semantic aliases */
    --buy: var(--color-price-up);
    --sell: var(--color-price-down);
    --positive: var(--color-price-up);
    --negative: var(--color-price-down);
  
    /* Status Colors */
    --color-success: #3FB950;
    --color-warning: #D29922;
    --color-error: #F85149;
    --color-info: #58A6FF;
  
    /* Status background */
    --color-success-bg: rgba(63, 185, 80, 0.15);
    --color-warning-bg: rgba(210, 153, 34, 0.15);
    --color-error-bg: rgba(248, 81, 73, 0.15);
    --color-info-bg: rgba(88, 166, 255, 0.15);
  
    /* Semantic aliases */
    --color-positive: var(--color-success);
    --color-positive-bg: var(--color-success-bg);
    --color-negative: var(--color-error);
    --color-negative-bg: var(--color-error-bg);
  
    /* Accent color */
    --accent: var(--color-info);
    --accent-alpha: rgba(88, 166, 255, 0.2);
  
    /* Brand Colors */
    --brand-400: #60A5FA;
    --brand-500: #3B82F6;
    --brand-600: #2563EB;
    --brand-700: #1D4ED8;
    --brand-500-rgb: 59, 130, 246;
  
    /* Connection Status */
    --color-connected: #3FB950;
    --color-connecting: #D29922;
    --color-disconnected: #F85149;
  
    /* Shadows */
    --shadow-xs: 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.25);
    --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
    --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.35);
    --shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.4);
  
    /* Card */
    --card-bg: var(--color-bg-secondary);
    --card-border: var(--color-border-secondary);
    --card-shadow: var(--shadow-xs);
  
    /* Overlay */
    --bg-secondary-90: rgba(22, 27, 34, 0.9);
  }

  /* ═══════════════════════════════════════════════════════════
   * GLOBAL STYLES (from global.css)
   * ═══════════════════════════════════════════════════════════
   */

  /* ===== Reset ===== */
  *,
  *::before,
  *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ===== Base ===== */
  html {
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    color-scheme: dark; /* Force browser dark mode */
  }

  body {
    font-family: var(--font-sans);
    font-size: var(--font-size-md);
    line-height: var(--line-height-normal);
    color: var(--text-primary);
    background-color: var(--bg-primary);
    min-height: 100vh;
    font-variant-numeric: tabular-nums;
  }

  /* ===== Typography ===== */
  h1, h2, h3, h4, h5, h6 {
    font-weight: var(--font-weight-semibold);
    line-height: var(--line-height-tight);
  }

  /* ===== Components ===== */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
    font-feature-settings: "tnum";
  }

  .price-up { color: var(--color-price-up); }
  .price-down { color: var(--color-price-down); }
  .price-neutral { color: var(--text-primary); }

  /* Card */
  .card {
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--card-shadow);
  }

  .card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--border-subtle);
    font-weight: var(--font-weight-semibold);
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    background: var(--bg-tertiary); /* Ensure definition matches */
  }

  .card-body {
    padding: var(--space-4);
  }

  /* Button */
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    padding: 0 var(--space-4);
    font-family: var(--font-sans);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all var(--transition-normal);
    height: 2rem;
    white-space: nowrap;
  }

  .btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-sm {
    height: 1.75rem;
    padding: 0 var(--space-3);
    font-size: var(--font-size-xs);
  }

  .btn-primary {
    background: var(--accent);
    color: white;
    border-color: var(--accent);
  }

  .btn-primary:hover:not(:disabled) {
    filter: brightness(1.1);
  }

  .btn-secondary {
    background: var(--surface);
    color: var(--text-primary);
    border-color: var(--border);
  }

  .btn-secondary:hover:not(:disabled) {
    background: var(--surface-hover);
    border-color: var(--color-border-primary);
  }

  /* Input */
  .input {
    width: 100%;
    height: 2.25rem;
    padding: 0 var(--space-3);
    font-family: var(--font-mono);
    font-size: var(--font-size-md);
    color: var(--text-primary);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    transition: border-color var(--transition-normal), box-shadow var(--transition-normal);
  
    &:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-alpha);
    }

    &::placeholder {
      color: var(--text-muted);
    }
  }

  /* Scrollbar */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.08);
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.15);
  }

  /* ===== Layout ===== */
  .app-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .app-header {
    height: var(--header-height);
    border-bottom: 1px solid var(--border-subtle);
    background: var(--bg-secondary);
    display: flex;
    align-items: center;
    padding: 0 var(--space-4);
    gap: var(--space-4);
    position: sticky;
    top: 0;
    z-index: var(--z-dropdown);
  }

  .app-main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--space-3);
    padding: var(--space-3);
    width: 100%;
  }

  .main-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .sidebar {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  /* Animation */
  .animate-fade {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* Responsive */
  @media (max-width: 1024px) {
    .app-main {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .app-container {
      padding-bottom: calc(var(--bottom-nav-height) + env(safe-area-inset-bottom));
    }
    
    .app-header {
      height: var(--header-height);
      padding: 0 var(--space-2);
      gap: var(--space-2);
    }
  }
`;
