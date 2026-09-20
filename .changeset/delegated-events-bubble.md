---
'@tachui/core': patch
---

A delegated event reaches every handler between the target and the container,
not just the innermost one.

`EventDelegator` walks up from the event target looking for registered
handlers, and it returned at the first one it found — so a handler on an
ancestor never ran if anything nearer the target listened for the same event
type. The comment beside the `return` claimed the opposite of what the code
did.

This is how a form loses its own fields. `BasicForm` listens for `input` and
`change` to drive `validateOnChange`; any TachUI control inside it —
`BasicInput`, `Slider`, `Toggle` — registers a handler for the same event,
and the form never heard from it. Validation worked for a raw `<input>` and
for nothing the framework builds.

The walk now carries on to the container, innermost handler first, which is
the bubbling it stands in for. A handler ends it the same way it would end
real bubbling, by calling `stopPropagation()`. Siblings are unaffected: only
ancestors of the target are on the path.
