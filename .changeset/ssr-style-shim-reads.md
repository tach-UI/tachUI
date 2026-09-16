---
'@tachui/ssr': patch
---

The server-render style stand-in answers reads, not only writes.

`createSSRVirtualElement` collected every style a modifier wrote but reported
nothing for any read, so a modifier that asks what a property already is saw an
unset value however the node declared itself. `overlay()` asks exactly that
before making its host a positioned container, so a host that positioned itself
— every `ZStack` child does — had `position: relative` appended on the server
and won the cascade:

```html
<span style="position:absolute;position:relative;top:0;left:0;right:0;bottom:0">
```

The child dropped out of the stack in static markup, its offsets became
no-ops, and it snapped back when the client re-rendered.

Reads now serve the collected styles, reporting the empty string for a property
that was never set, as CSSOM does, and matching kebab- and camel-case spellings
so a `setProperty` write reads back through either. This fixes reads for every
modifier, not only `overlay`.
