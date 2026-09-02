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

`Symbol()` now resolves its name — and its `fallback` — through `getLucideForSFSymbol()` before handing it to the icon set, matching `Image({ systemName })` in the SwiftUI shim, which has always resolved through the same table. A name with no mapping entry passes through unchanged, so icon-set-native names such as `chevron-right` — the only spelling that worked before — keep working, as do names belonging to other icon sets.

No mapping entries changed: all 140 targets already existed in Lucide, so the table was correct and simply unused. `isSFSymbolSupported()` now agrees with what renders, which is asserted directly rather than assumed.

## The symbol never left the loading spinner

Fixing name resolution alone was not enough to make a glyph appear. `Symbol` painted its icon from an effect created inside `render()`, but the renderer assigns `node.element` *after* `render()` returns, so that effect could never paint on its first run — it depended on a later signal change firing while the element existed.

That later run was not reliable. `createRoot` parents to `currentOwner`, which inside a computation is that computation's per-execution owner, so when the renderer's effect re-runs it tears the symbol's root down; the replacement effect runs once — again before its element exists — and then sits idle because the signals have already settled. Measured in jsdom, no `Symbol` ever painted an SVG: not a valid name, not a warm cache, not with a fallback, not after a signal change. Every one stayed on `⟳`.

The paint is now a plain function driven from a microtask as well as from the effect. The microtask runs after the synchronous render that assigns `element`, and after any re-render that has reset the node's children back to the spinner.

With both fixes, all 23 of the reporter's claimed-supported symbols draw a real glyph, up from 4. The 11 that still fail are exactly the ones with no mapping-table entry, for which `isSFSymbolSupported()` correctly returns `false`.

## Removed `SelectiveLucideIconSet`

`src/icon-sets/selective-lucide.ts` carried its own copy of the unresolved-name bug. It was unreachable: not exported from the `icon-sets` barrel or the package root, and the `exports` map has no wildcard subpath, so no consumer could import it. It had no tests and had not been touched since the first public-release commit. Removed rather than fixed in parallel.
