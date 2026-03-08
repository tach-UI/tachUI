# Application Mounting API

Guide to mounting TachUI applications to the DOM and understanding the difference between reactive contexts and DOM mounting.

## Overview

TachUI provides two distinct functions that serve different purposes:

- **`mountRoot`**: Mount your application to the DOM (application-level)
- **`createRoot`**: Create reactive contexts for signals and effects (reactive system)

## mountRoot - DOM Mounting

Use `mountRoot` to mount your TachUI application to the DOM. This is typically called once at the start of your application.

### Function Signature

```typescript
function mountRoot(rootFunction: () => ComponentInstance): void
```

### Basic Usage

```typescript
import { mountRoot } from '@tachui/core'
import { MyApp } from './MyApp'

// Mount your app to the DOM
mountRoot(() => MyApp())
```

### Requirements

- Your HTML must contain an element with `id="app"`
- The function should return your root component

### Complete Example

```typescript
// main.ts
import { mountRoot, VStack, Text, Button, createSignal } from '@tachui/core'

interface AppState {
  counter: number
  message: string
}

function App(): VStack {
  const [state, setState]: [Accessor<AppState>, SignalSetter<AppState>] = createSignal({
    counter: 0,
    message: 'Welcome to TachUI!'
  })

  const handleClick = (): void => {
    setState(prev => ({
      ...prev,
      counter: prev.counter + 1,
      message: `Clicked ${prev.counter + 1} times!`
    }))
  }

  return VStack({
    children: [
      Text(() => state().message)
        .modifier
        .fontSize(24)
        .fontWeight('bold')
        .build(),
        
      Text(() => `Counter: ${state().counter}`)
        .modifier
        .fontSize(18)
        .marginTop(8)
        .build(),
        
      Button('Click me', handleClick)
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('#FFFFFF')
        .marginTop(16)
        .build()
    ],
    spacing: 8
  })
}

// Type-safe mounting to DOM
mountRoot((): VStack => App())
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <title>My TachUI App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

## createRoot - Reactive Contexts

Use `createRoot` for creating reactive contexts when working with signals and effects inside your components.

### Function Signature

```typescript
function createRoot<T>(fn: (dispose: () => void) => T): T
```

### Usage in Components

```typescript
import { createRoot, createSignal, createEffect } from '@tachui/core'

// Inside a component that needs isolated reactive context
const MyComponent = () => {
  return createRoot((dispose) => {
    const [count, setCount] = createSignal(0)
    
    createEffect(() => {
      console.log('Count changed:', count())
    })
    
    // Component cleanup will call dispose() automatically
    
    return Button('Increment', () => setCount(count() + 1))
  })
}
```

## Key Differences

| Function | Purpose | Returns | Usage |
|----------|---------|---------|-------|
| `mountRoot` | Mount app to DOM | `void` | Application startup |
| `createRoot` | Create reactive context | `T` | Component isolation |

### Import Paths

```typescript
// Application mounting
import { mountRoot } from '@tachui/core'

// Reactive contexts (usually imported automatically)
import { createRoot } from '@tachui/core'
```

## Common Patterns

### Application Entry Point

```typescript
// main.ts - Application entry point
import { mountRoot } from '@tachui/core'
import { App } from './App'

mountRoot(() => App())
```

### Component with Isolated Reactive Context

```typescript
// Component.ts - Component with isolated reactive context
import { createRoot, createSignal } from '@tachui/core'

export const CounterComponent = () => {
  return createRoot((dispose) => {
    const [count, setCount] = createSignal(0)
    
    // This reactive context is isolated
    // and will be cleaned up automatically
    
    return VStack({
      children: [
        Text(() => `Count: ${count()}`),
        Button('Increment', () => setCount(count() + 1))
      ]
    })
  })
}
```

### Multiple App Mounting (Advanced)

```typescript
// Advanced: Mount multiple apps to different containers
import { mountComponentTree } from '@tachui/core'

// Custom mounting to specific containers
const container1 = document.getElementById('app1')
const container2 = document.getElementById('app2')

if (container1) {
  mountComponentTree(App1(), container1)
}

if (container2) {
  mountComponentTree(App2(), container2)
}
```

## Error Handling

### Missing App Container

```typescript
// mountRoot will throw if no #app element exists
try {
  mountRoot(() => MyApp())
} catch (error) {
  console.error('Failed to mount app:', error.message)
  // Error: App container element with id="app" not found
}
```

### Reactive Context Errors

```typescript
// createRoot handles disposal automatically
const result = createRoot((dispose) => {
  try {
    // Your reactive code here
    return someReactiveComponent()
  } catch (error) {
    dispose() // Manual cleanup if needed
    throw error
  }
})
```

## Performance Considerations

### mountRoot Performance

- `mountRoot` creates the initial reactive context for your entire app
- Only call `mountRoot` once per application
- The root component and all children share the same reactive context

### createRoot Performance

- `createRoot` creates isolated reactive contexts
- Use for components that need separate cleanup lifecycles
- Avoid unnecessary nesting of reactive roots

## Testing

### Testing with mountRoot

```typescript
// test-utils.ts
import { mountRoot } from '@tachui/core'

export function renderApp(component: () => ComponentInstance) {
  // Create test container
  const container = document.createElement('div')
  container.id = 'app'
  document.body.appendChild(container)
  
  // Mount component
  mountRoot(component)
  
  return {
    container,
    cleanup: () => {
      document.body.removeChild(container)
    }
  }
}
```

### Testing with createRoot

```typescript
// component.test.ts
import { createRoot, createSignal } from '@tachui/core'

test('reactive context works correctly', () => {
  const result = createRoot((dispose) => {
    const [count, setCount] = createSignal(0)
    
    setCount(5)
    
    // Test the reactive behavior
    expect(count()).toBe(5)
    
    return count()
  })
  
  expect(result).toBe(5)
})
```

## Migration Guide

### From Previous Versions

If you were using `createRoot` for DOM mounting:

```typescript
// Before (deprecated)
import { createRoot } from '@tachui/core'
createRoot(() => MyApp())

// After (correct)
import { mountRoot } from '@tachui/core'
mountRoot(() => MyApp())
```

The reactive `createRoot` remains unchanged:

```typescript
// This usage is still correct
import { createRoot } from '@tachui/core'
createRoot((dispose) => {
  // Reactive context code
})
```

## Best Practices

1. **Use `mountRoot` once**: Call it only at your application's entry point
2. **Use `createRoot` sparingly**: Only when you need isolated reactive contexts
3. **Prefer component patterns**: Most components don't need `createRoot`
4. **Handle cleanup**: Let TachUI handle cleanup automatically when possible
5. **Test your mounting**: Ensure your app container exists before mounting

## Related APIs

- **[mountComponentTree](/api/mounting#mountcomponenttree)** - Lower-level mounting to specific containers
- **[createSignal](/api/create-signal)** - Create reactive signals
- **[createEffect](/api/create-effect)** - Create reactive effects
- **[Component Guide](/guide/components)** - Component creation patterns