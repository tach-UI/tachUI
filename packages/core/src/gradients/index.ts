import type {
  GradientDefinition,
  LinearGradientOptions,
  RadialGradientOptions,
  AngularGradientOptions,
  RepeatingLinearGradientOptions,
  RepeatingRadialGradientOptions,
  ConicGradientOptions,
  EllipticalGradientOptions
} from './types'

export function LinearGradient(options: LinearGradientOptions): GradientDefinition {
  return {
    type: 'linear',
    options
  }
}

export function RadialGradient(options: RadialGradientOptions): GradientDefinition {
  return {
    type: 'radial',
    options
  }
}

export function AngularGradient(options: AngularGradientOptions): GradientDefinition {
  return {
    type: 'angular',
    options
  }
}

export function ConicGradient(options: ConicGradientOptions): GradientDefinition {
  return {
    type: 'conic',
    options
  }
}

export function RepeatingLinearGradient(options: RepeatingLinearGradientOptions): GradientDefinition {
  return {
    type: 'repeating-linear',
    options
  }
}

export function RepeatingRadialGradient(options: RepeatingRadialGradientOptions): GradientDefinition {
  return {
    type: 'repeating-radial',
    options
  }
}

export function EllipticalGradient(options: EllipticalGradientOptions): GradientDefinition {
  return {
    type: 'elliptical',
    options
  }
}

// Phase 2 export additions
export * from './types'
export * from './gradient-asset'
export * from './css-generator'

// Phase 3 export additions - State-based gradients
export * from './state-gradient-asset'

// Phase 4 export additions - Developer Experience
export { 
  LinearGradientPresets,
  InteractiveGradientPresets,
  ThemeGradients,
  GradientUtils as GradientPresetUtils
} from './presets'
export * from './validation'
export * from './reactive'
export { 
  GradientUtils as GradientUtilities,
  ColorUtils as ColorUtilities,
  GradientAnalysis,
  StateGradientUtils
} from './utils'
export * from './examples'
export * from './performance'