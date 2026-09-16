---
'@tachui/primitives': patch
---

`Circle()` has a usable type again for TypeScript consumers.

The component held its measured rect in a private field named `frame`, which
collides with the public `frame()` modifier on the surface the shape's type is
intersected with. TypeScript reduces an intersection to `never` when a private
member meets a public one of the same name, so a consumer's `Circle()` had no
usable type at all and even `Circle().fill('red')` failed to compile. Nothing
inside the package saw it, because the collapse only happens where the two
halves are intersected.

The field is renamed, and a type test now asserts the public surface is
neither `never` nor `any`. The `@tachui/primitives/shapes` subpath is mapped
in the type-test config, without which such a test resolves to `any` and
passes having checked nothing.
