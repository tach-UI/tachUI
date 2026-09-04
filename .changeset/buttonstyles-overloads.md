---
'@tachui/primitives': patch
---

Reject `ButtonStyles.*` calls that pass a props object and a third argument.

`ButtonStyles.Filled('a', { css: 'x' }, { disabled: true })` type-checked, then discarded `{ disabled: true }` at runtime with no error and no warning. The helpers were single signatures — `(title, actionOrProps?, props?)` — admitting both an object second and a third argument, while the implementation branched on `typeof actionOrProps === 'function'`, took the object path, and forwarded only the second. `Button` itself already rejected the same call, being overloaded.

Every helper — `Filled`, `Outlined`, `Plain`, `Bordered`, `Destructive`, `Cancel` — now carries the same two overloads `Button` has: the action form takes `(title, action?, props?)`, the props form takes `(title, props?)` and no third argument. That call now fails to compile rather than losing props. All documented forms still resolve, including `helper(title, undefined, props)`, and the helpers remain assignable to their previous three-argument shape.

Note the `Omit` in these signatures documents which prop each helper owns without enforcing it: `ButtonProps` inherits `[key: string]: any` from `ComponentProps`, so the index signature still admits the key `Omit` removed, and `ButtonStyles.Filled('a', { variant: 'plain' })` compiles. The helper's own value wins at runtime, so the button is still filled.
