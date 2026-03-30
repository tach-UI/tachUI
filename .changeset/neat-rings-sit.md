---
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/primitives': patch
'@tachui/responsive': patch
---

Patch release for recent bug fixes and typing/reactivity improvements:

- Fix transform modifier composition/reactive update behavior and add stronger regression coverage.
- Harden responsive breakpoint reactivity test support and singleton reset behavior.
- Fix `Spacer()` typing so direct modifier chains (for example `.maxHeight()`) are available.
- Apply core SVG sanitization lint fix and include related renderer/runtime refinements.
