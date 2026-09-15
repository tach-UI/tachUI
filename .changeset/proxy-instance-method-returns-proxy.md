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

The wrapper keeps the method's declared `length` and `name`, which `bind`
preserved and an arrow does not, so anything reading a method's arity is
unaffected. The one deliberate difference is that a method returning its own
instance now yields the proxy, which is not `===` the instance.
