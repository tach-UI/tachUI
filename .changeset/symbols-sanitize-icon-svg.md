---
'@tachui/symbols': patch
---

Harden icon rendering against untrusted icon definitions (#218): icon SVG bodies are now routed through the framework's `sanitizeSVG` allowlist sanitizer before any `innerHTML` sink (inline-SVG rendering, the sprite-sheet symbol insertion, and the `Symbol` component — which now builds its wrapper `<svg>` via `createElementNS`/`setAttribute` so interpolated attribute values are escaped by the DOM), with per-definition memoization so repeated renders stay flat. Malicious `viewBox` values fall back to the standard `0 0 24 24`, and pluggable icon-set names/variants plus user colors are attribute-escaped in the string render paths. Also declares the existing runtime dependency on `@tachui/core`.
