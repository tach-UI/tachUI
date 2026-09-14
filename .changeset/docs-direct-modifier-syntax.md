---

---

No release. Documentation only.

The published docs taught `.modifier.*`, which is the internal trigger, not the
public API. 102 occurrences across twelve package READMEs and core's docs now
use direct chaining.

Thirty-two occurrences stay exactly as they were, because they are describing
the legacy form rather than recommending it: the migration guides' Legacy/New
tables and before-blocks, the eslint rule's own before/after, the
`legacyModifierFallback` configuration flag, and the "deprecated — avoid" blocks
in the modifiers guide. Rewriting those would have turned working documentation
into nonsense.

`@tachui/core`'s README example was wrong in four separate ways beyond that: it
imported `Text`, `Button` and `VStack` from core, where none of them exist;
omitted the modifier preload that makes the chained calls resolve; and mounted
with `counterApp.mount('#app')`, which is not an API. The corrected example is
covered by a test that mounts it and clicks the button. The guide's copy mounted
with `document.body.appendChild(counterApp)` — a component is not a DOM node —
and now uses `mountRoot`. The README also claimed the components as core's own;
they are `@tachui/primitives`.
