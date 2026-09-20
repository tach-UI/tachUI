---
'@tachui/core': patch
---

A layout container builds each child once instead of on every render.

`VStack`, `HStack` and `ZStack` called `child.build()` inside their `render()`,
which the render effect re-runs. `build()` clones the base component, so a
child holding state of its own was replaced by a fresh clone whenever its
parent re-rendered for any reason — losing that state and disposing the
effects its constructor opened.

This is the same defect as the one fixed in `renderComponent`, one level down:
a stateful component was safe at the root of a mount and not inside a stack.
`ZStack` built its children twice per render besides, once to read layout
priority and once to render, so the instance it measured was never the
instance it drew.
