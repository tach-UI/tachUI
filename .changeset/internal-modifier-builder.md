---
'@tachui/types': patch
'@tachui/core': patch
'@tachui/responsive': patch
---

`addModifier()` and `.modifier()` are no longer on the public
`ModifierBuilder` type. Both move to `InternalModifierBuilder`, an internal
interface in `@tachui/types` re-exported by `@tachui/core` for framework
packages. Autocomplete now offers only chain methods, and the public builder
no longer has a `void`-returning method that silently ends a chain.

Nothing changes at runtime: both methods still exist on the builder,
`.modifier()` still warns in development, and `addModifier()` stays silent.
Only code that calls them through the public type stops compiling.

Migration: chain the modifier directly.

```ts
// Before
Text('Hello').modifier.modifier(padding(16)).build()

// After
Text('Hello').padding(16)
```

`ResponsiveModifierBuilder` from `@tachui/responsive` no longer declares
`addModifier()` either; its responsive and breakpoint methods apply modifiers
exactly as before.
