---
"@tachui/core": patch
---

A prop that stops being reactive now releases the binding it had.

No observable failure was found from leaving it — every path that makes a prop
static again is a re-render, and the render owner disposes the old effect as it
re-runs — so this is hygiene rather than a fix: what it prevents is a map entry
holding a dead closure until the element unmounts. Recorded as such so the next
reader does not go looking for the bug it guards against.
