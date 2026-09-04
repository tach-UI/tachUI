---
'@tachui/core': patch
'@tachui/types': patch
---

Accept CSS Color 4 syntax in `ColorAsset.validateColor` and gradient stop validation.

`oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated / slash-alpha forms of `rgb()` and `hsl()` no longer throw from the `ColorAsset` constructor. The legacy comma forms keep their range checks; the new forms are validated against a per-function grammar (angle units only in a hue slot: first in `hsl()`/`hwb()`, last in `lch()`/`oklch()`, never in `rgb()`, `lab()`, `oklab()` or `color()`) and otherwise left to the browser. `ColorValidationResult.format` gains the corresponding values.

The space-separated `rgb()` / `hsl()` forms are also parsed by the transforms and by `opacity()`, so `rgb(255 0 0 / 50%)` brightens, saturates, rotates and re-alphas exactly like `rgba(255, 0, 0, 0.5)`; `none` channels compute as 0, percentage channels and `deg` / `grad` / `rad` / `turn` hues are converted, and out-of-range channels clamp. Values the transforms cannot convert to sRGB (`oklch()`, `color()`, `var()`, …) pass through unchanged, as `var()` tokens already did. `GradientValidation.validateColor` defers to the same validator so the new syntax is accepted as a gradient stop too.
