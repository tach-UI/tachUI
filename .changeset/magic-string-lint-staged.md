---
'@tachui/devtools': patch
---

`@tachui/devtools` moves `magic-string` from ^0.30.0 to ^1.4.3; the import
optimizer's Vite plugin rewrites import sources and emits its source map as
before. The repository's lint-staged pre-commit tool moves from ^15 to ^17
(not published).
