import { Editor } from "@/components/Editor/Editor";

import { LangSelect, PaletteKindSelect } from "@/components/Select/Select";
import { Separator } from "@/components/Separator/Separator";
import { SettingsMenu } from "@/components/Settings/SettingsMenu";

import { LINE_COL, SHAPES } from "@/lib/const";
import { LANG_PLACEHOLDER, LANG_PRETTIER } from "@/lib/languages";
import { Copy, Moon, Sun, Wand } from "lucide-react";
import { format } from "prettier";
import prettierBabel from "prettier/plugins/babel";
import prettierEstree from "prettier/plugins/estree";
import prettierGraphql from "prettier/plugins/graphql";
import prettierHtml from "prettier/plugins/html";
import prettierMarkdown from "prettier/plugins/markdown";
import prettierPostcss from "prettier/plugins/postcss";
import prettierTypescript from "prettier/plugins/typescript";
import prettierYaml from "prettier/plugins/yaml";
import { useCallback, useEffect, useRef, useState } from "react";
import ColorPicker from "@/components/ColorPicker/ColorPicker";
import type { ThemeRegistration } from "shiki";
import { useTheme } from "../../hooks/useTheme";
import { highlightCode } from "../../lib/shiki";
import { Button, ButtonGroup, IconButton } from "../Button/Button";
import "./Container.css";

export function Container() {
  const {
    theme,
    setTheme,
    paletteKind,
    setPaletteKind,
    paletteStyle,
    setPaletteStyle,
    activeTheme,
    themePair,
  } = useTheme();

  const [lang, setLang] = useState(
    () => localStorage.getItem("lang") || "typescript",
  );

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const savedCode = useRef<Record<string, string>>({ ...LANG_PLACEHOLDER });
  const userEdited = useRef(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightSerial = useRef(0);

  const handleLangChange = useCallback(
    (newLang: string) => {
      if (textRef.current) {
        savedCode.current[lang] = textRef.current.value;
        if (!userEdited.current) {
          textRef.current.value =
            savedCode.current[newLang] ?? LANG_PLACEHOLDER[newLang] ?? "";
        }
      }
      setLang(newLang);
    },
    [lang],
  );

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
      userEdited.current = true;
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
          prettierMarkdown,
          prettierGraphql,
        ],
      });
      textRef.current.value = formatted;
      await doHighlight(formatted);
    } catch (err) {
      console.error(err);
    }
  }, [lang, doHighlight]);

  const copy = useCallback(async () => {
    const code = textRef.current?.value;
    if (!code) return;
    const [lightHtml, darkHtml] = await Promise.all([
      highlightCode(code, lang, themePair.light as ThemeRegistration),
      highlightCode(code, lang, themePair.dark as ThemeRegistration),
    ]);
    if (!lightHtml || !darkHtml) return;
    await navigator.clipboard.writeText(
      codeWrapper({ lang, lightHtml, darkHtml }),
    );
  }, [lang, themePair]);

  return (
    <div className="fs-card">
      {/* Header */}
      <div className="fs-header">
        <div className="fs-header-left">
          {/* Color picker */}
          <ColorPicker />
        </div>

        <div className="fs-header-right">
          {/* Palette kind */}
          <PaletteKindSelect
            paletteKind={paletteKind}
            setPaletteKind={setPaletteKind}
          />

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

          <Separator />

          <SettingsMenu />
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
          <LangSelect handleLangChange={handleLangChange} lang={lang} />

          <Separator />

          <IconButton variant="ghost" aria-label="Format" onClick={formatCode}>
            <Wand size={14} />
          </IconButton>
        </div>

        <div className="fs-footer-right">
          <Button variant="primary" icon={<Copy size={14} />} onClick={copy}>
            Copy Snippet
          </Button>
        </div>
      </div>
    </div>
  );
}

type CodeWrapperType = { lang: string; lightHtml: string; darkHtml: string };

const codeBlock = (lang: string, renderedHtml: string) =>
  `<div class="fs-code"><div class="fs-code-nav"><span>${lang}</span><button aria-label="Copy code" class="fs-code-copy"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg></button></div>${renderedHtml}</div>`;

const codeWrapper = ({ lang, lightHtml, darkHtml }: CodeWrapperType) =>
  `<div class="fs-light">${codeBlock(lang, lightHtml)}</div><div class="fs-dark">${codeBlock(lang, darkHtml)}</div>`;
