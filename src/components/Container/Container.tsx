import { Editor } from "@/components/Editor/Editor";

import { LangSelect, PaletteKindSelect } from "@/components/Select/Select";
import { Separator } from "@/components/Separator/Separator";
import { SettingsMenu } from "@/components/Settings/SettingsMenu";

import { LINE_COL, SHAPES } from "@/lib/const";
import { LANG_PLACEHOLDER, LANG_PRETTIER } from "@/lib/languages";
import { canFormat, formatCode } from "@/lib/prettier";
import { Copy, Moon, Sun, Wand, Check } from "lucide-react";
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

  const [copyButtonIconToUse, setCopyButtonIconToUse] = useState(
    <Copy size={14} />,
  );

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);
  const [renderedHtml, setRenderedHtml] = useState<string | null>(null);
  const savedCode = useRef<Record<string, string>>({ ...LANG_PLACEHOLDER });
  const textRef = useRef<HTMLTextAreaElement>(null);
  const highlightSerial = useRef(0);

  const handleLangChange = useCallback(
    (newLang: string) => {
      if (textRef.current) {
        // Persist the current language's edits, then load the target
        // language's own code (its prior edit, or the stock sample).
        savedCode.current[lang] = textRef.current.value;
        textRef.current.value =
          savedCode.current[newLang] ?? LANG_PLACEHOLDER[newLang] ?? "";
      }
      setLang(newLang);
    },
    [lang],
  );

  const editorBg = activeTheme.colors["editor.background"];
  const formatSupported = canFormat(LANG_PRETTIER[lang]);

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
      savedCode.current[lang] = e.target.value;
      doHighlight(e.target.value);
    },
    [lang, doHighlight],
  );

  const handleFormat = useCallback(async () => {
    const parser = LANG_PRETTIER[lang];
    if (!canFormat(parser) || !textRef.current?.value) return;
    try {
      const formatted = await formatCode(textRef.current.value, parser);
      textRef.current.value = formatted;
      savedCode.current[lang] = formatted;
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
    setCopyButtonIconToUse(<Check size={14} />);
    setTimeout(() => {
      setCopyButtonIconToUse(<Copy size={14} />);
    }, 2000);
  }, [lang, themePair]);

  return (
    <div className="cc-card">
      {/* Header */}
      <div className="cc-header">
        <div className="cc-header-left">
          {/* Color picker */}
          <ColorPicker />
        </div>

        <div className="cc-header-right">
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
                className={paletteStyle === value ? "cc-btn-active" : ""}
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
      <div className="cc-footer">
        <div className="cc-footer-left">
          {/* Lang selector */}
          <LangSelect handleLangChange={handleLangChange} lang={lang} />

          {formatSupported && (
            <>
              <Separator />

              <IconButton
                variant="ghost"
                aria-label="Format"
                onClick={handleFormat}
              >
                <Wand size={14} />
              </IconButton>
            </>
          )}
        </div>

        <div className="cc-footer-right">
          <Button variant="primary" icon={copyButtonIconToUse} onClick={copy}>
            Copy Snippet
          </Button>
        </div>
      </div>
    </div>
  );
}

type CodeWrapperType = { lang: string; lightHtml: string; darkHtml: string };

const codeBlock = (lang: string, renderedHtml: string) =>
  `<div class="cc-code"><div class="cc-code-nav"><span>${lang}</span><button aria-label="Copy code" class="cc-code-copy"></button></div>${renderedHtml}</div>`;

const codeWrapper = ({ lang, lightHtml, darkHtml }: CodeWrapperType) =>
  `<div class="cc-light">${codeBlock(lang, lightHtml)}</div><div class="cc-dark">${codeBlock(lang, darkHtml)}</div>`;
