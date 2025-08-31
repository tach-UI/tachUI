/**
 * Layout Stack Components
 *
 * SwiftUI-inspired VStack, HStack, and ZStack components with modifier support
 */

import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '@tachui/core/runtime/types'
import type {
  ModifiableComponent,
  ModifierBuilder,
} from '@tachui/core/modifiers/types'
import {
  createModifiableComponent,
  createModifierBuilder,
} from '@tachui/core/modifiers'
import {
  ComponentWithCSSClasses,
  type CSSClassesProps,
} from '@tachui/core/css-classes'
import {
  processElementOverride,
  type ElementOverrideProps,
} from '@tachui/core/runtime/element-override'
import { useLifecycle } from '@tachui/core/lifecycle/hooks'
import { registerComponentWithLifecycleHooks } from '@tachui/core/runtime/dom-bridge'

/**
 * VStack component props
 */
export interface VStackProps {
  children?: ComponentInstance[]
  spacing?: number
  alignment?: 'leading' | 'center' | 'trailing'
  debugLabel?: string
  element?: string
}

/**
 * HStack component props
 */
export interface HStackProps {
  children?: ComponentInstance[]
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom'
  debugLabel?: string
  element?: string
}

/**
 * ZStack component props
 */
export interface ZStackProps {
  children?: ComponentInstance[]
  alignment?:
    | 'topLeading'
    | 'top'
    | 'topTrailing'
    | 'leading'
    | 'center'
    | 'trailing'
    | 'bottomLeading'
    | 'bottom'
    | 'bottomTrailing'
  element?: string
}

/**
 * Helper function to check if a component implements Concatenatable
 */
function isConcatenatable(component: any): component is any {
  return (
    component &&
    typeof component.concat === 'function' &&
    typeof component.toSegment === 'function' &&
    typeof component.isConcatenatable === 'function'
  )
}

/**
 * Enhanced component wrapper that adds modifier support and preserves concatenation methods
 */
export function withModifiers<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} & (ComponentInstance<P> extends any ? any : {}) {
  const modifiableComponent = createModifiableComponent(component)
  const modifierBuilder = createModifierBuilder(modifiableComponent)

  const result: any = {
    ...modifiableComponent,
    modifier: modifierBuilder,
    modifierBuilder: modifierBuilder,
  }

  // If the original component supports concatenation, preserve those methods
  if (isConcatenatable(component)) {
    result.concat = function (other: any) {
      return (component as any).concat(other)
    }
    result.toSegment = function () {
      return (component as any).toSegment()
    }
    result.isConcatenatable = function () {
      return (component as any).isConcatenatable()
    }
  }

  return result
}

/**
 * Layout container component class with element override support
 */
export class LayoutComponent
  extends ComponentWithCSSClasses
  implements
    ComponentInstance<ComponentProps & ElementOverrideProps & CSSClassesProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private effectiveTag: string
  private validationResult: any

  constructor(
    public props: ComponentProps & ElementOverrideProps & CSSClassesProps,
    private layoutType: 'vstack' | 'hstack' | 'zstack',
    public children: ComponentInstance[] = [],
    private layoutProps: any = {}
  ) {
    super()
    this.id = `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process element override for tag specification enhancement
    const componentType =
      this.layoutType === 'hstack'
        ? 'HStack'
        : this.layoutType === 'vstack'
          ? 'VStack'
          : 'ZStack'
    const override = processElementOverride(
      componentType,
      'div',
      this.props.element
    )
    this.effectiveTag = override.tag
    this.validationResult = override.validation

    // Set up lifecycle hooks to process child components
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        // Process lifecycle hooks for child components that have them
        this.children.forEach((child, index) => {
          const enhancedLifecycle = (child as any)._enhancedLifecycle

          if (
            enhancedLifecycle &&
            enhancedLifecycle.onDOMReady &&
            !child.domReady
          ) {
            try {
              // Find DOM elements for this child by searching within our container
              if (primaryElement) {
                // For layout components, children are rendered as direct children
                // Try to find the child's DOM element(s)
                const childElements = this.findChildDOMElements(
                  child,
                  primaryElement,
                  index
                )

                if (childElements.length > 0) {
                  // Set up DOM tracking for the child
                  child.domElements = new Map()
                  childElements.forEach((element, idx) => {
                    const key = element.id || `element-${idx}`
                    child.domElements!.set(key, element)
                    if (!child.primaryElement) {
                      child.primaryElement = element
                    }
                  })

                  child.domReady = true

                  // Call the child's onDOMReady hook
                  const cleanup = enhancedLifecycle.onDOMReady(
                    child.domElements,
                    child.primaryElement
                  )
                  if (typeof cleanup === 'function') {
                    child.cleanup = child.cleanup || []
                    child.cleanup.push(cleanup)
                  }

                  // Also call onMount if it exists
                  if (enhancedLifecycle.onMount) {
                    const mountCleanup = enhancedLifecycle.onMount()
                    if (typeof mountCleanup === 'function') {
                      child.cleanup = child.cleanup || []
                      child.cleanup.push(mountCleanup)
                    }
                  }
                }
              }
            } catch (error) {
              console.error(
                `Error processing lifecycle hooks for child ${child.id}:`,
                error
              )
              // Continue processing other children even if one fails
            }
          }
        })
      },
    })

    // Register this component for lifecycle processing
    registerComponentWithLifecycleHooks(this)
  }

  /**
   * Find DOM elements for a specific child component within the layout container
   */
  private findChildDOMElements(
    child: ComponentInstance,
    container: Element,
    childIndex: number
  ): Element[] {
    // For Image components, look for img elements with the tachui-image class
    if (child.id.startsWith('image-')) {
      const images = container.querySelectorAll('img.tachui-image')
      // Since we don't have a perfect way to match, we'll use the childIndex as a heuristic
      if (images[childIndex]) {
        return [images[childIndex]]
      }
      // Fallback: return all images and let the component handle it
      return Array.from(images)
    }

    // For Button components, look for button elements with the tachui-button class
    if (child.id.startsWith('button-')) {
      const buttons = container.querySelectorAll('button.tachui-button')
      if (buttons[childIndex]) {
        return [buttons[childIndex]]
      }
      // Fallback: return all buttons and let the component handle it
      return Array.from(buttons)
    }

    // For Text components, look for span elements with the tachui-text class
    if (child.id.startsWith('text-')) {
      const textElements = container.querySelectorAll(
        'span.tachui-text, .tachui-text'
      )
      if (textElements[childIndex]) {
        return [textElements[childIndex]]
      }
      return Array.from(textElements)
    }

    // For other components, try to find any direct children elements
    // This is a fallback that should work for most components
    const allChildren = Array.from(container.children)
    if (allChildren[childIndex]) {
      return [allChildren[childIndex]]
    }

    // Final fallback: return all children and let the component handle it
    return allChildren
  }

  render(): DOMNode[] {
    const { spacing = 0, debugLabel } = this.layoutProps
    // Explicitly handle alignment to avoid default override
    const alignment =
      this.layoutProps.alignment !== undefined
        ? this.layoutProps.alignment
        : 'center'

    // Process CSS classes for this component
    const baseClasses = [`tachui-${this.layoutType}`]
    const classString = this.createClassString(this.props, baseClasses)

    switch (this.layoutType) {
      case 'vstack': {
        // Render children normally but also make them available for DOM bridge processing
        const vstackRenderedChildren = this.children.map(child => {
          const childResult = child.render()
          const resultArray = Array.isArray(childResult)
            ? childResult
            : [childResult]
          return resultArray
        })
        const vstackFlattened = vstackRenderedChildren.flat()

        const element: DOMNode = {
          type: 'element',
          tag: this.effectiveTag,
          props: {
            className: classString,
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: spacing ? `${spacing}px` : '0',
              alignItems:
                alignment === 'leading'
                  ? 'flex-start'
                  : alignment === 'trailing'
                    ? 'flex-end'
                    : 'center',
            },
            'data-tachui-component': 'VStack',
            ...(debugLabel && { 'data-tachui-label': debugLabel }),
          },
          children: vstackFlattened,
          // Add component metadata for semantic role processing
          componentMetadata: {
            originalType: 'VStack',
            overriddenTo:
              this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
            validationResult: this.validationResult,
          },
        }

        return [element]
      }

      case 'hstack': {
        const hstackRenderedChildren = this.children.map(child => {
          const childResult = child.render()
          const resultArray = Array.isArray(childResult)
            ? childResult
            : [childResult]
          return resultArray
        })
        const hstackFlattened = hstackRenderedChildren.flat()

        const element: DOMNode = {
          type: 'element',
          tag: this.effectiveTag,
          props: {
            className: classString,
            style: {
              display: 'flex',
              flexDirection: 'row',
              gap: spacing ? `${spacing}px` : '0',
              alignItems:
                alignment === 'top'
                  ? 'flex-start'
                  : alignment === 'bottom'
                    ? 'flex-end'
                    : 'center',
            },
            'data-tachui-component': 'HStack',
            ...(debugLabel && { 'data-tachui-label': debugLabel }),
          },
          children: hstackFlattened,
          componentMetadata: {
            originalType: 'HStack',
            overriddenTo:
              this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
            validationResult: this.validationResult,
          },
        }

        return [element]
      }

      case 'zstack': {
        const zstackRenderedChildren = this.children.map(child => {
          const childResult = child.render()
          const resultArray = Array.isArray(childResult)
            ? childResult
            : [childResult]
          return resultArray
        })
        const zstackFlattened = zstackRenderedChildren.flat()

        // Map SwiftUI alignment to CSS
        const getZStackAlignment = (alignment: string) => {
          switch (alignment) {
            case 'topLeading':
              return { justifyContent: 'flex-start', alignItems: 'flex-start' }
            case 'top':
              return { justifyContent: 'flex-start', alignItems: 'center' }
            case 'topTrailing':
              return { justifyContent: 'flex-start', alignItems: 'flex-end' }
            case 'leading':
              return { justifyContent: 'center', alignItems: 'flex-start' }
            case 'center':
              return { justifyContent: 'center', alignItems: 'center' }
            case 'trailing':
              return { justifyContent: 'center', alignItems: 'flex-end' }
            case 'bottomLeading':
              return { justifyContent: 'flex-end', alignItems: 'flex-start' }
            case 'bottom':
              return { justifyContent: 'flex-end', alignItems: 'center' }
            case 'bottomTrailing':
              return { justifyContent: 'flex-end', alignItems: 'flex-end' }
            default:
              return { justifyContent: 'center', alignItems: 'center' }
          }
        }

        const alignmentStyles = getZStackAlignment(alignment)

        const element: DOMNode = {
          type: 'element',
          tag: this.effectiveTag,
          props: {
            className: classString,
            style: {
              display: 'flex',
              position: 'relative',
              ...alignmentStyles,
            },
            'data-tachui-component': 'ZStack',
          },
          children: zstackFlattened.map((child, index) => ({
            ...child,
            props: {
              ...child.props,
              style: {
                ...child.props?.style,
                position: index === 0 ? 'relative' : 'absolute',
                zIndex: zstackFlattened.length - index,
              },
            },
          })),
          componentMetadata: {
            originalType: 'ZStack',
            overriddenTo:
              this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
            validationResult: this.validationResult,
          },
        }

        return [element]
      }

      default:
        return []
    }
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.cleanup.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Layout component cleanup error:', error)
      }
    })
    this.cleanup = []

    // Cleanup children
    this.children.forEach(child => {
      if (child.dispose) {
        child.dispose()
      }
    })
  }
}

/**
 * SwiftUI-aligned direct exports for layout components
 */
export function VStack(props: VStackProps = {}) {
  const { children = [], spacing = 0, debugLabel } = props
  // Explicitly handle alignment to avoid default override
  const alignment = props.alignment !== undefined ? props.alignment : 'center'
  const component = new LayoutComponent(props, 'vstack', children, {
    spacing,
    alignment,
    debugLabel,
  })
  return withModifiers(component)
}

export function HStack(props: HStackProps = {}) {
  const { children = [], spacing = 0, debugLabel } = props
  // Explicitly handle alignment to avoid default override
  const alignment = props.alignment !== undefined ? props.alignment : 'center'
  const component = new LayoutComponent(props, 'hstack', children, {
    spacing,
    alignment,
    debugLabel,
  })
  return withModifiers(component)
}

export function ZStack(props: ZStackProps = {}) {
  const { children = [], alignment = 'center' } = props
  const component = new LayoutComponent(props, 'zstack', children, {
    alignment,
  })
  return withModifiers(component)
}
