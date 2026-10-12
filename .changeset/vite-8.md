---
'@tachui/query': patch
'@tachui/modifiers': patch
'@tachui/symbols': patch
'@tachui/data': patch
'@tachui/viewport': patch
---

Packages now build with Vite 8 (Rolldown), esbuild ^0.28.2 and
vite-plugin-dts ^5.1.2. Entry points, exports and declaration paths are
unchanged; internal chunk files are laid out differently.

- `@tachui/query`: `isDevelopment()` reads `NODE_ENV` through a local, so the
  built code keeps treating a `process` with no `env` as development. Vite 8
  rewrote `process.env?.NODE_ENV` to a non-optional read.
- `@tachui/data` and `@tachui/viewport`: shared chunks get hashed names, so no
  chunk named `list.js` or `modifiers.js` hides the `list/` or `modifiers/`
  declarations from TypeScript.
- `@tachui/modifiers`: the basic-modifiers chunk is declared in the form
  Rolldown accepts; each effect family stays in its own entry file.
- `@tachui/symbols`: declarations stay beside the built entries rather than
  under `dist/src/`.
