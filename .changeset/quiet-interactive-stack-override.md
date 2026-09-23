---
'@tachui/core': patch
---

A layout stack with an interactive `element` override, such as
`HStack({ element: 'button' })` or `VStack({ element: 'a', href })`, no longer
warns.

The override is documented and renders correctly, but every construction logged
`Interactive tag 'button' on layout component 'HStack' may cause unexpected
behavior`, and validation returned a matching warning. The tag alone was the
only trigger, so both are gone. Warnings for invalid tags, heading and form tags,
and problematic overrides on `Button` and `Link` are unchanged.
