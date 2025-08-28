import type { Asset } from '../assets/types'
import type { 
  GradientDefinition, 
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

// Removed unused DIRECTION_MAP - using calculateDirection function instead

const POSITION_MAP: Record<string, string> = {
  'center': 'center',
  'top': 'top',
  'bottom': 'bottom',
  'leading': 'left',
  'trailing': 'right'
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

export function generateLinearGradientCSS(options: LinearGradientOptions): string {
  const direction = calculateDirection(options.startPoint, options.endPoint, options.angle)
  const colorStops = formatColorStops(options.colors, options.stops)
  
  return `linear-gradient(${direction}, ${colorStops})`
}

export function generateRadialGradientCSS(options: RadialGradientOptions): string {
  const shape = options.shape || 'circle'
  const position = formatPosition(options.center)
  const colorStops = formatColorStops(options.colors, options.stops)
  
  // Handle radius specification based on shape
  let sizeSpec: string
  if (shape === 'circle') {
    sizeSpec = `${options.endRadius}px`
  } else {
    // For ellipse, use endRadius for both axes unless specified differently
    sizeSpec = `${options.endRadius}px ${options.endRadius}px`
  }
  
  return `radial-gradient(${shape} ${sizeSpec} at ${position}, ${colorStops})`
}

export function generateAngularGradientCSS(options: AngularGradientOptions): string {
  const position = formatPosition(options.center)
  const fromAngle = `from ${options.startAngle}deg`
  const colorStops = formatColorStops(options.colors, options.stops)
  
  return `conic-gradient(${fromAngle} at ${position}, ${colorStops})`
}

export function generateConicGradientCSS(options: ConicGradientOptions): string {
  const position = formatPosition(options.center)
  const fromAngle = `from ${options.startAngle}deg`
  const colorStops = formatColorStops(options.colors, options.stops)
  
  return `conic-gradient(${fromAngle} at ${position}, ${colorStops})`
}

export function generateRepeatingLinearGradientCSS(options: RepeatingLinearGradientOptions): string {
  const colorStops = options.colors.map((color, index) => {
    const resolvedColor = resolveColor(color)
    const stop = options.colorStops[index] || `${index * 10}px`
    return `${resolvedColor} ${stop}`
  }).join(', ')
  
  return `repeating-linear-gradient(${options.direction}, ${colorStops})`
}

export function generateRepeatingRadialGradientCSS(options: RepeatingRadialGradientOptions): string {
  const shape = options.shape || 'circle'
  const position = formatPosition(options.center)
  const colorStops = options.colors.map((color, index) => {
    const resolvedColor = resolveColor(color)
    const stop = options.colorStops[index] || `${index * 10}px`
    return `${resolvedColor} ${stop}`
  }).join(', ')
  
  return `repeating-radial-gradient(${shape} at ${position}, ${colorStops})`
}

export function generateEllipticalGradientCSS(options: EllipticalGradientOptions): string {
  const position = formatPosition(options.center)
  const colorStops = formatColorStops(options.colors, options.stops)
  
  return `radial-gradient(ellipse ${options.radiusX}px ${options.radiusY}px at ${position}, ${colorStops})`
}

export function gradientToCSS(gradient: GradientDefinition): string {
  switch (gradient.type) {
    case 'linear':
      return generateLinearGradientCSS(gradient.options as LinearGradientOptions)
    case 'radial':
      return generateRadialGradientCSS(gradient.options as RadialGradientOptions)
    case 'angular':
      return generateAngularGradientCSS(gradient.options as AngularGradientOptions)
    case 'conic':
      return generateConicGradientCSS(gradient.options as ConicGradientOptions)
    case 'repeating-linear':
      return generateRepeatingLinearGradientCSS(gradient.options as RepeatingLinearGradientOptions)
    case 'repeating-radial':
      return generateRepeatingRadialGradientCSS(gradient.options as RepeatingRadialGradientOptions)
    case 'elliptical':
      return generateEllipticalGradientCSS(gradient.options as EllipticalGradientOptions)
    default:
      throw new Error(`Unknown gradient type: ${gradient.type}`)
  }
}