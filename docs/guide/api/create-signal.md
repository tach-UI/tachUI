# createSignal

Creates a reactive signal that automatically tracks dependencies and triggers updates when its value changes.

## Signature

```typescript
function createSignal<T>(
  initialValue: T, 
  options?: SignalOptions<T>
): [getter: () => T, setter: (value: T | ((prev: T) => T)) => void]
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialValue` | `T` | The initial value of the signal |
| `options` | `SignalOptions<T>` | Optional configuration object |

### SignalOptions

```typescript
interface SignalOptions<T> {
  equals?: (prev: T, next: T) => boolean
  name?: string
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `equals` | `(prev: T, next: T) => boolean` | `(a, b) => a === b` | Custom equality function |
| `name` | `string` | `undefined` | Debug name for the signal |

## Returns

A tuple containing:
- **getter**: `() => T` - Function to read the current value
- **setter**: `(value: T | ((prev: T) => T)) => void` - Function to update the value

## Basic Usage

### Simple Signal

```typescript
import { createSignal } from '@tachui/core'

const [count, setCount] = createSignal(0)

console.log(count()) // 0

setCount(5)
console.log(count()) // 5
```

### Functional Updates

```typescript
const [count, setCount] = createSignal(0)

// Increment using function
setCount(prev => prev + 1)
console.log(count()) // 1

// Multiple updates
setCount(prev => prev * 2)
console.log(count()) // 2
```

### Object Signals

```typescript
interface User {
  name: string
  age: number
}

const [user, setUser] = createSignal<User>({
  name: 'John',
  age: 25
})

// Update entire object
setUser({ name: 'Jane', age: 30 })

// Update using function
setUser(prev => ({ ...prev, age: prev.age + 1 }))
```

## Advanced Usage

### Custom Equality

```typescript
const [items, setItems] = createSignal([], {
  equals: (prev, next) => prev.length === next.length
})

// Only triggers updates when array length changes
setItems([1, 2, 3]) // Triggers update
setItems([4, 5, 6]) // No update (same length)
```

### Named Signals (Debugging)

```typescript
const [debugSignal, setDebugSignal] = createSignal(0, {
  name: 'counterSignal'
})

// Appears in dev tools with the name 'counterSignal'
```

## Reactive Context

Signals automatically track dependencies when accessed inside reactive contexts:

### With Components

```typescript
import { Text, createSignal } from '@tachui/core'

function Counter() {
  const [count, setCount] = createSignal(0)
  
  // Text automatically updates when count changes
  return Text(() => `Count: ${count()}`)
}
```

### With Effects

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [name, setName] = createSignal('John')
const [age, setAge] = createSignal(25)

// Effect runs when either name or age changes
createEffect(() => {
  console.log(`${name()} is ${age()} years old`)
})

setName('Jane') // Triggers effect
setAge(30)      // Triggers effect
```

### With Computed Values

```typescript
import { createSignal, createMemo } from '@tachui/core'

const [firstName, setFirstName] = createSignal('John')
const [lastName, setLastName] = createSignal('Doe')

// Computed value updates when dependencies change
const fullName = createMemo(() => `${firstName()} ${lastName()}`)

console.log(fullName()) // "John Doe"
setFirstName('Jane')
console.log(fullName()) // "Jane Doe"
```

## Performance Characteristics

### Batched Updates

Multiple synchronous updates are automatically batched:

```typescript
const [count, setCount] = createSignal(0)

// These updates are batched into a single DOM update
setCount(1)
setCount(2)
setCount(3)
// Only final value (3) triggers component updates
```

### Memory Management

Signals automatically clean up unused dependencies:

```typescript
function createTemporarySignal() {
  const [temp, setTemp] = createSignal(0)
  return temp
}

// Signal is automatically garbage collected when no longer referenced
let getter = createTemporarySignal()
getter = null // Signal can be garbage collected
```

## Common Patterns

### Toggle Signal

```typescript
const [isEnabled, setIsEnabled] = createSignal(false)

const toggle = () => setIsEnabled(prev => !prev)
```

### Array Manipulation

```typescript
const [items, setItems] = createSignal<string[]>([])

const addItem = (item: string) => {
  setItems(prev => [...prev, item])
}

const removeItem = (index: number) => {
  setItems(prev => prev.filter((_, i) => i !== index))
}

const updateItem = (index: number, newItem: string) => {
  setItems(prev => prev.map((item, i) => i === index ? newItem : item))
}
```

### Async Signal Updates

```typescript
const [data, setData] = createSignal<any>(null)
const [loading, setLoading] = createSignal(false)

async function fetchData() {
  setLoading(true)
  try {
    const response = await fetch('/api/data')
    const result = await response.json()
    setData(result)
  } finally {
    setLoading(false)
  }
}
```

## Type Safety

### Generic Signals

```typescript
// Type is inferred from initial value
const [message, setMessage] = createSignal('hello') // string signal

// Explicit type annotation
const [user, setUser] = createSignal<User | null>(null)

// Union types
const [status, setStatus] = createSignal<'loading' | 'success' | 'error'>('loading')
```

### Readonly Signals

```typescript
function useCounter(initialValue = 0) {
  const [count, setCount] = createSignal(initialValue)
  
  const increment = () => setCount(prev => prev + 1)
  const decrement = () => setCount(prev => prev - 1)
  
  // Return readonly getter with methods
  return {
    count,           // getter function
    increment,
    decrement
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// ✅ Good - Clear purpose
const [userEmail, setUserEmail] = createSignal('')
const [isFormValid, setIsFormValid] = createSignal(false)

// ❌ Avoid - Unclear names
const [data, setData] = createSignal('')
const [flag, setFlag] = createSignal(false)
```

### 2. Initialize with Proper Types

```typescript
// ✅ Good - Clear initial state
const [users, setUsers] = createSignal<User[]>([])
const [selectedUser, setSelectedUser] = createSignal<User | null>(null)

// ❌ Avoid - Unclear initial state
const [users, setUsers] = createSignal(null)
```

### 3. Use Functional Updates for Complex State

```typescript
// ✅ Good - Functional update
setUser(prev => ({ ...prev, name: newName }))

// ❌ Avoid - Direct mutation
const currentUser = user()
currentUser.name = newName  // Doesn't trigger updates
setUser(currentUser)
```

## Debugging

### Development Tools

Signals integrate with TachUI's development tools:

```typescript
// Named signals appear in the component tree
const [debugCounter, setDebugCounter] = createSignal(0, {
  name: 'debugCounter'
})
```

### Logging Changes

```typescript
const [count, setCount] = createSignal(0)

// Log all changes in development
if (process.env.NODE_ENV === 'development') {
  createEffect(() => {
    console.log('Count changed to:', count())
  })
}
```

## Migration from Other Frameworks

### From React useState

```typescript
// React
const [count, setCount] = useState(0)

// TachUI - Very similar API
const [count, setCount] = createSignal(0)

// React - Access value directly
console.log(count)

// TachUI - Access via function call
console.log(count())
```

### From Vue ref

```typescript
// Vue
const count = ref(0)
console.log(count.value)

// TachUI
const [count, setCount] = createSignal(0)
console.log(count())
```

## Enhanced Signals (v2.0)

TachUI v2.0 introduces enhanced signals with additional features while maintaining full backward compatibility:

### createEnhancedSignal

```typescript
import { createEnhancedSignal, deepEquals, UpdatePriority } from '@tachui/core'

const [user, setUser] = createEnhancedSignal({
  name: 'John',
  preferences: { theme: 'dark' }
}, {
  equals: deepEquals,           // Custom equality function
  priority: UpdatePriority.High, // Update priority
  debugName: 'userState'        // Debug name
})

// Now detects deep object changes!
setUser({ name: 'John', preferences: { theme: 'light' } }) // Triggers update
```

### Convenience Functions

```typescript
import { createDeepSignal, createShallowSignal } from '@tachui/core'

// Automatic deep equality
const [items, setItems] = createDeepSignal([])

// Automatic shallow equality  
const [config, setConfig] = createShallowSignal({})
```

### Available Equality Functions

```typescript
import { 
  defaultEquals,     // Reference equality (===)
  deepEquals,        // Deep object/array comparison
  shallowEquals,     // Shallow object comparison
  structuralEquals,  // Handles Date, RegExp, Set, Map
  jsonEquals,        // JSON serialization comparison
  createSelectorEquals,  // Custom property-based equality
  createArrayEquals,     // Custom array element comparison
  createObjectEquals     // Custom object property comparison
} from '@tachui/core'
```

### Migration Utilities

```typescript
import { 
  migrateToEnhancedSignal,
  analyzeSignalUsage,
  analyzeReactivePerformance 
} from '@tachui/core'

// Migrate existing signals
const enhanced = migrateToEnhancedSignal(originalSignal, {
  equals: 'deep',
  priority: UpdatePriority.High,
  debugName: 'migratedSignal'
})

// Analyze signal usage
const analysis = analyzeSignalUsage(mySignal)
console.log('Recommendations:', analysis.recommendations)

// Performance analysis
const performance = analyzeReactivePerformance()
console.log('Reactive system score:', performance.overallScore)
```

## See Also

- **[createMemo](/api/create-computed)** - Computed values derived from signals
- **[createEffect](/api/create-effect)** - Side effects that react to signal changes
- **[Signals Guide](/guide/signals)** - Comprehensive guide to reactive programming
- **[State Management](/guide/state-management)** - Advanced state management patterns
- **[Migration Guide](/guide/migration)** - Upgrading to v2.0 reactive system