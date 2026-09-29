---
'@tachui/types': patch
'@tachui/core': patch
'@tachui/primitives': patch
---

`.modifier` is no longer needed to apply a modifier.

`BasicInput`, `Toggle`, `ToggleWithLabel`, `Divider`, `Picker` and `BasicForm`,
along with `ToggleStyles`, `DividerUtils`, `PickerStyles` and `ImageUtils`, now
return `ModifiableComponentWithModifiers`, so modifiers chain on them directly
as they already did on the other primitives. `wrapComponent` returns the same
shape.

Registered factories chain by name on any component, and the new
`.applyModifier()` applies an instance from any factory, including one an
application registers itself:

```ts
BasicInput({ text, setText }).css({ display: 'block' }).ariaLabel('Name')

VStack({ children }).onHover(setHovered).applyModifier(glow('gold'))
```

`.modifier` keeps working as before.
