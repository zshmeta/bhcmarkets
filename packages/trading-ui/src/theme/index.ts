/**
 * Premium Trading Theme
 * 
 * Professional-grade design system for trading terminals.
 * Inspired by top-tier platforms: HollaEx, Binance, TradingView.
 * 
 * Design Principles:
 * - Avoid pure black (#000) - use dark grays for depth
 * - Avoid pure white (#fff) for text - use off-whites for comfort
 * - Use desaturated colors for trading indicators
 * - Ensure WCAG 4.5:1 contrast ratios
 * - Implement subtle micro-animations
 */

// =============================================================================
// COLOR PALETTE
// =============================================================================

/** 
 * Base dark theme colors
 * Using carefully calibrated grays to reduce eye strain
 */
export const COLORS = {
    // Backgrounds - layered for depth
    bg: {
        primary: '#0d0d14',      // Deepest layer (main background)
        secondary: '#12121c',    // Elevated surfaces
        tertiary: '#181825',     // Cards and panels
        elevated: '#1e1e2d',     // Highest elevation (dropdowns, tooltips)
        hover: 'rgba(255, 255, 255, 0.04)',
        active: 'rgba(255, 255, 255, 0.08)',
    },

    // Text hierarchy
    text: {
        primary: '#e6e6ef',      // High emphasis
        secondary: '#a1a1b5',    // Medium emphasis
        tertiary: '#6b6b7d',     // Low emphasis / placeholder
        disabled: '#45455a',     // Disabled state
        inverse: '#0d0d14',      // On light backgrounds
    },

    // Borders and dividers
    border: {
        subtle: 'rgba(255, 255, 255, 0.06)',
        default: 'rgba(255, 255, 255, 0.1)',
        strong: 'rgba(255, 255, 255, 0.16)',
        focus: '#4a9eff',
    },

    // Semantic colors (desaturated for reduced eye strain)
    semantic: {
        // Positive/Buy - Muted teal-green
        positive: {
            main: '#20b26c',
            light: '#2dd57f',
            dark: '#1a9058',
            muted: '#20b26c80',
            bg: 'rgba(32, 178, 108, 0.12)',
            bgHover: 'rgba(32, 178, 108, 0.2)',
        },
        // Negative/Sell - Muted coral-red
        negative: {
            main: '#ef4444',
            light: '#f87171',
            dark: '#dc2626',
            muted: '#ef444480',
            bg: 'rgba(239, 68, 68, 0.12)',
            bgHover: 'rgba(239, 68, 68, 0.2)',
        },
        // Warning
        warning: {
            main: '#f59e0b',
            light: '#fbbf24',
            dark: '#d97706',
            bg: 'rgba(245, 158, 11, 0.12)',
        },
        // Info/Primary accent
        info: {
            main: '#4a9eff',
            light: '#7ab8ff',
            dark: '#2d7dd2',
            bg: 'rgba(74, 158, 255, 0.12)',
        },
    },

    // Chart colors
    chart: {
        upBody: '#20b26c',
        upWick: '#1a9058',
        upBorder: '#20b26c',
        downBody: '#ef4444',
        downWick: '#dc2626',
        downBorder: '#ef4444',
        grid: 'rgba(255, 255, 255, 0.04)',
        crosshair: 'rgba(255, 255, 255, 0.3)',
        volume: 'rgba(74, 158, 255, 0.3)',
    },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const TYPOGRAPHY = {
    fontFamily: {
        sans: "'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif",
        mono: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Consolas', monospace",
    },
    fontSize: {
        xs: '10px',
        sm: '11px',
        base: '12px',
        md: '13px',
        lg: '14px',
        xl: '16px',
        '2xl': '18px',
        '3xl': '20px',
        '4xl': '24px',
    },
    fontWeight: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
    lineHeight: {
        tight: 1.2,
        normal: 1.5,
        relaxed: 1.75,
    },
    letterSpacing: {
        tight: '-0.02em',
        normal: '0',
        wide: '0.02em',
        wider: '0.05em',
    },
} as const;

// =============================================================================
// SPACING & SIZING
// =============================================================================

export const SPACING = {
    px: '1px',
    0: '0',
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
} as const;

export const SIZING = {
    panelHeader: '36px',
    panelHeaderCompact: '28px',
    inputHeight: '32px',
    inputHeightLg: '40px',
    buttonHeight: '32px',
    buttonHeightLg: '40px',
    buttonHeightXl: '48px',
    tabHeight: '32px',
    rowHeight: '36px',
    rowHeightCompact: '28px',
    iconSm: '14px',
    iconMd: '16px',
    iconLg: '20px',
} as const;

// =============================================================================
// EFFECTS
// =============================================================================

export const EFFECTS = {
    borderRadius: {
        none: '0',
        sm: '2px',
        base: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        full: '9999px',
    },
    shadow: {
        sm: '0 1px 2px rgba(0, 0, 0, 0.3)',
        base: '0 2px 4px rgba(0, 0, 0, 0.3)',
        md: '0 4px 8px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 16px rgba(0, 0, 0, 0.4)',
        xl: '0 16px 32px rgba(0, 0, 0, 0.5)',
        glow: {
            positive: '0 0 20px rgba(32, 178, 108, 0.3)',
            negative: '0 0 20px rgba(239, 68, 68, 0.3)',
            info: '0 0 20px rgba(74, 158, 255, 0.3)',
        },
    },
    transition: {
        fast: 'all 0.1s ease',
        base: 'all 0.15s ease',
        slow: 'all 0.3s ease',
        smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
} as const;

// =============================================================================
// Z-INDEX LAYERS
// =============================================================================

export const Z_INDEX = {
    base: 0,
    dropdown: 100,
    sticky: 200,
    overlay: 300,
    modal: 400,
    popover: 500,
    tooltip: 600,
    toast: 700,
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const COMPONENT = {
    panel: {
        bg: COLORS.bg.tertiary,
        headerBg: COLORS.bg.secondary,
        border: COLORS.border.subtle,
        borderRadius: EFFECTS.borderRadius.md,
    },
    input: {
        bg: COLORS.bg.primary,
        border: COLORS.border.default,
        borderFocus: COLORS.border.focus,
        text: COLORS.text.primary,
        placeholder: COLORS.text.tertiary,
    },
    button: {
        primaryBg: COLORS.semantic.info.main,
        primaryHover: COLORS.semantic.info.light,
        secondaryBg: COLORS.bg.elevated,
        secondaryHover: 'rgba(255, 255, 255, 0.15)',
        ghostHover: COLORS.bg.hover,
    },
    table: {
        headerBg: COLORS.bg.secondary,
        rowHover: COLORS.bg.hover,
        rowActive: COLORS.bg.active,
        border: COLORS.border.subtle,
    },
    orderbook: {
        bidBg: 'rgba(32, 178, 108, 0.08)',
        askBg: 'rgba(239, 68, 68, 0.08)',
        bidDepth: 'linear-gradient(to left, rgba(32, 178, 108, 0.25), transparent)',
        askDepth: 'linear-gradient(to right, rgba(239, 68, 68, 0.25), transparent)',
    },
} as const;



// =============================================================================
// CSS HELPERS
// =============================================================================

/**
 * CSS for price flash animation
 */
export const PRICE_FLASH_CSS = `
  @keyframes flashUp {
    0% { background-color: rgba(32, 178, 108, 0.3); }
    100% { background-color: transparent; }
  }
  
  @keyframes flashDown {
    0% { background-color: rgba(239, 68, 68, 0.3); }
    100% { background-color: transparent; }
  }
  
  .price-up {
    animation: flashUp 0.5s ease-out;
  }
  
  .price-down {
    animation: flashDown 0.5s ease-out;
  }
`;

/**
 * CSS for smooth number transitions
 */
export const NUMBER_TRANSITION_CSS = `
  .number-transition {
    transition: color 0.3s ease, transform 0.15s ease;
  }
`;

/**
 * CSS for scrollbar styling
 */
export const SCROLLBAR_CSS = `
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

// =============================================================================
// THEME OBJECT (for styled-components ThemeProvider)
// =============================================================================

export const tradingTheme = {
    colors: COLORS,
    typography: TYPOGRAPHY,
    spacing: SPACING,
    sizing: SIZING,
    effects: EFFECTS,
    zIndex: Z_INDEX,
    component: COMPONENT,
} as const;

export type TradingTheme = typeof tradingTheme;
