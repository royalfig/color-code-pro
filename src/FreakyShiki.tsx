import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover } from "radix-ui";
import { HexColorPicker } from "react-colorful";
import { format } from "prettier";
import prettierBabel from "prettier/plugins/babel";
import prettierEstree from "prettier/plugins/estree";
import prettierPostcss from "prettier/plugins/postcss";
import prettierTypescript from "prettier/plugins/typescript";
import prettierHtml from "prettier/plugins/html";
import prettierYaml from "prettier/plugins/yaml";
import {
  Square,
  Triangle,
  Circle,
  Diamond,
  Sun,
  Wand,
  Copy,
  Download,
  Moon,
} from "lucide-react";
import { useState, useRef, useCallback, useEffect } from "react";
import { highlightCode } from "./lib/shiki";
import type { ThemeRegistration } from "shiki";
import { useTheme } from "./hooks/useTheme";
import type { PaletteKind, PaletteStyle } from "./types";
import { ButtonGroup } from "./components/ui/button-group";

const LANG_SHORT: Record<string, string> = {
  typescript: "TS",
  javascript: "JS",
  css: "CSS",
  json: "JSON",
  html: "HTML",
  yaml: "YAML",
  bash: "BASH",
};

const LANG_PRETTIER: Record<string, string> = {
  typescript: "typescript",
  javascript: "babel",
  css: "css",
  json: "json",
  html: "html",
  yaml: "yaml",
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
  Icon: React.FC<{ className?: string }>;
}[] = [
  { value: "square", Icon: Square },
  { value: "triangle", Icon: Triangle },
  { value: "circle", Icon: Circle },
  { value: "diamond", Icon: Diamond },
];

// Must match the CSS custom property --fs-line-col in index.css
const LINE_COL = "3rem";

export function FreakyShiki() {
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
  const [loading, setLoading] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const editorBg = activeTheme.colors["editor.background"];

  const doHighlight = useCallback(
    async (code: string) => {
      const html = await highlightCode(
        code,
        lang,
        activeTheme as ThemeRegistration,
      );
      if (html) setRenderedHtml(html);
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
      setLoading(true);
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
    } finally {
      setLoading(false);
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
    <div className="rounded-xl bg-card shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b">
        <div className="flex items-center gap-3">
          {/* Color picker */}
          <Popover.Root>
            <Popover.Trigger asChild>
              <button
                className="h-6 w-6 rounded-full border border-border shadow-sm shrink-0 cursor-pointer"
                style={{ backgroundColor: baseColor }}
                aria-label="Pick base color"
              />
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                sideOffset={8}
                className="z-50 rounded-lg shadow-lg p-2 bg-popover border border-border"
              >
                <HexColorPicker color={baseColor} onChange={setBaseColor} />
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
          <span className="italic font-serif text-lg select-none">
            Freaky Shiki
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Language */}
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger className="h-6 w-20 text-xs font-medium uppercase tracking-wider">
              <SelectValue>{LANG_SHORT[lang]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(LANG_SHORT).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Palette kind */}
          <Select
            value={paletteKind}
            onValueChange={(v) => setPaletteKind(v as PaletteKind)}
          >
            <SelectTrigger className="w-36 text-xs font-medium uppercase tracking-wider">
              <SelectValue>{PALETTE_LABELS[paletteKind]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(PALETTE_LABELS) as [PaletteKind, string][]).map(
                ([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ),
              )}
            </SelectContent>
          </Select>

          {/* Shape buttons */}
          <ButtonGroup className="flex items-center">
            {SHAPES.map(({ value, Icon }) => (
              <Button
                key={value}
                variant={paletteStyle === value ? "secondary" : "outline"}
                size="icon"
                onClick={() => setPaletteStyle(value)}
                aria-label={value}
              >
                <Icon className="h-4 w-4" />
              </Button>
            ))}
          </ButtonGroup>

          {/* Dark/light toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <Sun /> : <Moon />}
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div
        className="relative min-h-60 font-mono text-sm leading-6"
        style={
          {
            backgroundColor: editorBg,
            "--fs-line-col": LINE_COL,
          } as React.CSSProperties
        }
      >
        <div
          className="relative w-full h-full p-4 [&_.shiki]:m-0"
          dangerouslySetInnerHTML={{ __html: renderedHtml || "" }}
        />
        <textarea
          ref={textRef}
          onChange={handleChange}
          spellCheck={false}
          className="absolute inset-0 w-full h-full z-10 bg-transparent text-transparent caret-primary resize-none font-mono text-sm leading-6 p-4"
          style={{ paddingLeft: `calc(${LINE_COL} + 1rem)` }}
        />
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 px-5 py-3 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={formatCode}
          className="gap-1.5"
        >
          <Wand className="h-3.5 w-3.5" />
          {loading ? "Formatting…" : "Format"}
        </Button>
        <Button size="sm" onClick={copy} className="gap-1.5">
          <Copy className="h-3.5 w-3.5" />
          Copy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={downloadJson}
          className="gap-1.5"
        >
          <Download className="h-3.5 w-3.5" />
          Download JSON
        </Button>
      </div>
    </div>
  );
}

type CodeWrapperType = { lang: string; renderedHtml: string };

const codeWrapper = ({ lang, renderedHtml }: CodeWrapperType) =>
  `<div class="s-code"><div class="s-code-nav"><span>${lang}</span><button aria-label="Copy code" class="s-code-copy"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg></button></div>${renderedHtml}</div>`;
