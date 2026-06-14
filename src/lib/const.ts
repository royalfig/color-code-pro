import type { PaletteKind, PaletteStyle } from "@/types/index";
import { type ThemeFormat } from "@royalfig/color-palette-pro";
import { Circle, Diamond, Square, Triangle } from "lucide-react";

export const PALETTE_LABELS: Record<PaletteKind, string> = {
  ana: "Analogous",
  tas: "Tints & Shades",
  tri: "Triadic",
  tet: "Tetradic",
  com: "Complementary",
  spl: "Split Comp",
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
  { value: "ghostty", label: "Ghostty", ext: "conf", mime: "text/plain" },
];

export const SHAPES: {
  value: PaletteStyle;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { value: "square", Icon: Square },
  { value: "triangle", Icon: Triangle },
  { value: "circle", Icon: Circle },
  { value: "diamond", Icon: Diamond },
];

// Must match the CSS custom property --fs-line-col in index.css
export const LINE_COL = "3rem";
