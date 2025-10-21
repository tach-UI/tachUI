# @tachui/registry

Singleton registry management for TachUI modifiers. This package provides the single source of truth for modifier registration and ensures all packages use the same registry instance.

## Installation

```bash
pnpm add @tachui/registry
```

## Core API

### Basic Usage

```typescript
import { globalModifierRegistry } from '@tachui/registry'

// Register a custom modifier
globalModifierRegistry.register('customModifier', (props) => ({
  type: 'customModifier',
  priority: 100,
  properties: props,
  apply: (node, context) => {
    // Apply modifier logic
    return node
  }
}))
```

### Convenience API

```typescript
import { 
  registerModifier,
  hasModifier,
  listModifiers,
  validateRegistry,
  getModifier 
} from '@tachui/registry'

// Register a custom glassmorphism modifier
registerModifier('glassmorphism', (intensity: number) => ({
  type: 'glassmorphism',
  priority: 100,
  properties: { intensity },
  apply: (node, context) => {
    node.style.backdropFilter = `blur(${intensity}px)`
    node.style.background = 'rgba(255, 255, 255, 0.1)'
    return node
  }
}))

// Check if modifier exists
if (hasModifier('glassmorphism')) {
  console.log('Glassmorphism modifier is available')
}

// List all modifiers
console.log('Available modifiers:', listModifiers())

// Get registry health
const health = validateRegistry()
console.log(`Registry has ${health.totalModifiers} modifiers`)
```

## Developer Extension Examples

### Custom Animation Modifier

```typescript
import { registerModifier } from '@tachui/registry'

registerModifier('slideIn', ({ direction = 'left', duration = '0.3s' }) => ({
  type: 'slideIn',
  priority: 200,
  properties: { direction, duration },
  apply: (node, context) => {
    const transform = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(-100%)',
      down: 'translateY(100%)'
    }[direction]

    node.style.transition = `transform ${duration} ease-out`
    node.style.transform = transform
    
    // Animate in
    requestAnimationFrame(() => {
      node.style.transform = 'translate(0, 0)'
    })
    
    return node
  }
}))

// Usage in components
// Text('Hello').slideIn({ direction: 'right', duration: '0.5s' }).build()
```

### Plugin Development

```typescript
// @company/tachui-animations package
import { registerModifier } from '@tachui/registry'

export function installAnimationPlugin() {
  registerModifier('fadeIn', createFadeInModifier)
  registerModifier('slideUp', createSlideUpModifier)
  registerModifier('bounce', createBounceModifier)
  
  console.log('Animation plugin installed')
}

function createFadeInModifier({ duration = '0.3s' }) {
  return {
    type: 'fadeIn',
    priority: 150,
    properties: { duration },
    apply: (node, context) => {
      node.style.opacity = '0'
      node.style.transition = `opacity ${duration} ease-in`
      
      requestAnimationFrame(() => {
        node.style.opacity = '1'
      })
      
      return node
    }
  }
}
```

## Testing Support

```typescript
import { 
  createIsolatedRegistry,
  resetRegistry,
  clearRegistry 
} from '@tachui/registry'

describe('My Component Tests', () => {
  beforeEach(() => {
    // Clear global registry for each test
    clearRegistry()
  })

  it('should work with isolated registry', () => {
    const isolatedRegistry = createIsolatedRegistry()
    
    // Register test-specific modifiers
    isolatedRegistry.register('testModifier', createTestModifier())
    
    // Test without affecting global registry
    expect(isolatedRegistry.has('testModifier')).toBe(true)
  })

  it('should reset registry completely', () => {
    registerModifier('testMod', createTestModifier())
    expect(listModifiers()).toContain('testMod')
    
    resetRegistry()
    expect(listModifiers()).toHaveLength(0)
  })
})
```

## Development & Debugging

```typescript
import { validateRegistry } from '@tachui/registry'

// Check registry health in development
if (process.env.NODE_ENV === 'development') {
  const health = validateRegistry()
  
  console.log('Registry Health:', {
    totalModifiers: health.totalModifiers,
    instanceId: health.instanceId,
    duplicates: health.duplicateNames
  })
  
  if (health.duplicateNames.length > 0) {
    console.warn('Duplicate modifiers detected:', health.duplicateNames)
  }
}
```

## Type Safety

```typescript
import type { ModifierFactory, Modifier } from '@tachui/registry'

// Define typed modifier factory
const createTypedModifier: ModifierFactory<{ size: number; color: string }> = 
  ({ size, color }) => ({
    type: 'typedModifier',
    priority: 100,
    properties: { size, color },
    apply: (node, context) => {
      node.style.fontSize = `${size}px`
      node.style.color = color
      return node
    }
  })

registerModifier('typedModifier', createTypedModifier)
```

## Architecture

The registry uses a singleton pattern that ensures all packages import the same registry instance, regardless of how they're bundled or imported. This solves ESM module isolation issues that can break modifier functionality.

**Key Benefits:**
- Single source of truth for all modifiers
- Prevents duplicate registry instances
- Supports custom modifier development
- Provides testing utilities
- Full TypeScript support

## API Reference

### Core Functions

- `globalModifierRegistry` - The singleton registry instance
- `registerModifier<T>(name, factory)` - Register a custom modifier
- `hasModifier(name)` - Check if modifier exists
- `getModifier<T>(name)` - Get modifier factory
- `listModifiers()` - Get all modifier names
- `validateRegistry()` - Get registry health information

### Testing Functions

- `createIsolatedRegistry()` - Create isolated registry for tests
- `resetRegistry()` - Reset global registry (test-only)
- `clearRegistry()` - Clear all modifiers (dev/test-only)

### Types

- `ModifierRegistry` - Registry interface
- `ModifierFactory<T>` - Modifier factory function type
- `Modifier<T>` - Modifier instance interface
- `ModifierContext` - Context passed to modifiers
- `RegistryHealth` - Registry diagnostic information