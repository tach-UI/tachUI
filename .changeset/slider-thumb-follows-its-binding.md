---
'@tachui/forms': patch
---

`Slider`'s thumb and track fill no longer disagree.

The fill is drawn from `value` on every render, but the browser moves the
thumb on its own before the handler runs. With a plain-number `value`, or an
`onValueChange` that does not write the value back, nothing re-renders — so
the thumb sat where the pointer dropped it while the fill stayed where the
binding was. Dragging from 10 to 42 left the thumb at 42 and the track drawn
at 10%.

The thumb is now put back on whatever the value says once the handler has
run, which is what `Toggle` does with its hidden checkbox. Unchanged when
`onValueChange` wrote the reported value straight through; snapped to the step
when it rounded, without waiting for the render; and back where it started
when the binding cannot follow. The slider is controlled by `value` in fact
and not just in intent.
