// ThemeManager.tsx
import { type PropsWithChildren, useMemo, useState } from "react";
import { ThemeProvider } from "styled-components";
import { defaultPalette, paletteOrder, palettes, type PaletteName } from "./palettes";
import { ThemePickerContext } from "./ThemeContext";
import { createTokenTheme } from "./tokens";
import GlobalStyle from "./GlobalStyle";

export type ThemeManagerProps = PropsWithChildren<{
  initialPalette?: PaletteName;
}>;

const formatPaletteLabel = (key: string) =>
  key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

export const ThemeManager = ({ initialPalette = defaultPalette, children }: ThemeManagerProps) => {
  const [paletteName, setPaletteName] = useState<PaletteName>(
    palettes[initialPalette] ? initialPalette : defaultPalette
  );

  const themeTokens = useMemo(() => createTokenTheme(paletteName), [paletteName]);

  const options = useMemo(
    () =>
      paletteOrder
        .filter((key): key is PaletteName => key in palettes)
        .map((key) => ({ value: key, label: formatPaletteLabel(key) })),
    []
  );

  const contextValue = useMemo(
    () => ({
      paletteName,
      setPalette: (next: PaletteName) => {
        if (next && palettes[next]) {
          setPaletteName(next);
        }
      },
      options,
      tokens: themeTokens,
    }),
    [paletteName, options, themeTokens]
  );

  return (
    <ThemePickerContext.Provider value={contextValue}>
      <ThemeProvider theme={themeTokens}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemePickerContext.Provider>
  );
};

export default ThemeManager;
