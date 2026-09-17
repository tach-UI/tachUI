---
'@tachui/modifiers': patch
---

The server overlay keeps a content node's declared style whatever shape it is
in.

Placing two or more overlay items in the layer's one cell spread
`props.style` as though it were always an object. It is not: the serializer
and the client renderer both accept a CSS string or a signal of either, and
core ships string-styled nodes. Spreading a string enumerated its character
indices and spreading a signal enumerated its own properties, so the
declaration was replaced with garbage:

```html
<span style="0:c;1:o;2:l;3:o;4:r;5::;6:r;7:e;8:d;grid-area:1 / 1">
```

A string style is now kept and the placement appended to it, and a signal is
resolved with the same untracked read the rest of the path uses. The
`display: contents` shell check reads the declared style the same way, so a
shell styled with a string is recognised — missing it left the items unlayered
on the server while the client, reading `display` off the applied element,
still descended into them.
