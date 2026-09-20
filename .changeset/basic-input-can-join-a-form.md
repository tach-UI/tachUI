---
'@tachui/primitives': patch
---

`BasicInput` takes `name` and `required`, so it can take part in a form.

Neither existed. A form reads its fields through `FormData`, which skips
anything unnamed, so `BasicForm` submitted `{}` for a form built out of
`BasicInput` controls no matter what was typed into them — and with no
`required` to check, the validation sweep had nothing to find, so
`validateOnSubmit` passed every empty form and `validateOnChange` never
reported an error. Only a raw `<input>` dropped into the form worked.

`name` is a plain string, since it is the field's identity rather than its
state. `required` takes a signal the way `disabled` and `readonly` do. The
native `required` attribute already tells assistive technology what
`aria-required` would, so it is not duplicated.
