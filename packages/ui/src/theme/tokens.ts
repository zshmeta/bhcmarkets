import { defaultPalette, getPalette, type Palette, type PaletteName } from "./palettes";

export const toRgba = (hex: string | undefined, alpha: number) => {
  if (!hex) {
    return `rgba(0, 0, 0, ${alpha})`;
  }

  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => char + char)
          .join("")
      : normalized;

  const bigint = Number.parseInt(expanded, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export type TokenTypography = {
  fontFamily: string;
  headingsFamily: string;
  weightRegular: number;
  weightMedium: number;
  weightSemiBold: number;
  weightBold: number;
  sizes: Record<"xs" | "sm" | "base" | "md" | "lg" | "xl" | "xxl", string>;
  lineHeights: Record<"tight" | "snug" | "normal" | "relaxed", number>;
};

export type TokenSpacingScale = Record<
  "xxxs" | "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "xxxl",
  string
>;

export type TokenRadii = Record<"xs" | "sm" | "md" | "lg" | "xl" | "pill", string>;

const buildColorTokens = (baseColors: Palette) => ({
  ...baseColors,
  text: {
    primary: baseColors.neutral50,
    secondary: baseColors.neutral300,
    tertiary: baseColors.neutral500,
    muted: baseColors.neutral600,
    inverted: baseColors.background,
    onAccent: baseColors.neutral50,
  },
  backgrounds: {
    app: baseColors.background,
    soft: baseColors.backgroundSoft,
    surface: baseColors.surface,
    elevated: baseColors.surfaceElevated,
    overlay: toRgba(baseColors.background, 0.72),
  },
  border: {
    subtle: toRgba(baseColors.surfaceInverted, 0.08),
    default: toRgba(baseColors.surfaceInverted, 0.12),
    accent: toRgba(baseColors.primary, 0.4),
    danger: toRgba(baseColors.danger, 0.4),
  },
  status: {
    success: baseColors.success,
    warning: baseColors.warning,
    danger: baseColors.danger,
    info: baseColors.primary,
  },
  focus: toRgba(baseColors.primary, 0.22),
});

const buildGradientTokens = (baseColors: Palette) => {
  const primaryHover = baseColors.primaryHover || baseColors.primary;
  const accentHover = baseColors.accentHover || baseColors.accent;

  return {
    primary: `linear-gradient(135deg, ${baseColors.primary}, ${primaryHover})`,
    primarySoft: `linear-gradient(160deg, ${toRgba(baseColors.primary, 0.18)}, ${toRgba(primaryHover, 0.12)})`,
    accent: `linear-gradient(140deg, ${baseColors.accent}, ${accentHover})`,
    danger: `linear-gradient(135deg, ${baseColors.danger}, ${toRgba(baseColors.danger, 0.68)})`,
    glass: "linear-gradient(160deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04))",
  };
};

export type TokenColors = ReturnType<typeof buildColorTokens>;
export type TokenGradients = ReturnType<typeof buildGradientTokens>;

export const radii: TokenRadii = {
  xs: "6px",
  sm: "8px",
  md: "12px",
  lg: "18px",
  xl: "26px",
  pill: "999px",
};

export const spacing: TokenSpacingScale = {
  xxxs: "2px",
  xxs: "4px",
  xs: "8px",
  sm: "12px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  xxl: "40px",
  xxxl: "56px",
};

export const typography: TokenTypography = {
  fontFamily: "'Inter', 'Segoe UI', sans-serif",
  headingsFamily: "'Inter', 'Segoe UI', sans-serif",
  weightRegular: 400,
  weightMedium: 500,
  weightSemiBold: 600,
  weightBold: 700,
  sizes: {
    xs: "0.75rem",
    sm: "0.85rem",
    base: "0.95rem",
    md: "1.05rem",
    lg: "1.35rem",
    xl: "1.65rem",
    xxl: "2.1rem",
  },
  lineHeights: {
    tight: 1.1,
    snug: 1.25,
    normal: 1.45,
    relaxed: 1.65,
  },
};

export const shadows = {
  soft: "0 12px 32px rgba(5, 11, 26, 0.45)",
  medium: "0 18px 48px rgba(5, 11, 26, 0.50)",
  hard: "0 24px 64px rgba(5, 11, 26, 0.55)",
};

export const elevations = {
  raised: "0 1px 0 rgba(255, 255, 255, 0.06), 0 8px 24px rgba(5, 11, 26, 0.32)",
  overlay: "0 20px 55px rgba(5, 11, 26, 0.6)",
  modal: "0 32px 80px rgba(5, 11, 26, 0.65)",
};

export const zIndices = {
  base: 1,
  sidebar: 10,
  dropdown: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
};

export const opacity = {
  subtle: 0.04,
  medium: 0.12,
  strong: 0.32,
  intense: 0.56,
};

export const layout = {
  contentMaxWidth: "1440px",
  sidebarWidth: "260px",
  topbarHeight: "72px",
};

export const transitions = {
  base: "all 180ms ease",
  fast: "all 120ms ease",
  slow: "all 260ms ease",
};

export type TokenTheme = {
  paletteName: PaletteName;
  colors: TokenColors;
  gradients: TokenGradients;
  radii: TokenRadii;
  spacing: TokenSpacingScale;
  typography: TokenTypography;
  shadows: typeof shadows;
  transitions: typeof transitions;
  elevations: typeof elevations;
  zIndices: typeof zIndices;
  opacity: typeof opacity;
  layout: typeof layout;
};

export const createTokenTheme = (paletteName: PaletteName = defaultPalette): TokenTheme => {
  const baseColors = getPalette(paletteName);

  return {
    paletteName,
    colors: buildColorTokens(baseColors),
    gradients: buildGradientTokens(baseColors),
    radii,
    spacing,
    typography,
    shadows,
    transitions,
    elevations,
    zIndices,
    opacity,
    layout,
  };
};

const defaultTokens = createTokenTheme();

export const colors = defaultTokens.colors;
export const gradients = defaultTokens.gradients;

export default defaultTokens;
