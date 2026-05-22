# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev        # start dev server
pnpm build      # tsc + vite build
pnpm lint       # eslint
pnpm preview    # preview production build
```

No test suite exists in this project.

## Architecture

**Freaky Shiki** is a React + Vite app that provides a real-time code editor with syntax highlighting powered by Shiki, and a dynamically generated color theme driven by a base color picker.

### Theme system (two-layer)

There are two independent theming concepts that interact:

1. **UI theme** (`light` / `dark` / `system`) — controls the app's light/dark mode. Managed by `ThemeProvider` (`src/context/`) and stored in `localStorage`. Applied by toggling a CSS class on `<html>`.

2. **Syntax theme** (`mono` | `tetris` | `spl`) — selects which `ThemeRegistration` object is passed to Shiki for code highlighting. The three static theme definitions live in `src/lib/mono.ts`, `src/lib/tetris.ts`, and `src/lib/spl.ts`. These themes use CSS custom properties (e.g. `var(--color-primary)`) as token colors rather than hardcoded hex values.

The CSS variables those themes reference are generated at runtime in `App.tsx` (`ThemeControls` component) using `@royalfig/color-palette-pro`. Whenever the user changes the base color, UI theme, or syntax theme, `createPalettes` + `generateCssVariables` from `color-palette-pro` re-derive the full palette and inject it into the document `<head>` as a `<style id="color-vars">` tag. This is what makes the syntax colors respond to the base color picker.

### Code editor (`FreakyShiki.tsx`)

The editor overlays a transparent `<textarea>` over a `<div>` that shows Shiki-rendered HTML. As the user types, `highlightCode` (a thin wrapper in `src/lib/shiki.ts`) re-highlights via a singleton `createHighlighterCore` instance. The Format button runs Prettier (browser build) then re-highlights; Copy outputs a self-contained HTML snippet via `codeWrapper`.

Shiki is initialized once as a module-level promise (`highlighterPromise`) so langs are only loaded once.

### Path alias

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.app.json`).

### UI components

shadcn/ui components (`src/components/ui/`) — Button, Select, Textarea — using Tailwind v4 with `@tailwindcss/vite`. CSS variables bridge shadcn's token names to `color-palette-pro`'s semantic color roles (defined in `src/index.css`).

### In-progress work

`PLAN-api-migration.md` documents a planned migration to `color-palette-pro`'s newer `generateCodeTheme`/`generateCodeThemePair` API. Currently `App.tsx` still calls the older `createPalettes` + `generateCssVariables` path; `src/lib/theme-generator.ts` wraps the new API functions but is not yet wired into the main UI.
