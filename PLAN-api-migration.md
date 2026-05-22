# Implementation Plan: Migrate to color-palette-pro New API

## New API Surface (from color-palette-pro)

### Core Functions
- `generateCodeTheme(baseColor, palette, isDarkMode, paletteKind, paletteStyle)` → `CodeThemeOutput`
  - Full pipeline: template → personality → distinction → APCA contrast → UI colors → token rules
  - Returns: `{ $schema?, name, displayName, description?, author?, type, semanticHighlighting, colors, tokenColors, semanticTokenColors }`

- `generateCodeThemePair(baseColor, palette, paletteKind, paletteStyle?)` → `{ dark: CodeThemeOutput, light: CodeThemeOutput }`
  - Convenience wrapper for both modes

- `serializeTheme(theme)` / `serializeThemePair(pair)` → string (JSON)

### Key Types
- `CodeThemeOutput` — standard VS Code theme JSON shape
- `SemanticColors` — 40+ typed semantic color roles (surfaces, syntax, status, terminal, markdown, bracket pairs)
- `CodeThemeTemplate` — interface for deriving syntax colors and bracket pairs
- `PersonalityConfig` — bgTint, contrastProfile, fontStyleProfile, surfaceProfile, lensName, paletteCharacter
- `SurfaceProfile` — editor L, peakAlpha, sidebarSurface, statusBarStyle, cursorSource, etc.
- `TokenRule` — TextMate scope + settings
- `PaletteCharacter` — 'serene' | 'vivid' | 'crisp' | 'mono'

### Architecture
```
baseColor + palette
    → template.deriveColors() → SyntaxColors (raw chromatic + quiet roles)
    → personality.contrastProfile → adjusted
    → enforceDistinction() → guaranteed distinctness
    → ensureRoleContrast() → APCA contrast guarantee
    → deriveUiColors(SemanticColors) → UI color map
    → generateBaseTokenRules() → TextMate rules
    → generateSemanticTokenRules() → semantic token map
```

---

## Current State (freaky-shiki)

### Palette Generation (`src/palette-gen/`)
- `generateBasePalette.ts` — generates palette from base color using `generatePaletteFromBaseColor`
- `generateSemanticColors.ts` — maps palette → SemanticColors (40+ roles)
- `generateUiColors.ts` — SemanticColors → UI color map
- `generateTokenColors.ts` — generates TextMate token rules
- `generateSemanticTokenColors.ts` — generates semantic token rules
- `generateCodeTheme.ts` — orchestrates all of the above

### Theme Generation (`src/theme-gen/`)
- `index.ts` — main orchestrator, builds full theme objects
- `buildDescription.ts` — theme descriptions
- `nameSuggestions.ts` — theme name suggestions
- `generateSemanticColors.ts` — duplicate/older version of semantic colors

### Codemodes (`src/codemodes/`)
- `color-palette-pro-dark.ts` — uses OLD API (`generatePaletteFromBaseColor`)
- `color-palette-pro-light.ts` — uses OLD API (`generatePaletteFromBaseColor`)
- `color-palette-pro.ts` — uses NEW API (`generateCodeThemePair`)

### Patches (`src/patch/`)
- `neovim/` — Neovim format transformations
- `vscode/` — VS Code format transformations
- `zed/` — Zed format transformations

---

## Migration Plan

### Phase 1: Replace Palette Generation

**File: `src/palette-gen/generateBasePalette.ts`**

Replace the old `generatePaletteFromBaseColor` call with the new API's palette generation. The new API expects a `Color[]` (BaseColorData[]). We need to generate the palette array from the base color using the new API's internal palette factory.

**Decision:** Check if color-palette-pro exports a palette generation function, or if the codemode already handles this upstream. If the codemode generates the palette and passes it to `generateCodeTheme`, then this file can be simplified to just call the new API's palette generation.

### Phase 2: Replace Theme Generation

**File: `src/palette-gen/generateCodeTheme.ts`**

Replace the current orchestration (palette → semantic colors → UI colors → token rules) with a single call to the new API:

```typescript
import { generateCodeTheme, generateCodeThemePair } from 'color-palette-pro'

// For single mode:
const theme = generateCodeTheme(baseColor, palette, isDarkMode, paletteKind, paletteStyle)

// Or for both modes:
const pair = generateCodeThemePair(baseColor, palette, paletteKind, paletteStyle)
```

The new API handles:
- ✅ Syntax color derivation (via templates)
- ✅ Personality application (contrast profile, font styles)
- ✅ Distinction enforcement
- ✅ APCA contrast guarantee
- ✅ UI color derivation
- ✅ Token rule generation
- ✅ Semantic token color generation

**Files that can be DELETED:**
- `src/palette-gen/generateSemanticColors.ts` — replaced by new API's internal pipeline
- `src/palette-gen/generateUiColors.ts` — replaced by `deriveUiColors` in new API
- `src/palette-gen/generateTokenColors.ts` — replaced by `generateBaseTokenRules` in new API
- `src/palette-gen/generateSemanticTokenColors.ts` — replaced by `generateSemanticTokenRules` in new API

### Phase 3: Personality Bridge

The new API uses `PersonalityConfig` with `SurfaceProfile`. Our project has its own personality system. We need a bridge layer:

```typescript
// src/personality-bridge.ts
import type { PersonalityConfig, SurfaceProfile, PaletteCharacter } from 'color-palette-pro'
import { Personality, PaletteKind, PaletteStyle } from './types'

function mapPersonalityToSurfaceProfile(
  personality: Personality,
  paletteKind: PaletteKind,
  isDarkMode: boolean,
): SurfaceProfile {
  // Map our personality → SurfaceProfile
  // - editor L → editorLDark/editorLLight
  // - peakAlpha → character/mode driven
  // - sidebarSurface → personality driven
  // - statusBarStyle → 'match-sidebar' | 'tinted' | 'primary' | 'primary-deep'
  // - cursorSource → 'foreground' | 'accent'
  // - inactiveSelectionStyle → 'chromatic' | 'complementary' | 'neutral'
  // - neutralBandTint → 0–0.01 range
}

function mapPaletteCharacter(paletteKind: PaletteKind): PaletteCharacter {
  // vivid → 'vivid'
  // serene → 'serene'
  // crisp → 'crisp'
  // mono → 'mono'
}
```

### Phase 4: Replace Codemodes

**Files: `src/codemodes/color-palette-pro-dark.ts` and `color-palette-pro-light.ts`**

These currently use the old API. They can be removed entirely since `color-palette-pro.ts` already uses the new `generateCodeThemePair` API.

**File: `src/codemodes/color-palette-pro.ts`**

Update to use the new API properly. It should:
1. Generate palette from base color (using new API's palette factory)
2. Call `generateCodeThemePair(baseColor, palette, paletteKind, paletteStyle)`
3. Return the pair for downstream processing

### Phase 5: Patch Transformations

The new API returns `CodeThemeOutput` which is already in VS Code JSON format. The `colors`, `tokenColors`, and `semanticTokenColors` fields match the VS Code theme schema exactly.

**For VS Code (`src/patch/vscode/`):**
- Direct passthrough — no transformation needed
- The `CodeThemeOutput` shape matches VS Code's theme JSON schema

**For Neovim (`src/patch/neovim/`):**
- Transform `colors` map → Neovim highlight groups
- Transform `tokenColors` → Neovim syntax rules
- May need scope-to-highlight-group mapping

**For Zed (`src/patch/zed/`):**
- Transform `colors` map → Zed theme colors
- Transform `tokenColors` → Zed syntax rules
- May need scope-to-Zed token mapping

### Phase 6: Cleanup

**Delete:**
- `src/palette-gen/generateSemanticColors.ts`
- `src/palette-gen/generateUiColors.ts`
- `src/palette-gen/generateTokenColors.ts`
- `src/palette-gen/generateSemanticTokenColors.ts`
- `src/codemodes/color-palette-pro-dark.ts`
- `src/codemodes/color-palette-pro-light.ts`

**Keep but review:**
- `src/theme-gen/buildDescription.ts` — may be replaceable with new API's `description` field
- `src/theme-gen/nameSuggestions.ts` — keep for theme naming
- `src/theme-gen/generateSemanticColors.ts` — review if duplicate

---

## Implementation Order

1. **Research:** Check if color-palette-pro exports a palette generation function (separate from `generateCodeTheme`)
2. **Personality bridge:** Create `src/personality-bridge.ts`
3. **Update codemode:** Rewrite `src/codemodes/color-palette-pro.ts` to use new API
4. **Update patches:** Adapt VS Code/Neovim/Zed patches for `CodeThemeOutput`
5. **Delete old files:** Remove deprecated palette-gen files
6. **Test:** Verify themes look correct across all targets

---

## Risks & Considerations

1. **Palette generation:** The new API's `generateCodeTheme` expects a `BaseColorData[]` palette. We need to know how to generate this palette. It may be internal to the package or exported separately.

2. **Personality mapping:** Our personality system may not map 1:1 to the new API's `SurfaceProfile`. We need to verify all fields have sensible defaults or mappings.

3. **Scope differences:** TextMate scopes generated by the new API may differ slightly from ours. Need to verify scope compatibility with our existing grammar files.

4. **Neovim/Zed patches:** These may need significant rework if the new API's output format differs from what we currently produce.

5. **Custom logic:** If we have any custom logic in the current `generateCodeTheme.ts` that the new API doesn't support, we need to find alternatives or contribute to color-palette-pro.
