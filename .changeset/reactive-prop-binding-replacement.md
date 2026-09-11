---
"@tachui/core": patch
---

A reactive prop re-applied by a re-render now replaces its previous binding
instead of stacking on it.

The renderer creates an effect for a prop whose value is a signal, and
registers the disposal as one more cleanup on the element. A re-render
re-applies the props and creates another, so the registration only ever grew:
the render owner disposed the superseded *effect*, but the closure holding it
stayed on the element until unmount, and with it that effect, whatever it
subscribed to, and — where a component is rebuilt on each render — that
component and its props.

A long-lived element that re-renders often therefore accumulated every
generation it had ever had. Measured over seven renders of a button with a
reactive `disabled`: seven retained before, one after, that one being the
generation currently on screen.

Bindings are now keyed by element and prop, so installing one disposes and
discards the one it supersedes. That also matters where nothing else would have
disposed it: on a render path with no owner, the old effect stayed live and
both wrote to the same prop.
