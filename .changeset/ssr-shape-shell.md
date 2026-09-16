---
'@tachui/primitives': patch
---

Shapes serialize as an `<svg>` shell instead of nothing.

A shape's geometry comes from measuring its frame, which no server can do, so
the server used to emit the wrapper alone and leave a hole until scripts ran.
Everything else about the element is known ahead of time, and is now emitted:
the `<svg>` with its sizing, `display: block`, `overflow: visible` and
`aria-hidden`, wrapping an empty `<path>`. The shape has its layout box in the
first paint, and only the path data arrives with the client.

The shell is described as an ordinary node rather than an owned one, so no DOM
shim is needed to serialize it — an owned node's element *is* its markup, and
needs a DOM to exist. Where a shim is present the owned path still runs and
emits the built element, which carries the same shell.

The `<path>` is left bare. Its fill and stroke would resolve server-side, but
with no `d` there is nothing for them to paint, so emitting them would run a
caller's signals and assets during serialization to no visible end.
