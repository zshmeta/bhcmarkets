/**
 * Mobile Theme Tokens
 * 
 * Core design tokens for mobile UI components.
 * Based on a Neo-Fintech Luxury aesthetic with cyber accents.
 */

export const COLORS = {
    // Backgrounds - Deep dark with subtle depth
    bg: '#050510',
    bgLayer1: '#0A0A1F',
    bgLayer2: '#12122A',
    bgPrimary: '#0D1117',
    bgSecondary: '#161B22',
    bgTertiary: '#1C2128',

    // Accents - Electric and premium
    primary: '#4D8DFE',       // Electric Blue
    secondary: '#00E396',     // Cyber Green / Success
    accent: '#7B61FF',        // Deep Purple
    error: '#FF4560',         // Red
    warning: '#FEB019',       // Amber

    // Text hierarchy
    text: '#FFFFFF',
    textPrimary: '#E6EDF3',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.5)',

    // UI Elements
    border: 'rgba(255, 255, 255, 0.1)',
    borderSubtle: '#262C36',
    glass: 'rgba(255, 255, 255, 0.05)',
    glassBorder: 'rgba(255, 255, 255, 0.15)',
} as const;

export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
} as const;

export const RADIUS = {
    s: 8,
    m: 12,
    l: 16,
    xl: 24,
    pill: 9999,
} as const;

export const FONT_SIZE = {
    caption: 12,
    body: 15,
    h3: 18,
    h2: 24,
    h1: 32,
    display: 40,
} as const;

export const FONT_WEIGHT = {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
} as const;

export const LAYOUT = {
    screenPadding: 20,
    maxWidth: 430,      // iPhone Pro Max
    maxHeight: 932,
    safeAreaTop: 54,    // Dynamic island height
    safeAreaBottom: 34, // Home indicator
} as const;

export const SHADOWS = {
    card: '0 4px 16px rgba(0, 0, 0, 0.3)',
    elevated: '0 8px 32px rgba(0, 0, 0, 0.4)',
    glow: (color: string) => `0 0 20px ${color}20`,
} as const;

export type SpacingKey = keyof typeof SPACING;
export type RadiusKey = keyof typeof RADIUS;
export type FontSizeKey = keyof typeof FONT_SIZE;
