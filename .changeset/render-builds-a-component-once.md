---
'@tachui/core': patch
---

`renderComponent` builds a component once instead of on every render.

`build()` clones the base component, and the renderer was calling it inside
the render effect. So a component that renders from state it holds itself
destroyed that state on the very render the change caused: the effect re-ran,
built a fresh clone, rendered the clone's empty state, and disposed the
effects the previous instance opened in its constructor — the render effect
owns whatever runs inside it. The live DOM handlers still belonged to the
instance that had recorded the change, and nothing was left listening to it.

`BasicForm` is where this showed: `validateOnChange` collected errors, the
render effect woke because the validation summary reads them, and the rebuild
threw them away before `onValidationChange` could report them. Any component
holding its own signal state and rendering from it had the same hole.

Building once, before the effect, is what the code already meant by "a
ModifierBuilder that hasn't been built yet". Components without a `build()`
were never affected.
