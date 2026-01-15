// Palette library captures alternate base color sets for quick thematic swaps.
export const palettes = {
  darkFinance: {
    background: "#050B1A",
    backgroundSoft: "#0A1226",
    surface: "#11172A",
    surfaceElevated: "#1C243A",
    surfaceInverted: "#FFFFFF",
    primary: "#3F8CFF",
    primaryHover: "#5FA2FF",
    primaryMuted: "#1E3B69",
    accent: "#00D1B2",
    accentHover: "#33E5C8",
    success: "#3BCF7C",
    warning: "#FFB347",
    danger: "#FF5A5F",
    neutral50: "#F1F5F9",
    neutral100: "#E2E8F0",
    neutral200: "#CBD5F5",
    neutral300: "#A8B2CF",
    neutral400: "#94A3B8",
    neutral500: "#7B8AB0",
    neutral600: "#64748B",
    neutral700: "#4B5565",
    neutral800: "#334155",
    neutral900: "#1E293B",
  },
  darkGlow: {
    background: "#181818ff",
    backgroundSoft: "#080D1F",
    surface: "#101930",
    surfaceElevated: "#16233F",
    surfaceInverted: "#FFFFFF",
    primary: "#2F88FF",
    primaryHover: "#53A0FF",
    primaryMuted: "#1A3260",
    accent: "#FF9155",
    accentHover: "#FFB37F",
    success: "#3BCF7C",
    warning: "#FFC361",
    danger: "#FF5A7A",
    neutral50: "#EEF4FF",
    neutral100: "#DCE6F7",
    neutral200: "#B8C5E5",
    neutral300: "#92A4CE",
    neutral400: "#7C8AB7",
    neutral500: "#6673A0",
    neutral600: "#505C88",
    neutral700: "#3A456F",
    neutral800: "#242D54",
    neutral900: "#131A35",
  },
    monoDark: {
    background: "#0D0D0D",
    backgroundSoft: "#1A1A1A",
    surface: "#262626",
    surfaceElevated: "#333333",
    surfaceInverted: "#FFFFFF",
    primary: "#888888",
    primaryHover: "#AAAAAA",
    primaryMuted: "#444444",
    accent: "#BBBBBB",
    accentHover: "#DDDDDD",
    success: "#6F6F6F",
    warning: "#A0A0A0",
    danger: "#B22222",
    neutral50: "#E0E0E0",
    neutral100: "#C0C0C0",
    neutral200: "#A0A0A0",
    neutral300: "#808080",
    neutral400: "#606060",
    neutral500: "#404040",
    neutral600: "#202020",
    neutral700: "#101010",
    neutral800: "#080808",
    neutral900: "#040404",
  },    
  corporateBlue: {
    background: "#0A0F1A",     // Deep corporate navy (near-black)
    backgroundSoft: "#0e1020ff", // Slightly softer navy for subtle variance
    surface: "#121826",         // Main panel/card background
    surfaceElevated: "#1c1d1de1", // For modals, dropdowns
    surfaceInverted: "#FFFFFF", // For inverted elements
    primary: "#02173fff",         // A strong, professional, stable blue
    primaryHover: "#283957ff",    // A clear, lighter hover state
    primaryMuted: "#1A2F5A",    // For subtle selected states or backgrounds
    accent: "#E6A135",         // Muted gold/brass "wealth" accent
    accentHover: "#F0B45F",    // Lighter gold hover
    success: "#28A745",         // Classic "in the green" color
    warning: "#FFC107",         // Standard amber warning
    danger: "#DC3545",          // Classic "in the red" color
    neutral50: "#F8F9FA",       // Primary text (high contrast) 
    neutral100: "#E9ECEF",
    neutral200: "#DEE2E6",
    neutral300: "#CED4DA",      // Secondary text
    neutral400: "#ADB5BD",
    neutral500: "#6C757D",      // Tertiary/muted text
    neutral600: "#495057",
    neutral700: "#343A40",
    neutral800: "#212529",
    neutral900: "#121519",
  },
  heritageDark: {
    background: "#14161A",     // Dark slate/charcoal
    backgroundSoft: "#1A1D21", // Slightly softer slate
    surface: "#1F2229",         // Main panel/card background
    surfaceElevated: "#2A2E37", // For modals, dropdowns
    surfaceInverted: "#FFFFFF",
    primary: "#4A6D9C",         // Desaturated, "steel" blue
    primaryHover: "#6B8AB6",    // Lighter, clear hover
    primaryMuted: "#2C3E5A",    // Very dark, muted blue for backgrounds
    accent: "#9A8C70",         // Muted, "antique brass" accent
    accentHover: "#B5A990",    // Lighter brass hover
    success: "#2F9A60",         // Deeper, "ledger" green
    warning: "#D9A036",         // "Ochre" or "old gold" warning
    danger: "#C93A40",          // Deeper, "oxblood" red
    neutral50: "#F8F9FA",       // Primary text (high contrast)
    neutral100: "#E9ECEF",
    neutral200: "#DEE2E6",
    neutral300: "#CED4DA",      // Secondary text
    neutral400: "#ADB5BD",
    neutral500: "#6C757D",      // Tertiary/muted text
    neutral600: "#495057",
    neutral700: "#343A40",
    neutral800: "#212529",
    neutral900: "#121519",
  },
};

export type PaletteMap = typeof palettes;
export type PaletteName = keyof PaletteMap;
export type Palette = PaletteMap[PaletteName];

export const paletteOrder: PaletteName[] = ["darkFinance", "corporateBlue", "heritageDark", "darkGlow", "monoDark"];

export const defaultPalette: PaletteName = "corporateBlue";

let activePaletteName: PaletteName = defaultPalette;

export const setActivePalette = (name: PaletteName) => {
  if (palettes[name]) {
    activePaletteName = name;
  }
};

export const getPalette = (name: PaletteName = activePaletteName): Palette => ({
  ...palettes[name],
});