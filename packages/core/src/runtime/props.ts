/**
 * Props and Children Handling System (Phase 3.1.2)
 *
 * Type-safe props system with reactive updates, children handling,
 * and component composition patterns.
 */

import type { ModifierBuilder } from '../modifiers/types'
import { createComputed, createEffect, createSignal } from '../reactive'
import type {
  ChildrenRenderer,
  ComponentChildren,
  ComponentInstance,
  ComponentProps,
  ComponentRef,
  DOMNode,
  Fragment,
  Ref,
  ValidatedProps,
} from './types'

/**
 * Props manager for handling component props reactively
 */
export class PropsManager<P extends ComponentProps = ComponentProps> {
  private propsSignal: [() => P, (props: P) => void]
  private childrenSignal: [() => ComponentChildren, (children: ComponentChildren) => void]
  private changedKeys = new Set<keyof P>()

  constructor(
    initialProps: P,
    private validator?: ValidatedProps<P>
  ) {
    // Create reactive signals for props and children
    this.propsSignal = createSignal(this.validateAndMergeProps(initialProps))
    this.childrenSignal = createSignal(initialProps.children)

    // Track prop changes
    createEffect(() => {
      const props = this.propsSignal[0]()
      this.trackChanges(props)
    })
  }

  /**
   * Get current props reactively
   */
  getProps(): P {
    return this.propsSignal[0]()
  }

  /**
   * Update props with validation and change detection
   */
  setProps(newProps: Partial<P>): void {
    const currentProps = this.propsSignal[0]()
    const mergedProps = { ...currentProps, ...newProps } as P
    const validatedProps = this.validateAndMergeProps(mergedProps)

    // Track which keys changed
    this.changedKeys.clear()
    Object.keys(newProps).forEach((key) => {
      if (currentProps[key as keyof P] !== newProps[key as keyof P]) {
        this.changedKeys.add(key as keyof P)
      }
    })

    this.propsSignal[1](validatedProps)

    // Update children separately if it changed
    if (newProps.children !== undefined) {
      this.childrenSignal[1](newProps.children)
    }
  }

  /**
   * Get current children reactively
   */
  getChildren(): ComponentChildren {
    return this.childrenSignal[0]()
  }

  /**
   * Set children directly
   */
  setChildren(children: ComponentChildren): void {
    this.childrenSignal[1](children)
  }

  /**
   * Get keys that changed in last update
   */
  getChangedKeys(): (keyof P)[] {
    return Array.from(this.changedKeys)
  }

  /**
   * Create reactive computed for a specific prop
   */
  createPropComputed<K extends keyof P>(key: K): () => P[K] {
    return createComputed(() => this.getProps()[key])
  }

  /**
   * Create effect that runs when specific props change
   */
  createPropsEffect(
    keys: (keyof P)[],
    effect: (props: P, changedKeys: (keyof P)[]) => void
  ): () => void {
    const effectComputation = createEffect(() => {
      const props = this.getProps()
      const changed = this.getChangedKeys()

      // Check if any of the specified keys changed or it's the first run
      const hasChanges = changed.length === 0 || keys.some((key) => changed.includes(key))
      if (hasChanges) {
        effect(
          props,
          changed.filter((key) => keys.includes(key))
        )
      }
    })

    return () => effectComputation.dispose()
  }

  private validateAndMergeProps(props: P): P {
    let validatedProps = props

    // Apply defaults
    if (this.validator?.defaults) {
      validatedProps = { ...this.validator.defaults, ...props } as P
    }

    // Validate required props
    if (this.validator?.required) {
      for (const key of this.validator.required) {
        if (validatedProps[key] === undefined || validatedProps[key] === null) {
          throw new Error(`Required prop '${String(key)}' is missing`)
        }
      }
    }

    // Run custom validator
    if (this.validator?.validator) {
      const result = this.validator.validator(validatedProps)
      if (typeof result === 'string') {
        throw new Error(`Props validation failed: ${result}`)
      } else if (result === false) {
        throw new Error('Props validation failed')
      }
    }

    return validatedProps
  }

  private trackChanges(_props: P): void {
    // This will be called reactively when props change
    // Additional change tracking logic can be added here
  }
}

/**
 * Children manager for handling component composition
 */
export class ChildrenManager {
  private childrenSignal: [() => ComponentChildren, (children: ComponentChildren) => void]

  constructor(initialChildren: ComponentChildren = null) {
    this.childrenSignal = createSignal<ComponentChildren>(initialChildren)
  }

  /**
   * Get current children reactively
   */
  getChildren(): ComponentChildren {
    return this.childrenSignal[0]()
  }

  /**
   * Set new children
   */
  setChildren(children: ComponentChildren): void {
    this.childrenSignal[1](children)
  }

  /**
   * Render children to DOM nodes
   */
  renderChildren(): DOMNode[] {
    const children = this.getChildren()
    return this.renderChildrenArray(Array.isArray(children) ? children : [children])
  }

  /**
   * Create fragment with multiple children
   */
  createFragment(children: ComponentChildren[]): Fragment {
    return { children }
  }

  /**
   * Map children with a function
   */
  mapChildren<T>(mapper: (child: ComponentChildren, index: number) => T): T[] {
    const children = this.getChildren()
    const childArray = Array.isArray(children) ? children : [children]
    return childArray.map(mapper)
  }

  /**
   * Filter children
   */
  filterChildren(
    predicate: (child: ComponentChildren, index: number) => boolean
  ): ComponentChildren[] {
    const children = this.getChildren()
    const childArray = Array.isArray(children) ? children : [children]
    return childArray.filter(predicate)
  }

  /**
   * Count non-null children
   */
  countChildren(): number {
    const children = this.getChildren()
    if (children === null || children === undefined) return 0
    if (Array.isArray(children)) {
      return children.filter((child) => child !== null && child !== undefined).length
    }
    return 1
  }

  private renderChildrenArray(children: ComponentChildren[]): DOMNode[] {
    const nodes: DOMNode[] = []

    for (const child of children) {
      if (child === null || child === undefined) {
        continue
      }

      if (typeof child === 'string' || typeof child === 'number') {
        nodes.push({
          type: 'text',
          text: String(child),
        })
      } else if (typeof child === 'boolean') {
      } else if (typeof child === 'function') {
        // Render function children
        const result = child()
        if (Array.isArray(result)) {
          nodes.push(...result)
        } else {
          nodes.push(result)
        }
      } else if (Array.isArray(child)) {
        // Nested array of children
        nodes.push(...this.renderChildrenArray(child))
      } else if (isModifierBuilder(child)) {
        // ModifierBuilder - build before rendering so auto-build logic always runs
        const builtChild = child.build()
        const result = builtChild.render()
        if (Array.isArray(result)) {
          nodes.push(...result)
        } else {
          nodes.push(result)
        }
      } else if (typeof child === 'object' && child !== null && 'render' in child) {
        // Component instance - auto-build if it still exposes ModifierBuilder API
        let componentToRender = child
        if ('build' in child && typeof child.build === 'function') {
          componentToRender = child.build()
        }

        const result = componentToRender.render()
        if (Array.isArray(result)) {
          nodes.push(...result)
        } else {
          nodes.push(result)
        }
      }
    }

    return nodes
  }
}

/**
 * Ref manager for component references
 */
export class RefManager<T = any> {
  private ref: ComponentRef<T>

  constructor(initialValue: T | null = null) {
    this.ref = { current: initialValue }
  }

  /**
   * Get the ref object
   */
  getRef(): ComponentRef<T> {
    return this.ref
  }

  /**
   * Set ref value
   */
  setValue(value: T | null): void {
    this.ref.current = value
  }

  /**
   * Get current ref value
   */
  getValue(): T | null {
    return this.ref.current
  }

  /**
   * Apply ref (handle both ref objects and callback refs)
   */
  static applyRef<T>(ref: Ref<T> | undefined, value: T | null): void {
    if (!ref) return

    if (typeof ref === 'function') {
      // Callback ref
      ref(value)
    } else if (typeof ref === 'object' && ref !== null) {
      // Ref object
      ref.current = value
    }
  }

  /**
   * Create a new ref
   */
  static createRef<T = any>(initialValue: T | null = null): ComponentRef<T> {
    return { current: initialValue }
  }

  /**
   * Forward ref to another component
   */
  static forwardRef<T, P extends ComponentProps>(
    render: (props: P, ref: Ref<T> | undefined) => DOMNode | DOMNode[]
  ): (props: P & { ref?: Ref<T> }) => DOMNode | DOMNode[] {
    return (props: P & { ref?: Ref<T> }) => {
      const { ref, ...restProps } = props
      return render(restProps as P, ref || undefined)
    }
  }
}

/**
 * Create props manager with validation
 */
export function createPropsManager<P extends ComponentProps>(
  initialProps: P,
  validation?: ValidatedProps<P>
): PropsManager<P> {
  return new PropsManager(initialProps, validation)
}

/**
 * Create children manager
 */
export function createChildrenManager(initialChildren?: ComponentChildren): ChildrenManager {
  return new ChildrenManager(initialChildren)
}

function isModifierBuilder(
  value: unknown
): value is ModifierBuilder<ComponentInstance> {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const hasBuild = 'build' in value && typeof (value as any).build === 'function'
  if (!hasBuild) {
    return false
  }

  const hasRender = 'render' in value && typeof (value as any).render === 'function'
  return !hasRender
}

/**
 * Create ref manager
 */
export function createRefManager<T = any>(initialValue?: T | null): RefManager<T> {
  return new RefManager(initialValue)
}

/**
 * Utility functions for props handling
 */
export const propsUtils = {
  /**
   * Compare props for changes
   */
  compareProps<P extends ComponentProps>(prevProps: P, nextProps: P): (keyof P)[] {
    const changedKeys: (keyof P)[] = []

    // Check all keys from both objects
    const allKeys = new Set([...Object.keys(prevProps), ...Object.keys(nextProps)])

    for (const key of allKeys) {
      if (prevProps[key as keyof P] !== nextProps[key as keyof P]) {
        changedKeys.push(key as keyof P)
      }
    }

    return changedKeys
  },

  /**
   * Shallow compare props
   */
  shallowEqual<P extends ComponentProps>(prevProps: P, nextProps: P): boolean {
    const prevKeys = Object.keys(prevProps)
    const nextKeys = Object.keys(nextProps)

    if (prevKeys.length !== nextKeys.length) {
      return false
    }

    for (const key of prevKeys) {
      if (prevProps[key as keyof P] !== nextProps[key as keyof P]) {
        return false
      }
    }

    return true
  },

  /**
   * Pick specific props
   */
  pickProps<P extends ComponentProps, K extends keyof P>(props: P, keys: K[]): Pick<P, K> {
    const picked = {} as Pick<P, K>
    for (const key of keys) {
      picked[key] = props[key]
    }
    return picked
  },

  /**
   * Omit specific props
   */
  omitProps<P extends ComponentProps, K extends keyof P>(props: P, keys: K[]): Omit<P, K> {
    const omitted = { ...props } as any
    for (const key of keys) {
      delete omitted[key]
    }
    return omitted
  },
}

/**
 * Default children renderer
 */
export const defaultChildrenRenderer: ChildrenRenderer = (children) => {
  const manager = new ChildrenManager(children)
  return manager.renderChildren()
}
