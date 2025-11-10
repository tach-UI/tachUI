# createComputed / createMemo

Creates a computed value that automatically recalculates when its dependencies change. Also available as `createMemo` for compatibility.

## Signature

```typescript
function createComputed<T>(
  computation: () => T,
  options?: ComputedOptions<T>
): () => T

// Alias for createComputed
function createMemo<T>(
  computation: () => T,
  options?: ComputedOptions<T>
): () => T
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `computation` | `() => T` | Function that computes the derived value |
| `options` | `ComputedOptions<T>` | Optional configuration object |

### ComputedOptions

```typescript
interface ComputedOptions<T> {
  equals?: (prev: T, next: T) => boolean
  name?: string
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `equals` | `(prev: T, next: T) => boolean` | `(a, b) => a === b` | Custom equality function |
| `name` | `string` | `undefined` | Debug name for the computed value |

## Returns

A getter function `() => T` that returns the current computed value.

## Basic Usage

### Simple Computed Value

```typescript
import { createSignal, createMemo } from '@tachui/core'

const [firstName, setFirstName] = createSignal('John')
const [lastName, setLastName] = createSignal('Doe')

// Computed value automatically updates when dependencies change
const fullName = createMemo(() => `${firstName()} ${lastName()}`)

console.log(fullName()) // "John Doe"

setFirstName('Jane')
console.log(fullName()) // "Jane Doe"
```

### Complex Computations

```typescript
import { createSignal, createMemo } from '@tachui/core'

const [items, setItems] = createSignal([
  { name: 'Apple', price: 1.50, category: 'fruit' },
  { name: 'Bread', price: 2.00, category: 'bakery' },
  { name: 'Banana', price: 0.75, category: 'fruit' }
])

const [filter, setFilter] = createSignal('')

// Expensive computation only runs when dependencies change
const filteredItems = createMemo(() => {
  const filterValue = filter().toLowerCase()
  return items().filter(item => 
    item.name.toLowerCase().includes(filterValue) ||
    item.category.toLowerCase().includes(filterValue)
  )
})

const totalPrice = createMemo(() => 
  filteredItems().reduce((sum, item) => sum + item.price, 0)
)
```

## Advanced Usage

### Chained Computations

```typescript
const [numbers, setNumbers] = createSignal([1, 2, 3, 4, 5])

// Chain computed values
const evenNumbers = createMemo(() => 
  numbers().filter(n => n % 2 === 0)
)

const sumOfEvens = createMemo(() => 
  evenNumbers().reduce((sum, n) => sum + n, 0)
)

const formattedSum = createMemo(() => 
  `Sum of even numbers: ${sumOfEvens()}`
)

console.log(formattedSum()) // "Sum of even numbers: 6"
```

### Custom Equality

```typescript
interface User {
  id: number
  name: string
  email: string
}

const [users, setUsers] = createSignal<User[]>([])

// Only recalculate when user IDs change, not other properties
const userIds = createMemo(() => users().map(u => u.id), {
  equals: (prev, next) => 
    prev.length === next.length && 
    prev.every((id, i) => id === next[i])
})
```

### Named Computations (Debugging)

```typescript
const expensiveComputation = createMemo(() => {
  // Complex calculation
  return performExpensiveOperation()
}, {
  name: 'expensiveComputation'
})
```

## Performance Characteristics

### Lazy Evaluation

Computed values are lazy - they only recalculate when accessed and dependencies have changed:

```typescript
const [count, setCount] = createSignal(0)

const expensive = createMemo(() => {
  console.log('Computing expensive value')
  return count() * 1000
})

setCount(5) // Doesn't trigger computation yet
setCount(10) // Still no computation

console.log(expensive()) // Now computes: "Computing expensive value"
console.log(expensive()) // Uses cached value, no recomputation
```

### Automatic Caching

Results are automatically cached until dependencies change:

```typescript
const [a, setA] = createSignal(1)
const [b, setB] = createSignal(2)

const sum = createMemo(() => {
  console.log('Calculating sum')
  return a() + b()
})

console.log(sum()) // "Calculating sum", returns 3
console.log(sum()) // Uses cache, returns 3
console.log(sum()) // Uses cache, returns 3

setA(5) // Invalidates cache
console.log(sum()) // "Calculating sum", returns 7
```

### Dependency Tracking

Computed values automatically track all signals accessed during computation:

```typescript
const [showDetails, setShowDetails] = createSignal(false)
const [user, setUser] = createSignal({ name: 'John', age: 25 })

// Dependencies tracked automatically
const displayText = createMemo(() => {
  if (showDetails()) {
    return `${user().name} (${user().age} years old)`
  }
  return user().name
})

// Only recalculates when accessed signals change
setShowDetails(true) // Triggers recalculation
setUser({ name: 'Jane', age: 30 }) // Triggers recalculation
```

## Component Integration

### With UI Components

```typescript
import { Text, VStack, createSignal, createMemo } from '@tachui/core'

function ShoppingCart() {
  const [items, setItems] = createSignal([
    { name: 'Apple', price: 1.50, quantity: 2 },
    { name: 'Bread', price: 2.00, quantity: 1 }
  ])
  
  const totalPrice = createMemo(() => 
    items().reduce((sum, item) => sum + item.price * item.quantity, 0)
  )
  
  const itemCount = createMemo(() => 
    items().reduce((sum, item) => sum + item.quantity, 0)
  )
  
  return VStack({
    children: [
      Text(() => `Items: ${itemCount()}`),
      Text(() => `Total: $${totalPrice().toFixed(2)}`),
    ]
  })
}
```

### Computed Signals in Modifiers 🆕

**Latest Achievement**: Computed signals now work seamlessly with all modifier types for reactive styling:

```typescript
import { Text, createSignal, createComputed } from '@tachui/core'

function ReactiveComponent() {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  const [size, setSize] = createSignal<'small' | 'large'>('small')

  // Computed signals for reactive styling
  const textColor = createComputed(() => 
    theme() === 'dark' ? '#ffffff' : '#000000'
  )
  
  const backgroundColor = createComputed(() => 
    theme() === 'dark' ? '#333333' : '#ffffff'
  )
  
  const fontSize = createComputed(() => 
    size() === 'large' ? 20 : 14
  )
  
  const borderWidth = createComputed(() => 
    size() === 'large' ? 2 : 1
  )

  return Text("Reactive styling with computed signals")
    .modifier
    .foregroundColor(textColor)        // Computed signal for color
    .backgroundColor(backgroundColor)  // Computed signal for background
    .fontSize(fontSize)                // Computed signal for size
    .border(borderWidth, textColor)    // Multiple computed signals
    .opacity(createComputed(() => theme() === 'dark' ? 0.9 : 1.0))
    .build()
}
```

#### Advanced Computed Modifier Examples

```typescript
// Complex theme resolution
const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('auto')
const [userPrefersDark] = createSignal(
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

const resolvedTheme = createComputed(() => {
  if (theme() === 'auto') {
    return userPrefersDark() ? 'dark' : 'light'
  }
  return theme()
})

// Computed styling object
const dynamicStyles = createComputed(() => ({
  textColor: resolvedTheme() === 'dark' ? '#ffffff' : '#1a1a1a',
  borderColor: resolvedTheme() === 'dark' ? '#444444' : '#e0e0e0',
  cornerRadius: resolvedTheme() === 'dark' ? 8 : 4
}))

Text("Advanced computed styling")
  .modifier
  .foregroundColor(dynamicStyles().textColor)
  .borderTop(1, dynamicStyles().borderColor)
  .cornerRadius(dynamicStyles().cornerRadius)
  .build()
```

#### Computed Signal Features in Modifiers

- **Full TypeScript Compatibility**: Computed signals work with all modifier type signatures
- **Automatic Updates**: Style changes propagate automatically when dependencies change
- **Memory Efficient**: Proper cleanup prevents memory leaks
- **Cross-Modifier Support**: Use computed signals in any modifier context
- **Performance Optimized**: Only re-compute styles when dependencies actually change

### Conditional Computations

```typescript
function UserProfile({ userId }) {
  const [userData, setUserData] = createSignal(null)
  const [preferences, setPreferences] = createSignal(null)
  
  // Only compute when both data sources are available
  const displayName = createMemo(() => {
    const user = userData()
    const prefs = preferences()
    
    if (!user || !prefs) return 'Loading...'
    
    return prefs.showFullName 
      ? `${user.firstName} ${user.lastName}`
      : user.firstName
  })
  
  return Text(() => displayName())
}
```

## Common Patterns

### Derived Collections

```typescript
const [todos, setTodos] = createSignal([])
const [filter, setFilter] = createSignal('all') // 'all', 'active', 'completed'

const filteredTodos = createMemo(() => {
  const currentFilter = filter()
  if (currentFilter === 'active') {
    return todos().filter(todo => !todo.completed)
  }
  if (currentFilter === 'completed') {
    return todos().filter(todo => todo.completed)
  }
  return todos()
})

const todoStats = createMemo(() => ({
  total: todos().length,
  active: todos().filter(t => !t.completed).length,
  completed: todos().filter(t => t.completed).length
}))
```

### Form Validation

```typescript
const [email, setEmail] = createSignal('')
const [password, setPassword] = createSignal('')
const [confirmPassword, setConfirmPassword] = createSignal('')

const emailValid = createMemo(() => 
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())
)

const passwordValid = createMemo(() => 
  password().length >= 8
)

const passwordsMatch = createMemo(() => 
  password() === confirmPassword()
)

const formValid = createMemo(() => 
  emailValid() && passwordValid() && passwordsMatch()
)
```

### Search and Filtering

```typescript
const [searchQuery, setSearchQuery] = createSignal('')
const [sortBy, setSortBy] = createSignal('name')
const [data, setData] = createSignal([])

const searchResults = createMemo(() => {
  const query = searchQuery().toLowerCase()
  if (!query) return data()
  
  return data().filter(item => 
    item.name.toLowerCase().includes(query) ||
    item.description.toLowerCase().includes(query)
  )
})

const sortedResults = createMemo(() => {
  const results = searchResults()
  const sortField = sortBy()
  
  return [...results].sort((a, b) => {
    if (a[sortField] < b[sortField]) return -1
    if (a[sortField] > b[sortField]) return 1
    return 0
  })
})
```

## Type Safety

### Generic Computations

```typescript
interface User {
  id: number
  name: string
  active: boolean
}

const [users, setUsers] = createSignal<User[]>([])

// Type is automatically inferred
const activeUsers = createMemo(() => 
  users().filter(user => user.active)
) // Type: () => User[]

// Explicit type annotation
const userNames = createMemo<string[]>(() =>
  users().map(user => user.name)
)
```

### Conditional Return Types

```typescript
const [user, setUser] = createSignal<User | null>(null)

// Union return type
const userDisplay = createMemo(() => {
  const currentUser = user()
  return currentUser ? currentUser.name : 'Anonymous'
}) // Type: () => string
```

## Best Practices

### 1. Keep Computations Pure

```typescript
// ✅ Good - Pure computation
const doubled = createMemo(() => count() * 2)

// ❌ Avoid - Side effects in computation
const doubled = createMemo(() => {
  console.log('Computing...') // Side effect
  return count() * 2
})
```

### 2. Use for Expensive Operations

```typescript
// ✅ Good - Cache expensive operations
const expensiveResult = createMemo(() => 
  performExpensiveCalculation(data())
)

// ❌ Avoid - Repeating expensive operations
Text(() => performExpensiveCalculation(data()))
```

### 3. Prefer Computed Over Effects for Derived State

```typescript
// ✅ Good - Computed for derived state
const fullName = createMemo(() => `${firstName()} ${lastName()}`)

// ❌ Avoid - Effect for derived state
const [fullName, setFullName] = createSignal('')
createEffect(() => {
  setFullName(`${firstName()} ${lastName()}`)
})
```

## Debugging

### Development Tools

Named computations appear in development tools:

```typescript
const debugComputation = createMemo(() => {
  return complexCalculation()
}, {
  name: 'debugComputation'
})
```

### Logging Dependencies

```typescript
const debuggedMemo = createMemo(() => {
  console.log('Dependencies:', {
    firstName: firstName(),
    lastName: lastName()
  })
  return `${firstName()} ${lastName()}`
})
```

## Error Handling

### Graceful Degradation

```typescript
const safeComputation = createMemo(() => {
  try {
    return riskyCalculation(data())
  } catch (error) {
    console.error('Computation failed:', error)
    return fallbackValue
  }
})
```

## Migration Guide

### From React useMemo

```typescript
// React
const memoized = useMemo(() => 
  expensiveComputation(a, b), [a, b]
)

// TachUI - Dependencies tracked automatically
const memoized = createMemo(() => 
  expensiveComputation(a(), b())
)
```

### From Vue computed

```typescript
// Vue
const fullName = computed(() => 
  `${firstName.value} ${lastName.value}`
)

// TachUI
const fullName = createMemo(() => 
  `${firstName()} ${lastName()}`
)
```

## See Also

- **[createSignal](/api/create-signal)** - Create reactive signals
- **[createEffect](/api/create-effect)** - Side effects that react to changes
- **[Signals Guide](/guide/signals)** - Understanding reactive programming
- **[State Management](/guide/state-management)** - Advanced state management patterns