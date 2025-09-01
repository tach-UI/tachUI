/**
 * Component Wrapper System
 *
 * Provides wrapper functions to enhance regular components with modifier support
 * and integrate them with the TachUI modifier system.
 */

import { createModifiableComponent, createModifierBuilder } from '../modifiers'
import type { ModifiableComponent, ModifierBuilder } from '../modifiers/types'
import { h, text } from '../runtime'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'
import { useLifecycle } from '../lifecycle/hooks'
import { registerComponentWithLifecycleHooks } from '../runtime/dom-bridge'
import {
  processElementOverride,
  type ElementOverrideProps,
} from '../runtime/element-override'
import { ComponentWithCSSClasses, type CSSClassesProps } from '../css-classes'
import type { Concatenatable } from '../concatenation/types'
// Lazy import debug manager to avoid circular dependencies
let debugManager: any = null
const getDebugManager = () => {
  if (!debugManager) {
    try {
      const debugModule = require('../debug')
      debugManager = debugModule.debugManager
    } catch {
      // Debug module not available, create a mock
      debugManager = {
        isEnabled: () => false,
        logComponent: () => {},
      }
    }
  }
  return debugManager
}

/**
 * Wrapper options for enhancing components
 */
export interface WrapperOptions {
  enableModifiers?: boolean
  enableReactivity?: boolean
  enableErrorBoundary?: boolean
  enablePerformanceTracking?: boolean
}

/**
 * Helper function to check if a component implements Concatenatable
 */
function isConcatenatable(component: any): component is Concatenatable {
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
} & (ComponentInstance<P> extends Concatenatable ? Concatenatable : {}) {
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
 * Create a reactive component wrapper with full TachUI features
 */
export function createReactiveWrapper<P extends ComponentProps>(
  renderFn: (props: P) => DOMNode | DOMNode[],
  options: WrapperOptions = {}
): (
  props: P
) => ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} {
  const { enableModifiers = true } = options

  return (props: P) => {
    // Create a simple component instance that uses the render function
    const component: ComponentInstance<P> = {
      type: 'component' as const,
      id: `wrapper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      props,
      mounted: false,
      cleanup: [],
      render() {
        const result = renderFn(props)
        return Array.isArray(result) ? result : [result]
      },
    }

    // Add modifier support if enabled
    if (enableModifiers) {
      return withModifiers(component)
    }

    // Return basic component with minimal wrapper
    return withModifiers(component)
  }
}

/**
 * Simple element component class
 */
class ElementComponent implements ComponentInstance<ComponentProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(
    public props: ComponentProps,
    private tag: string,
    private content?: string,
    private attributes: Record<string, any> = {}
  ) {
    this.id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  render() {
    return [
      h(this.tag, this.attributes, this.content ? text(this.content) : ''),
    ]
  }
}

/**
 * Simple HTML element wrappers with modifier support
 *
 * These are basic HTML element wrappers for simple use cases.
 * For enhanced SwiftUI-style components with advanced features,
 * use the main component exports (Button, Image, Text, etc.).
 */
export const HTML = {
  /**
   * Create a div element with modifier support
   */
  div: (props: { children?: any } = {}) => {
    const component = new ElementComponent(
      props,
      'div',
      props.children ? String(props.children) : undefined
    )
    return withModifiers(component)
  },

  /**
   * Create a span element with modifier support
   */
  span: (props: { children?: any } = {}) => {
    const component = new ElementComponent(
      props,
      'span',
      props.children ? String(props.children) : undefined
    )
    return withModifiers(component)
  },

  /**
   * Create a paragraph element with modifier support
   */
  p: (props: { children?: any } = {}) => {
    const component = new ElementComponent(
      props,
      'p',
      props.children ? String(props.children) : undefined
    )
    return withModifiers(component)
  },

  /**
   * Create a button element with modifier support
   *
   * Note: For enhanced button features (press states, variants, accessibility),
   * use the main Button component instead.
   */
  button: (props: { children?: any; onClick?: () => void } = {}) => {
    const component = new ElementComponent(
      props,
      'button',
      props.children ? String(props.children) : undefined,
      {
        onclick: props.onClick,
      }
    )
    return withModifiers(component)
  },

  /**
   * Create an input element with modifier support
   */
  input: (
    props: {
      type?: string
      value?: string
      placeholder?: string
      onChange?: (value: string) => void
    } = {}
  ) => {
    const component = new ElementComponent(props, 'input', undefined, {
      type: props.type || 'text',
      value: props.value || '',
      placeholder: props.placeholder || '',
      oninput: (e: Event) => {
        const target = e.target as HTMLInputElement
        props.onChange?.(target.value)
      },
    })
    return withModifiers(component)
  },

  /**
   * Create an image element with modifier support
   *
   * Note: For enhanced image features (loading states, content modes, progressive loading),
   * use the main Image component instead.
   */
  img: (props: {
    src: string
    alt?: string
    width?: number | string
    height?: number | string
  }) => {
    const component = new ElementComponent(props, 'img', undefined, {
      src: props.src,
      alt: props.alt || '',
      width: props.width,
      height: props.height,
    })
    return withModifiers(component)
  },

  /**
   * Create a heading element with modifier support
   */
  heading:
    (level: 1 | 2 | 3 | 4 | 5 | 6) =>
    (props: { children?: any } = {}) => {
      const component = new ElementComponent(
        props,
        `h${level}`,
        props.children ? String(props.children) : undefined
      )
      return withModifiers(component)
    },
}

/**
 * Shorthand for heading elements
 */
export const H1 = HTML.heading(1)
export const H2 = HTML.heading(2)
export const H3 = HTML.heading(3)
export const H4 = HTML.heading(4)
export const H5 = HTML.heading(5)
export const H6 = HTML.heading(6)

/**
 * Layout container component class with element override support
 */
class LayoutComponent
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

  render() {
    const { spacing = 0, debugLabel } = this.layoutProps
    // Explicitly handle alignment to avoid default override
    const alignment =
      this.layoutProps.alignment !== undefined
        ? this.layoutProps.alignment
        : 'center'

    // Log component for debugging
    const debug = getDebugManager()
    debug.logComponent(this.layoutType.toUpperCase(), debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      `tachui-${this.layoutType}`,
      ...(debug.isEnabled() ? ['tachui-debug'] : []),
    ]
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

        const element = {
          type: 'element' as const,
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
            // Add debug attributes
            ...(debug.isEnabled() && {
              'data-tachui-component': 'VStack',
              ...(debugLabel && { 'data-tachui-label': debugLabel }),
            }),
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

        const element = {
          type: 'element' as const,
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
            // Add debug attributes
            ...(debug.isEnabled() && {
              'data-tachui-component': 'HStack',
              ...(debugLabel && { 'data-tachui-label': debugLabel }),
            }),
          },
          children: hstackFlattened,
          // Add component metadata for semantic role processing
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
        // Find the highest layoutPriority child to determine container size
        let maxPriority = -Infinity
        let highestPriorityChild: ComponentInstance | null = null

        this.children.forEach(child => {
          if ('modifiers' in child && Array.isArray(child.modifiers)) {
            const layoutMod = child.modifiers.find(
              m =>
                m.type === 'layout' &&
                m.properties &&
                'layoutPriority' in m.properties &&
                typeof m.properties.layoutPriority === 'number'
            )
            if (layoutMod) {
              const priority = layoutMod.properties.layoutPriority as number
              if (priority > maxPriority) {
                maxPriority = priority
                highestPriorityChild = child
              }
            }
          }
        })

        const container = h('div', {
          className: classString,
          style: {
            position: 'relative',
            display: 'flex',
            justifyContent: alignment.includes('Leading')
              ? 'flex-start'
              : alignment.includes('Trailing')
                ? 'flex-end'
                : 'center',
            alignItems: alignment.includes('top')
              ? 'flex-start'
              : alignment.includes('bottom')
                ? 'flex-end'
                : 'center',
            // Container sizes to the highest priority child
            ...(highestPriorityChild
              ? {
                  minWidth: 'fit-content',
                  minHeight: 'fit-content',
                }
              : {}),
          },
          // Add debug attributes
          ...(debug.isEnabled() && {
            'data-tachui-component': 'ZStack',
            ...(debugLabel && { 'data-tachui-label': debugLabel }),
          }),
        })

        // Apply absolute positioning to children for z-stack
        const renderedChildren = this.children.flatMap((child, index) => {
          const childNodes = child.render()
          const nodeArray = Array.isArray(childNodes)
            ? childNodes
            : [childNodes]

          // Get layoutPriority from child's modifiers
          let childPriority = index // Default to index-based z-index
          if ('modifiers' in child && Array.isArray(child.modifiers)) {
            const layoutMod = child.modifiers.find(
              m =>
                m.type === 'layout' &&
                m.properties &&
                'layoutPriority' in m.properties
            )
            if (
              layoutMod &&
              typeof layoutMod.properties.layoutPriority === 'number'
            ) {
              childPriority = layoutMod.properties.layoutPriority
            }
          }

          return nodeArray.map(node => {
            if (node.type === 'element') {
              const isHighestPriority = child === highestPriorityChild
              return {
                ...node,
                props: {
                  ...node.props,
                  style: {
                    ...node.props?.style,
                    // Highest priority child determines container size
                    ...(isHighestPriority
                      ? {
                          position: 'relative',
                          zIndex: childPriority,
                        }
                      : {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          zIndex: childPriority,
                        }),
                  },
                },
              }
            }
            return node
          })
        })

        return [
          {
            type: 'element' as const,
            tag: this.effectiveTag,
            props: {
              ...container.props,
              className: classString,
            },
            children: renderedChildren,
            // Add component metadata for semantic role processing
            componentMetadata: {
              originalType: 'ZStack',
              overriddenTo:
                this.effectiveTag !== 'div' ? this.effectiveTag : undefined,
              validationResult: this.validationResult,
            },
          },
        ]
      }

      default:
        return [
          {
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
          },
        ]
    }
  }
}

/**
 * Layout container components with modifier support
 */
export const Layout = {
  /**
   * Vertical stack container (flexbox column)
   */
  VStack: (
    props: {
      children?: ComponentInstance[]
      spacing?: number
      alignment?: 'leading' | 'center' | 'trailing'
    } = {}
  ) => {
    const { children = [], spacing = 0, alignment = 'center' } = props
    const component = new LayoutComponent(props, 'vstack', children, {
      spacing,
      alignment,
    })
    return withModifiers(component)
  },

  /**
   * Horizontal stack container (flexbox row)
   */
  HStack: (
    props: {
      children?: ComponentInstance[]
      spacing?: number
      alignment?: 'top' | 'center' | 'bottom'
    } = {}
  ) => {
    const { children = [], spacing = 0, alignment = 'center' } = props
    const component = new LayoutComponent(props, 'hstack', children, {
      spacing,
      alignment,
    })
    return withModifiers(component)
  },

  /**
   * Z-index stack container (absolute positioning)
   */
  ZStack: (
    props: {
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
    } = {}
  ) => {
    const { children = [], alignment = 'center' } = props
    const component = new LayoutComponent(props, 'zstack', children, {
      alignment,
    })
    return withModifiers(component)
  },
}

/**
 * Utility to wrap any component with modifier support
 */
export function wrapComponent<P extends ComponentProps>(
  component: ComponentInstance<P>
): ModifiableComponent<P> & {
  modifier: ModifierBuilder<ModifiableComponent<P>>
} {
  return withModifiers(component)
}

/**
 * Higher-order component wrapper
 */
export function withModifierSupport<P extends ComponentProps>(
  ComponentClass: new (props: P) => ComponentInstance<P>
) {
  return class extends ComponentClass {
    public _modifiableComponent?: ModifiableComponent<P>

    constructor(props: P) {
      super(props)
      this._modifiableComponent = withModifiers(this)
    }

    get modifier(): ModifierBuilder<ModifiableComponent<P>> {
      return createModifierBuilder(this._modifiableComponent!)
    }

    get modifiers() {
      return this._modifiableComponent!.modifiers
    }
  }
}

/**
 * Factory function for creating modifiable components
 */
export function createModifiableComponentFactory<P extends ComponentProps>(
  renderFn: (props: P) => DOMNode | DOMNode[]
) {
  return (props: P) => {
    // Create a simple component instance that uses the render function
    const component: ComponentInstance<P> = {
      type: 'component' as const,
      id: `factory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      props,
      mounted: false,
      cleanup: [],
      render() {
        const result = renderFn(props)
        return Array.isArray(result) ? result : [result]
      },
    }
    return withModifiers(component)
  }
}
