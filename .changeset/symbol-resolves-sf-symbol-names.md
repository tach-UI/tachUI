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
