import { useState, useEffect, useLayoutEffect, useMemo } from "react";
import { ThemeContext } from "./themeContext";
import type { Theme, PaletteKind, PaletteStyle } from "@/types";
import {
  createPalettes,
  generateCodeThemePair,
  generateCssVariables,
} from "@royalfig/color-palette-pro";

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateTheme = () => {
      const active =
        theme === "system" ? (mediaQuery.matches ? "dark" : "light") : theme;
      setResolvedTheme(active);
      root.classList.remove("light", "dark");
      root.classList.add(active);
      localStorage.setItem("theme", theme);
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  const [paletteKind, setPaletteKind] = useState<PaletteKind>(() => {
    return (localStorage.getItem("paletteKind") as PaletteKind) || "tet";
  });

  useEffect(() => {
    localStorage.setItem("paletteKind", paletteKind);
  }, [paletteKind]);

  const [paletteStyle, setPaletteStyle] = useState<PaletteStyle>(() => {
    return (localStorage.getItem("paletteStyle") as PaletteStyle) || "square";
  });

  useEffect(() => {
    localStorage.setItem("paletteStyle", paletteStyle);
  }, [paletteStyle]);

  const [baseColor, setBaseColor] = useState(() => {
    return localStorage.getItem("baseColor") || "#ff0000";
  });

  useEffect(() => {
    localStorage.setItem("baseColor", baseColor);
  }, [baseColor]);

  const palette = useMemo(() => {
    return createPalettes(baseColor, paletteKind, paletteStyle, {
      space: "oklch",
      format: "hex",
    });
  }, [baseColor, paletteKind, paletteStyle]);

  const themePair = useMemo(() => {
    const base = palette.find((c) => c.isBase)!;
    return generateCodeThemePair(base.color, palette, paletteKind, paletteStyle);
  }, [palette, paletteKind, paletteStyle]);

  const activeTheme =
    resolvedTheme === "dark" ? themePair.dark : themePair.light;

  useLayoutEffect(() => {
    const uiPalette = createPalettes(
      baseColor,
      paletteKind,
      paletteStyle,
      { space: "oklch", format: "hex" },
      undefined,
      true,
      resolvedTheme === "dark",
    );

    const uiVars = generateCssVariables(uiPalette, {
      format: "hex",
      isUiMode: true,
      wrapper: "root",
    });

    const styleEl = document.createElement("style");
    styleEl.id = "color-vars";
    styleEl.innerHTML = uiVars;

    const existing = document.getElementById("color-vars");
    if (existing) existing.replaceWith(styleEl);
    else document.head.append(styleEl);
  }, [baseColor, paletteKind, paletteStyle, resolvedTheme]);

  useLayoutEffect(() => {
    const size = 64;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const colors = palette.map((c) => c.cssValue);
    const count = Math.min(colors.length, 5);
    const pad = 4;
    const innerSize = size - pad * 2;
    const bandH = innerSize / count;

    ctx.fillStyle = "#12121f";
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, 12);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(pad, pad, innerSize, innerSize, 8);
    ctx.clip();

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(pad, pad + i * bandH, innerSize, bandH);
    }

    ctx.restore();

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = canvas.toDataURL("image/png");
  }, [palette]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        resolvedTheme,
        paletteKind,
        setPaletteKind,
        paletteStyle,
        setPaletteStyle,
        baseColor,
        setBaseColor,
        activeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};
