import { Editor } from "@/components/Editor/Editor";
import { Select } from "@/components/Select/Select";
import { Separator } from "@/components/Separator/Separator";

import {
  Circle,
  Copy,
  Diamond,
  Download,
  Moon,
  Square,
  Sun,
  Triangle,
  Wand,
} from "lucide-react";
import { format } from "prettier";
import prettierBabel from "prettier/plugins/babel";
import prettierEstree from "prettier/plugins/estree";
import prettierHtml from "prettier/plugins/html";
import prettierPostcss from "prettier/plugins/postcss";
import prettierTypescript from "prettier/plugins/typescript";
import prettierYaml from "prettier/plugins/yaml";
import { useCallback, useEffect, useRef, useState } from "react";
import { HexColorPicker } from "react-colorful";
import type { ThemeRegistration } from "shiki";
import { useTheme } from "../../hooks/useTheme";
import { highlightCode } from "../../lib/shiki";
import type { PaletteKind, PaletteStyle } from "../../types";
import { Button, ButtonGroup, IconButton } from "../Button/Button";
import "./Container.css";

const LANG_SHORT: Record<string, string> = {
  typescript: "TS",
  tsx: "TSX",
  javascript: "JS",
  css: "CSS",
  json: "JSON",
  html: "HTML",
  yaml: "YAML",
  bash: "BASH",
};

const LANG_PRETTIER: Record<string, string> = {
  typescript: "typescript",
  tsx: "typescript",
  javascript: "babel",
  css: "css",
  json: "json",
  html: "html",
  yaml: "yaml",
};

const LANG_PLACEHOLDER: Record<string, string> = {
  typescript: `const greet = (name: string): string => {
  return \`Hello, \${name}!\`;
};

console.log(greet("world"));`,
  tsx: `function Greeting({ name }: { name: string }) {
  return <h1>Hello, {name}!</h1>;
}

export default Greeting;`,
  javascript: `const greet = (name) => {
  return \`Hello, \${name}!\`;
};

console.log(greet("world"));`,
  css: `.container {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
}`,
  json: `{
  "name": "my-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite"
  }
}`,
  html: `<!doctype html>
<html lang="en">
  <head>
    <title>Hello</title>
  </head>
  <body>
    <h1>Hello, world!</h1>
  </body>
</html>`,
  yaml: `name: my-app
version: 1.0.0
scripts:
  dev: vite
  build: tsc && vite build`,
  bash: `#!/usr/bin/env bash
set -e

echo "Hello, world!"
ls -la`,
  python: `def greet(name: str) -> str:
    return f"Hello, {name}!"

print(greet("world"))`,
};

const PALETTE_LABELS: Record<PaletteKind, string> = {
  ana: "Analogous",
  tas: "Tints & Shades",
  tri: "Triadic",
  tet: "Tetradic",
  com: "Complementary",
  spl: "Split Comp",
};

const SHAPES: {
  value: PaletteStyle;
  Icon: React.FC<{ size?: number }>;
}[] = [
  { value: "square", Icon: Square },
  { value: "triangle", Icon: Triangle },
  { value: "circle", Icon: Circle },
  { value: "diamond", Icon: Diamond },
];

// Must match the CSS custom property --fs-line-col in index.css
const LINE_COL = "3rem";

export function Container() {
  const {
    theme,
    setTheme,
    paletteKind,
    setPaletteKind,
    paletteStyle,
    setPaletteStyle,
    baseColor,
    setBaseColor,
    activeTheme,
    resolvedTheme,
  } = useTheme();

  const [lang, setLang] = useState("typescript");
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const savedCode = useRef<Record<string, string>>({ ...LANG_PLACEHOLDER });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightSerial = useRef(0);

  const handleLangChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newLang = e.target.value;
      if (textRef.current) {
        savedCode.current[lang] = textRef.current.value;
        textRef.current.value =
          savedCode.current[newLang] ?? LANG_PLACEHOLDER[newLang] ?? "";
      }
      setLang(newLang);
    },
    [lang],
  );

  const [colorPickerOpen, setColorPickerOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!colorPickerOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [colorPickerOpen]);

  const editorBg = activeTheme.colors["editor.background"];

  const doHighlight = useCallback(
    async (code: string) => {
      const serial = ++highlightSerial.current;
      const html = await highlightCode(
        code,
        lang,
        activeTheme as ThemeRegistration,
      );
      if (html && serial === highlightSerial.current) setRenderedHtml(html);
    },
    [lang, activeTheme],
  );

  useEffect(() => {
    const code = textRef.current?.value || "";
    if (!code) return;
    doHighlight(code);
  }, [doHighlight]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      doHighlight(e.target.value);
    },
    [doHighlight],
  );

  const formatCode = useCallback(async () => {
    if (!textRef.current?.value) return;
    const parser = LANG_PRETTIER[lang];
    if (!parser) return;
    try {
      const formatted = await format(textRef.current.value, {
        parser,
        plugins: [
          prettierPostcss,
          prettierBabel,
          prettierEstree,
          prettierTypescript,
          prettierHtml,
          prettierYaml,
        ],
      });
      textRef.current.value = formatted;
      await doHighlight(formatted);
    } catch (err) {
      console.error(err);
    }
  }, [lang, doHighlight]);

  const copy = useCallback(() => {
    if (!renderedHtml) return;
    navigator.clipboard.writeText(codeWrapper({ lang, renderedHtml }));
  }, [renderedHtml, lang]);

  const downloadJson = useCallback(() => {
    const json = JSON.stringify(activeTheme, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freaky-shiki-${resolvedTheme}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [activeTheme, resolvedTheme]);

  return (
    <div className="fs-card">
      {/* Header */}
      <div className="fs-header">
        <div className="fs-header-left">
          {/* Color picker */}
          <div className="fs-popover-anchor" ref={popoverRef}>
            <Button
              aria-label="Pick base color"
              onClick={() => setColorPickerOpen((o) => !o)}
            >
              <span
                className="fs-color-swatch"
                style={{ backgroundColor: baseColor }}
              ></span>
              <span className="fs-title">{baseColor}</span>
            </Button>
            {colorPickerOpen && (
              <div className="fs-popover-content">
                <HexColorPicker color={baseColor} onChange={setBaseColor} />
              </div>
            )}
          </div>
        </div>

        <div className="fs-header-center"></div>

        <div className="fs-header-right">
          {/* Palette Options */}
          <Select
            size="lg"
            value={paletteKind}
            onChange={(e) => setPaletteKind(e.target.value as PaletteKind)}
            aria-label="Palette kind"
          >
            {(Object.entries(PALETTE_LABELS) as [PaletteKind, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </Select>

          <Separator />

          <ButtonGroup label="Palette shape">
            {SHAPES.map(({ value, Icon }) => (
              <IconButton
                key={value}
                variant="ghost"
                aria-pressed={paletteStyle === value}
                aria-label={value}
                onClick={() => setPaletteStyle(value)}
                className={paletteStyle === value ? "fs-btn-active" : ""}
              >
                <Icon size={14} />
              </IconButton>
            ))}
          </ButtonGroup>

          <Separator />

          <IconButton
            variant="ghost"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </IconButton>
        </div>
      </div>

      <Editor
        editorBg={editorBg}
        renderedHtml={renderedHtml}
        textRef={textRef}
        onChange={handleChange}
        lineCol={LINE_COL}
        defaultValue={LANG_PLACEHOLDER[lang]}
      />

      {/* Footer */}
      <div className="fs-footer">
        <div className="fs-footer-left">
          {/* Lang selector */}
          <Select
            size="sm"
            value={lang}
            onChange={handleLangChange}
            aria-label="Language"
          >
            {Object.entries(LANG_SHORT).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>

          <Separator />

          <IconButton variant="ghost" aria-label="Format" onClick={formatCode}>
            <Wand size={14} />
          </IconButton>
        </div>

        <div className="fs-footer-right">
          <Button icon={<Download size={14} />} onClick={downloadJson}>
            Download Theme
          </Button>
          <Button variant="primary" icon={<Copy size={14} />} onClick={copy}>
            Copy Snippet
          </Button>
        </div>
      </div>
    </div>
  );
}

type CodeWrapperType = { lang: string; renderedHtml: string };

const codeWrapper = ({ lang, renderedHtml }: CodeWrapperType) =>
  `<div class="s-code"><div class="s-code-nav"><span>${lang}</span><button aria-label="Copy code" class="s-code-copy"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg></button></div>${renderedHtml}</div>`;
