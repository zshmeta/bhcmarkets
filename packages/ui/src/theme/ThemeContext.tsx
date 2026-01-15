import { createContext, useContext } from "react";
import { defaultPalette, paletteOrder, type PaletteName } from "./palettes";
import defaultTokens, { type TokenTheme } from "./tokens";

export type ThemePickerOption = {
  value: PaletteName;
  label: string;
};

export type ThemePickerContextValue = {
  paletteName: PaletteName;
  setPalette: (name: PaletteName) => void;
  options: ThemePickerOption[];
  tokens: TokenTheme;
};

const defaultOptions: ThemePickerOption[] = paletteOrder.map((key) => ({
  value: key,
  label: key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase())
    .trim(),
}));

export const ThemePickerContext = createContext<ThemePickerContextValue>({
  paletteName: defaultPalette,
  setPalette: () => undefined,
  options: defaultOptions,
  tokens: defaultTokens,
});

export const useThemePicker = () => useContext(ThemePickerContext);
