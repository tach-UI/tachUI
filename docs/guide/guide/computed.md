# Computed Values

Computed values (also known as memos) are derived state that automatically recalculates when their dependencies change. TachUI's computed signals provide a powerful way to create reactive derived values with efficient caching and dependency tracking.

## Core API

TachUI provides both `createComputed` and `createMemo` (alias) for creating computed signals:

```typescript
import { 
  createSignal, 
  createComputed, 
  createMemo,
  type Accessor,
  type SignalSetter,
  type Signal
} from '@tachui/core'

// Type-safe signal creation
const [firstName, setFirstName]: [Accessor<string>, SignalSetter<string>] = createSignal('John')
const [lastName, setLastName]: [Accessor<string>, SignalSetter<string>] = createSignal('Doe')

// Computed value with explicit return type
const fullName: Signal<string> = createComputed((): string => `${firstName()} ${lastName()}`)

// createMemo is an alias for createComputed with type safety
const displayName: Signal<string> = createMemo((): string => fullName().toUpperCase())

// Type-safe usage
const currentFullName: string = fullName() // "John Doe"
const currentDisplayName: string = displayName() // "JOHN DOE"
console.log(currentFullName, currentDisplayName)

setFirstName('Jane')
console.log(fullName()) // "Jane Doe"
console.log(displayName()) // "JANE DOE"

// Complex computed values with proper typing
interface Person {
  firstName: string
  lastName: string
  age: number
  email?: string
}

const [person, setPerson]: [Accessor<Person>, SignalSetter<Person>] = createSignal<Person>({
  firstName: 'John',
  lastName: 'Doe',
  age: 30,
  email: 'john@example.com'
})

// Computed with complex return type
const personSummary: Signal<string> = createComputed((): string => {
  const p: Person = person()
  return `${p.firstName} ${p.lastName} (${p.age} years old)${p.email ? ` - ${p.email}` : ''}`
})

// Computed returning complex objects
interface PersonAnalysis {
  isAdult: boolean
  nameLength: number
  hasEmail: boolean
  displayName: string
}

const personAnalysis: Signal<PersonAnalysis> = createComputed((): PersonAnalysis => {
  const p: Person = person()
  return {
    isAdult: p.age >= 18,
    nameLength: (p.firstName + p.lastName).length,
    hasEmail: !!p.email,
    displayName: `${p.firstName} ${p.lastName}`
  }
})
```

## Computed Options

Configure computed values with comprehensive options:

```typescript
import { 
  createComputed,
  type ComputedOptions,
  type EqualityFunction,
  type UpdatePriority 
} from '@tachui/core'

// TypeScript interface for computed options
interface ComputedOptions<T> {
  equals?: EqualityFunction<T>    // Custom equality for change detection
  priority?: UpdatePriority       // Scheduling priority
  debugName?: string             // Name for debugging
  onError?: (error: Error) => T  // Error fallback handler
}

const [items, setItems]: [Accessor<number[]>, SignalSetter<number[]>] = createSignal([1, 2, 3])

// Computed with typed options
const expensiveCalculation: Signal<number> = createComputed((): number => {
  const itemArray: number[] = items()
  return itemArray.reduce((sum: number, item: number) => sum + item ** 2, 0)
}, {
  debugName: 'sumOfSquares',
  equals: (a: number, b: number): boolean => a === b, // Custom equality with types
  onError: (error: Error): number => {
    console.error('Calculation failed:', error)
    return 0 // Fallback value
  }
} satisfies ComputedOptions<number>)

// Complex computed with custom equality for objects
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface CartSummary {
  totalItems: number
  totalPrice: number
  averagePrice: number
}

const [cartItems, setCartItems]: [Accessor<CartItem[]>, SignalSetter<CartItem[]>] = 
  createSignal<CartItem[]>([])

const cartSummary: Signal<CartSummary> = createComputed((): CartSummary => {
  const items: CartItem[] = cartItems()
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0)
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  return {
    totalItems,
    totalPrice,
    averagePrice: totalItems > 0 ? totalPrice / totalItems : 0
  }
}, {
  debugName: 'cartSummaryComputation',
  equals: (a: CartSummary, b: CartSummary): boolean => 
    a.totalItems === b.totalItems && 
    a.totalPrice === b.totalPrice && 
    a.averagePrice === b.averagePrice,
  onError: (error: Error): CartSummary => {
    console.error('Cart calculation failed:', error)
    return { totalItems: 0, totalPrice: 0, averagePrice: 0 }
  },
  priority: UpdatePriority.High
} satisfies ComputedOptions<CartSummary>)

// Async-safe computed with error handling
interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
}

const [userId, setUserId]: [Accessor<string | null>, SignalSetter<string | null>] = createSignal(null)

const userProfile: Signal<ApiResponse<Person>> = createComputed((): ApiResponse<Person> => {
  const id: string | null = userId()
  
  if (!id) {
    return { data: null, loading: false, error: null }
  }
  
  try {
    // Simulate sync operation that could fail
    if (id === 'invalid') {
      throw new Error('Invalid user ID')
    }
    
    // Mock user data
    const mockUser: Person = {
      firstName: 'John',
      lastName: 'Doe',
      age: 30,
      email: `${id}@example.com`
    }
    
    return { data: mockUser, loading: false, error: null }
  } catch (error) {
    throw error // Let onError handle it
  }
}, {
  debugName: 'userProfileLoader',
  onError: (error: Error): ApiResponse<Person> => ({
    data: null,
    loading: false,
    error: error.message
  })
} satisfies ComputedOptions<ApiResponse<Person>>)
```

## Computed Signals in Modifiers

Computed signals work seamlessly in TachUI's modifier system:

### Basic Usage

```typescript
const [isDark, setIsDark] = createSignal(false)
const textColor = createComputed(() => isDark() ? '#ffffff' : '#000000')
const bgColor = createComputed(() => isDark() ? '#1a1a1a' : '#ffffff')

Text("Reactive themed text")
  .modifier
  .foregroundColor(textColor)  // Computed signal works directly
  .backgroundColor(bgColor)
  .padding(16)
  .build()
```

### Complex Theme System

```typescript
const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('auto')
const [systemPrefersDark] = createSignal(
  window.matchMedia('(prefers-color-scheme: dark)').matches
)

const resolvedTheme = createComputed(() => {
  if (theme() === 'auto') {
    return systemPrefersDark() ? 'dark' : 'light'
  }
  return theme()
})

const themeColors = createComputed(() => {
  const dark = resolvedTheme() === 'dark'
  return {
    text: dark ? '#ffffff' : '#1a1a1a',
    background: dark ? '#1a1a1a' : '#ffffff',
    border: dark ? '#444444' : '#e0e0e0',
    accent: dark ? '#3b82f6' : '#2563eb'
  }
})

// Apply dynamic theming
VStack({
  children: [
    Text("Theme-aware header")
      .modifier
      .foregroundColor(themeColors().text)
      .fontSize(24)
      .fontWeight('bold')
      .build(),
      
    Button("Toggle Theme", () => {
      setTheme(theme() === 'dark' ? 'light' : 'dark')
    })
      .modifier
      .backgroundColor(themeColors().accent)
      .foregroundColor('#ffffff')
      .border(1, themeColors().border)
      .build()
  ]
})
  .modifier
  .backgroundColor(themeColors().background)
  .padding(16)
  .build()
```

## Performance Patterns

### Efficient Derived State

```typescript
const [todos, setTodos] = createSignal([
  { id: 1, text: 'Learn TachUI', completed: false },
  { id: 2, text: 'Build an app', completed: true },
  { id: 3, text: 'Deploy it', completed: false }
])

// Efficiently computed derived values
const completedTodos = createComputed(() => 
  todos().filter(todo => todo.completed)
)

const pendingTodos = createComputed(() => 
  todos().filter(todo => !todo.completed)
)

const completionStats = createComputed(() => {
  const total = todos().length
  const completed = completedTodos().length
  return {
    total,
    completed,
    pending: total - completed,
    percentage: total > 0 ? Math.round((completed / total) * 100) : 0
  }
})

// Use in UI
VStack({
  children: [
    Text(() => `Progress: ${completionStats().percentage}%`)
      .modifier
      .fontSize(18)
      .fontWeight('bold')
      .build(),
      
    Text(() => `${completionStats().completed} of ${completionStats().total} completed`)
      .modifier
      .fontSize(14)
      .foregroundColor('#666666')
      .build()
  ]
})
```

### Chained Computations

```typescript
const [price, setPrice] = createSignal(100)
const [quantity, setQuantity] = createSignal(2)
const [taxRate, setTaxRate] = createSignal(0.08)
const [discountPercent, setDiscountPercent] = createSignal(10)

// Chain computed values for complex calculations
const subtotal = createComputed(() => price() * quantity())

const discountAmount = createComputed(() => 
  subtotal() * (discountPercent() / 100)
)

const discountedSubtotal = createComputed(() => 
  subtotal() - discountAmount()
)

const taxAmount = createComputed(() => 
  discountedSubtotal() * taxRate()
)

const total = createComputed(() => 
  discountedSubtotal() + taxAmount()
)

// Display in UI
VStack({
  children: [
    HStack({ children: [
      Text("Subtotal:"),
      Text(() => `$${subtotal().toFixed(2)}`)
    ]}),
    HStack({ children: [
      Text(`Discount (${discountPercent()}%):`),
      Text(() => `-$${discountAmount().toFixed(2)}`)
    ]}),
    HStack({ children: [
      Text("Tax:"),
      Text(() => `$${taxAmount().toFixed(2)}`)
    ]}),
    HStack({ children: [
      Text("Total:")
        .modifier.fontWeight('bold').build(),
      Text(() => `$${total().toFixed(2)}`)
        .modifier.fontWeight('bold').build()
    ]})
  ],
  spacing: 8
})
```

## Error Handling

Computed values can handle errors gracefully:

```typescript
const [dataUrl, setDataUrl] = createSignal('/api/data')

const parsedData = createComputed(() => {
  try {
    const rawData = fetchDataSync(dataUrl()) // Hypothetical sync fetch
    return JSON.parse(rawData)
  } catch (error) {
    console.error('Failed to parse data:', error)
    return { error: 'Failed to load data', items: [] }
  }
}, {
  debugName: 'parsedApiData',
  onError: (error) => ({ error: error.message, items: [] })
})

// Safe usage in UI
VStack({
  children: [
    () => parsedData().error ? 
      Text(`Error: ${parsedData().error}`)
        .modifier.foregroundColor('#dc2626').build() :
      List({
        data: parsedData().items,
        renderItem: (item, index) => Text(item.name)
      })
  ]
})
```

## Advanced Patterns

### Conditional Computations

```typescript
const [isLoggedIn, setIsLoggedIn] = createSignal(false)
const [userId, setUserId] = createSignal<string | null>(null)

// Only compute when conditions are met
const userProfile = createComputed(() => {
  if (!isLoggedIn() || !userId()) {
    return null
  }
  
  // Expensive computation only runs when needed
  return fetchUserProfile(userId()!)
}, {
  debugName: 'userProfile'
})

const displayName = createComputed(() => {
  const profile = userProfile()
  return profile ? profile.displayName : 'Guest'
})
```

### Debounced Computations

```typescript
const [searchTerm, setSearchTerm] = createSignal('')

// Debounce expensive search computations
let searchTimeout: number
const debouncedSearch = createComputed(() => {
  const term = searchTerm()
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  return new Promise((resolve) => {
    searchTimeout = setTimeout(() => {
      resolve(performExpensiveSearch(term))
    }, 300)
  })
}, {
  debugName: 'debouncedSearch'
})
```

## Best Practices

### 1. Keep Computations Pure

```typescript
// ✅ Good - Pure function
const formatted = createComputed(() => {
  return formatCurrency(price(), locale())
})

// ❌ Avoid - Side effects in computed
const badComputed = createComputed(() => {
  const result = calculate()
  localStorage.setItem('result', result) // Side effect!
  return result
})
```

### 2. Use Meaningful Debug Names

```typescript
// ✅ Good - Descriptive names for debugging
const cartTotal = createComputed(() => 
  items().reduce((sum, item) => sum + item.price, 0),
  { debugName: 'shoppingCartTotal' }
)

const isFormValid = createComputed(() => 
  email().includes('@') && password().length >= 8,
  { debugName: 'loginFormValidation' }
)
```

### 3. Handle Edge Cases

```typescript
// ✅ Good - Handle empty states
const averageScore = createComputed(() => {
  const scores = getScores()
  if (scores.length === 0) return 0
  
  return scores.reduce((sum, score) => sum + score, 0) / scores.length
}, {
  debugName: 'averageScore'
})
```

### 4. Optimize with Custom Equality

```typescript
// ✅ Good - Custom equality for objects
const processedItems = createComputed(() => {
  return items().map(item => ({ ...item, processed: true }))
}, {
  equals: (a, b) => a.length === b.length && a.every((item, i) => item.id === b[i].id),
  debugName: 'processedItems'
})
```

## Performance Tips

1. **Minimize Dependencies** - Only access signals you actually need
2. **Use Custom Equality** - Prevent unnecessary recalculations for complex objects
3. **Chain Wisely** - Break complex computations into smaller, focused computeds
4. **Debug Names** - Always provide debug names for easier performance profiling
5. **Error Boundaries** - Use onError for graceful degradation

## Next Steps

- [Learn about Effects](/guide/effects) - Handle side effects and async operations
- [Explore Signals](/guide/signals) - Foundation reactive primitives
- [State Management](/guide/state-management) - Higher-level state patterns
- [Memory Management](/guide/cleanup) - Prevent memory leaks in reactive code