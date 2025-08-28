import { BaseModifier } from './base'
import type { ModifierContext } from './types'
import type { DOMNode } from '../runtime/types'
import type { Asset } from '../assets/types'
import type { 
  GradientDefinition, 
  StatefulBackgroundValue, 
  StateGradientOptions 
} from '../gradients/types'
import { gradientToCSS } from '../gradients/css-generator'
import { StateGradientAsset } from '../gradients/state-gradient-asset'

export interface BackgroundOptions {
  background: StatefulBackgroundValue
}

export class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95
  private stateGradientAsset?: StateGradientAsset

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const background = this.properties.background
    const element = context.element as HTMLElement

    if (this.isStateGradientOptions(background)) {
      this.setupStateGradient(element, background)
    } else {
      const cssValue = this.resolveBackground(background)
      if (cssValue) {
        element.style.background = cssValue
      }
    }

    return undefined
  }

  private setupStateGradient(element: HTMLElement, stateOptions: StateGradientOptions): void {
    // Create or update the state gradient asset
    this.stateGradientAsset = new StateGradientAsset('background-state', stateOptions)
    
    // Set initial background
    element.style.background = this.stateGradientAsset.resolve()
    
    // Add animation styles
    const animationCSS = this.stateGradientAsset.getAnimationCSS()
    element.style.cssText += animationCSS

    // Set up event listeners for state changes
    this.setupStateEventListeners(element)
  }

  private setupStateEventListeners(element: HTMLElement): void {
    if (!this.stateGradientAsset) return

    // Hover state
    if (this.stateGradientAsset.hasState('hover')) {
      element.addEventListener('mouseenter', () => {
        this.stateGradientAsset!.setState('hover')
        element.style.background = this.stateGradientAsset!.resolve()
      })

      element.addEventListener('mouseleave', () => {
        // Return to appropriate state (active, focus, or default)
        const currentState = this.getCurrentElementState(element)
        this.stateGradientAsset!.setState(currentState)
        element.style.background = this.stateGradientAsset!.resolve()
      })
    }

    // Active/pressed state
    if (this.stateGradientAsset.hasState('active')) {
      element.addEventListener('mousedown', () => {
        this.stateGradientAsset!.setState('active')
        element.style.background = this.stateGradientAsset!.resolve()
      })

      element.addEventListener('mouseup', () => {
        // Return to hover if still hovering, otherwise default
        const isHovering = element.matches(':hover')
        const nextState = isHovering && this.stateGradientAsset!.hasState('hover') ? 'hover' : 'default'
        this.stateGradientAsset!.setState(nextState)
        element.style.background = this.stateGradientAsset!.resolve()
      })
    }

    // Focus state
    if (this.stateGradientAsset.hasState('focus')) {
      element.addEventListener('focus', () => {
        this.stateGradientAsset!.setState('focus')
        element.style.background = this.stateGradientAsset!.resolve()
      })

      element.addEventListener('blur', () => {
        this.stateGradientAsset!.setState('default')
        element.style.background = this.stateGradientAsset!.resolve()
      })
    }

    // Disabled state (handled via attribute observation)
    if (this.stateGradientAsset.hasState('disabled')) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'disabled') {
            const isDisabled = element.hasAttribute('disabled')
            const state = isDisabled ? 'disabled' : 'default'
            this.stateGradientAsset!.setState(state)
            element.style.background = this.stateGradientAsset!.resolve()
          }
        })
      })

      observer.observe(element, { attributes: true, attributeFilter: ['disabled'] })
    }
  }

  private getCurrentElementState(element: HTMLElement): keyof StateGradientOptions {
    if (!this.stateGradientAsset) return 'default'

    if (element.hasAttribute('disabled') && this.stateGradientAsset.hasState('disabled')) {
      return 'disabled'
    }

    if (element.matches(':focus') && this.stateGradientAsset.hasState('focus')) {
      return 'focus'
    }

    return 'default'
  }

  private resolveBackground(background: StatefulBackgroundValue): string {
    if (typeof background === 'string') {
      return background
    }

    if (this.isAsset(background)) {
      return background.resolve() as string
    }

    if (this.isGradientDefinition(background)) {
      return gradientToCSS(background)
    }

    if (this.isStateGradientOptions(background)) {
      // This should be handled by setupStateGradient
      return this.resolveBackground(background.default)
    }

    return ''
  }

  private isAsset(value: any): value is Asset {
    return value && typeof value === 'object' && typeof value.resolve === 'function'
  }

  private isGradientDefinition(value: any): value is GradientDefinition {
    return value && typeof value === 'object' && 'type' in value && 'options' in value
  }

  private isStateGradientOptions(value: any): value is StateGradientOptions {
    return value && typeof value === 'object' && 'default' in value
  }
}