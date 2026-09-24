---
'@tachui/modifiers': patch
'@tachui/types': patch
---

`.offset(x, y)` typechecks with a numeric signal on either axis.

The runtime already followed a signal, and the factory's own example showed
one, but the factory, `OffsetOptions` and the layout `offset` prop were typed
for numbers only, so `Text('x').offset(xSignal, 0)` needed a cast. Each now
takes `number | Signal<number>`. Strings and non-numeric signals are still
rejected, and the `offset(x, y)` factory in `effects/transforms` is unchanged.
