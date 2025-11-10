/**
 * Viewport Lifecycle Modifiers
 *
 * Modifiers for detecting when elements enter and leave the viewport
 * using IntersectionObserver API.
 */

import { BaseModifier } from '@tachui/core/modifiers/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { ViewportLifecycleOptions } from './types'

export class ViewportLifecycleModifier extends BaseModifier<ViewportLifecycleOptions> {
  readonly type = 'viewportLifecycle'
  readonly priority = 100 // High priority for lifecycle events

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    if (this.properties.onAppear || this.properties.onDisappear) {
      this.setupLifecycleObserver(context.element, this.properties)
    }

    return undefined
  }

  private setupLifecycleObserver(
    element: Element,
    props: ViewportLifecycleOptions
  ): void {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && props.onAppear) {
            // Element has appeared in viewport
            props.onAppear()
          } else if (!entry.isIntersecting && props.onDisappear) {
            // Element has disappeared from viewport
            props.onDisappear()
          }
        })
      },
      {
        threshold: 0.1, // Trigger when 10% of element is visible
        rootMargin: '10px', // Add some margin for better UX
      }
    )

    observer.observe(element)

    // Note: Cleanup would need to be integrated with the component's cleanup system
    // For now, the observer will be cleaned up when the element is removed from DOM
  }
}

/**
 * Modifier that triggers when an element enters the viewport
 *
 * @param handler - Function to call when element becomes visible
 * @returns ViewportLifecycleModifier
 *
 * @example
 * ```typescript
 * VStack({ children: [] })
 *   .onAppear(() => console.log('Element is now visible'))
 *   .build()
 * ```
 */
export function onAppear(handler: () => void): ViewportLifecycleModifier {
  return new ViewportLifecycleModifier({ onAppear: handler })
}

/**
 * Modifier that triggers when an element leaves the viewport
 *
 * @param handler - Function to call when element becomes hidden
 * @returns ViewportLifecycleModifier
 *
 * @example
 * ```typescript
 * VStack({ children: [] })
 *   .onDisappear(() => console.log('Element is now hidden'))
 *   .build()
 * ```
 */
export function onDisappear(handler: () => void): ViewportLifecycleModifier {
  return new ViewportLifecycleModifier({ onDisappear: handler })
}
