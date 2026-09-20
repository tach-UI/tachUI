---
'@tachui/core': patch
---

A layout child keeps the effects it was built with, and a mount releases them
when it unmounts.

Building each child once was only half of it. The first build still happened
inside the container's render, and a render pass disposes everything it owns
the moment it runs again — so the effects a child opened in its constructor
were torn down by the next render of its parent, while the cached child
instance carried on. That is a silent failure: the child keeps rendering and
quietly stops reacting. A `BasicForm` inside a `VStack` lost
`onValidationChange` as soon as anything else in the stack changed.

Children are now built under the owner the container itself was created in —
the mount's root, normally, since the instance the renderer draws is the
clone `build()` makes inside it. They live exactly as long as the mount.

`renderComponent`'s unmount now disposes that root too. It only disposed the
render effect, so the effects the built component opened in its constructor
went on running against detached DOM.
