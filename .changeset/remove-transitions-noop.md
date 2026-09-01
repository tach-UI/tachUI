---
'@tachui/core': patch
'@tachui/modifiers': patch
'@tachui/types': patch
---

Remove `.transitions()`, which never did anything (#297).

It was chainable, declared in the modifier types, and registered in the modifier registry — so calls resolved without error — but `AnimationModifier.apply` never read `props.transitions`. `Text('x').transitions({ opacity: { duration: 500 } })` left `element.style.transition` empty while the singular `.transition('opacity', 500, 'ease-in')` produced `opacity 500ms ease-in 0ms` on the same render.

Removing it turns a silent no-op into a compile error. No capability is lost: `.transition()` is the working API and there was never a defined shape for `.transitions()`'s config, which was typed `any`. If a multi-property form is wanted it should be designed and implemented, not inherited from a placeholder.
