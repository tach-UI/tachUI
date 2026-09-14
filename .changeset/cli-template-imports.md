---
"@tachui/cli": patch
---

The scaffolded starter apps crashed on first render. Both templates imported
`Text` from `@tachui/core` and called `Layout.VStack(...)`, and neither exists:
components live in `@tachui/primitives`, and core's `Layout` is the constants
export — `fullWidthButton`, `sidebar`, `header`, `content`, `card`, `overlay`.
Every project created by `tacho init` on 0.11.0 threw `Text is not a function`
the moment it mounted.

`release:smoke` scaffolded a project and ran `npm run build` on it, and passed
every time. Vite builds with esbuild, which strips types without checking them,
and a build never executes `App()` — so the check proved the package graph
resolved and the bundle emitted, and nothing about whether the app runs. It now
runs the generated project's own `typecheck` script first, which reports both
errors precisely; verified by putting the broken template back and watching it
fail.

Two more faults the templates carried. `.padding(10, 14)` silently dropped its
second argument — `padding` takes one value or an object, so every one of those
rendered `10px` on all four sides instead of the `10px 14px` intended; they are
objects now. And `App()` ended on a modifier chain, which yields a
`ModifierBuilder` rather than the `ComponentInstance` `mountRoot` accepts, so
the generated project had never type-checked at all. The chains close with
`.build()`.

The templates are also rendered in a real test now, mounted and clicked, since
neither type-checking nor building would have caught a template that compiles
and then throws. Their bodies have to be copied into that test — a test module
cannot import a `.ts.template` — so `ci:check-template-apps` keeps the copies in
step and fails the build when they drift.
