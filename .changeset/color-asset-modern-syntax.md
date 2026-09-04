---
'@tachui/core': patch
'@tachui/types': patch
---

Accept CSS Color 4 syntax in `ColorAsset.validateColor` and gradient stop validation.

`oklch()`, `oklab()`, `lab()`, `lch()`, `hwb()`, `color()` and the space-separated / slash-alpha forms of `rgb()` and `hsl()` no longer throw from the `ColorAsset` constructor. The legacy comma forms keep their range checks; the new forms are validated structurally and left to the browser. `ColorValidationResult.format` gains the corresponding values.

Values the numeric transforms cannot convert to sRGB pass through `brighten`, `saturate`, `contrast` and `rotateHue` unchanged, as `var()` tokens already did, so widening validation does not change any transform output. `GradientValidation.validateColor` defers to the same validator so the new syntax is accepted as a gradient stop too.
