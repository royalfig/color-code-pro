import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { ThemeRegistration } from "shiki";

const highlighterPromise = createHighlighterCore({
  themes: [],
  langs: [
    import("@shikijs/langs/typescript"),
    import("@shikijs/langs/javascript"),
    import("@shikijs/langs/css"),
    import("@shikijs/langs/json"),
    import("@shikijs/langs/python"),
    import("@shikijs/langs/html"),
    import("@shikijs/langs/yaml"),
    import("@shikijs/langs/bash"),
  ],
  engine: createJavaScriptRegexEngine(),
});

const lineNumbers = {
  name: "line-numbers",
  line(node: any, line: number) {
    node.properties["data-line"] = String(line).padStart(2, "0");
  },
};

export async function highlightCode(
  code: string,
  lang: string,
  theme: ThemeRegistration,
) {
  const highlighter = await highlighterPromise;
  return highlighter.codeToHtml(code, { lang, theme, transformers: [lineNumbers] });
}
