---
'@tachui/core': patch
---

The component proxy hands back itself when an instance method returns its
instance.

A builder-style method (`return this`, as shape methods such as `fill` and
`stroke` use) returned the raw component, which stranded every modifier
applied so far on the proxy's wrapper: `Circle().frame(…).stroke(…)` rendered
a bare circle with no frame. The proxy already re-wrapped `clone()`'s result;
it now does the same for any method whose result is the instance, so the
chain continues from it in either order.
