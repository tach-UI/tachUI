---
'@tachui/core': patch
---

Run the `ColorAsset` numeric transforms in OKLab / OKLCH.

`brighten`, `saturate`, `contrast` and `rotateHue` used to lerp gamma-encoded sRGB channels or round-trip through HSL, neither of which is perceptually uniform: the same nominal `brighten(0.3)` produced a 5x larger lightness step on maroon than on yellow, `rotateHue` swung OKLab lightness by 0.25 across a full wheel, and `saturate(-1)` turned yellow into a mid-gray far darker than the input. They now convert to OKLab, operate on L (brightness, contrast), C (saturation) or H (hue), and convert back. A result outside the sRGB gamut has its chroma reduced at constant lightness and hue rather than having channels clipped, so hue never drifts.

Output format is unchanged (uppercase hex, or `rgba()` when alpha is present) and the anchors hold: `brighten(1)` / `brighten(-1)` reach white / black, `saturate(-1)` is the gray of the same lightness, `saturate(1)` is the most chromatic sRGB color at that lightness and hue, and `rotateHue(360)` and every zero-amount call are exact identities. The numeric result of every non-trivial call changes, so snapshots pinned to the old outputs need re-recording. Two anchors move: `contrast(-1)` now collapses to OKLab mid-gray `#636363` instead of `#808080`, and `saturate(1)` no longer jumps to the HSL-saturated (much lighter) color.

Accepted-but-untransformable values (`var()`, `oklch()`, `color()`, and so on) still pass through unchanged.
