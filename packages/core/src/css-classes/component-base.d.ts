/**
 * CSS Classes Enhancement - Component Base
 *
 * Base class for components that support CSS class integration.
 * Provides utilities for processing and applying CSS classes.
 */
import type { Signal } from '../reactive/types'
import type { CSSClassesProps } from './types'
/**
 * Base class for components with CSS class support
 */
export declare abstract class ComponentWithCSSClasses {
  protected cssClassManager: import('./css-class-manager').CSSClassManager
  /**
   * Process CSS classes from props and integrate with component classes
   */
  protected processComponentClasses(
    props: CSSClassesProps,
    baseClasses?: string[]
  ): string[]
  /**
   * Create class string for DOM nodes - handles both static and reactive classes
   */
  protected createClassString(
    props: CSSClassesProps,
    baseClasses?: string[]
  ): Signal<string> | string
  /**
   * Create class array for components that need array format
   */
  protected createClassArray(
    props: CSSClassesProps,
    baseClasses?: string[]
  ): Signal<string[]> | string[]
  /**
   * Validate CSS classes for development warnings
   */
  protected validateCSSClasses(props: CSSClassesProps): void
  /**
   * Get debug information about processed classes
   */
  protected getClassDebugInfo(
    props: CSSClassesProps,
    baseClasses?: string[]
  ): {
    base: string[]
    user: string[]
    processed: string[]
    final: string
  }
}
//# sourceMappingURL=component-base.d.ts.map
