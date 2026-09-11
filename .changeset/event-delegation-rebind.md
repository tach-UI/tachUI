---
"@tachui/core": patch
---

Re-registering an event handler on an element that has only that one handler no
longer loses it.

`register` unregisters the previous handler first, and `unregister` drops an
element's handler map from its `WeakMap` as soon as that map empties — but
`register` went on writing the new handler into the local reference it already
held, which is no longer the map dispatch reads. The handler was filed where
nothing would look for it, while the handler count still went up and the root
listener stayed live: an element with a healthy-looking registration of one and
nothing to call. Any re-render that re-registers a single-handler element hit
it.
