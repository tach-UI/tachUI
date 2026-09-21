---
'@tachui/primitives': patch
---

`Link` merges the `css` prop into the rendered anchor.

`Link` accepted `css` and type-checked, and the `<a>` came out with no `class`
attribute at all — the prop went nowhere. `Text` and `Button` have merged the
same prop for a while; `EnhancedLinkComponent` was the one render path that
never picked up `ComponentWithCSSClasses`.

The anchor now carries `tachui-link` plus whatever `css` asks for, static,
array or reactive, the way the other primitives do. Anything styling a link by
its tag or its position is unaffected; the new base class only adds a hook
that was not there before.

Classes matter here in a way modifiers cannot cover: a stylesheet `:hover`
rule loses to an inline style, so a class is the only way to reach one.
