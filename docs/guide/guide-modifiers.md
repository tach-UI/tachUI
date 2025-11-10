---
cssclasses:
  - full-page
---

# Modifier Implementation Guide

> **Framework Version**: TachUI 1.0.0-alpha  
> **Last Updated**: September 4, 2025  
> **Audience**: Plugin developers and framework contributors

This guide covers how to properly implement modifiers in TachUI plugins, ensuring they integrate seamlessly with the core modifier system and provide the expected developer experience.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Creating a New Modifier](#creating-a-new-modifier)
3. [Registry Integration](#registry-integration)
4. [ModifierBuilder Integration](#modifierbuilder-integration)
5. [Testing Your Modifier](#testing-your-modifier)
6. [Best Practices](#best-practices)
7. [Examples](#examples)

---

## Architecture Overview

TachUI's modifier system is built on a **registry-based architecture** that allows plugins to register modifiers with the core system without creating circular dependencies:

```
┌─────────────────┐    ┌──────────────────┐    ┌───────────────────┐
│   @tachui/core  │    │ ModifierRegistry │    │ @tachui/modifiers │
│                 │◄───┤                  ├───►│                   │
│ ModifierBuilder │    │ Global Registry  │    │  PaddingModifier  │
│ .padding()      │    │                  │    │  MarginModifier   │
└─────────────────┘    └──────────────────┘    └───────────────────┘
```

### Key Components

- **BaseModifier**: Abstract base class all modifiers extend
- **ModifierRegistry**: Central registry for modifier factory functions
- **ModifierBuilder**: Provides fluent API (`.padding()`, `.margin()`, etc.)
- **Factory Functions**: Create modifier instances from properties

## Creating a New Modifier

### Step 1: Define the Modifier Class

All modifiers must extend `BaseModifier` and implement the required interface:

```typescript
import { BaseModifier } from '@tachui/core'
import type { DOMNode, ModifierContext } from '@tachui/core'

// 1. Define options interface
export interface MyModifierOptions {
  value: number | string
  color?: string
  enabled?: boolean
}

// 2. Create the modifier class
export class MyModifier extends BaseModifier<MyModifierOptions> {
  readonly type = 'myModifier' // Unique modifier type
  readonly priority = 150 // Application order (0-1000)

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const { value, color, enabled = true } = this.properties

    if (!enabled) return

    // Apply your modifier logic here
    if (context.element instanceof HTMLElement) {
      context.element.style.setProperty('--my-value', String(value))
      if (color) {
        context.element.style.setProperty('--my-color', color)
      }
    }

    return undefined // Most modifiers don't transform the DOM structure
  }
}
```

### Step 2: Create Factory Function

Factory functions provide a convenient API for creating modifier instances:

```typescript
/**
 * Apply custom styling to an element
 * @param value The value to apply
 * @param color Optional color override
 */
export function myModifier(value: number | string, color?: string): MyModifier {
  return new MyModifier({ value, color })
}

// Optional: Create preset factory functions
export function myModifierLarge(): MyModifier {
  return myModifier(24, '#007AFF')
}

export function myModifierSmall(): MyModifier {
  return myModifier(8)
}
```

### Step 3: Add TypeScript Declarations

Extend the `ModifierBuilder` interface to add your modifier methods:

```typescript
// In your package's types.ts file
declare module '@tachui/core' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance> {
    /**
     * Apply my custom modifier
     * @param value The value to apply
     * @param color Optional color override
     */
    myModifier(value: number | string, color?: string): ModifierBuilder<T>

    /**
     * Apply large preset
     */
    myModifierLarge(): ModifierBuilder<T>

    /**
     * Apply small preset
     */
    myModifierSmall(): ModifierBuilder<T>
  }
}
```

## Registry Integration

### Auto-Registration Pattern

Your plugin should automatically register its modifiers when imported:

```typescript
// src/index.ts
import { globalModifierRegistry } from '@tachui/core'
import {
  MyModifier,
  myModifier,
  myModifierLarge,
  myModifierSmall,
} from './my-modifier'

// Register the modifier factory
globalModifierRegistry.register('myModifier', (props: any) => {
  return new MyModifier(props)
})

// Register preset factories
globalModifierRegistry.register('myModifierLarge', () => {
  return myModifierLarge()
})

globalModifierRegistry.register('myModifierSmall', () => {
  return myModifierSmall()
})

// Export everything for direct usage
export { MyModifier, myModifier, myModifierLarge, myModifierSmall }
```

### Manual Registration API

For advanced use cases, provide manual registration utilities:

```typescript
export function registerMyModifiers(registry?: ModifierRegistry) {
  const target = registry || globalModifierRegistry

  target.register('myModifier', props => new MyModifier(props))
  target.register('myModifierLarge', () => myModifierLarge())
  target.register('myModifierSmall', () => myModifierSmall())
}

// Auto-register on import
registerMyModifiers()
```

## ModifierBuilder Integration

The `ModifierBuilder` uses the registry to resolve modifier methods. When a user calls:

```typescript
Text('Hello').myModifier(16, '#FF0000').build()
```

The builder:

1. Looks up `'myModifier'` in the global registry
2. Calls the factory function with the provided arguments
3. Adds the resulting modifier to the component

### Registry Lookup Implementation

Core's `ModifierBuilder` implements this pattern:

```typescript
// In ModifierBuilder (core implementation)
myModifier(value: number | string, color?: string): ModifierBuilder<T> {
  const factory = globalModifierRegistry.get('myModifier')

  if (factory) {
    const modifier = factory({ value, color })
    this.modifiers.push(modifier)
  } else {
    console.warn(
      'myModifier not registered. Import your plugin to register modifiers.'
    )
  }

  return this
}
```

## Testing Your Modifier

### Unit Tests

Test your modifier class directly:

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { MyModifier } from '../src/my-modifier'

describe('MyModifier', () => {
  let modifier: MyModifier
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    modifier = new MyModifier({ value: 16, color: '#FF0000' })
    mockElement = document.createElement('div')
    mockContext = {
      componentId: 'test',
      element: mockElement,
      phase: 'creation',
    }
  })

  it('should apply styles to element', () => {
    modifier.apply({ element: mockElement, children: [] }, mockContext)

    expect(mockElement.style.getPropertyValue('--my-value')).toBe('16')
    expect(mockElement.style.getPropertyValue('--my-color')).toBe('#FF0000')
  })

  it('should handle disabled state', () => {
    const disabledModifier = new MyModifier({ value: 16, enabled: false })

    disabledModifier.apply({ element: mockElement, children: [] }, mockContext)

    expect(mockElement.style.getPropertyValue('--my-value')).toBe('')
  })
})
```

### Integration Tests

Test the registry integration and ModifierBuilder usage:

```typescript
import { globalModifierRegistry, Text } from '@tachui/core'
import '../src/index' // Import to trigger auto-registration

describe('MyModifier Integration', () => {
  it('should register with global registry', () => {
    expect(globalModifierRegistry.has('myModifier')).toBe(true)
  })

  it('should work with ModifierBuilder', () => {
    const component = Text('Test').myModifier(16, '#FF0000').build()

    expect(component.modifiers).toHaveLength(1)
    expect(component.modifiers[0].type).toBe('myModifier')
    expect(component.modifiers[0].properties).toEqual({
      value: 16,
      color: '#FF0000',
    })
  })
})
```

### Stress Tests

Test performance and edge cases:

```typescript
describe('MyModifier Stress Tests', () => {
  it('should handle rapid application', () => {
    const modifiers = Array.from(
      { length: 1000 },
      (_, i) => new MyModifier({ value: i })
    )

    const startTime = performance.now()

    modifiers.forEach(modifier => {
      modifier.apply({ element: mockElement, children: [] }, mockContext)
    })

    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
  })
})
```

## Best Practices

### 1. Naming Conventions

- **Class names**: `PascalCase` ending in `Modifier` (e.g., `PaddingModifier`)
- **Factory functions**: `camelCase` matching the modifier concept (e.g., `padding`)
- **Registry keys**: Match factory function names exactly
- **Type identifiers**: `camelCase` matching the modifier concept (e.g., `'padding'`)

### 2. Priority Guidelines

Use consistent priority ranges to ensure proper application order:

```typescript
// Priority ranges (0-1000)
const PRIORITIES = {
  RESET: 0, // CSS resets
  LAYOUT: 100, // padding, margin, size, position
  APPEARANCE: 200, // backgroundColor, border, shadow
  TYPOGRAPHY: 250, // font, textAlign, lineHeight
  TRANSFORMS: 300, // scale, rotate, translate
  FILTERS: 350, // blur, brightness, contrast
  INTERACTION: 400, // hover, focus, active states
  ANIMATION: 500, // transitions, animations
  ACCESSIBILITY: 600, // ARIA, focus management
  CUSTOM: 700, // Plugin-specific modifiers
  DEBUG: 900, // Development/debug modifiers
}
```

### 3. Reactive Support

Always support both static and reactive values:

```typescript
export interface MyModifierOptions {
  value: number | string | Signal<number | string>
  color?: string | Signal<string>
}

export class MyModifier extends BaseModifier<MyModifierOptions> {
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const element = context.element as HTMLElement

    // Handle reactive values
    this.applyReactiveValue(this.properties.value, value =>
      element.style.setProperty('--my-value', String(value))
    )

    if (this.properties.color) {
      this.applyReactiveValue(this.properties.color, color =>
        element.style.setProperty('--my-color', color)
      )
    }
  }
}
```

### 4. Error Handling

Provide helpful error messages and graceful degradation:

```typescript
apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
  if (!context.element) {
    console.warn('MyModifier: No element in context')
    return
  }

  if (!(context.element instanceof HTMLElement)) {
    console.warn('MyModifier: Can only be applied to HTML elements')
    return
  }

  try {
    // Apply modifier logic
  } catch (error) {
    console.error('MyModifier: Failed to apply', error)
  }
}
```

### 5. Documentation

Document your modifiers thoroughly:

````typescript
/**
 * Apply custom styling with reactive support
 *
 * @example
 * ```typescript
 * // Static usage
 * Text("Hello").myModifier(16, '#FF0000').build()
 *
 * // Reactive usage
 * const size = signal(16)
 * const color = signal('#FF0000')
 * Text("Hello").myModifier(size, color).build()
 *
 * // Preset usage
 * Text("Hello").myModifierLarge().build()
 * ```
 *
 * @param value The size value (supports reactive signals)
 * @param color Optional color override (supports reactive signals)
 */
````

## Examples

### Basic Modifier Example

Here's a complete implementation of a simple shadow modifier:

```typescript
// src/shadow.ts
import { BaseModifier } from '@tachui/core'
import type { DOMNode, ModifierContext, Signal } from '@tachui/core'

export interface ShadowOptions {
  x?: number | Signal<number>
  y?: number | Signal<number>
  blur?: number | Signal<number>
  spread?: number | Signal<number>
  color?: string | Signal<string>
}

export class ShadowModifier extends BaseModifier<ShadowOptions> {
  readonly type = 'shadow'
  readonly priority = 200

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element || !(context.element instanceof HTMLElement)) return

    const element = context.element
    const {
      x = 0,
      y = 4,
      blur = 8,
      spread = 0,
      color = 'rgba(0,0,0,0.1)',
    } = this.properties

    // Build shadow string reactively
    this.createShadowEffect(element, { x, y, blur, spread, color })
  }

  private createShadowEffect(
    element: HTMLElement,
    shadow: ShadowOptions
  ): void {
    // Handle reactive shadow computation
    const computeShadow = () => {
      const x = this.resolveValue(shadow.x) || 0
      const y = this.resolveValue(shadow.y) || 4
      const blur = this.resolveValue(shadow.blur) || 8
      const spread = this.resolveValue(shadow.spread) || 0
      const color = this.resolveValue(shadow.color) || 'rgba(0,0,0,0.1)'

      return `${x}px ${y}px ${blur}px ${spread}px ${color}`
    }

    // Apply initial shadow
    element.style.boxShadow = computeShadow()

    // Set up reactive updates
    this.subscribeToReactiveValues(
      [shadow.x, shadow.y, shadow.blur, shadow.spread, shadow.color],
      () => {
        element.style.boxShadow = computeShadow()
      }
    )
  }
}

// Factory functions
export function shadow(options: ShadowOptions = {}): ShadowModifier {
  return new ShadowModifier(options)
}

export function cardShadow(): ShadowModifier {
  return shadow({ y: 2, blur: 8, color: 'rgba(0,0,0,0.15)' })
}

export function elevatedShadow(): ShadowModifier {
  return shadow({ y: 8, blur: 24, color: 'rgba(0,0,0,0.2)' })
}
```

### Plugin Package Structure

Organize your modifier plugin with this recommended structure:

```
my-modifier-plugin/
├── src/
│   ├── index.ts              # Main exports and auto-registration
│   ├── shadow.ts             # Shadow modifier implementation
│   ├── glow.ts               # Glow modifier implementation
│   ├── pulse.ts              # Pulse animation modifier
│   └── types.ts              # TypeScript declarations
├── __tests__/
│   ├── shadow.test.ts        # Unit tests
│   ├── integration.test.ts   # Integration tests
│   └── stress.test.ts        # Performance tests
├── package.json
├── tsconfig.json
└── README.md
```

### Auto-Registration Index

```typescript
// src/index.ts
import { globalModifierRegistry } from '@tachui/core'
import {
  ShadowModifier,
  shadow,
  cardShadow,
  elevatedShadow,
  GlowModifier,
  glow,
  softGlow,
  brightGlow,
  PulseModifier,
  pulse,
  heartbeat,
} from './implementations'

// Register all modifiers
const modifiers = [
  // Shadow modifiers
  ['shadow', (props: any) => new ShadowModifier(props)],
  ['cardShadow', () => cardShadow()],
  ['elevatedShadow', () => elevatedShadow()],

  // Glow modifiers
  ['glow', (props: any) => new GlowModifier(props)],
  ['softGlow', () => softGlow()],
  ['brightGlow', () => brightGlow()],

  // Animation modifiers
  ['pulse', (props: any) => new PulseModifier(props)],
  ['heartbeat', () => heartbeat()],
] as const

modifiers.forEach(([name, factory]) => {
  globalModifierRegistry.register(name, factory)
})

// Export everything for direct usage
export * from './implementations'
export * from './types'

console.log(`Registered ${modifiers.length} modifiers from my-modifier-plugin`)
```

---

## Conclusion

Following this guide ensures your modifiers:

1. ✅ Integrate seamlessly with the TachUI modifier system
2. ✅ Provide the expected developer experience (`component.yourModifier()`)
3. ✅ Support both static and reactive values
4. ✅ Are properly tested and documented
5. ✅ Follow framework conventions and best practices

For more advanced examples, see the implementations in `@tachui/modifiers`, `@tachui/effects`, and `@tachui/responsive`.

Happy modifying! 🚀
