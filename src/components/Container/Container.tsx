import { Editor } from "@/components/Editor/Editor";

import { LangSelect, PaletteKindSelect } from "@/components/Select/Select";
import { Separator } from "@/components/Separator/Separator";
import { SettingsMenu } from "@/components/Settings/SettingsMenu";
import { ThemeDownload } from "@/components/ThemeDownload/ThemeDownload";

import { LINE_COL, SHAPES, THEME_MODES } from "@/lib/const";
import { LANG_PLACEHOLDER, LANG_PRETTIER } from "@/lib/languages";
import { canFormat, formatCode } from "@/lib/prettier";
import { CopyIcon, MagicWandIcon, CheckIcon } from "@phosphor-icons/react";
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
    mode,
  } = useTheme();

  const [lang, setLang] = useState(
    () => localStorage.getItem("lang") || "typescript",
  );

  const [copyButtonIconToUse, setCopyButtonIconToUse] = useState(
    <CopyIcon size={14} />,
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

  // The theme control is a single button that cycles dual → light → dark,
  // showing the current mode's icon.
  const currentMode =
    THEME_MODES.find((m) => m.value === theme) ?? THEME_MODES[0];
  const ModeIcon = currentMode.Icon;
  const cycleTheme = () => {
    const i = THEME_MODES.findIndex((m) => m.value === theme);
    setTheme(THEME_MODES[(i + 1) % THEME_MODES.length].value);
  };

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
    let snippet: string;
    if (theme === "dual") {
      // Both variants + a prefers-color-scheme toggle (needs base.css; web-only).
      const [lightHtml, darkHtml] = await Promise.all([
        highlightCode(code, lang, themePair.light as ThemeRegistration),
        highlightCode(code, lang, themePair.dark as ThemeRegistration),
      ]);
      if (!lightHtml || !darkHtml) return;
      snippet = dualWrapper(lang, lightHtml, darkHtml);
    } else {
      // A single self-contained variant that works on the web AND in email.
      const html = await highlightCode(
        code,
        lang,
        (theme === "dark"
          ? themePair.dark
          : themePair.light) as ThemeRegistration,
      );
      if (!html) return;
      snippet = codeBlock(lang, html);
    }
    await navigator.clipboard.writeText(snippet);
    setCopyButtonIconToUse(<CheckIcon size={14} />);
    setTimeout(() => {
      setCopyButtonIconToUse(<CopyIcon size={14} />);
    }, 2000);
  }, [lang, themePair, theme]);

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
            aria-label={`Theme: ${currentMode.label} — click to cycle`}
            onClick={cycleTheme}
          >
            <ModeIcon
              size={14}
              weight={currentMode.value === "dual" ? "fill" : "regular"}
            />
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
                <MagicWandIcon size={14} />
              </IconButton>
            </>
          )}
        </div>

        <div className="cc-footer-right">
          {mode === "snippet" ? (
            <Button
              variant="primary"
              icon={copyButtonIconToUse}
              aria-label="Copy embed snippet"
              onClick={copy}
            >
              Copy Snippet
            </Button>
          ) : (
            <ThemeDownload />
          )}
        </div>
      </div>
    </div>
  );
}

// The frame lives inline on the <pre> so the snippet is self-contained in email
// (mail clients keep inline styles but strip <style>/class rules). Shiki already
// inlines token colors + background; we add the container styles here.
const PRE_INLINE =
  "margin:0;padding:16px;border:1px solid #e3e3e8;border-radius:8px;" +
  "overflow-x:auto;white-space:pre;" +
  "font-family:ui-monospace,'Cascadia Code',Menlo,Consolas,monospace;" +
  "font-size:13px;line-height:1.5;";

// Prepend container styles into the <pre>'s existing inline style attribute.
const inlinePreStyles = (shikiHtml: string) =>
  shikiHtml.replace(/(<pre\b[^>]*\bstyle=")/, `$1${PRE_INLINE}`);

// One self-contained block: an Outlook-safe single-cell table, an inline lang
// label, and the inline-styled <pre>. No copy button in the markup — base.js
// overlays one on the web (it never runs in email, which is the point). The
// .cc-code class + position:relative cell give that overlay an anchor.
const codeBlock = (lang: string, shikiHtml: string) => {
  const label =
    `<div style="font-family:ui-monospace,monospace;font-size:12px;font-weight:600;` +
    `letter-spacing:.05em;text-transform:uppercase;color:#6b6b72;padding:0 0 6px;">${lang}</div>`;
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" ` +
    `class="cc-code" data-lang="${lang}" style="border-collapse:collapse;margin:16px 0;"><tr>` +
    `<td style="padding:0;position:relative;">${label}${inlinePreStyles(shikiHtml)}</td>` +
    `</tr></table>`
  );
};

// Dual mode ships both variants wrapped in .cc-light/.cc-dark; base.css toggles
// them via prefers-color-scheme. Web-only — email has no way to hide one, so it
// shows both (which is why light/dark mode exists for newsletters).
const dualWrapper = (lang: string, lightHtml: string, darkHtml: string) =>
  `<div class="cc-light">${codeBlock(lang, lightHtml)}</div>` +
  `<div class="cc-dark">${codeBlock(lang, darkHtml)}</div>`;
