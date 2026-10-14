---
'@tachui/cli': patch
---

The `tachui init` starter templates track the workspace toolchain:
`typescript: ^6.0.3` and `vite: ^8.3.4`.

The previous `typescript: ^5.8.0` pin no longer installs: eight
published packages peer-depend on `typescript >= 6.0.0` (optional), so a
fresh scaffold failed dependency resolution (npm ERESOLVE) — which is what
blocked the 0.12.0 publish in the release smoke test.
