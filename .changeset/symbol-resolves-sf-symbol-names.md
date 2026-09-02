---
'@tachui/symbols': patch
---

Resolve SF Symbol names through the mapping table before loading an icon (#303).

`@tachui/symbols` ships a 140-entry SF Symbol → Lucide mapping table, but `Symbol()` never consulted it. The raw name went straight to the icon set, which PascalCases it and looks it up in Lucide. Dots are not word separators there, so `chevron.right` became `Chevron.right`, missed `ChevronRight`, and drew the error glyph — while `isSFSymbolSupported('chevron.right')` returned `true` and TypeScript was satisfied.

Only SF Symbols spelled identically in Lucide ever rendered. Of the 23 symbols one reporter's app used that the package claimed to support, 4 worked: `calendar`, `clock`, `pencil`, `plus`. The other 19 silently drew a circle-with-X.

```typescript
Symbol('chevron.right')
// before: <span class="… tachui-symbol--error"> and a console warning
// after:  the chevron-right glyph
```

The package README documents `Symbol('heart.fill')`, `Symbol('star.circle')`, `Symbol('person.fill')` and similar throughout, so this affected the component's documented API as written.

`IconLoader` now resolves a name — and a `fallback` — through `getLucideForSFSymbol()` before asking the icon set for it, matching `Image({ systemName })` in the SwiftUI shim, which has always resolved through the same table. A name with no mapping entry passes through unchanged, so icon-set-native names such as `chevron-right` — the only spelling that worked before — keep working, as do names belonging to other icon sets.

Resolving at the loader rather than in `Symbol()` keeps every entry point on one name. `IconLoader` is exported from the package root and the compatibility guide documents preloading with SF spellings, so resolving in the component alone would leave `preloadIcons(['heart.fill'])` warming a key the render never asks for — a guaranteed miss, plus a wasted load of a name no icon set has.

No mapping entries changed: all 140 targets already existed in Lucide, so the table was correct and simply unused. `isSFSymbolSupported()` now agrees with what renders, which is asserted directly rather than assumed.

## The symbol never left the loading spinner

Fixing name resolution alone was not enough to make a glyph appear. Measured in jsdom, no `Symbol` ever painted an SVG — not a valid name, not a warm cache, not with a fallback, not after a signal change. Every one stayed on `⟳`.

`Symbol` painted from an effect created inside `render()`, but the renderer assigns `node.element` *after* `render()` returns, so that effect could never paint on its first run. Anything it did manage to write later was overwritten by `updateChildren`, which reconciles the node's declared children on every render.

## `render()` describes; the renderer subscribes

The deeper problem was where the symbol's state was read. A component's `render()` does not run in its own reactive scope: a child's `render()` is called inline inside the *enclosing* component's render effect, so reading `isLoading`/`error`/`iconDefinition` there subscribes the parent, and every icon that resolved re-rendered the whole surrounding subtree. Where a parent constructs its symbols during its own render — the ordinary way to write it — each pass built fresh signals whose load triggered another pass: **26 enclosing renders for a single symbol**, settling only once the loader cache was warm.

`Symbol`'s `render()` now reads no signals at all. It hands the renderer memos for the wrapper's classes and styles, and the icon as a `DOMNode.reactiveElement` accessor — see the `@tachui/core` note below. Every subscription belongs to a renderer-owned binding scoped to the mounted element, which is where a reactive `className` or `style` prop has always lived. The component owns no scope, patches no DOM, and holds no reference to the element the renderer built.

Four things fall out of that, each of which was broken while `Symbol` maintained its own repaint scope:

- A symbol disposed and re-rendered — what `Show` does across a branch swap — repaints again, instead of freezing at whatever it last painted.
- A symbol paints inside a layout that hands the renderer a *copy* of the node. `ZStack` and the tab views spread nodes (`{ ...node }`), so the object the component kept never received an `element`; such a symbol stayed on the spinner forever, including with a warm cache.
- Modifier styles and classes survive the load. `Symbol('heart').padding(8).frame({ width: 40 })` keeps both the padding and the frame width once the icon resolves, and across a later scale change; `.foregroundColor('red')` stays red.
- A parent re-render with a fresh `Symbol()` instance leaves one child, not a spinner mounted alongside the icon.

The wrapper's styles now go over as an object rather than a string, which also fixes keys the string path silently dropped: `lineHeight`, `fontWeight`, `letterSpacing` and `fontVariationSettings` are not valid CSS property names, and the renderer kebab-cases object keys.

`render()` also no longer needs a DOM: server-side it emits the wrapper alone and the icon is drawn on hydration, rather than throwing on `createElementNS`.

## Removed `SelectiveLucideIconSet`

`src/icon-sets/selective-lucide.ts` carried its own copy of the unresolved-name bug. It was unreachable: not exported from the `icon-sets` barrel or the package root, and the `exports` map has no wildcard subpath, so no consumer could import it. It had no tests and had not been touched since the first public-release commit. Removed rather than fixed in parallel.
