import type { PaletteKind, PaletteStyle, Theme } from "@/types/index";
import { type ThemeFormat } from "@royalfig/color-palette-pro";
import {
  CircleIcon,
  DiamondIcon,
  SquareIcon,
  TriangleIcon,
  SunIcon,
  MoonIcon,
  CircleHalfIcon,
  IconWeight,
} from "@phosphor-icons/react";

export const PALETTE_LABELS: Record<PaletteKind, string> = {
  ana: "Analogous",
  com: "Complementary",
  spl: "Split Comp",
  tri: "Triadic",
  tet: "Tetradic",
  tas: "Tints & Shades",
};

export const FORMATS: {
  value: ThemeFormat;
  label: string;
  ext: string;
  mime: string;
}[] = [
  { value: "vscode", label: "VS Code", ext: "json", mime: "application/json" },
  { value: "zed", label: "Zed", ext: "json", mime: "application/json" },
  {
    value: "iterm2",
    label: "iTerm2",
    ext: "itermcolors",
    mime: "application/xml",
  },
  { value: "ghostty", label: "Ghostty", ext: "", mime: "text/plain" },
];

export const SHAPES: {
  value: PaletteStyle;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { value: "square", Icon: SquareIcon },
  { value: "triangle", Icon: TriangleIcon },
  { value: "circle", Icon: CircleIcon },
  { value: "diamond", Icon: DiamondIcon },
];

export const THEME_MODES: {
  value: Theme;
  label: string;
  Icon: React.FC<{ size?: number; weight?: IconWeight }>;
}[] = [
  { value: "dual", label: "Dual — light + dark", Icon: CircleHalfIcon },
  { value: "light", label: "Light", Icon: MoonIcon },
  { value: "dark", label: "Dark", Icon: SunIcon },
];

// Must match the CSS custom property --cc-line-col in index.css
export const LINE_COL = "3rem";
