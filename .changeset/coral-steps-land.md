---
"@tachui/core": minor
"@tachui/types": minor
"@tachui/ssr": minor
"@tachui/modifiers": patch
"@tachui/responsive": patch
"@tachui/fragments": minor
---

Add fragments architecture, SSR head collection, and deterministic component IDs.

## `@tachui/core`

- Add `withSSRAssetHeadCollector` / `getSSRAssetHeadCollector` for threading link/style/meta contributions from asset resolution through synchronous SSR render passes
- Add deterministic structural component IDs (`createDeterministicComponentId`, `beginRenderPass`, `allocateChildIndex`) for stable `data-component-id` values across repeated renders
- Export `getCurrentComponentContextOrNull` for context-optional reads
- Prevent internal renderer metadata (`componentMetadata`, `debugLabel`) from leaking into DOM attribute output via `sanitizeDOMProps`
- Add `collectStaticAnimationCSSRules` shared helper to eliminate divergence across `AnimationModifier` variants

## `@tachui/types`

- Add `FragmentMarker` interface (`componentId`, `componentName`, `snapshotData`)
- Add `__tachui_fragment?: FragmentMarker` to `DOMNode` as the well-known marker key for the fragments architecture

## `@tachui/ssr`

- Add `SSRContext` type (`links`, `styles`, `meta`) and `createSSRContext()` factory for collecting `<head>` contributions during render
- Add `serializeToHTMLWithContext()` entry point that threads context and `interactive` flag through serialization
- Add `head-sanitizer` module (`sanitizeHeadEntry`, `buildHeadEntries`) with injection-safe filtering of head entries; shared by SSR prerender and fragments prerender
- Add `getStaticCSS` modifier protocol support in serializer: collects pseudo-class, `@keyframes`, and `@media` rules from modifiers that implement `getStaticCSS(selector)`
- Add fragment serialization: detect `__tachui_fragment` markers on element nodes, wrap output in `<tachui-fragment data-component data-component-id [data-state]>` when `interactive` is true (default), omit wrapper when `interactive: false`; `onFragment` callback fires in both modes for manifest collection
- Add `RenderToStringOptions.interactive` to control fragment wrapper emission
- Fix: omit `debugLabel` from serialized HTML attributes

## `@tachui/modifiers`

- Fix `active()` and `focus()` modifier factory functions — previously both emitted `:hover` CSS rules; now correctly emit `:active` and `:focus` respectively via new `pseudoClass` property on `HoverModifier`
- Add `HoverModifier.getStaticCSS(selector)` for SSR static pseudo-class rule extraction (no `!important` in static output)

## `@tachui/responsive`

- Add `ResponsiveModifier.getStaticCSS(selector)` for SSR static `@media` rule extraction

## `@tachui/fragments` (new package)

Initial release of the fragments architecture for selective hydration.

- `.interactive()` modifier — marks a component's root node as a hydration boundary via `__tachui_fragment`
- `.snapshot({ get, restore })` modifier — opt-in state capture; `get()` called at prerender to produce `data-state`, `restore(snap)` called at hydration before first render
- `Interactive({ children, componentName? })` wrapper component — escape hatch for raw DOM nodes that cannot use `.interactive()` directly
- `configureFragments({ onHydrationError })` — global hydration error handler; defaults to `console.error`; static HTML snapshot always retained regardless of error
- `prerender(routes, options)` — fragment-aware static generation; emits per-route HTML files with manifest script and runtime script tag when `interactive: true` (default); strips wrappers when `interactive: false`
- `registerFragment(name, factory)` / `hydrateFragments()` — client-side runtime; defers to `DOMContentLoaded`, resolves fragments via manifest, calls `restore()` if snapshot present, falls back to static HTML on error
