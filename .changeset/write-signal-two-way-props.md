---
"@tachui/core": minor
"@tachui/forms": patch
"@tachui/navigation": patch
---

Writing a value back through a two-way prop now says when it cannot.

A prop declared `T | Signal<T>` is written through the accessor it was given,
and only a `createSignal` accessor has anything to write to. A computed is a
`Signal` and has no setter, so `Stepper`'s value and `TabView`'s selection
moved their control and changed nothing — silently, which is the worst of the
available answers. Both now go through `writeSignal`, which writes where it
can, reports whether it landed, and explains itself in development where it
cannot.

This matters more now that a computed passes `isSignal` at all. The other
write-back sites in the navigation modifiers are deliberately left alone: they
fall through to a binding or a callback when the signal path does not take, so
nothing is silently dropped there.
