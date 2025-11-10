# Signals

Signals are the core reactive primitive in TachUI. They provide fine-grained reactivity that enables surgical DOM updates without virtual DOM overhead.

## Creating Signals

Use `createSignal()` to create reactive state:

```typescript
import { 
  createSignal,
  type Signal,
  type SignalSetter,
  type Accessor
} from '@tachui/core'

// Explicitly typed signals
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(0)
const [name, setName]: [Accessor<string>, SignalSetter<string>] = createSignal('TachUI')

// Complex typed signals
interface User {
  id: number
  name: string
  email?: string
  isActive: boolean
}

const [user, setUser]: [Accessor<User>, SignalSetter<User>] = createSignal<User>({ 
  id: 1, 
  name: 'John',
  isActive: true
})

// Array signals with proper typing
const [todos, setTodos]: [Accessor<Todo[]>, SignalSetter<Todo[]>] = createSignal<Todo[]>([])

// Union type signals
type Theme = 'light' | 'dark' | 'auto'
const [theme, setTheme]: [Accessor<Theme>, SignalSetter<Theme>] = createSignal<Theme>('light')
```

## Reading Signal Values

Signals are functions that return their current value:

```typescript
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(42)

// Type-safe signal reading
const currentValue: number = count() // 42
console.log(currentValue)

// Type checking prevents errors
// const invalidValue: string = count() // ❌ TypeScript error: Type 'number' is not assignable to type 'string'
```

### Dependency Tracking

When you read a signal inside a reactive context (like an effect or computed), it automatically tracks that dependency:

```typescript
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(0)

createEffect((): void => {
  // This effect will re-run whenever count changes
  const currentCount: number = count()
  console.log('Count is:', currentCount)
})

setCount(5) // Logs: "Count is: 5"

// Example with multiple signals and type safety
const [name, setName]: [Accessor<string>, SignalSetter<string>] = createSignal('TachUI')
const [version, setVersion]: [Accessor<string>, SignalSetter<string>] = createSignal('1.0.0')

createEffect((): void => {
  const appName: string = name()
  const appVersion: string = version()
  console.log(`${appName} v${appVersion}`)
})
```

### Reading Without Tracking

Use `.peek()` to read a signal's value without creating a dependency:

```typescript
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(0)

createEffect((): void => {
  const currentCount: number = count.peek() // Won't track as dependency
  console.log('Effect ran, count is:', currentCount)
})

setCount(5) // Effect won't re-run

// Example with multiple signals and selective tracking
interface AppState {
  userId: string
  settings: { theme: string; language: string }
}

const [appState, setAppState]: [Accessor<AppState>, SignalSetter<AppState>] = createSignal({
  userId: 'user123',
  settings: { theme: 'dark', language: 'en' }
})

createEffect((): void => {
  // Only track userId changes, not settings
  const userId: string = appState().userId
  const settingsSnapshot = appState.peek().settings // Don't track settings
  
  console.log(`User ${userId} with theme: ${settingsSnapshot.theme}`)
})
```

## Updating Signals

### Direct Updates

Set a new value directly:

```typescript
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(0)

// Type-safe direct updates
setCount(10) // ✅ Valid - number
console.log(count()) // 10

// setCount("invalid") // ❌ TypeScript error: Argument of type 'string' is not assignable to parameter of type 'number'

// Complex type updates
interface UserProfile {
  id: string
  name: string
  preferences: {
    theme: 'light' | 'dark'
    notifications: boolean
  }
}

const [profile, setProfile]: [Accessor<UserProfile>, SignalSetter<UserProfile>] = createSignal({
  id: 'user123',
  name: 'John Doe',
  preferences: { theme: 'light', notifications: true }
})

// Type-safe complex update
const newProfile: UserProfile = {
  id: 'user456',
  name: 'Jane Smith',
  preferences: { theme: 'dark', notifications: false }
}
setProfile(newProfile)
```

### Functional Updates

Use a function to update based on the previous value:

```typescript
const [count, setCount]: [Accessor<number>, SignalSetter<number>] = createSignal(0)

// Type-safe functional updates
setCount((prev: number): number => prev + 1)
console.log(count()) // 1

setCount((prev: number): number => prev * 2)
console.log(count()) // 2

// Complex functional updates with type safety
interface ShoppingCart {
  items: Array<{ id: string; name: string; price: number; quantity: number }>
  total: number
}

const [cart, setCart]: [Accessor<ShoppingCart>, SignalSetter<ShoppingCart>] = createSignal({
  items: [],
  total: 0
})

// Type-safe cart operations
const addItem = (newItem: { id: string; name: string; price: number }): void => {
  setCart((prev: ShoppingCart): ShoppingCart => {
    const existingItem = prev.items.find(item => item.id === newItem.id)
    
    let updatedItems: Array<{ id: string; name: string; price: number; quantity: number }>
    
    if (existingItem) {
      updatedItems = prev.items.map(item =>
        item.id === newItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    } else {
      updatedItems = [...prev.items, { ...newItem, quantity: 1 }]
    }
    
    const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    
    return { items: updatedItems, total }
  })
}

const removeItem = (itemId: string): void => {
  setCart((prev: ShoppingCart): ShoppingCart => {
    const updatedItems = prev.items.filter(item => item.id !== itemId)
    const total = updatedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    return { items: updatedItems, total }
  })
}
```

### Object Updates

For objects, create new objects to trigger updates:

```typescript
interface User {
  name: string
  age: number
  email?: string
  isActive: boolean
}

const [user, setUser]: [Accessor<User>, SignalSetter<User>] = createSignal<User>({ 
  name: 'John', 
  age: 30, 
  isActive: true 
})

// ✅ Good: Creates new object with proper typing
setUser((prev: User): User => ({ ...prev, age: 31 }))

// ✅ Good: Partial updates with type safety
setUser((prev: User): User => ({ 
  ...prev, 
  email: 'john@example.com',
  isActive: true 
}))

// ✅ Good: Complex nested updates
interface UserWithPreferences {
  name: string
  age: number
  preferences: {
    theme: 'light' | 'dark'
    language: 'en' | 'es' | 'fr'
    notifications: {
      email: boolean
      push: boolean
      sms: boolean
    }
  }
}

const [userWithPrefs, setUserWithPrefs]: [Accessor<UserWithPreferences>, SignalSetter<UserWithPreferences>] = 
  createSignal<UserWithPreferences>({
    name: 'John',
    age: 30,
    preferences: {
      theme: 'light',
      language: 'en',
      notifications: { email: true, push: false, sms: false }
    }
  })

// Type-safe nested object updates
setUserWithPrefs((prev: UserWithPreferences): UserWithPreferences => ({
  ...prev,
  preferences: {
    ...prev.preferences,
    theme: 'dark',
    notifications: {
      ...prev.preferences.notifications,
      push: true
    }
  }
}))

// ❌ Bad: Mutates existing object (won't trigger updates)
setUser((prev: User): User => {
  prev.age = 31 // Direct mutation - won't trigger updates!
  return prev
})

// ❌ Bad: Type-unsafe mutation
setUser((prev: User): User => {
  (prev as any).invalidProperty = 'value' // TypeScript error in strict mode
  return prev
})
```

## Signal Performance

### Equality Checking

Signals only trigger updates when the value actually changes:

```typescript
const [count, setCount] = createSignal(0)

createEffect(() => {
  console.log('Effect ran:', count())
})

setCount(0) // Won't trigger effect - same value
setCount(1) // Will trigger effect - different value
```

### Batching Updates

Use `batch()` to group multiple updates:

```typescript
import { batch } from '@tachui/core'

const [first, setFirst]: [Accessor<number>, SignalSetter<number>] = createSignal(0)
const [second, setSecond]: [Accessor<number>, SignalSetter<number>] = createSignal(0)

createEffect((): void => {
  const sum: number = first() + second()
  console.log('Sum:', sum)
})

// Without batching: effect runs twice
setFirst(1) // Logs: "Sum: 1"
setSecond(2) // Logs: "Sum: 3"

// With batching: effect runs once
batch((): void => {
  setFirst(10)
  setSecond(20)
}) // Logs: "Sum: 30" (only once)

// Complex batching example with type safety
interface FormData {
  name: string
  email: string
  age: number
}

interface FormErrors {
  name?: string
  email?: string
  age?: string
}

const [formData, setFormData]: [Accessor<FormData>, SignalSetter<FormData>] = createSignal({
  name: '',
  email: '',
  age: 0
})

const [formErrors, setFormErrors]: [Accessor<FormErrors>, SignalSetter<FormErrors>] = createSignal({})
const [isValidating, setIsValidating]: [Accessor<boolean>, SignalSetter<boolean>] = createSignal(false)

// Validation effect that depends on all form state
createEffect((): void => {
  const data: FormData = formData()
  const errors: FormErrors = formErrors()
  const validating: boolean = isValidating()
  
  console.log('Form validation triggered', { data, errors, validating })
})

// Batch multiple form updates to prevent excessive validation
const updateFormWithValidation = (updates: Partial<FormData>): void => {
  batch((): void => {
    setIsValidating(true)
    setFormData((prev: FormData): FormData => ({ ...prev, ...updates }))
    
    // Simulate validation
    const newErrors: FormErrors = {}
    if (updates.email && !updates.email.includes('@')) {
      newErrors.email = 'Invalid email format'
    }
    if (updates.age !== undefined && updates.age < 0) {
      newErrors.age = 'Age must be positive'
    }
    
    setFormErrors(newErrors)
    setIsValidating(false)
  })
} // All updates happen atomically - validation effect runs only once
```

## Advanced Usage

### Enhanced Signals

TachUI provides enhanced signals with advanced features for sophisticated reactive applications:

```typescript
import { 
  createEnhancedSignal, 
  deepEquals, 
  shallowEquals,
  UpdatePriority 
} from '@tachui/core'

// Signal with deep equality for objects/arrays
const [user, setUser] = createEnhancedSignal({ 
  name: 'John', 
  preferences: { theme: 'dark' }
}, { 
  equals: deepEquals,
  debugName: 'userState',
  priority: UpdatePriority.High 
})

// Now deep object changes are detected automatically!
setUser({ name: 'John', preferences: { theme: 'light' } }) // Will trigger updates

// Convenience functions for common patterns
import { createDeepSignal, createShallowSignal } from '@tachui/core'

const [items, setItems] = createDeepSignal([]) // Automatic deep equality
const [config, setConfig] = createShallowSignal({}) // Automatic shallow equality
```

### Signal Options

All enhanced signals support comprehensive configuration:

```typescript
interface SignalOptions<T> {
  equals?: EqualityFunction<T>     // Custom equality comparison
  priority?: UpdatePriority        // Update scheduling priority
  debugName?: string              // Name for debugging tools
}

enum UpdatePriority {
  Immediate = 0,    // Synchronous updates
  High = 1,         // High priority async updates  
  Normal = 2,       // Standard priority (default)
  Low = 3,          // Low priority updates
  Idle = 4          // Idle time updates
}
```

### Custom Equality Functions

Create your own equality logic:

```typescript
import { createEnhancedSignal } from '@tachui/core'

const [items, setItems] = createEnhancedSignal([], {
  equals: (a, b) => a.length === b.length && a.every((item, i) => item.id === b[i].id),
  debugName: 'itemList'
})
```

### Signal Composition

Signals work great with other reactive primitives:

```typescript
const [firstName, setFirstName] = createSignal('John')
const [lastName, setLastName] = createSignal('Doe')

// Computed value that depends on multiple signals
const fullName = createComputed(() => `${firstName()} ${lastName()}`)

console.log(fullName()) // "John Doe"

setFirstName('Jane')
console.log(fullName()) // "Jane Doe"
```

## Best Practices

### 1. Use Functional Updates for Calculations

```typescript
// ✅ Good
setCount(prev => prev + 1)

// ❌ Avoid
setCount(count() + 1) // Reads current value unnecessarily
```

### 2. Keep Signals Simple

```typescript
// ✅ Good: Simple, focused signals
const [name, setName] = createSignal('')
const [email, setEmail] = createSignal('')

// ❌ Avoid: Large, complex objects
const [formState, setFormState] = createSignal({
  name: '',
  email: '',
  preferences: { theme: 'dark', notifications: true },
  // ... many more properties
})
```

### 3. Use TypeScript for Type Safety

```typescript
interface User {
  id: number
  name: string
  email: string
}

const [user, setUser] = createSignal<User | null>(null)

// TypeScript ensures type safety
setUser({ id: 1, name: 'John', email: 'john@example.com' })
```

## Common Patterns

### Loading States

```typescript
const [isLoading, setIsLoading] = createSignal(false)
const [data, setData] = createSignal(null)

const fetchData = async () => {
  setIsLoading(true)
  try {
    const response = await fetch('/api/data')
    const result = await response.json()
    setData(result)
  } finally {
    setIsLoading(false)
  }
}
```

### Toggle States

```typescript
const [isOpen, setIsOpen] = createSignal(false)

const toggle = () => setIsOpen(prev => !prev)
```

### Counter with Bounds

```typescript
const [count, setCount] = createSignal(0)

const increment = () => setCount(prev => Math.min(prev + 1, 100))
const decrement = () => setCount(prev => Math.max(prev - 1, 0))
```

## Error Handling

TachUI provides robust error handling for reactive operations:

```typescript
import { createEffect, createComputed } from '@tachui/core'

// Effects with error boundaries
const cleanup = createEffect(() => {
  try {
    // Your reactive code here
    const result = riskyOperation()
    console.log('Success:', result)
  } catch (error) {
    console.error('Effect failed:', error)
    // Handle error gracefully
  }
}, { name: 'criticalEffect' })

// Computed values with fallback handling
const safeComputed = createComputed(() => {
  try {
    return expensiveCalculation()
  } catch (error) {
    console.warn('Computation failed, using fallback:', error)
    return fallbackValue
  }
}, { debugName: 'safeComputation' })
```

## Signal Lifecycle & Cleanup

Proper cleanup prevents memory leaks in reactive applications:

```typescript
import { createRoot, onCleanup } from '@tachui/core'

// Create a reactive root
const dispose = createRoot((dispose) => {
  const [count, setCount] = createSignal(0)
  
  // Effect with cleanup
  const cleanup = createEffect(() => {
    const timer = setInterval(() => {
      setCount(c => c + 1)
    }, 1000)
    
    // Cleanup when effect is disposed
    onCleanup(() => {
      clearInterval(timer)
      console.log('Timer cleared')
    })
  })
  
  return () => {
    cleanup() // Clean up effect
    dispose() // Clean up reactive root
  }
})

// Later, clean up everything
dispose()
```

## Performance Monitoring

TachUI provides tools for monitoring reactive performance:

```typescript
import { ReactiveScheduler, batch, untrack } from '@tachui/core'

// Get scheduler instance for metrics
const scheduler = ReactiveScheduler.getInstance()

// Use batching to optimize updates
batch(() => {
  setCount(10)
  setName('John')
  setEmail('john@example.com')
}) // All updates happen together

// Use untrack to read without creating dependencies
const result = untrack(() => {
  return expensiveCalculation(count()) // Won't track count as dependency
})
```

## Next Steps

- [Learn about Computed Values](/guide/computed) - Derived reactive state
- [Explore Effects](/guide/effects) - Handle side effects
- [Memory Management](/guide/cleanup) - Prevent memory leaks
- [Migration Guide](/guide/migration) - Upgrade to v2.0 reactive system