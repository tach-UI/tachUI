import type { Asset } from '../assets/types'
import type {
  GradientDefinition,
  GradientColors,
  GradientInterpolation,
  LinearGradientOptions,
  RadialGradientOptions,
  AngularGradientOptions,
  ConicGradientOptions,
  RepeatingLinearGradientOptions,
  RepeatingRadialGradientOptions,
  EllipticalGradientOptions,
  GradientStartPoint,
  GradientCenter
} from './types'

/**
 * Interpolation space used when a gradient definition does not set
 * `interpolation`.
 *
 * `'oklab'` (#310): the legacy sRGB default routes hue-distant stops through
 * a desaturated gray midpoint; OKLab takes the perceptually straight path and,
 * unlike OKLCH, never introduces a hue neither stop has. Because this is not
 * `'srgb'`, every gradient emits a fallback pair (see `gradientToDeclarations`)
 * so a browser that cannot parse the hint still gets the sRGB gradient. Set
 * `interpolation: 'srgb'` per gradient to pin the legacy rendering.
 */
export const DEFAULT_GRADIENT_INTERPOLATION: GradientInterpolation = 'oklab'

export function resolveGradientInterpolation(
  options: GradientColors
): GradientInterpolation {
  return options.interpolation ?? DEFAULT_GRADIENT_INTERPOLATION
}

const POSITION_MAP: Record<string, string> = {
  'center': 'center',
  'top': 'top',
  'bottom': 'bottom',
  'leading': 'left',
  'trailing': 'right'
}

/**
 * A gradient split at the color stops so the same resolved stops can be
 * rendered with and without an interpolation hint. Assets in `colors` are
 * resolved once, when the parts are built.
 */
interface GradientParts {
  functionName: string
  /** Everything before the stops: direction, shape / size / position, from-angle. */
  head: string
  colorStops: string
  interpolation: GradientInterpolation
}

function renderGradient(
  parts: GradientParts,
  interpolation: GradientInterpolation
): string {
  const hint = interpolation === 'srgb' ? '' : `in ${interpolation} `
  return `${parts.functionName}(${hint}${parts.head}, ${parts.colorStops})`
}

function resolveColor(color: string | Asset): string {
  if (typeof color === 'string') {
    return color
  }
  return color.resolve() as string
}

function formatColorStops(colors: (string | Asset)[], stops?: number[]): string {
  return colors.map((color, index) => {
    const resolvedColor = resolveColor(color)
    if (stops && stops[index] !== undefined) {
      return `${resolvedColor} ${stops[index]}%`
    }
    return resolvedColor
  }).join(', ')
}

function formatRepeatingColorStops(
  colors: (string | Asset)[],
  colorStops: string[]
): string {
  return colors.map((color, index) => {
    const resolvedColor = resolveColor(color)
    const stop = colorStops[index] || `${index * 10}px`
    return `${resolvedColor} ${stop}`
  }).join(', ')
}

function formatPosition(center: GradientCenter): string {
  if (Array.isArray(center)) {
    return `${center[0]}% ${center[1]}%`
  }
  return POSITION_MAP[center] || center
}

function calculateDirection(startPoint: GradientStartPoint, endPoint: GradientStartPoint, angle?: number): string {
  if (angle !== undefined) {
    return `${angle}deg`
  }

  // Simple direction mapping for common cases
  const directionKey = `${startPoint}-${endPoint}`
  const directionMappings: Record<string, string> = {
    'top-bottom': 'to bottom',
    'bottom-top': 'to top',
    'leading-trailing': 'to right',
    'trailing-leading': 'to left',
    'topLeading-bottomTrailing': 'to bottom right',
    'topTrailing-bottomLeading': 'to bottom left',
    'bottomLeading-topTrailing': 'to top right',
    'bottomTrailing-topLeading': 'to top left'
  }

  return directionMappings[directionKey] || 'to bottom'
}

function describeLinearGradient(options: LinearGradientOptions): GradientParts {
  return {
    functionName: 'linear-gradient',
    head: calculateDirection(options.startPoint, options.endPoint, options.angle),
    colorStops: formatColorStops(options.colors, options.stops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeRadialGradient(options: RadialGradientOptions): GradientParts {
  const shape = options.shape || 'circle'
  const position = formatPosition(options.center)

  // Handle radius specification based on shape
  let sizeSpec: string
  if (shape === 'circle') {
    sizeSpec = `${options.endRadius}px`
  } else {
    // For ellipse, use endRadius for both axes unless specified differently
    sizeSpec = `${options.endRadius}px ${options.endRadius}px`
  }

  return {
    functionName: 'radial-gradient',
    head: `${shape} ${sizeSpec} at ${position}`,
    colorStops: formatColorStops(options.colors, options.stops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeConicGradient(
  options: AngularGradientOptions | ConicGradientOptions
): GradientParts {
  return {
    functionName: 'conic-gradient',
    head: `from ${options.startAngle}deg at ${formatPosition(options.center)}`,
    colorStops: formatColorStops(options.colors, options.stops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeRepeatingLinearGradient(options: RepeatingLinearGradientOptions): GradientParts {
  return {
    functionName: 'repeating-linear-gradient',
    head: options.direction,
    colorStops: formatRepeatingColorStops(options.colors, options.colorStops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeRepeatingRadialGradient(options: RepeatingRadialGradientOptions): GradientParts {
  const shape = options.shape || 'circle'
  return {
    functionName: 'repeating-radial-gradient',
    head: `${shape} at ${formatPosition(options.center)}`,
    colorStops: formatRepeatingColorStops(options.colors, options.colorStops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeEllipticalGradient(options: EllipticalGradientOptions): GradientParts {
  return {
    functionName: 'radial-gradient',
    head: `ellipse ${options.radiusX}px ${options.radiusY}px at ${formatPosition(options.center)}`,
    colorStops: formatColorStops(options.colors, options.stops),
    interpolation: resolveGradientInterpolation(options)
  }
}

function describeGradient(gradient: GradientDefinition): GradientParts {
  switch (gradient.type) {
    case 'linear':
      return describeLinearGradient(gradient.options as LinearGradientOptions)
    case 'radial':
      return describeRadialGradient(gradient.options as RadialGradientOptions)
    case 'angular':
      return describeConicGradient(gradient.options as AngularGradientOptions)
    case 'conic':
      return describeConicGradient(gradient.options as ConicGradientOptions)
    case 'repeating-linear':
      return describeRepeatingLinearGradient(gradient.options as RepeatingLinearGradientOptions)
    case 'repeating-radial':
      return describeRepeatingRadialGradient(gradient.options as RepeatingRadialGradientOptions)
    case 'elliptical':
      return describeEllipticalGradient(gradient.options as EllipticalGradientOptions)
    default:
      throw new Error(`Unknown gradient type: ${gradient.type}`)
  }
}

function renderPreferred(parts: GradientParts): string {
  return renderGradient(parts, parts.interpolation)
}

export function generateLinearGradientCSS(options: LinearGradientOptions): string {
  return renderPreferred(describeLinearGradient(options))
}

export function generateRadialGradientCSS(options: RadialGradientOptions): string {
  return renderPreferred(describeRadialGradient(options))
}

export function generateAngularGradientCSS(options: AngularGradientOptions): string {
  return renderPreferred(describeConicGradient(options))
}

export function generateConicGradientCSS(options: ConicGradientOptions): string {
  return renderPreferred(describeConicGradient(options))
}

export function generateRepeatingLinearGradientCSS(options: RepeatingLinearGradientOptions): string {
  return renderPreferred(describeRepeatingLinearGradient(options))
}

export function generateRepeatingRadialGradientCSS(options: RepeatingRadialGradientOptions): string {
  return renderPreferred(describeRepeatingRadialGradient(options))
}

export function generateEllipticalGradientCSS(options: EllipticalGradientOptions): string {
  return renderPreferred(describeEllipticalGradient(options))
}

/**
 * The single preferred CSS string for a gradient: hinted with
 * `in <space>` unless its interpolation resolves to `'srgb'`.
 *
 * A browser that cannot parse the hint drops the whole declaration and the
 * element gets no background at all, so anything that writes this to a
 * `background` should write `gradientToDeclarations` instead.
 */
export function gradientToCSS(gradient: GradientDefinition): string {
  return renderPreferred(describeGradient(gradient))
}

/**
 * The declarations a `background` needs for this gradient, in cascade order:
 * the plain sRGB form first, then the hinted form. A browser that cannot
 * parse `in oklab` rejects only the second write and keeps the first — this
 * holds for stylesheet rules, `style` attributes and CSSOM `setProperty`
 * alike, as long as both writes actually reach the target.
 *
 * Length 1 when the interpolation resolves to `'srgb'`.
 */
export function gradientToDeclarations(gradient: GradientDefinition): string[] {
  const parts = describeGradient(gradient)
  if (parts.interpolation === 'srgb') {
    return [renderGradient(parts, 'srgb')]
  }
  return [renderGradient(parts, 'srgb'), renderPreferred(parts)]
}
