# Phase 0: Clone Reference Implementations

**Date**: 2025-10-21
**Purpose**: Reference implementations for component clone() methods
**Related**: Phase0-Component-Clone-Audit.md, SwiftModifiers-Implementation-Plan.md Phase 2

## Overview

This document provides reference implementations for the `clone()` method across different component complexity levels. These serve as templates for implementing clone support across all TachUI components.

## Base Interface

```typescript
/**
 * Clone options for component cloning
 */
export interface CloneOptions {
  /** Perform deep clone of children (default: false) */
  deep?: boolean
}

/**
 * Cloneable interface that all components should implement
 */
export interface Cloneable {
  /**
   * Clone this component, optionally with deep cloning of children
   */
  clone(options?: CloneOptions): this

  /**
   * Internal: Perform shallow clone (override in subclasses)
   */
  shallowClone(): this

  /**
   * Internal: Perform deep clone (override in subclasses)
   */
  deepClone(): this
}
```

## Helper Utilities

### 1. Clone Props with Reactivity Preservation

```typescript
// packages/core/src/utils/clone-helpers.ts

import type { Signal } from '../reactive/types'

/**
 * Check if value is a Signal
 */
export function isSignal(value: any): value is Signal<any> {
  return (
    value &&
    typeof value === 'function' &&
    typeof value.set === 'function'
  )
}

/**
 * Check if value is an Asset (has resolve method)
 */
export function isAsset(value: any): boolean {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'resolve' in value &&
    typeof value.resolve === 'function'
  )
}

/**
 * Check if value is a Component
 */
export function isComponent(value: any): boolean {
  return (
    value &&
    typeof value === 'object' &&
    'type' in value &&
    value.type === 'component' &&
    'render' in value
  )
}

/**
 * Deep clone props object, preserving signal and asset references
 *
 * @param props - Props object to clone
 * @returns Cloned props with preserved reactivity
 */
export function clonePropsPreservingReactivity<T>(
  props: T,
  options: CloneOptions = {}
): T {
  const cloned = {} as T

  for (const [key, value] of Object.entries(props)) {
    if (isSignal(value) || isAsset(value)) {
      // Preserve reference to reactive values and assets
      cloned[key as keyof T] = value
    } else if (Array.isArray(value)) {
      // Deep clone arrays
      if (options.deep && value.some(isComponent)) {
        // Deep clone component children
        cloned[key as keyof T] = value.map(item =>
          isComponent(item) ? item.clone(options) : item
        ) as any
      } else {
        // Shallow clone array
        cloned[key as keyof T] = [...value] as any
      }
    } else if (typeof value === 'object' && value !== null) {
      // Deep clone plain objects (but not DOM elements)
      if (value instanceof Element || value instanceof Node) {
        // Don't clone DOM elements
        cloned[key as keyof T] = undefined as any
      } else {
        cloned[key as keyof T] = { ...value } as any
      }
    } else {
      // Primitive values (shallow copy)
      cloned[key as keyof T] = value
    }
  }

  return cloned
}

/**
 * Create reset lifecycle state for cloned components
 */
export function createResetLifecycleState() {
  return {
    mounted: false,
    cleanup: [] as (() => void)[],
    domElements: undefined,
    domReady: false,
    primaryElement: undefined,
  }
}
```

## Implementation Examples

### Level 1: Simple Component (EnhancedText)

**Complexity**: 🟢 Simple
**Properties**: Simple props, no children, no state

```typescript
// packages/primitives/src/display/Text.ts

import type { Cloneable, CloneOptions } from '@tachui/core'
import { clonePropsPreservingReactivity, createResetLifecycleState } from '@tachui/core'

export class EnhancedText
  extends ComponentWithCSSClasses
  implements ComponentInstance<TextProps>, Concatenatable<TextProps>, Cloneable
{
  // ... existing properties ...

  /**
   * Clone this text component
   */
  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  /**
   * Shallow clone (fast path)
   */
  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)

    const cloned = new (this.constructor as any)(clonedProps) as this

    // Reset lifecycle state
    Object.assign(cloned, createResetLifecycleState())

    return cloned
  }

  /**
   * Deep clone (same as shallow for Text - no children)
   */
  deepClone(): this {
    return this.shallowClone()
  }
}
```

**Usage**:
```typescript
const originalText = Text('Hello World')
  .modifier.foregroundColor('red')
  .modifier.padding(16)

// Clone for branching
const clonedText = originalText.clone()
  .modifier.foregroundColor('blue') // Different color

// Original unchanged
expect(originalText.props.foregroundColor).not.toBe('blue')
```

### Level 2: Medium Component (LayoutComponent)

**Complexity**: 🟡 Medium
**Properties**: Props with children array, layout-specific properties

```typescript
// packages/primitives/src/layout/Stack.ts

import type { Cloneable, CloneOptions } from '@tachui/core'
import { clonePropsPreservingReactivity, createResetLifecycleState } from '@tachui/core'

export class LayoutComponent
  extends ComponentWithCSSClasses
  implements ComponentInstance<ComponentProps>, Cloneable
{
  // ... existing properties ...

  /**
   * Clone this layout component
   */
  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  /**
   * Shallow clone (children not cloned)
   */
  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)

    // Shallow clone children array (preserve child references)
    const clonedChildren = [...this.children]

    // Shallow clone layout props
    const clonedLayoutProps = { ...this.layoutProps }

    const cloned = new (this.constructor as any)(
      clonedProps,
      this.layoutType,
      clonedChildren,
      clonedLayoutProps
    ) as this

    // Reset lifecycle state
    Object.assign(cloned, createResetLifecycleState())

    // Preserve immutable properties
    Object.defineProperty(cloned, 'effectiveTag', {
      value: this.effectiveTag,
      writable: false,
      configurable: false,
    })

    return cloned
  }

  /**
   * Deep clone (children also cloned)
   */
  deepClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)

    // Deep clone children array
    const clonedChildren = this.children.map(child => {
      if (isComponent(child) && typeof child.clone === 'function') {
        return child.clone({ deep: true })
      }
      return child
    })

    // Shallow clone layout props
    const clonedLayoutProps = { ...this.layoutProps }

    const cloned = new (this.constructor as any)(
      clonedProps,
      this.layoutType,
      clonedChildren,
      clonedLayoutProps
    ) as this

    // Reset lifecycle state
    Object.assign(cloned, createResetLifecycleState())

    // Preserve immutable properties
    Object.defineProperty(cloned, 'effectiveTag', {
      value: this.effectiveTag,
      writable: false,
      configurable: false,
    })

    return cloned
  }
}
```

**Usage**:
```typescript
const originalStack = VStack({
  children: [
    Text('Child 1'),
    Text('Child 2'),
  ],
  spacing: 8,
})

// Shallow clone (children shared)
const shallowClone = originalStack.clone({ deep: false })
shallowClone.children[0] === originalStack.children[0] // true

// Deep clone (children cloned)
const deepClone = originalStack.clone({ deep: true })
deepClone.children[0] !== originalStack.children[0] // true
deepClone.children[0].props.content === originalStack.children[0].props.content // true
```

### Level 3: Complex Component (EnhancedButton)

**Complexity**: 🔴 Complex
**Properties**: Reactive state signals, theme reference, event handlers

```typescript
// packages/primitives/src/controls/Button.ts

import type { Cloneable, CloneOptions } from '@tachui/core'
import { createSignal, clonePropsPreservingReactivity, createResetLifecycleState } from '@tachui/core'

export class EnhancedButton
  extends ComponentWithCSSClasses
  implements ComponentInstance<ButtonProps>, Concatenatable<ButtonProps>, Cloneable
{
  // ... existing properties ...

  /**
   * Clone this button component
   */
  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  /**
   * Shallow clone
   */
  shallowClone(): this {
    const clonedProps = clonePropsPreservingReactivity(this.props)

    // Create new instance with cloned props and SAME theme (shared reference)
    const cloned = new (this.constructor as any)(
      clonedProps,
      this.theme // Preserve theme reference
    ) as this

    // Reset lifecycle state
    Object.assign(cloned, createResetLifecycleState())

    // Note: New stateSignal created automatically in constructor
    // This ensures cloned button has independent state

    return cloned
  }

  /**
   * Deep clone (same as shallow for Button - no children to deep clone)
   */
  deepClone(): this {
    return this.shallowClone()
  }
}
```

**Key Points for Button**:
1. **State Signal**: Constructor creates new `stateSignal` automatically
2. **Theme**: Preserve reference (shared configuration)
3. **Props**: Clone with reactivity preservation (signals preserved)
4. **Lifecycle**: Reset to allow new DOM attachment

**Usage**:
```typescript
const originalButton = Button('Click me', () => console.log('clicked'))
  .modifier.foregroundColor('red')
  .modifier.padding(16)

// Clone for variant
const clonedButton = originalButton.clone()
  .modifier.foregroundColor('blue')

// Independent state
originalButton.stateSignal() // 'normal'
clonedButton.stateSignal() // 'normal' (separate signal)

// Shared theme
originalButton.theme === clonedButton.theme // true
```

## Testing Strategy

### Clone Tests Template

```typescript
// __tests__/clone.test.ts
import { describe, it, expect } from 'vitest'
import { Button, Text, VStack } from '@tachui/primitives'

describe('Component Cloning', () => {
  describe('Simple Components', () => {
    it('should clone text component', () => {
      const original = Text('Hello')
      const cloned = original.clone()

      expect(cloned).not.toBe(original)
      expect(cloned.props.content).toBe(original.props.content)
      expect(cloned.id).toBe(original.id) // ID preserved
      expect(cloned.mounted).toBe(false) // Lifecycle reset
    })

    it('should preserve signals in cloned text', () => {
      const [text, setText] = createSignal('Hello')
      const original = Text(text)
      const cloned = original.clone()

      // Signal reference preserved
      expect(cloned.props.content).toBe(text)

      // Update signal
      setText('World')

      // Both components see update
      expect(original.props.content()).toBe('World')
      expect(cloned.props.content()).toBe('World')
    })
  })

  describe('Layout Components', () => {
    it('should shallow clone layout component', () => {
      const child1 = Text('Child 1')
      const child2 = Text('Child 2')
      const original = VStack({ children: [child1, child2] })

      const cloned = original.clone({ deep: false })

      expect(cloned).not.toBe(original)
      expect(cloned.children[0]).toBe(child1) // Shared reference
      expect(cloned.mounted).toBe(false)
    })

    it('should deep clone layout component', () => {
      const child1 = Text('Child 1')
      const child2 = Text('Child 2')
      const original = VStack({ children: [child1, child2] })

      const cloned = original.clone({ deep: true })

      expect(cloned).not.toBe(original)
      expect(cloned.children[0]).not.toBe(child1) // Cloned
      expect(cloned.children[0].props.content).toBe('Child 1') // Same content
      expect(cloned.mounted).toBe(false)
    })
  })

  describe('Complex Components', () => {
    it('should clone button with independent state', () => {
      const original = Button('Click me')
      const cloned = original.clone()

      // Independent instances
      expect(cloned).not.toBe(original)

      // Independent state
      expect(cloned.stateSignal).not.toBe(original.stateSignal)

      // Shared theme
      expect(cloned.theme).toBe(original.theme)

      // Reset lifecycle
      expect(cloned.mounted).toBe(false)
      expect(cloned.cleanup).toEqual([])
    })

    it('should preserve signal props in cloned button', () => {
      const [enabled, setEnabled] = createSignal(true)
      const original = Button('Click me', undefined, { isEnabled: enabled })
      const cloned = original.clone()

      // Signal preserved
      expect(cloned.props.isEnabled).toBe(enabled)

      // Update affects both
      setEnabled(false)
      expect(original.isEnabled()).toBe(false)
      expect(cloned.isEnabled()).toBe(false)
    })

    it('should preserve action handlers', () => {
      const actionCalled = { count: 0 }
      const action = () => { actionCalled.count++ }

      const original = Button('Click me', action)
      const cloned = original.clone()

      // Same action reference
      expect(cloned.props.action).toBe(action)

      // Call on clone
      cloned.props.action?.()
      expect(actionCalled.count).toBe(1)
    })
  })

  describe('Modifier Interaction', () => {
    it('should allow independent modification after clone', () => {
      const original = Text('Hello')
        .modifier.foregroundColor('red')

      const cloned = original.clone()
        .modifier.foregroundColor('blue')

      // Different modifiers
      expect(original.modifiers).not.toBe(cloned.modifiers)

      // Original unchanged
      const originalModifier = original.modifiers.find(m =>
        m.properties.foregroundColor === 'red'
      )
      expect(originalModifier).toBeDefined()

      // Clone has different color
      const clonedModifier = cloned.modifiers.find(m =>
        m.properties.foregroundColor === 'blue'
      )
      expect(clonedModifier).toBeDefined()
    })
  })
})
```

## Performance Considerations

### Clone Performance Targets

| Component Type | Shallow Clone | Deep Clone (3 children) | Deep Clone (10 children) |
|----------------|---------------|-------------------------|--------------------------|
| Simple (Text) | <0.01ms | N/A | N/A |
| Medium (VStack) | <0.02ms | <0.1ms | <0.3ms |
| Complex (Button) | <0.03ms | N/A | N/A |

### Optimization Techniques

1. **Lazy Cloning**: Only clone when `.clone()` is called
2. **Shallow by Default**: `clone()` defaults to shallow unless `deep: true`
3. **Reference Preservation**: Preserve signals, assets, themes (immutable)
4. **Minimal Object Creation**: Reuse constructor logic where possible

## Integration with Proxy System

```typescript
// When proxy system is enabled
if (globalModifierRegistry.isFeatureEnabled('proxyModifiers')) {
  // Proxy will intercept modifier calls and clone automatically
  const component = Button('Click')

  // This creates a clone internally
  const modified = component.padding(16) // Returns cloned proxy

  // Original unchanged
  expect(component).not.toBe(modified)
}
```

## Migration Guide

### Adding Clone Support to Existing Component

1. **Implement Cloneable Interface**:
```typescript
export class MyComponent implements Cloneable {
  // ... existing code ...

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    // Implementation here
  }

  deepClone(): this {
    // Implementation here
  }
}
```

2. **Use Helper Utilities**:
```typescript
import { clonePropsPreservingReactivity, createResetLifecycleState } from '@tachui/core'
```

3. **Write Clone Tests**:
```typescript
describe('MyComponent Cloning', () => {
  it('should clone correctly', () => {
    const original = new MyComponent(props)
    const cloned = original.clone()

    expect(cloned).not.toBe(original)
    expect(cloned.mounted).toBe(false)
  })
})
```

4. **Test with Modifiers**:
```typescript
it('should allow independent modification after clone', () => {
  const original = MyComponent(props).modifier.padding(16)
  const cloned = original.clone().modifier.padding(32)

  expect(original.modifiers[0].properties.padding).toBe(16)
  expect(cloned.modifiers[0].properties.padding).toBe(32)
})
```

## Checklist for Clone Implementation

- [ ] Implement `clone(options)` method
- [ ] Implement `shallowClone()` method
- [ ] Implement `deepClone()` method
- [ ] Use `clonePropsPreservingReactivity` helper
- [ ] Use `createResetLifecycleState` helper
- [ ] Preserve signal references
- [ ] Preserve asset references
- [ ] Preserve shared theme/config references
- [ ] Create new state signals if applicable
- [ ] Reset lifecycle properties
- [ ] Write clone tests
- [ ] Write signal preservation tests
- [ ] Write deep vs shallow clone tests
- [ ] Document clone behavior

---

**Reference Implementations Created**: 2025-10-21
**Next Steps**: Implement across all components
**Owner**: Implementation Team
