/**
 * Enhanced Lifecycle Hook Registration API (Phase 1)
 *
 * Provides convenient utilities for registering lifecycle hooks with DOM context,
 * error handling, and migration helpers for setTimeout workarounds.
 */

import type { ComponentInstance, ComponentProps, DOMError } from '../runtime/types'

/**
 * Enhanced lifecycle hook registration using withLifecycle utility
 */
export function useLifecycle(
  instance: ComponentInstance,
  hooks: {
    onMount?: () => void | (() => void)
    onUnmount?: () => void
    onError?: (error: Error) => void
    onDOMReady?: (elements: Map<string, Element>, primary?: Element) => void | (() => void)
    onDOMError?: (error: DOMError, context: string) => void
  }
): void {
  // Store enhanced hooks in a custom property for now
  ;(instance as any)._enhancedLifecycle = { 
    ...(instance as any)._enhancedLifecycle, 
    ...hooks 
  }
}

/**
 * Register onMount lifecycle hook
 */
export function onMount(
  instance: ComponentInstance, 
  callback: () => void | (() => void)
): void {
  useLifecycle(instance, { onMount: callback })
}

/**
 * Register onDOMReady lifecycle hook with guaranteed DOM element access
 */
export function onDOMReady(
  instance: ComponentInstance,
  callback: (elements: Map<string, Element>, primary?: Element) => void | (() => void)
): void {
  useLifecycle(instance, { onDOMReady: callback })
}

/**
 * Register onUnmount lifecycle hook
 */
export function onUnmount(
  instance: ComponentInstance, 
  callback: () => void
): void {
  useLifecycle(instance, { onUnmount: callback })
}

/**
 * Register error handling hooks
 */
export function onError(
  instance: ComponentInstance,
  callback: (error: Error) => void
): void {
  useLifecycle(instance, { onError: callback })
}

/**
 * Register DOM-specific error handling
 */
export function onDOMError(
  instance: ComponentInstance,
  callback: (error: DOMError, context: string) => void
): void {
  useLifecycle(instance, { onDOMError: callback })
}

/**
 * Error boundary wrapper for components
 */
export function withErrorBoundary<P extends ComponentProps>(
  instance: ComponentInstance<P>,
  errorHandler: (error: Error, context?: string) => void
): ComponentInstance<P> {
  useLifecycle(instance, {
    onError: (error) => errorHandler(error),
    onDOMError: (error, context) => errorHandler(error, `DOM:${context}`)
  })
  return instance
}

/**
 * DOM element access utilities
 */
export function withDOMAccess<T extends ComponentInstance>(
  instance: T,
  callback: (element: Element) => void | (() => void)
): void {
  onDOMReady(instance, (_elements, primaryElement) => {
    if (primaryElement) {
      return callback(primaryElement)
    }
  })
}

/**
 * Reactive asset utilities for components
 */
export function withReactiveAsset<T extends ComponentInstance>(
  instance: T,
  asset: any, // Asset type would be imported from assets system
  updateCallback: (element: Element, value: string) => void
): void {
  withDOMAccess(instance, (element) => {
    // This would integrate with the reactive asset system
    // For now, providing interface for future implementation
    if (typeof asset?.resolve === 'function') {
      const resolvedValue = asset.resolve()
      updateCallback(element, resolvedValue)
    }
  })
}

/**
 * Migration helper: Replace setTimeout workarounds with onDOMReady
 */
export function migrateFromSetTimeout(
  instance: ComponentInstance,
  legacyDOMSetup: () => void
): void {
  // Add deprecation warning
  console.warn('⚠️ setTimeout workaround detected. Consider migrating to onDOMReady.')
  
  onDOMReady(instance, () => {
    legacyDOMSetup()
  })
}

/**
 * Focus management utilities
 */
export const FocusManager = {
  /**
   * Focus element when DOM is ready (replaces setTimeout focus hacks)
   */
  focusWhenReady(
    instance: ComponentInstance,
    selector?: string,
    element?: Element
  ): void {
    onDOMReady(instance, (_elements, primaryElement) => {
      let targetElement: Element | null = null
      
      if (element) {
        targetElement = element
      } else if (selector) {
        targetElement = primaryElement?.querySelector(selector) || null
      } else {
        targetElement = primaryElement || null
      }
      
      if (targetElement instanceof HTMLElement && typeof targetElement.focus === 'function') {
        // Use requestAnimationFrame instead of setTimeout for focus
        requestAnimationFrame(() => {
          try {
            targetElement!.focus()
          } catch (error) {
            console.warn('Focus failed:', error)
          }
        })
      }
    })
  },

  /**
   * Focus first focusable element in component
   */
  focusFirstFocusable(instance: ComponentInstance): void {
    onDOMReady(instance, (_elements, primaryElement) => {
      if (primaryElement) {
        const focusable = primaryElement.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement
        
        if (focusable) {
          this.focusWhenReady(instance, undefined, focusable)
        }
      }
    })
  }
}

/**
 * Animation coordination utilities (replaces setTimeout animation hacks)
 */
export const AnimationManager = {
  /**
   * Coordinate animations with DOM readiness
   */
  animateWhenReady(
    instance: ComponentInstance,
    animations: {
      element?: Element
      selector?: string
      setup: (element: Element) => void
      animate: (element: Element) => void
    }
  ): void {
    onDOMReady(instance, (_elements, primaryElement) => {
      let targetElement: Element | null = null
      
      if (animations.element) {
        targetElement = animations.element
      } else if (animations.selector) {
        targetElement = primaryElement?.querySelector(animations.selector) || null
      } else {
        targetElement = primaryElement || null
      }
      
      if (targetElement) {
        // Setup initial state
        animations.setup(targetElement)
        
        // Trigger animation on next frame
        requestAnimationFrame(() => {
          animations.animate(targetElement!)
        })
      }
    })
  },

  /**
   * Fade in animation (common pattern)
   */
  fadeIn(
    instance: ComponentInstance,
    element?: Element,
    duration = 300
  ): void {
    this.animateWhenReady(instance, {
      element,
      setup: (el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.opacity = '0'
        htmlEl.style.transition = `opacity ${duration}ms ease-out`
      },
      animate: (el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.opacity = '1'
      }
    })
  },

  /**
   * Scale in animation (common for modals/alerts)
   */
  scaleIn(
    instance: ComponentInstance,
    element?: Element,
    duration = 300
  ): void {
    this.animateWhenReady(instance, {
      element,
      setup: (el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.transform = 'scale(0.8)'
        htmlEl.style.opacity = '0'
        htmlEl.style.transition = `all ${duration}ms ease-out`
      },
      animate: (el) => {
        const htmlEl = el as HTMLElement
        htmlEl.style.transform = 'scale(1)'
        htmlEl.style.opacity = '1'
      }
    })
  }
}

/**
 * Outside click detection utility (replaces setTimeout blur workarounds)
 */
export function setupOutsideClickDetection(
  instance: ComponentInstance,
  callback: () => void,
  selector?: string
): void {
  onDOMReady(instance, (_elements, primaryElement) => {
    const targetElement = selector 
      ? primaryElement?.querySelector(selector)
      : primaryElement
    
    if (targetElement) {
      const handleClickOutside = (event: MouseEvent) => {
        if (!targetElement.contains(event.target as Node)) {
          callback()
        }
      }
      
      document.addEventListener('click', handleClickOutside)
      
      // Return cleanup function
      onUnmount(instance, () => {
        document.removeEventListener('click', handleClickOutside)
      })
    }
  })
}

/**
 * Position calculation utility (replaces setTimeout positioning hacks)
 */
export function setupPositioning(
  instance: ComponentInstance,
  triggerSelector: string,
  targetSelector: string,
  calculatePosition: (trigger: Element, target: Element) => { x: number; y: number }
): void {
  onDOMReady(instance, (_elements, primaryElement) => {
    const trigger = primaryElement?.querySelector(triggerSelector)
    const target = primaryElement?.querySelector(targetSelector)
    
    if (trigger && target) {
      const position = calculatePosition(trigger, target)
      const targetEl = target as HTMLElement
      targetEl.style.left = `${position.x}px`
      targetEl.style.top = `${position.y}px`
    }
  })
}

