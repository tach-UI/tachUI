---
"@tachui/core": patch
"@tachui/grid": patch
"@tachui/viewport": patch
---

`@tachui/grid` and `@tachui/viewport` shipped 0.11.0 with no type declarations
at all, while their manifests pointed at `dist/index.d.ts`. Grid's build never
ran `tsc`; viewport's did, but inherited `noEmit: true` from the root config,
which wins over `emitDeclarationOnly`, so it produced a `.tsbuildinfo` and
nothing else. Both then hit a second fault: the incremental state sat at the
package root, where the build script's `rm -rf dist` could not reach it, so a
clean rebuild believed the declarations were current and emitted nothing —
silently, with exit code 0. The state now lives in `dist`, and viewport gets an
explicit `rootDir` so the output lands where the manifest says.

`@tachui/core`'s `./minimal`, `./common`, `./essential` and `./minimal-prod`
subpaths advertised `dist/<name>.d.ts`. Those bundles are built from
`src/bundles/`, so their declarations are at `dist/bundles/<name>.d.ts` — the
JavaScript resolved and the types never did.

`ci:check-declared-types` now fails a build where a publishable package
advertises declarations it did not produce. Three entry points are recorded as
known gaps rather than hidden: `@tachui/core`'s `./viewport` and
`@tachui/grid`'s `./components` and `./modifiers` have no build output at all,
which is a build fix rather than a manifest fix.
