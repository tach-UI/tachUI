/**
 * Reactive Signal Integration for TachUI Gradients
 * 
 * Enables dynamic gradients that update based on reactive signals,
 * allowing for animated and data-driven gradient effects.
 */

// Define Signal interface for gradients
interface Signal<T> {
  readonly value: T
  subscribe(callback: () => void): () => void
}
import type { Asset } from '../assets/types'
import { Asset as AssetClass } from '../assets/Asset'
import type {
  GradientDefinition,
  LinearGradientOptions,
  RadialGradientOptions,
  AngularGradientOptions,
  StateGradientOptions,
  StatefulBackgroundValue
} from './types'
import { LinearGradient, RadialGradient, AngularGradient } from './index'
import { StateGradientAsset } from './state-gradient-asset'

/**
 * Reactive gradient options supporting signal-based values
 */
export interface ReactiveLinearGradientOptions {
  colors: (string | Asset | Signal<string>)[]
  stops?: (number | Signal<number>)[]
  startPoint: LinearGradientOptions['startPoint'] | Signal<LinearGradientOptions['startPoint']>
  endPoint: LinearGradientOptions['endPoint'] | Signal<LinearGradientOptions['endPoint']>
  angle?: number | Signal<number>
}

export interface ReactiveRadialGradientOptions {
  colors: (string | Asset | Signal<string>)[]
  stops?: (number | Signal<number>)[]
  center: RadialGradientOptions['center'] | Signal<RadialGradientOptions['center']>
  startRadius: number | Signal<number>
  endRadius: number | Signal<number>
  shape?: RadialGradientOptions['shape'] | Signal<RadialGradientOptions['shape']>
}

export interface ReactiveAngularGradientOptions {
  colors: (string | Asset | Signal<string>)[]
  stops?: (number | Signal<number>)[]
  center: AngularGradientOptions['center'] | Signal<AngularGradientOptions['center']>
  startAngle: number | Signal<number>
  endAngle: number | Signal<number>
}

/**
 * Reactive gradient definition
 */
export interface ReactiveGradientDefinition {
  type: GradientDefinition['type']
  options: ReactiveLinearGradientOptions | ReactiveRadialGradientOptions | ReactiveAngularGradientOptions
  __reactive: true
}

/**
 * Reactive gradient asset that updates when signals change
 */
export class ReactiveGradientAsset extends AssetClass<string> {
  private currentGradient: GradientDefinition
  private subscriptions: (() => void)[] = []
  private updateCallback?: () => void

  constructor(
    name: string,
    private reactiveDefinition: ReactiveGradientDefinition,
    updateCallback?: () => void
  ) {
    super(name)
    this.updateCallback = updateCallback
    this.currentGradient = this.resolveStaticGradient()
    this.setupSignalSubscriptions()
  }

  /**
   * Resolve current gradient to CSS
   */
  resolve(): string {
    return this.gradientToCSS(this.currentGradient)
  }

  /**
   * Get current static gradient (resolved from signals)
   */
  getCurrentGradient(): GradientDefinition {
    return this.currentGradient
  }

  /**
   * Update the reactive definition and re-subscribe to signals
   */
  updateDefinition(newDefinition: ReactiveGradientDefinition): void {
    this.cleanup()
    this.reactiveDefinition = newDefinition
    this.currentGradient = this.resolveStaticGradient()
    this.setupSignalSubscriptions()
    this.notifyUpdate()
  }

  /**
   * Clean up signal subscriptions
   */
  cleanup(): void {
    this.subscriptions.forEach(unsubscribe => unsubscribe())
    this.subscriptions = []
  }

  private resolveStaticGradient(): GradientDefinition {
    const { type, options } = this.reactiveDefinition

    switch (type) {
      case 'linear':
        return LinearGradient(this.resolveLinearOptions(options as ReactiveLinearGradientOptions))
      case 'radial':
        return RadialGradient(this.resolveRadialOptions(options as ReactiveRadialGradientOptions))
      case 'angular':
      case 'conic':
        return AngularGradient(this.resolveAngularOptions(options as ReactiveAngularGradientOptions))
      default:
        throw new Error(`Unsupported reactive gradient type: ${type}`)
    }
  }

  private resolveLinearOptions(options: ReactiveLinearGradientOptions): LinearGradientOptions {
    return {
      colors: options.colors.map(color => this.resolveValue(color)),
      stops: options.stops?.map(stop => this.resolveValue(stop)),
      startPoint: this.resolveValue(options.startPoint),
      endPoint: this.resolveValue(options.endPoint),
      angle: options.angle ? this.resolveValue(options.angle) : undefined
    }
  }

  private resolveRadialOptions(options: ReactiveRadialGradientOptions): RadialGradientOptions {
    return {
      colors: options.colors.map(color => this.resolveValue(color)),
      stops: options.stops?.map(stop => this.resolveValue(stop)),
      center: this.resolveValue(options.center),
      startRadius: this.resolveValue(options.startRadius),
      endRadius: this.resolveValue(options.endRadius),
      shape: options.shape ? this.resolveValue(options.shape) : undefined
    }
  }

  private resolveAngularOptions(options: ReactiveAngularGradientOptions): AngularGradientOptions {
    return {
      colors: options.colors.map(color => this.resolveValue(color)),
      stops: options.stops?.map(stop => this.resolveValue(stop)),
      center: this.resolveValue(options.center),
      startAngle: this.resolveValue(options.startAngle),
      endAngle: this.resolveValue(options.endAngle)
    }
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    if (this.isSignal(value)) {
      return (value as Signal<T>).value
    }
    return value as T
  }

  private isSignal<T>(value: T | Signal<T>): value is Signal<T> {
    return value !== null && 
           typeof value === 'object' && 
           'value' in value && 
           'subscribe' in value
  }

  private setupSignalSubscriptions(): void {
    this.subscribeToSignalsInOptions(this.reactiveDefinition.options)
  }

  private subscribeToSignalsInOptions(options: any): void {
    for (const [_key, value] of Object.entries(options)) {
      if (Array.isArray(value)) {
        // Handle arrays (colors, stops)
        value.forEach(item => {
          if (this.isSignal(item)) {
            const unsubscribe = (item as Signal<any>).subscribe(() => this.handleSignalChange())
            this.subscriptions.push(unsubscribe)
          }
        })
      } else if (this.isSignal(value)) {
        // Handle individual signals
        const unsubscribe = (value as Signal<any>).subscribe(() => this.handleSignalChange())
        this.subscriptions.push(unsubscribe)
      }
    }
  }

  private handleSignalChange(): void {
    this.currentGradient = this.resolveStaticGradient()
    this.notifyUpdate()
  }

  private notifyUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback()
    }
  }

  private gradientToCSS(gradient: GradientDefinition): string {
    // Import and use the existing CSS generator
    const { gradientToCSS } = require('./css-generator')
    return gradientToCSS(gradient)
  }
}

/**
 * Reactive state gradient asset with signal support
 */
export class ReactiveStateGradientAsset extends StateGradientAsset {
  private reactiveSubscriptions: (() => void)[] = []

  constructor(
    name: string,
    private reactiveStateGradients: {
      default: StatefulBackgroundValue | Signal<StatefulBackgroundValue>
      hover?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>
      active?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>
      focus?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>
      disabled?: StatefulBackgroundValue | Signal<StatefulBackgroundValue>
      animation?: StateGradientOptions['animation']
    },
    private updateCallback?: () => void
  ) {
    // Resolve initial state
    const initialState = ReactiveStateGradientAsset.resolveStateOptions(reactiveStateGradients)
    super(name, initialState)
    
    this.setupStateSignalSubscriptions()
  }

  /**
   * Update reactive state configuration
   */
  updateReactiveState(
    newState: ReactiveStateGradientAsset['reactiveStateGradients']
  ): void {
    this.cleanupStateSubscriptions()
    this.reactiveStateGradients = newState
    
    // Update the underlying state gradients
    const resolvedState = ReactiveStateGradientAsset.resolveStateOptions(newState)
    this.updateStateGradients(resolvedState)
    
    this.setupStateSignalSubscriptions()
    this.notifyStateUpdate()
  }

  /**
   * Clean up signal subscriptions
   */
  cleanupStateSubscriptions(): void {
    this.reactiveSubscriptions.forEach(unsubscribe => unsubscribe())
    this.reactiveSubscriptions = []
  }

  private static resolveStateOptions(
    reactiveState: ReactiveStateGradientAsset['reactiveStateGradients']
  ): StateGradientOptions {
    const resolved: StateGradientOptions = {
      default: ReactiveStateGradientAsset.resolveValue(reactiveState.default) as any,
      animation: reactiveState.animation
    }

    if (reactiveState.hover) {
      resolved.hover = ReactiveStateGradientAsset.resolveValue(reactiveState.hover) as any
    }
    if (reactiveState.active) {
      resolved.active = ReactiveStateGradientAsset.resolveValue(reactiveState.active) as any
    }
    if (reactiveState.focus) {
      resolved.focus = ReactiveStateGradientAsset.resolveValue(reactiveState.focus) as any
    }
    if (reactiveState.disabled) {
      resolved.disabled = ReactiveStateGradientAsset.resolveValue(reactiveState.disabled) as any
    }

    return resolved
  }

  private static resolveValue<T>(value: T | Signal<T>): T {
    if (value !== null && 
        typeof value === 'object' && 
        'value' in value && 
        'subscribe' in value) {
      return (value as Signal<T>).value
    }
    return value as T
  }

  private static isSignal<T>(value: T | Signal<T>): value is Signal<T> {
    return value !== null && 
           typeof value === 'object' && 
           'value' in value && 
           'subscribe' in value
  }

  private setupStateSignalSubscriptions(): void {
    Object.entries(this.reactiveStateGradients).forEach(([key, value]) => {
      if (key === 'animation') return // Skip animation
      
      if (ReactiveStateGradientAsset.isSignal(value)) {
        const unsubscribe = (value as Signal<any>).subscribe(() => this.handleStateSignalChange())
        this.reactiveSubscriptions.push(unsubscribe)
      }
    })
  }

  private handleStateSignalChange(): void {
    const resolvedState = ReactiveStateGradientAsset.resolveStateOptions(this.reactiveStateGradients)
    this.updateStateGradients(resolvedState)
    this.notifyStateUpdate()
  }

  private notifyStateUpdate(): void {
    if (this.updateCallback) {
      this.updateCallback()
    }
  }
}

/**
 * Factory functions for creating reactive gradients
 */
export const ReactiveGradients = {
  /**
   * Create a reactive linear gradient
   */
  linear: (
    options: ReactiveLinearGradientOptions,
    updateCallback?: () => void
  ): ReactiveGradientAsset => {
    return new ReactiveGradientAsset(
      'reactive-linear',
      { type: 'linear', options, __reactive: true },
      updateCallback
    )
  },

  /**
   * Create a reactive radial gradient
   */
  radial: (
    options: ReactiveRadialGradientOptions,
    updateCallback?: () => void
  ): ReactiveGradientAsset => {
    return new ReactiveGradientAsset(
      'reactive-radial',
      { type: 'radial', options, __reactive: true },
      updateCallback
    )
  },

  /**
   * Create a reactive angular gradient
   */
  angular: (
    options: ReactiveAngularGradientOptions,
    updateCallback?: () => void
  ): ReactiveGradientAsset => {
    return new ReactiveGradientAsset(
      'reactive-angular',
      { type: 'angular', options, __reactive: true },
      updateCallback
    )
  },

  /**
   * Create a reactive state gradient
   */
  state: (
    name: string,
    options: ReactiveStateGradientAsset['reactiveStateGradients'],
    updateCallback?: () => void
  ): ReactiveStateGradientAsset => {
    return new ReactiveStateGradientAsset(name, options, updateCallback)
  }
} as const

/**
 * Utility functions for working with reactive gradients
 */
export const ReactiveGradientUtils = {
  /**
   * Create an animated gradient that cycles through colors
   */
  createAnimatedGradient: (
    colors: string[],
    _duration: number = 3000
  ): ReactiveGradientAsset => {
    // This would need actual signal implementation
    // Placeholder for the concept
    const colorSignal = {
      value: colors[0],
      subscribe: (_callback: () => void) => {
        // Implementation would cycle through colors
        return () => {} // unsubscribe
      }
    } satisfies Signal<string>

    return ReactiveGradients.linear({
      colors: [colorSignal, colors[1]],
      startPoint: 'top',
      endPoint: 'bottom'
    })
  },

  /**
   * Create a progress gradient that fills based on a signal
   */
  createProgressGradient: (
    progressSignal: Signal<number>,
    color: string = '#007AFF'
  ): ReactiveGradientAsset => {
    return ReactiveGradients.linear({
      colors: [color, 'transparent'],
      stops: [progressSignal, progressSignal], // Both stops use the same signal
      startPoint: 'leading',
      endPoint: 'trailing'
    })
  },

  /**
   * Create a data-driven gradient that reflects numeric values
   */
  createDataGradient: (
    _valueSignal: Signal<number>,
    _minValue: number,
    _maxValue: number,
    colorScale: string[] = ['#ff0000', '#ffff00', '#00ff00']
  ): ReactiveGradientAsset => {
    // Implementation would map value to color index
    // This is a conceptual placeholder
    return ReactiveGradients.linear({
      colors: colorScale,
      startPoint: 'top',
      endPoint: 'bottom'
    })
  }
} as const

/**
 * Enhanced background modifier support for reactive gradients
 */
export const ReactiveBackgroundUtils = {
  /**
   * Check if a background value is reactive
   */
  isReactiveBackground: (value: unknown): value is ReactiveGradientAsset | ReactiveStateGradientAsset => {
    return value instanceof ReactiveGradientAsset || value instanceof ReactiveStateGradientAsset
  },

  /**
   * Create a reactive background from a signal
   */
  fromSignal: (backgroundSignal: Signal<StatefulBackgroundValue>): ReactiveStateGradientAsset => {
    return ReactiveGradients.state('signal-background', {
      default: backgroundSignal
    })
  }
} as const