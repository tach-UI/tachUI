---
'@tachui/primitives': patch
---

`Button` now accepts props as its second argument, matching every other primitive (#266).

`Button(title, props)` previously landed the whole props object in the `action` parameter, so everything on it — `css` included — was dropped at runtime with no signal. `Image(src, props)`, `Toggle(isOn, props)` and `Text(content, props)` all take props second, so this was the natural call to write and the only primitive that punished it.

Both forms now work, on `Button` and on all six `ButtonStyles` variants:

```ts
Button('Go', () => {}, { css: 'my-class' })   // action second, props third
Button('Go', { css: 'my-class', action })     // props second
```

Purely additive — existing three-argument calls, including `Button(title, undefined, props)`, are unchanged.
