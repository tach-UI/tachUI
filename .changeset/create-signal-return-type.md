---
"@tachui/core": patch
---

`createSignal` declares the accessor it actually returns. It has always built
`(() => T) & { peek: () => T }` — precisely `Signal<T>` — and then declared
`[() => T, SignalSetter<T>]`, throwing the `peek` away. Since `Signal<T>` is
defined by that `peek`, no prop typed `Signal<T>` would accept a signal:

```ts
const [isPresented] = createSignal(false)
Alert({ isPresented, title: 'x', buttons: [] })
// Type '() => boolean' is not assignable to type 'Signal<boolean>'.
```

Around 206 prop declarations across the packages are typed that way, so this is
the ordinary route to them. `createComputed` next door declares `Signal<T>`
correctly, with a comment saying the accessor already is one — two functions
building the same shape, one describing it and one not.

Widening is safe in the direction it moves: `Signal<T>` is assignable everywhere
`() => T` was, so callers receive more and may still do everything they did.
Verified across the monorepo — build, `type-check`, `test:types` and `test:ci`
all clean, with no call site changed. `signal-list.ts` drops the assertion it
carried to recover what the accessor always had.

Fixes #372.
