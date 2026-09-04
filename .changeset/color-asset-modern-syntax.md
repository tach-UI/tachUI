---
'@tachui/core': patch
'@tachui/types': patch
---

Accept CSS Color 4 syntax in `ColorAsset.validateColor` and gradient stop validation.

`oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated / slash-alpha forms of `rgb()` and `hsl()` no longer throw from the `ColorAsset` constructor. The legacy comma forms keep their range checks; the new forms are validated against a per-function grammar (angle units only in a hue slot: first in `hsl()`/`hwb()`, last in `lch()`/`oklch()`, never in `rgb()`, `lab()`, `oklab()` or `color()`) and otherwise left to the browser. `ColorValidationResult.format` gains the corresponding values.

The space-separated `rgb()` / `hsl()` forms are also parsed by the transforms and by `opacity()`, so `rgb(255 0 0 / 50%)` brightens, saturates, rotates and re-alphas exactly like `rgba(255, 0, 0, 0.5)`; `none` channels (alpha included) compute as 0 per CSS Color 4 §4.4, percentage channels and `deg` / `grad` / `rad` / `turn` hues are converted, a bare S or L number reads as a percentage per §7.1, and out-of-range rgb channels clamp. `opacity()` on a modern `hsl()` emits the modern form (`hsl(359.9 33.33% 50% / 0.5)`) so fractional and out-of-range hues survive revalidation. Values the transforms cannot convert to sRGB (`oklch()`, `color()`, `var()`, …) pass through unchanged, as `var()` tokens already did. `GradientValidation.validateColor` defers to the same validator so the new syntax is accepted as a gradient stop too.
