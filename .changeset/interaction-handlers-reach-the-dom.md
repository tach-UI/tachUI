---
'@tachui/primitives': patch
'@tachui/forms': patch
---

`Toggle`, `Slider` and `BasicForm` respond to interaction again.

All three wired their DOM listeners from inside a `ref` callback on an
intrinsic element. The renderer has no `ref` support for intrinsic elements —
it treats the prop like any other and stringifies the function into a `ref`
attribute — so the callback never ran, no listener was ever attached, and the
components rendered correctly but were inert. `Toggle`'s `onToggle` never
fired for a click, a label click, a keyboard Space or a dispatched `change`;
`Slider`'s `onValueChange` never fired, so the value could not be dragged and
the track fill stayed at zero; `BasicForm` never saw `submit`, `change` or
`input`, so `onSubmit`, `validateOnSubmit` and `validateOnChange` all did
nothing. The stray `ref="(el) => {...}"` attribute is gone from the rendered
markup as well.

Each component now declares its handlers in element props the way
`BasicInput` and `Picker` already do. Two pieces of state that the ref
callback existed to capture went with it:

`Slider`'s track fill is a style rather than an imperative write —
`--slider-progress` is derived from the current value on every render, so it
follows the binding the way the thumb does. The drag-tracking signal that
guarded the old write is gone with the write it guarded; the input is
controlled by `value`, and a value written back mid-drag is the value the
handler just reported.

`BasicForm` resolves its form element from the event that reaches a handler,
which is what `FormData` and the validation sweep read.

`Toggle` also puts its hidden checkbox back in step with `isOn` after a
change. The browser flips that checkbox before the handler runs, so a toggle
whose binding is constant, or whose `onToggle` declines the change, used to
submit as checked while the track read off.
