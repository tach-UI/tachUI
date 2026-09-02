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

It now hands the renderer the element instead of patching behind it — see the `@tachui/core` note below — so the icon, the error glyph and the spinner are mounted content the renderer will not overwrite.

`Symbol` keeps a root of its own for repainting. Its state has to be read there rather than in `render()`: a child's `render()` is called inline by `renderChildrenArray`, inside the *enclosing* component's render effect, so reading it there subscribes the parent and every icon that resolves re-renders the surrounding subtree. Where the parent constructs its symbols during its own render — the ordinary way to write it — that is a feedback loop that settles only once the loader cache is warm. `render()` is untracked, and the root patches the symbol's own mounted element.

`render()` also no longer needs a DOM: server-side it emits the wrapper alone and the icon is drawn on hydration, rather than throwing on `createElementNS`.

With both fixes, all 23 of the reporter's claimed-supported symbols draw a real glyph, up from 4. The 11 that still fail are exactly the ones with no mapping-table entry, for which `isSFSymbolSupported()` correctly returns `false`.

## Removed `SelectiveLucideIconSet`

`src/icon-sets/selective-lucide.ts` carried its own copy of the unresolved-name bug. It was unreachable: not exported from the `icon-sets` barrel or the package root, and the `exports` map has no wildcard subpath, so no consumer could import it. It had no tests and had not been touched since the first public-release commit. Removed rather than fixed in parallel.
