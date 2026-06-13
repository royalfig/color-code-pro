import { createContext } from "react";
import type { Theme, PaletteKind, PaletteStyle } from "@/types";
import type { BaseColorData, CodeThemeOutput } from "@royalfig/color-palette-pro";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
  paletteKind: PaletteKind;
  setPaletteKind: (kind: PaletteKind) => void;
  paletteStyle: PaletteStyle;
  setPaletteStyle: (style: PaletteStyle) => void;
  baseColor: string;
  setBaseColor: (color: string) => void;
  activeTheme: CodeThemeOutput;
  themePair: { light: CodeThemeOutput; dark: CodeThemeOutput };
  uiVarsPair: { light: string; dark: string };
  palette: BaseColorData[];
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);
