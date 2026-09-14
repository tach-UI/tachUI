---
"@tachui/core": patch
"@tachui/grid": patch
"@tachui/viewport": patch
"@tachui/eslint-plugin": patch
"@tachui/mobile": patch
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

`@tachui/eslint-plugin@0.11.0` published with no code in it — `package.json` and
`README.md`, nothing else. It has a build script and is not private, but it was
absent from `build:packages`, and the release workflow builds by running exactly
that. With no `prepack` hook either, `changeset publish` packed a directory that
had never been written. Installing it got you an empty package. It joins the
build chain.

That is also why `ci:check-declared-types` runs in the build job: checked
against a stale local `dist` it passes, which is how this went unnoticed here
before CI ran it on a clean tree.

Every entry point the packages advertise now exists. `@tachui/mobile`'s main
entry pointed at `dist/index.js` while vite, given a bare entry, named the
output after the package — `dist/mobile.js`. Its types resolved and importing
the package did not. `@tachui/grid`'s `./components` and `./modifiers`, and
`@tachui/viewport`'s `./modifiers`, were advertised with nothing building them;
grid needed the index files written as well. `@tachui/core` listed six subpaths
whose JavaScript was never built — the declarations existed because tsc walks
the whole tree, so they type-checked and then failed to resolve. Four of those
are build-plugin and type-generator entries importing `node:` builtins, which
rollup could not resolve until they were externalised; they are Node-side
tooling, not browser code.

`@tachui/core`'s `./viewport` subpath is removed rather than repaired. It has no
source behind it at all: viewport moved to `@tachui/viewport`, and the export
was left behind pointing at nothing.

`ci:check-declared-types` now checks `import`, `types`, `require` and `default`
on every exports entry rather than declarations alone — 258 entry points. The
known-gaps list it carried is gone, because the gaps are.

`@tachui/eslint-plugin` needed a second repair. Putting it in the build chain
got it to publish a `dist`; the entry still threw `ERR_MODULE_NOT_FOUND` on
load, because `"type": "module"` requires extensioned relative specifiers and
the source imported `./rules/prefer-direct-modifiers`. It went from publishing
nothing to publishing something unusable, and every existence check passed
throughout. `ci:check-entry-imports` now loads what the manifests advertise.
