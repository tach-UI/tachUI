---
'@tachui/cli': patch
---

The `tachui init` starter templates scaffold `typescript: ^6.0.3`, matching
the workspace compiler. The previous `^5.8.0` pin no longer installs: eight
published packages peer-depend on `typescript >= 6.0.0` (optional), so a
fresh scaffold failed dependency resolution (npm ERESOLVE) — which is what
blocked the 0.12.0 publish in the release smoke test.
