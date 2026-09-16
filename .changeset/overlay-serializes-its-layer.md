---
'@tachui/modifiers': patch
---

`overlay()` serializes its layer and content server-side.

The overlay built its layer as DOM, so on a server it emitted nothing at all —
for every content form, not just components. Static markup carried the host
with no overlay, and the overlay appeared only once scripts ran.

With no DOM to build into, the modifier now describes the layer as nodes
instead: the host is marked a positioned container, and the layer, its
alignment and offset styles, and the content are appended as children. The
base styles and the alignment/offset resolution are shared with the DOM path
rather than restated, so the two cannot disagree about placement, writing
direction or an offset — a disagreement would show as the overlay jumping when
the client takes over. Multiple items still share the layer's one grid cell,
descending through a `display: contents` shell as the DOM walk does.

What the server path leaves out: the content observer, which watches for items
appearing later and has nothing to watch here, and the mount bookkeeping,
which exists to tear DOM down. A raw DOM element as content describes as
nothing, since there is no DOM server-side to describe.
