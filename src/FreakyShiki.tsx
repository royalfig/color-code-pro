import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "prettier";
import babel from "prettier/plugins/babel";
import estree from "prettier/plugins/estree";
import postcss from "prettier/plugins/postcss";
import typescript from "prettier/plugins/typescript";
import html from "prettier/plugins/html";
import yaml from "prettier/plugins/yaml";
import { useState } from "react";
import { codeToHtml } from "shiki";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const langMap = new Map([
  ["typescript", "typescript"],
  ["javascript", "babel"],
  ["css", "css"],
  ["json", "json"],
  ["html", "html"],
  ["yaml", "yaml"]
]
)

console.log(langMap.get("typescript"));

export function FreakyShiki() {
  const [renderedHtml, updateRenderedHtml] = useState<string | null>(null);
  const [lang, setLang] = useState<string>("typescript");

  async function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    try {
      const formattedCode = await format(event.target.value, {
        parser: langMap.get(lang),
        plugins: [postcss, babel, estree, typescript, html, yaml],
      });

      const rawHtml = await codeToHtml(formattedCode, {
        lang: lang,
        themes: {
          light: "min-light",
          dark: 'dark-plus',
        },
        colorReplacements: {
          'dark-plus': {
            '#1e1e1e': 'var(--cl-surface)'
          }
        }
      });

      const wrappedHtml = codeWrapper({ lang, rawHtml });

      updateRenderedHtml(wrappedHtml);
    } catch (error) {
      console.error(error);
    }
  }

  function copy() {
    navigator.clipboard.writeText(renderedHtml || "");
  }

  return (
    <div className="space-y-2">
      <Select onValueChange={(e) => setLang(e)} value={lang}>
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
        </SelectContent>
      </Select>
      <Textarea onChange={handleChange} className="min-h-80" />
      <Button onClick={copy}>Copy</Button>
      <div
        dangerouslySetInnerHTML={{
          __html: renderedHtml || "",
        }}
      ></div>
      <div>{renderedHtml}</div>
    </div>
  );
}

type CodeWrapperType = {
  lang: string;
  rawHtml: string;
};

const codeWrapper = ({ lang, rawHtml }: CodeWrapperType) =>
  `<div class="s-code"><div class="s-code-nav"><span>${lang}</span><button aria-label="Copy code" class="s-code-copy"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.9998 6V3C6.9998 2.44772 7.44752 2 7.9998 2H19.9998C20.5521 2 20.9998 2.44772 20.9998 3V17C20.9998 17.5523 20.5521 18 19.9998 18H16.9998V20.9991C16.9998 21.5519 16.5499 22 15.993 22H4.00666C3.45059 22 3 21.5554 3 20.9991L3.0026 7.00087C3.0027 6.44811 3.45264 6 4.00942 6H6.9998ZM5.00242 8L5.00019 20H14.9998V8H5.00242ZM8.9998 6H16.9998V16H18.9998V4H8.9998V6ZM7 11H13V13H7V11ZM7 15H13V17H7V15Z"></path></svg></button></div>${rawHtml}</div>`;

