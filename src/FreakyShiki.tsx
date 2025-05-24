import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "prettier";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import postcss from "prettier/plugins/postcss";
import typescript from "prettier/plugins/typescript";
import html from "prettier/plugins/html";
import yaml from "prettier/plugins/yaml";
import { useState, useRef, useCallback, useMemo } from "react";
import { codeToHtml } from "shiki";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Move langMap outside component to prevent recreation
const LANG_MAP = new Map([
  ["typescript", "typescript"],
  ["javascript", "babel"],
  ["css", "css"],
  ["json", "json"],
  ["html", "html"],
  ["yaml", "yaml"],
  ["bash", "bash"],
]);

// Memoize theme options
const THEME_OPTIONS = {
  light: "min-light",
  dark: "dark-plus",
};

const COLOR_REPLACEMENTS = {
  "dark-plus": {
    "#1e1e1e": "var(--cl-surface)",
  },
};

// Debounce function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function FreakyShiki() {
  const [renderedHtml, updateRenderedHtml] = useState<string | null>(null);
  const [lang, setLang] = useState<string>("typescript");
  const text = useRef<HTMLTextAreaElement>(null);

  // Memoize the code formatting function
  const formatCode = useCallback(async () => {
    if (!text.current) return;

    try {
      let formatted = text.current.value;

      // Only format if not bash
      if (lang !== "bash") {
        formatted = await format(text.current.value, {
          parser: LANG_MAP.get(lang),
          plugins: [postcss, babel, estree, typescript, html, yaml],
        });
      }

      const stylized = await codeToHtml(formatted, {
        lang: lang,
        themes: THEME_OPTIONS,
        colorReplacements: COLOR_REPLACEMENTS,
      });

      updateRenderedHtml(stylized);
    } catch (error) {
      console.error("Error formatting code:", error);
    }
  }, [lang]);

  // Memoize the HTML generation function
  const generateHtml = useCallback(
    async (code: string) => {
      try {
        const rawHtml = await codeToHtml(code, {
          lang: lang,
          themes: THEME_OPTIONS,
          colorReplacements: COLOR_REPLACEMENTS,
        });
        return rawHtml;
      } catch (error) {
        console.error("Error generating HTML:", error);
        return null;
      }
    },
    [lang]
  );

  // Debounced change handler
  const debouncedHandleChange = useMemo(
    () =>
      debounce(async (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        const html = await generateHtml(event.target.value);
        if (html) {
          updateRenderedHtml(html);
        }
      }, 300),
    [generateHtml]
  );

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      debouncedHandleChange(event);
    },
    [debouncedHandleChange]
  );

  const copy = useCallback(() => {
    if (!renderedHtml) return;
    const wrappedHtml = codeWrapper({ lang, renderedHtml });
    navigator.clipboard.writeText(wrappedHtml || "");
  }, [renderedHtml, lang]);

  return (
    <div className="space-y-2">
      <Select onValueChange={setLang} value={lang}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="typescript">TypeScript</SelectItem>
          <SelectItem value="javascript">JavaScript</SelectItem>
          <SelectItem value="css">CSS</SelectItem>
          <SelectItem value="json">JSON</SelectItem>
          <SelectItem value="html">HTML</SelectItem>
          <SelectItem value="yaml">YAML</SelectItem>
          <SelectItem value="bash">Bash</SelectItem>
        </SelectContent>
      </Select>
      <div className="relative border rounded-md p-2 min-h-80 font-mono leading-tight">
        <div
          className="relative w-full h-full"
          dangerouslySetInnerHTML={{
            __html: renderedHtml || "",
          }}
        />
        <textarea
          onChange={handleChange}
          className="w-full h-full z-10 absolute inset-0 p-2 text-transparent caret-red-600 bg-transparent"
          ref={text}
        />
      </div>
      <div className="flex gap-2">
        <Button onClick={copy}>Copy</Button>
        <Button onClick={formatCode}>Format</Button>
      </div>
    </div>
  );
}

type CodeWrapperType = {
  lang: string;
  renderedHtml: string;
};

const codeWrapper = ({ lang, renderedHtml }: CodeWrapperType) =>
  `<div class="s-code"><div class="s-code-nav"><span>${lang}</span><button aria-label="Copy code" class="s-code-copy"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg></button></div>${renderedHtml}</div>`;
