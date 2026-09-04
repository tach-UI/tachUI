/**
 * sRGB <-> OKLab / OKLCH conversion and sRGB gamut mapping.
 *
 * Björn Ottosson's OKLab constants. The ColorAsset numeric transforms run in
 * this space so a nominal amount means the same perceptual step on every hue,
 * while ColorAsset keeps emitting sRGB hex (#310).
 */

/** 8-bit sRGB channels, 0-255. */
export type RGBChannels = [red: number, green: number, blue: number]
/** OKLab: L in 0-1, a/b roughly -0.4..0.4. */
export type OklabColor = [lightness: number, a: number, b: number]
/** OKLCH: L in 0-1, chroma >= 0, hue in degrees 0-360. */
export type OklchColor = [lightness: number, chroma: number, hue: number]

// Linear channels this far outside 0..1 still count as in gamut: it absorbs
// the round-trip error of a color that is exactly on the boundary (a pure
// primary, black, white) so an identity transform maps it to itself.
const GAMUT_EPSILON = 1e-6
const GAMUT_SEARCH_STEPS = 24
// Nothing in sRGB exceeds C ~0.32; the search upper bound only has to clear it.
const CHROMA_SEARCH_CEILING = 0.5

function srgbToLinear(channel: number): number {
  const scaled = channel / 255
  return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4
}

function linearToSrgb(linear: number): number {
  const clamped = Math.min(1, Math.max(0, linear))
  const encoded =
    clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * clamped ** (1 / 2.4) - 0.055
  return encoded * 255
}

function normalizeHue(hue: number): number {
  return ((hue % 360) + 360) % 360
}

function oklabToLinearRgb(
  lightness: number,
  a: number,
  b: number
): [number, number, number] {
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s = (lightness - 0.0894841775 * a - 1.291485548 * b) ** 3
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ]
}

function isInGamut(linear: [number, number, number]): boolean {
  return linear.every(
    channel => channel >= -GAMUT_EPSILON && channel <= 1 + GAMUT_EPSILON
  )
}

function encodeLinearRgb(linear: [number, number, number]): RGBChannels {
  return [
    Math.round(linearToSrgb(linear[0])),
    Math.round(linearToSrgb(linear[1])),
    Math.round(linearToSrgb(linear[2])),
  ]
}

export function rgbToOklab(red: number, green: number, blue: number): OklabColor {
  const lr = srgbToLinear(red)
  const lg = srgbToLinear(green)
  const lb = srgbToLinear(blue)
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb)
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb)
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb)
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ]
}

export function oklabToOklch([lightness, a, b]: OklabColor): OklchColor {
  const chroma = Math.hypot(a, b)
  const hue = chroma === 0 ? 0 : normalizeHue((Math.atan2(b, a) * 180) / Math.PI)
  return [lightness, chroma, hue]
}

export function oklchToOklab([lightness, chroma, hue]: OklchColor): OklabColor {
  const radians = (hue * Math.PI) / 180
  return [lightness, chroma * Math.cos(radians), chroma * Math.sin(radians)]
}

/**
 * Largest chroma that stays inside sRGB at this lightness and hue. The sRGB
 * gamut is star-shaped around the neutral axis in OKLab, so a single binary
 * search along the chroma ray finds the boundary.
 */
export function maxChroma(lightness: number, hue: number): number {
  const clampedLightness = Math.min(1, Math.max(0, lightness))
  const inGamutAt = (chroma: number): boolean =>
    isInGamut(oklabToLinearRgb(...oklchToOklab([clampedLightness, chroma, hue])))

  if (inGamutAt(CHROMA_SEARCH_CEILING)) {
    return CHROMA_SEARCH_CEILING
  }

  let inside = 0
  let outside = CHROMA_SEARCH_CEILING
  for (let step = 0; step < GAMUT_SEARCH_STEPS; step += 1) {
    const midpoint = (inside + outside) / 2
    if (inGamutAt(midpoint)) {
      inside = midpoint
    } else {
      outside = midpoint
    }
  }
  return inside
}

/**
 * OKLCH -> 8-bit sRGB with gamut mapping: a color outside sRGB has its chroma
 * reduced at constant lightness and hue until it fits (the CSS Color 4
 * approach), rather than clipping channels, which would shift the hue.
 */
export function oklchToRgb(lightness: number, chroma: number, hue: number): RGBChannels {
  const clampedLightness = Math.min(1, Math.max(0, lightness))
  const clampedChroma = Math.max(0, chroma)
  const linear = oklabToLinearRgb(
    ...oklchToOklab([clampedLightness, clampedChroma, hue])
  )
  if (isInGamut(linear)) {
    return encodeLinearRgb(linear)
  }

  const fittedChroma = Math.min(clampedChroma, maxChroma(clampedLightness, hue))
  return encodeLinearRgb(
    oklabToLinearRgb(...oklchToOklab([clampedLightness, fittedChroma, hue]))
  )
}

export function oklabToRgb(lightness: number, a: number, b: number): RGBChannels {
  return oklchToRgb(...oklabToOklch([lightness, a, b]))
}
