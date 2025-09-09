/**
 * Modifier Registry and Application System
 *
 * Manages registration, storage, and application of modifiers to components.
 * Provides a centralized system for custom modifier registration and application.
 */

import type {
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../runtime/types'
import { createModifierBuilder } from './builder'
import type {
  ModifiableComponent,
  Modifier,
  ModifierApplicationOptions,
  ModifierContext,
  ModifierFactory,
  ModifierRegistry,
} from './types'
import type { Concatenatable, ComponentSegment } from '../concatenation/types'
import { ConcatenatedComponent } from '../concatenation/concatenated-component'

// Pure ESM module singleton - no globalThis

// Pure ESM module singleton - no globalThis
let registryInstance: ModifierRegistryImpl | null = null

/**
 * Pure ESM singleton modifier registry implementation
 */
export class ModifierRegistryImpl implements ModifierRegistry {
  private modifiers = new Map<string, ModifierFactory<any>>()

  static getInstance(): ModifierRegistryImpl {
    if (!registryInstance) {
      registryInstance = new ModifierRegistryImpl()
    } else {
    }

    return registryInstance
  }

  register<TProps>(name: string, factory: ModifierFactory<TProps>): void {
    this.modifiers.set(name, factory)
  }

  get<TProps>(name: string): ModifierFactory<TProps> | undefined {
    const result = this.modifiers.get(name) as
      | ModifierFactory<TProps>
      | undefined
    if (!result) {
    }
    return result
  }

  has(name: string): boolean {
    return this.modifiers.has(name)
  }

  list(): string[] {
    return Array.from(this.modifiers.keys())
  }

  clear(): void {
    this.modifiers.clear()
  }
}

/**
 * Global modifier registry instance using singleton pattern
 */
export const globalModifierRegistry = ModifierRegistryImpl.getInstance()

/**
 * Create a new modifier registry (returns singleton for consistency)
 */
export function createModifierRegistry(): ModifierRegistry {
  return ModifierRegistryImpl.getInstance()
}

/**
 * Apply modifiers to a DOM node
 */
export function applyModifiersToNode(
  node: DOMNode,
  modifiers: Modifier[],
  context: Partial<ModifierContext> = {},
  options: ModifierApplicationOptions = {}
): DOMNode {
  if (!modifiers.length) return node

  const fullContext: ModifierContext = {
    componentId: context.componentId || 'unknown',
    phase: context.phase || 'creation',
    ...(context.element && { element: context.element }),
    ...(context.parentElement && { parentElement: context.parentElement }),
    ...(context.componentInstance && {
      componentInstance: context.componentInstance,
    }),
    ...(context.previousModifiers && {
      previousModifiers: context.previousModifiers,
    }),
  }

  const strategy = options.batch ? 'batch' : 'sequential'

  switch (strategy) {
    case 'batch':
      return applyModifiersBatch(node, modifiers, fullContext, options)
    default:
      return applyModifiersSequential(node, modifiers, fullContext, options)
  }
}

/**
 * Apply modifiers sequentially
 */
function applyModifiersSequential(
  node: DOMNode,
  modifiers: Modifier[],
  context: ModifierContext,
  options: ModifierApplicationOptions
): DOMNode {
  // Sort modifiers by priority
  const sortedModifiers = [...modifiers].sort((a, b) => a.priority - b.priority)

  let currentNode = node
  const effects: (() => void)[] = []
  const cleanup: (() => void)[] = []

  for (const modifier of sortedModifiers) {
    try {
      const result = modifier.apply(currentNode, context)

      if (result && typeof result === 'object' && 'type' in result) {
        currentNode = result
      }

      if (options.immediate && !options.suppressEffects) {
        // Apply effects immediately
        effects.forEach(effect => effect())
        effects.length = 0
      }
    } catch (error) {
      console.error(`Failed to apply modifier ${modifier.type}:`, error)
    }
  }

  // Store cleanup functions on the node
  if (cleanup.length > 0) {
    const existingCleanup = currentNode.dispose
    currentNode.dispose = () => {
      cleanup.forEach(fn => fn())
      if (existingCleanup) existingCleanup()
    }
  }

  return currentNode
}

/**
 * Apply modifiers in batch mode for better performance
 */
function applyModifiersBatch(
  node: DOMNode,
  modifiers: Modifier[],
  context: ModifierContext,
  options: ModifierApplicationOptions
): DOMNode {
  // Group modifiers by type for more efficient application
  const modifierGroups = groupModifiersByType(modifiers)

  let currentNode = node
  const allEffects: (() => void)[] = []
  const allCleanup: (() => void)[] = []

  // Apply each group
  for (const [type, groupModifiers] of modifierGroups) {
    try {
      currentNode = applyModifierGroup(currentNode, groupModifiers, context)
    } catch (error) {
      // Only log in non-test environments to avoid polluting test output
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.error(`Failed to apply modifier group ${type}:`, error)
      }
    }
  }

  // Apply all effects at once if not suppressed
  if (!options.suppressEffects) {
    allEffects.forEach(effect => effect())
  }

  // Store cleanup functions
  if (allCleanup.length > 0) {
    const existingCleanup = currentNode.dispose
    currentNode.dispose = () => {
      allCleanup.forEach(fn => fn())
      if (existingCleanup) existingCleanup()
    }
  }

  return currentNode
}

/**
 * Group modifiers by type for batch processing
 */
function groupModifiersByType(modifiers: Modifier[]): Map<string, Modifier[]> {
  const groups = new Map<string, Modifier[]>()

  for (const modifier of modifiers) {
    const existing = groups.get(modifier.type) || []
    existing.push(modifier)
    groups.set(modifier.type, existing)
  }

  return groups
}

/**
 * Apply a group of modifiers of the same type
 */
function applyModifierGroup(
  node: DOMNode,
  modifiers: Modifier[],
  context: ModifierContext
): DOMNode {
  // Sort by priority within the group
  const sortedModifiers = [...modifiers].sort((a, b) => a.priority - b.priority)

  let currentNode = node

  for (const modifier of sortedModifiers) {
    try {
      const result = modifier.apply(currentNode, context)
      if (result && typeof result === 'object' && 'type' in result) {
        currentNode = result
      }
    } catch (error) {
      // In batch mode, individual modifier failures shouldn't break the entire batch
      // Only log in non-test environments to avoid polluting test output
      if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
        console.error(`Failed to apply modifier ${modifier.type}:`, error)
      }
      // Continue with the next modifier
    }
  }

  return currentNode
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
 * Create a modifiable component from a regular component
 */
export function createModifiableComponent<P extends ComponentProps>(
  component: ComponentInstance<P>,
  initialModifiers: Modifier[] = []
): ModifiableComponent<P> {
  // Create a proper copy to avoid shared references
  const modifiableComponent: ModifiableComponent<P> = {
    type: component.type,
    id: component.id,
    props: { ...component.props },
    mounted: component.mounted,
    cleanup: component.cleanup ? [...component.cleanup] : [],
    modifiers: [...initialModifiers],
    modifierBuilder: null as any, // Will be set after component is created
    render: component.render ? component.render.bind(component) : () => [], // Bind to original component or provide default
  }

  // Create modifier builder with the modifiable component so it can update the right modifiers array
  modifiableComponent.modifierBuilder = createModifierBuilder(
    modifiableComponent
  ) as any

  // Store reference to modifiable component so Button can access modifiers
  ;(component as any).modifiableComponent = modifiableComponent

  // CRITICAL: Preserve enhanced lifecycle hooks when creating modifiable components
  const enhancedLifecycle = (component as any)._enhancedLifecycle
  if (enhancedLifecycle) {
    // Preserve the enhanced lifecycle hooks
    ;(modifiableComponent as any)._enhancedLifecycle = enhancedLifecycle

    // Also preserve other component properties that might be important
    if ('domElements' in component) {
      ;(modifiableComponent as any).domElements = component.domElements
    }
    if ('primaryElement' in component) {
      ;(modifiableComponent as any).primaryElement = component.primaryElement
    }
    if ('domReady' in component) {
      ;(modifiableComponent as any).domReady = component.domReady
    }
    if ('children' in component) {
      ;(modifiableComponent as any).children = component.children
    }
  }

  // Enhance the render function to apply modifiers
  const originalRender = component.render
    ? component.render.bind(component)
    : () => []
  modifiableComponent.render = () => {
    const renderResult = originalRender()
    const nodes = Array.isArray(renderResult) ? renderResult : [renderResult]

    // Attach modifiers to each node for later application without breaking component structure
    return nodes.map((node: any) => {
      // Preserve the original node and just add modifier metadata
      if (node && typeof node === 'object') {
        // Use direct property assignment instead of spread to preserve prototypes
        node.modifiers = modifiableComponent.modifiers
        node.componentId = component.id
        return node
      }
      return node
    })
  }

  // If the original component supports concatenation, add concatenation methods to modifiable component
  if (isConcatenatable(component)) {
    ;(modifiableComponent as any).concat = function <
      U extends Concatenatable<any>,
    >(other: U): ConcatenatedComponent<P | U> {
      // Create segment for this modifiable component
      const thisSegment: ComponentSegment = {
        id: modifiableComponent.id,
        component: modifiableComponent,
        modifiers: modifiableComponent.modifiers,
        render: () => {
          const result = modifiableComponent.render()
          return Array.isArray(result) ? result[0] : result
        },
      }

      // Get segment from other component
      const otherSegment = other.toSegment()

      // Create concatenated component with appropriate metadata
      const metadata = {
        totalSegments:
          other instanceof ConcatenatedComponent
            ? other.segments.length + 1
            : 2,
        accessibilityRole: 'text' as const, // Simplified for now
        semanticStructure: 'inline' as const, // Simplified for now
      }

      if (other instanceof ConcatenatedComponent) {
        return new ConcatenatedComponent(
          [thisSegment, ...other.segments],
          metadata
        )
      }

      return new ConcatenatedComponent([thisSegment, otherSegment], metadata)
    }
    ;(modifiableComponent as any).toSegment = function (): ComponentSegment {
      return {
        id: modifiableComponent.id,
        component: modifiableComponent,
        modifiers: modifiableComponent.modifiers,
        render: () => {
          const result = modifiableComponent.render()
          return Array.isArray(result) ? result[0] : result
        },
      }
    }
    ;(modifiableComponent as any).isConcatenatable = function (): boolean {
      return true
    }
  }

  return modifiableComponent
}

/**
 * Update modifiers on an existing modifiable component
 */
export function updateComponentModifiers<P extends ComponentProps>(
  component: ModifiableComponent<P>,
  newModifiers: Modifier[],
  _options: ModifierApplicationOptions = {}
): void {
  // const _previousModifiers = component.modifiers
  component.modifiers = [...newModifiers]

  // If the component is mounted, reapply modifiers
  if (component.mounted && component.context) {
    // This would require access to the actual DOM element
    // Implementation would depend on the component mounting system
  }
}

/**
 * Modifier application utilities
 */
export const modifierApplicationUtils = {
  /**
   * Check if a component has specific modifier types
   */
  hasModifierOfType(component: ModifiableComponent, type: string): boolean {
    return component.modifiers.some(modifier => modifier.type === type)
  },

  /**
   * Get modifiers of a specific type from a component
   */
  getModifiersOfType(component: ModifiableComponent, type: string): Modifier[] {
    return component.modifiers.filter(modifier => modifier.type === type)
  },

  /**
   * Remove modifiers of a specific type from a component
   */
  removeModifiersOfType(component: ModifiableComponent, type: string): void {
    component.modifiers = component.modifiers.filter(
      modifier => modifier.type !== type
    )
  },

  /**
   * Replace modifiers of a specific type
   */
  replaceModifiersOfType(
    component: ModifiableComponent,
    type: string,
    newModifiers: Modifier[]
  ): void {
    // Remove existing modifiers of this type
    component.modifiers = component.modifiers.filter(
      modifier => modifier.type !== type
    )

    // Add new modifiers
    component.modifiers.push(...newModifiers)
  },

  /**
   * Get the total number of modifiers on a component
   */
  getModifierCount(component: ModifiableComponent): number {
    return component.modifiers.length
  },

  /**
   * Check if two modifier arrays are equivalent
   */
  areModifiersEqual(modifiers1: Modifier[], modifiers2: Modifier[]): boolean {
    if (modifiers1.length !== modifiers2.length) return false

    for (let i = 0; i < modifiers1.length; i++) {
      const m1 = modifiers1[i]
      const m2 = modifiers2[i]

      if (m1.type !== m2.type || m1.priority !== m2.priority) {
        return false
      }

      // Deep compare properties (simplified)
      if (JSON.stringify(m1.properties) !== JSON.stringify(m2.properties)) {
        return false
      }
    }

    return true
  },
}
