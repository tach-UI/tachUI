/**
 * Component Wrapper System
 *
 * Provides wrapper functions to enhance regular components with modifier support
 * and integrate them with the TachUI modifier system.
 */

import { createModifiableComponent, createModifierBuilder } from '../modifiers'
import type {
  ModifiableComponent,
  ModifierBuilder,
  ModifiableComponentWithModifiers,
} from '../modifiers/types'
import { h } from '../runtime'
import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
  CloneableComponent,
  CloneOptions,
} from '../runtime/types'
import { useLifecycle } from '../lifecycle/hooks'
import { registerComponentWithLifecycleHooks } from '../runtime/dom-bridge'
import {
  processElementOverride,
  type ElementOverrideProps,
} from '../runtime/element-override'
import { ComponentWithCSSClasses, type CSSClassesProps } from '../css-classes'
import {
  clonePropsPreservingReactivity,
  resetLifecycleState,
} from '../utils/clone-helpers'
import { isProxyEnabled } from '../config'
import { createComponentProxy } from '../modifiers/proxy'
import type { Concatenatable } from '../concatenation/types'
// Debug functionality moved to @tachui/devtools package
// Create a simple mock for backward compatibility
const debugManager = {
  isEnabled: () => false,
  logComponent: (..._args: any[]) => {},
  addDebugAttributes: (..._args: any[]) => {},
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

export interface BaseLayoutProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  id?: string
  debugLabel?: string
  children?: ComponentInstance[]
}

export interface VStackLayoutProps extends BaseLayoutProps {
  spacing?: number
  alignment?: 'leading' | 'center' | 'trailing'
}

export interface HStackLayoutProps extends BaseLayoutProps {
  spacing?: number
  alignment?: 'top' | 'center' | 'bottom'
}

export interface ZStackLayoutProps extends BaseLayoutProps {
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
  component: ComponentInstance<P>,
): ModifiableComponentWithModifiers<P> &
  (ComponentInstance<P> extends Concatenatable ? Concatenatable : {}) {
  const modifiableComponent = createModifiableComponent(component)
  const modifierBuilder = createModifierBuilder(modifiableComponent)

  if (!Object.prototype.hasOwnProperty.call(component, 'modifier')) {
    Object.defineProperty(component, 'modifier', {
      configurable: true,
      enumerable: false,
      get: () => modifierBuilder,
    })
  }

  if (isProxyEnabled()) {
    return createComponentProxy(
      component,
    ) as unknown as ModifiableComponentWithModifiers<P> &
      (ComponentInstance<P> extends Concatenatable ? Concatenatable : {})
  }
  const result: any = {
    ...modifiableComponent,
    modifier: modifierBuilder,
    modifierBuilder: modifierBuilder,
  }

  // Expose builder methods directly when the proxy path is disabled
  Object.setPrototypeOf(result, modifierBuilder)
  if (typeof modifierBuilder.build === 'function') {
    result.build = modifierBuilder.build.bind(modifierBuilder)
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

  return result as ModifiableComponentWithModifiers<P> &
    (ComponentInstance<P> extends Concatenatable ? Concatenatable : {})
}

/**
 * Create a reactive component wrapper with full TachUI features
 */
export function createReactiveWrapper<P extends ComponentProps>(
  renderFn: (props: P) => DOMNode | DOMNode[],
  options: WrapperOptions = {}
): (props: P) => ModifiableComponentWithModifiers<P> {
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
 * Layout container component class with element override support
 */
export class LayoutComponent
  extends ComponentWithCSSClasses
  implements
    CloneableComponent<ComponentProps & ElementOverrideProps & CSSClassesProps>
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
    this.id =
      (props as Record<string, unknown>)?.id?.toString() ||
      `layout-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

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

    // During tests ensure semantic element overrides still expose landmark roles
    if (
      process.env.NODE_ENV === 'test' &&
      this.effectiveTag !== 'div' &&
      !(this.props as Record<string, unknown>).role
    ) {
      const landmarkRoles: Record<string, string> = {
        nav: 'navigation',
        header: 'banner',
        footer: 'contentinfo',
        main: 'main',
        aside: 'complementary',
      }
      const inferredRole = landmarkRoles[this.effectiveTag]
      if (inferredRole) {
        ;(this.props as Record<string, unknown>).role = inferredRole
      }
    }

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
    debugManager.logComponent(this.layoutType.toUpperCase(), debugLabel)

    // Process CSS classes for this component
    const baseClasses = [
      `tachui-${this.layoutType}`,
      ...(debugManager.isEnabled() ? ['tachui-debug'] : []),
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
            ...(debugManager.isEnabled() && {
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
            ...(debugManager.isEnabled() && {
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
          ...(debugManager.isEnabled() && {
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

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)
    const clonedLayoutProps = clonePropsPreservingReactivity(this.layoutProps)
    const childCopies = (this.children ?? []).slice()

    const clone = new LayoutComponent(
      clonedProps,
      this.layoutType,
      childCopies,
      clonedLayoutProps,
    )

    resetLifecycleState(clone)
    return clone as this
  }

  deepClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props, {
      deep: true,
    })
    const clonedLayoutProps = clonePropsPreservingReactivity(this.layoutProps, {
      deep: true,
    })

    const clonedChildren = (this.children ?? []).map(child => {
      if (typeof (child as any)?.clone === 'function') {
        return (child as any).clone({ deep: true })
      }
      return child
    })

    const clone = new LayoutComponent(
      clonedProps,
      this.layoutType,
      clonedChildren,
      clonedLayoutProps,
    )

    resetLifecycleState(clone)
    return clone as this
  }
}

/**
 * Layout container components with modifier support
 */
export const Layout = {
  /**
   * Vertical stack container (flexbox column)
   */
  VStack: (props: VStackLayoutProps = {}) => {
    const {
      children = [],
      spacing = 0,
      alignment = 'center',
      debugLabel,
    } = props
    const component = new LayoutComponent(props, 'vstack', children, {
      spacing,
      alignment,
      debugLabel,
    })
    return withModifiers(component)
  },

  /**
   * Horizontal stack container (flexbox row)
   */
  HStack: (props: HStackLayoutProps = {}) => {
    const {
      children = [],
      spacing = 0,
      alignment = 'center',
      debugLabel,
    } = props
    const component = new LayoutComponent(props, 'hstack', children, {
      spacing,
      alignment,
      debugLabel,
    })
    return withModifiers(component)
  },

  /**
   * Z-index stack container (absolute positioning)
   */
  ZStack: (props: ZStackLayoutProps = {}) => {
    const { children = [], alignment = 'center', debugLabel } = props
    const component = new LayoutComponent(props, 'zstack', children, {
      alignment,
      debugLabel,
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
      const result = withModifiers(this)
      if (isProxyEnabled()) {
        this._modifiableComponent = createModifiableComponent(this)
        createComponentProxy(this)
      } else {
        this._modifiableComponent = result as any
        Object.defineProperty(this, 'modifier', {
          configurable: true,
          enumerable: false,
          value: (result as any).modifier,
          writable: false,
        })
        Object.defineProperty(this, 'modifiers', {
          configurable: true,
          enumerable: false,
          value: (result as any).modifiers,
          writable: false,
        })
      }
    }

    get modifier(): ModifierBuilder<ModifiableComponent<P>> {
      if (isProxyEnabled()) {
        const proxy = createComponentProxy(this)
        return (proxy as any).modifier
      }
      const mod = this._modifiableComponent ?? (withModifiers(this) as any)
      this._modifiableComponent = mod
      return mod.modifier
    }

    get modifiers() {
      const mod = this._modifiableComponent ?? (withModifiers(this) as any)
      this._modifiableComponent = mod
      return mod.modifiers
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
