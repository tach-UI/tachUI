---
'@tachui/core': patch
'@tachui/types': patch
'@tachui/modifiers': patch
'@tachui/ssr': patch
---

Add a gradient `interpolation` option and emit an sRGB fallback pair for it.

`GradientColors` gains `interpolation?: 'srgb' | 'oklab' | 'oklch'`, emitted as an `in <space>` hint (`linear-gradient(in oklab to right, …)`). A browser that cannot parse the hint drops the whole declaration and the element gets no background at all, so anything other than `'srgb'` is written as a pair: the plain sRGB gradient first, the hinted one second. CSSOM rejects a value it cannot parse as a no-op, so the browser keeps whichever it understood.

- `gradientToDeclarations(def)` returns that pair (length 1 for `'srgb'`); `gradientToCSS` keeps returning the single preferred string.
- `GradientAsset`, `StateGradientAsset` and `ReactiveGradientAsset` gain `resolveDeclarations()`; `resolve()` is unchanged. The reactive option types accept `interpolation` too.
- The background modifier writes every declaration in order at all three of its paths (static value, theme-reactive asset, stateful hover/active/focus/disabled), preferring `resolveDeclarations()` on an asset when present.
- The SSR style shim appends repeated writes to a property instead of overwriting, and the serializer emits one entry per write, so `renderToString` output carries the same pair in one `style` attribute. A property genuinely overridden by a later modifier now emits both values; the cascade keeps the last, as it does on the client.
- `CSSUtils.withFallback` emits the solid color, then the sRGB gradient, then the hinted one. `CSSUtils.toCustomProperties` always emits the sRGB form: a custom property cannot carry the pair, because an unsupported gradient only fails at `var()` substitution, where the using declaration becomes `unset` rather than falling back.
- A stateful background (`{ default, hover, … }`) rendered where there is no DOM element to attach listeners to, such as `renderToString`, now emits its resting `default` state. Previously the modifier threw a `ReferenceError` on the bare `HTMLElement` check under Node.

The default interpolation is unchanged in this release step.
