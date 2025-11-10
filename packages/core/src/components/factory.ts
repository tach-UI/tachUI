import { isProxyEnabled } from '../config'
import { createComponentProxy } from '../modifiers/proxy'
import type { ComponentInstance, ComponentProps } from '../runtime/types'

/**
 * Options for class-based component creation.
 */
export interface CreateComponentOptions {
  /**
   * When true, the returned instance is immediately wrapped in the modifier proxy.
   * Defaults to true so that downstream code can access modifier methods without
   * re-wrapping manually. Legacy paths that apply modifiers separately can set
   * this to false.
   */
  prewarmProxy?: boolean
}

/**
 * Instantiate a class-based component and ensure modifier proxy state is primed.
 *
 * This helper mirrors SwiftUI's component allocation flow while keeping
 * TachUI's modifier proxy cache in sync. When proxy mode is enabled the
 * instance is registered with the proxy cache so subsequent `withModifiers`
 * calls can reuse the same proxy. When proxy mode is disabled the raw
 * instance is returned.
 */
export function createComponentInstance<
  P extends ComponentProps,
  R extends ComponentInstance<P>,
  Args extends unknown[]
>(
  ComponentClass: new (props: P, ...rest: Args) => R,
  props: P,
  options: CreateComponentOptions = {},
  ...rest: Args
): R {
  const instance = new ComponentClass(props, ...rest)

  if (isProxyEnabled() && options.prewarmProxy !== false) {
    createComponentProxy(instance)
  }

  return instance
}
