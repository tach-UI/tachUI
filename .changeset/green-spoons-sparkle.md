---
'@tachui/core': patch
'@tachui/types': patch
'@tachui/registry': patch
'@tachui/modifiers': patch
'@tachui/primitives': patch
'@tachui/responsive': patch
'@tachui/forms': patch
'@tachui/navigation': patch
'@tachui/mobile': patch
'@tachui/symbols': patch
---

Correct the internal release line back to `0.8.x` and prevent cross-line drift in future releases.

This fixes package metadata so internal `@tachui/*` dependencies and peer ranges no longer point at unpublished `0.9.0` or `1.0.0` artifacts, and adds release guards that fail CI when publishable packages diverge across release lines or packed manifests reference unpublished internal versions.
