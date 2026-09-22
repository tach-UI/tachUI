---
'@tachui/types': patch
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/navigation': patch
'@tachui/grid': patch
'@tachui/responsive': patch
'@tachui/viewport': patch
'@tachui/mobile': patch
'@tachui/forms': patch
'@tachui/fragments': patch
---

Chain methods are now type-checked. `ModifierBuilder` ended in
`[key: string]: any`, so every chain call typechecked as `any`, including a
misspelled method, wrong arguments, or a modifier no package had typed. That
fallback is gone.

A method is now typed if core declares it or if the package that registers it
adds it. Each registering module adds its modifiers to `ModifierBuilder` by
augmenting `@tachui/types/modifiers`, with signatures derived from the
registered factories through the new `ModifierMethodsOf` and
`ModifierFactoriesOf` helpers. A method is therefore typed exactly when
importing its package registers it, and its parameters can't drift from its
factory. About 150 registered modifiers had no declaration anywhere, including
the aria helpers, `role`, most padding and margin sides, the touch handlers,
and the whole effects set. They are all typed now. The separate
`ModifierBuilder` that `@tachui/modifiers/types` declared is replaced by a
re-export of the one interface.

A chain on a component returns that component, as the runtime does, so a
modified component can be a child: `VStack({ children: [Text('a').padding(4)] })`.
A chain on `.modifier` returns the builder until `.build()`.

Typing them exposed some runtime bugs:

- `margin(signal)` treated the signal as its options object and set no margin.
  It now follows the signal, as `padding(signal)` does.
- Navigation's tab views, stacks, links and split view called basic modifiers
  without loading them, so they only worked if the app had. They now import
  `@tachui/modifiers/preload/basic`.

Typing also required two small changes in navigation. A tab view now
normalizes a tab button's render result to an array before mapping it, as the
declared return type requires. The split view now passes `'none'` for an
unset `maxWidth` rather than `undefined`, which the size modifier skipped. That
renders the same unless a stylesheet also sets the detail column's
`max-width`.

Navigation's own builder augmentation targeted `@tachui/core`, which re-exports
the interface through `export *`, a path augmentation cannot reach. It now
targets `@tachui/types/modifiers`. Grid, responsive, viewport, mobile, forms,
fragments and navigation now depend on `@tachui/types` directly, because their
published declarations reference it.

The size modifiers (`width`, `height`, `minWidth`, `maxWidth`, `minHeight`,
`maxHeight`) and the `padding` and `margin` families accept a signal in their
types, as they already did at runtime.
