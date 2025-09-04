/**
 * Enhanced Lifecycle Hook Registration API (Phase 1)
 *
 * Provides convenient utilities for registering lifecycle hooks with DOM context,
 * error handling, and migration helpers for setTimeout workarounds.
 */
import type {
  ComponentInstance,
  ComponentProps,
  DOMError,
} from '../runtime/types'
/**
 * Enhanced lifecycle hook registration using withLifecycle utility
 */
export declare function useLifecycle(
  instance: ComponentInstance,
  hooks: {
    onMount?: () => void | (() => void)
    onUnmount?: () => void
    onError?: (error: Error) => void
    onDOMReady?: (
      elements: Map<string, Element>,
      primary?: Element
    ) => void | (() => void)
    onDOMError?: (error: DOMError, context: string) => void
  }
): void
/**
 * Register onMount lifecycle hook
 */
export declare function onMount(
  instance: ComponentInstance,
  callback: () => void | (() => void)
): void
/**
 * Register onDOMReady lifecycle hook with guaranteed DOM element access
 */
export declare function onDOMReady(
  instance: ComponentInstance,
  callback: (
    elements: Map<string, Element>,
    primary?: Element
  ) => void | (() => void)
): void
/**
 * Register onUnmount lifecycle hook
 */
export declare function onUnmount(
  instance: ComponentInstance,
  callback: () => void
): void
/**
 * Register error handling hooks
 */
export declare function onError(
  instance: ComponentInstance,
  callback: (error: Error) => void
): void
/**
 * Register DOM-specific error handling
 */
export declare function onDOMError(
  instance: ComponentInstance,
  callback: (error: DOMError, context: string) => void
): void
/**
 * Error boundary wrapper for components
 */
export declare function withErrorBoundary<P extends ComponentProps>(
  instance: ComponentInstance<P>,
  errorHandler: (error: Error, context?: string) => void
): ComponentInstance<P>
/**
 * DOM element access utilities
 */
export declare function withDOMAccess<T extends ComponentInstance>(
  instance: T,
  callback: (element: Element) => void | (() => void)
): void
/**
 * Reactive asset utilities for components
 */
export declare function withReactiveAsset<T extends ComponentInstance>(
  instance: T,
  asset: any, // Asset type would be imported from assets system
  updateCallback: (element: Element, value: string) => void
): void
/**
 * Migration helper: Replace setTimeout workarounds with onDOMReady
 */
export declare function migrateFromSetTimeout(
  instance: ComponentInstance,
  legacyDOMSetup: () => void
): void
/**
 * Focus management utilities
 */
export declare const FocusManager: {
  /**
   * Focus element when DOM is ready (replaces setTimeout focus hacks)
   */
  focusWhenReady(
    instance: ComponentInstance,
    selector?: string,
    element?: Element
  ): void
  /**
   * Focus first focusable element in component
   */
  focusFirstFocusable(instance: ComponentInstance): void
}
/**
 * Animation coordination utilities (replaces setTimeout animation hacks)
 */
export declare const AnimationManager: {
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
  ): void
  /**
   * Fade in animation (common pattern)
   */
  fadeIn(
    instance: ComponentInstance,
    element?: Element,
    duration?: number
  ): void
  /**
   * Scale in animation (common for modals/alerts)
   */
  scaleIn(
    instance: ComponentInstance,
    element?: Element,
    duration?: number
  ): void
}
/**
 * Outside click detection utility (replaces setTimeout blur workarounds)
 */
export declare function setupOutsideClickDetection(
  instance: ComponentInstance,
  callback: () => void,
  selector?: string
): void
/**
 * Position calculation utility (replaces setTimeout positioning hacks)
 */
export declare function setupPositioning(
  instance: ComponentInstance,
  triggerSelector: string,
  targetSelector: string,
  calculatePosition: (
    trigger: Element,
    target: Element
  ) => {
    x: number
    y: number
  }
): void
//# sourceMappingURL=hooks.d.ts.map
