---
'@tachui/core': patch
---

Default gradient interpolation to OKLab. **This changes how existing gradients render.**

Every gradient built from `LinearGradient`, `RadialGradient`, `AngularGradient`, `ConicGradient`, the repeating and elliptical variants, gradient presets and the reactive / state / theme gradient assets now interpolates `in oklab` unless it sets `interpolation` itself. The legacy sRGB default routes hue-distant stops through a desaturated gray midpoint; OKLab takes the perceptually straight path and, unlike OKLCH, never introduces a hue neither stop has.

The rendered pixels move. The shift scales with how far apart the endpoints are in hue: a same-hue-family gradient is unchanged to within one 8-bit step, a teal → sand pair moves by up to 21 per channel at the midpoint. A gradient that is the visual spec of a design system should get a visual-regression pass, or pin `interpolation: 'srgb'` per gradient to keep its previous rendering exactly. No error, warning or deprecation is emitted for the change.

Because the default is no longer `'srgb'`, every gradient now emits the sRGB fallback declaration ahead of the hinted one at each emission site, so browsers without OKLab gradient support (before Chrome 111, Firefox 113 and Safari 16.2) keep rendering the sRGB gradient. Server-rendered output carries the same pair.

`gradientToCSS` now returns the hinted string for an unhinted definition. `CSSUtils.toCustomProperties` is the one helper that stays sRGB-only: a custom property cannot carry a fallback past `var()` substitution.
