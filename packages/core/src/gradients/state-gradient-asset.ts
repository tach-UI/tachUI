import { Asset } from '../assets/Asset'
import type { 
  StateGradientOptions, 
  GradientDefinition, 
  GradientAnimationOptions 
} from './types'
import { gradientToCSS } from './css-generator'

/**
 * State-aware gradient asset that manages different gradients for interaction states
 * 
 * Provides hover, active, focus, and disabled state support with smooth transitions.
 */
export class StateGradientAsset extends Asset<string> {
  private currentState: keyof StateGradientOptions = 'default'
  private animationOptions: GradientAnimationOptions
  private resolvedGradientCache: Map<string, string> = new Map()
  private isTransitioning: boolean = false

  constructor(
    name: string,
    private stateGradients: StateGradientOptions
  ) {
    super(name)
    this.animationOptions = stateGradients.animation || {
      duration: 300,
      easing: 'ease',
      delay: 0
    }
    
    // Pre-resolve all gradients for performance
    this.preResolveGradients()
  }

  /**
   * Set the current interaction state
   */
  setState(state: keyof StateGradientOptions): void {
    if (state !== this.currentState && this.stateGradients[state] && !this.isTransitioning) {
      this.currentState = state
      
      // Set transition flag to prevent rapid state changes during animation
      if (this.animationOptions.duration && this.animationOptions.duration > 0) {
        this.isTransitioning = true
        setTimeout(() => {
          this.isTransitioning = false
        }, this.animationOptions.duration + (this.animationOptions.delay || 0))
      }
    }
  }

  /**
   * Get the current state
   */
  getState(): keyof StateGradientOptions {
    return this.currentState
  }

  /**
   * Resolve the current gradient to CSS
   */
  resolve(): string {
    // Use cached result if available
    const cacheKey = this.currentState
    if (this.resolvedGradientCache.has(cacheKey)) {
      return this.resolvedGradientCache.get(cacheKey)!
    }
    
    const gradient = this.stateGradients[this.currentState] || this.stateGradients.default
    const resolved = this.resolveGradientValue(gradient as GradientDefinition | string | Asset)
    
    // Cache the result
    this.resolvedGradientCache.set(cacheKey, resolved)
    return resolved
  }

  /**
   * Get gradient for a specific state without changing current state
   */
  getStateGradient(state: keyof StateGradientOptions): string {
    const gradient = this.stateGradients[state] || this.stateGradients.default
    return this.resolveGradientValue(gradient as GradientDefinition | string | Asset)
  }

  /**
   * Get animation CSS properties for transitions
   */
  getAnimationCSS(): string {
    const { duration, easing, delay } = this.animationOptions
    return `transition: background ${duration}ms ${easing} ${delay || 0}ms;`
  }

  /**
   * Get all available states
   */
  getAvailableStates(): (keyof StateGradientOptions)[] {
    return Object.keys(this.stateGradients).filter(
      key => this.stateGradients[key as keyof StateGradientOptions] !== undefined
    ) as (keyof StateGradientOptions)[]
  }

  /**
   * Check if a state is available
   */
  hasState(state: keyof StateGradientOptions): boolean {
    return state in this.stateGradients && this.stateGradients[state] !== undefined
  }

  /**
   * Update animation options
   */
  setAnimation(options: Partial<GradientAnimationOptions>): void {
    this.animationOptions = { ...this.animationOptions, ...options }
  }

  private resolveGradientValue(value: GradientDefinition | string | Asset): string {
    if (typeof value === 'string') {
      return value
    }

    if (this.isAsset(value)) {
      return value.resolve() as string
    }

    if (this.isGradientDefinition(value)) {
      return gradientToCSS(value)
    }

    return ''
  }

  private isAsset(value: any): value is Asset {
    return value && typeof value === 'object' && typeof value.resolve === 'function'
  }

  private isGradientDefinition(value: any): value is GradientDefinition {
    return value && typeof value === 'object' && 'type' in value && 'options' in value
  }

  /**
   * Pre-resolve all gradients to improve runtime performance
   */
  private preResolveGradients(): void {
    Object.keys(this.stateGradients).forEach(stateKey => {
      const state = stateKey as keyof StateGradientOptions
      if (state !== 'animation' && this.stateGradients[state]) {
        const resolved = this.resolveGradientValue(this.stateGradients[state]!)
        this.resolvedGradientCache.set(state, resolved)
      }
    })
  }

  /**
   * Clear the gradient cache (useful when gradients change dynamically)
   */
  clearCache(): void {
    this.resolvedGradientCache.clear()
    this.preResolveGradients()
  }

  /**
   * Force update animation options and clear cache if needed
   */
  updateStateGradients(newGradients: StateGradientOptions): void {
    this.stateGradients = newGradients
    this.animationOptions = newGradients.animation || this.animationOptions
    this.clearCache()
  }
}

/**
 * Create a state-based gradient asset
 */
export function StateGradient(
  name: string,
  gradients: StateGradientOptions
): StateGradientAsset {
  return new StateGradientAsset(name, gradients)
}