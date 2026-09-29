---
'@tachui/types': patch
'@tachui/core': patch
---

The modifier builder declares `.onHover(cb)` next to `.onTap()`, so hover
chains on `.modifier` like tap does and no longer needs the internal
`.modifier()` hatch. It applies the `onHover` modifier registered by
`@tachui/modifiers`, calling back with `true` on `mouseenter` and `false` on
`mouseleave`.

```ts
Button('Save')
  .modifier.onHover(hovered => setHovered(hovered))
  .onTap(save)
  .build()
```

The `onHover` factory from `@tachui/modifiers` is unchanged.
