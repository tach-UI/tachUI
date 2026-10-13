---
'@tachui/core': patch
'@tachui/data': patch
'@tachui/flow-control': patch
'@tachui/grid': patch
'@tachui/modifiers': patch
'@tachui/primitives': patch
'@tachui/responsive': patch
'@tachui/viewport': patch
---

The workspace compiler moves from TypeScript 5 to TypeScript 6 (`^6.0.3` in
the root and every workspace manifest). The eight packages that publish a
`typescript` peer range (`core`, `data`, `flow-control`, `grid`, `modifiers`,
`primitives`, `responsive`, `viewport`) raise its floor from `>=5.0.0` to
`>=6.0.0`; the peer stays optional. tsconfigs drop the options TypeScript 6
deprecates (`baseUrl`, `downlevelIteration`, `moduleResolution: node10`) and
name the Node types they use, since `types` now defaults to empty.

The release pipeline moves to the changesets v3 line in the same change:
`@changesets/cli` `^3.0.3`, `@changesets/changelog-github` `^1.0.1`, the config
schema at `@changesets/config@4.0.0`, and `changesets/action@v2` with its
renamed inputs. Release policy (fixed group, access, base branch, private
packages, ignores) is unchanged.
