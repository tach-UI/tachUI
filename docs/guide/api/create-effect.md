# createEffect

Creates a side effect that automatically runs when its dependencies change. Effects are used for performing side effects like DOM manipulation, network requests, or logging.

## Signature

```typescript
function createEffect<T>(
  effectFn: (prev?: T) => T,
  options?: EffectOptions
): void
```

## Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `effectFn` | `(prev?: T) => T` | Function that performs the side effect |
| `options` | `EffectOptions` | Optional configuration object |

### EffectOptions

```typescript
interface EffectOptions {
  name?: string
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | `undefined` | Debug name for the effect |

## Basic Usage

### Simple Effect

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [count, setCount] = createSignal(0)

// Effect runs when count changes
createEffect(() => {
  console.log('Count is now:', count())
})

setCount(5) // Logs: "Count is now: 5"
setCount(10) // Logs: "Count is now: 10"
```

### Multiple Dependencies

```typescript
const [firstName, setFirstName] = createSignal('John')
const [lastName, setLastName] = createSignal('Doe')

// Effect runs when either name changes
createEffect(() => {
  console.log('Full name:', `${firstName()} ${lastName()}`)
})

setFirstName('Jane') // Logs: "Full name: Jane Doe"
setLastName('Smith') // Logs: "Full name: Jane Smith"
```

### Effect with Previous Value

```typescript
const [count, setCount] = createSignal(0)

createEffect((prev) => {
  const current = count()
  console.log(`Count changed from ${prev} to ${current}`)
  return current
})

setCount(5) // Logs: "Count changed from undefined to 5"
setCount(10) // Logs: "Count changed from 5 to 10"
```

## Advanced Usage

### DOM Manipulation

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [isVisible, setIsVisible] = createSignal(true)

createEffect(() => {
  const element = document.getElementById('myElement')
  if (element) {
    element.style.display = isVisible() ? 'block' : 'none'
  }
})
```

### Network Requests

```typescript
const [userId, setUserId] = createSignal(1)
const [userData, setUserData] = createSignal(null)
const [loading, setLoading] = createSignal(false)

createEffect(() => {
  const id = userId()
  if (!id) return
  
  setLoading(true)
  fetch(`/api/users/${id}`)
    .then(response => response.json())
    .then(data => {
      setUserData(data)
      setLoading(false)
    })
    .catch(error => {
      console.error('Failed to fetch user:', error)
      setLoading(false)
    })
})
```

### Local Storage Sync

```typescript
const [theme, setTheme] = createSignal('light')

// Load from localStorage on startup
const savedTheme = localStorage.getItem('theme')
if (savedTheme) {
  setTheme(savedTheme)
}

// Save to localStorage when changed
createEffect(() => {
  localStorage.setItem('theme', theme())
})
```

### Cleanup Effects

```typescript
const [isActive, setIsActive] = createSignal(false)

createEffect(() => {
  if (!isActive()) return
  
  // Set up interval
  const interval = setInterval(() => {
    console.log('Active timer tick')
  }, 1000)
  
  // Cleanup function - runs when effect re-runs or component unmounts
  return () => {
    clearInterval(interval)
    console.log('Timer cleaned up')
  }
})
```

### Named Effects (Debugging)

```typescript
createEffect(() => {
  console.log('Debug effect running')
}, {
  name: 'debugEffect'
})
```

## Component Integration

### Component Lifecycle Effects

```typescript
import { VStack, Text, createSignal, createEffect } from '@tachui/core'

function TimerComponent() {
  const [seconds, setSeconds] = createSignal(0)
  const [isRunning, setIsRunning] = createSignal(false)
  
  // Timer effect
  createEffect(() => {
    if (!isRunning()) return
    
    const interval = setInterval(() => {
      setSeconds(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(interval)
  })
  
  return VStack({
    children: [
      Text(() => `Timer: ${seconds()}s`),
      Button(
        () => isRunning() ? 'Stop' : 'Start',
        () => setIsRunning(!isRunning())
      )
    ]
  })
}
```

### Focus Management

```typescript
function SearchComponent() {
  const [query, setQuery] = createSignal('')
  const [isVisible, setIsVisible] = createSignal(false)
  
  // Focus input when component becomes visible
  createEffect(() => {
    if (isVisible()) {
      const input = document.getElementById('search-input')
      if (input) {
        input.focus()
      }
    }
  })
  
  return VStack({
    children: [
      TextField(query, setQuery, 'Search...')
        .id('search-input')
    ]
  })
}
```

### Window Event Listeners

```typescript
function WindowSizeTracker() {
  const [windowSize, setWindowSize] = createSignal({
    width: window.innerWidth,
    height: window.innerHeight
  })
  
  createEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })
  
  return Text(() => 
    `Window size: ${windowSize().width} × ${windowSize().height}`
  )
}
```

## Common Patterns

### Async Data Fetching

```typescript
function UserProfile({ userId }: { userId: () => number }) {
  const [user, setUser] = createSignal(null)
  const [loading, setLoading] = createSignal(false)
  const [error, setError] = createSignal(null)
  
  createEffect(() => {
    const id = userId()
    if (!id) return
    
    setLoading(true)
    setError(null)
    
    fetchUser(id)
      .then(userData => {
        setUser(userData)
        setError(null)
      })
      .catch(err => {
        setError(err.message)
        setUser(null)
      })
      .finally(() => {
        setLoading(false)
      })
  })
  
  return VStack({
    children: [
      () => loading() ? Text('Loading...') : null,
      () => error() ? Text(`Error: ${error()}`).foregroundColor('red') : null,
      () => user() ? UserCard({ user: user() }) : null
    ]
  })
}
```

### Form Validation

```typescript
function ContactForm() {
  const [email, setEmail] = createSignal('')
  const [message, setMessage] = createSignal('')
  const [errors, setErrors] = createSignal({})
  
  // Validation effect
  createEffect(() => {
    const currentEmail = email()
    const currentMessage = message()
    const newErrors = {}
    
    if (!currentEmail) {
      newErrors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(currentEmail)) {
      newErrors.email = 'Email is invalid'
    }
    
    if (!currentMessage) {
      newErrors.message = 'Message is required'
    } else if (currentMessage.length < 10) {
      newErrors.message = 'Message must be at least 10 characters'
    }
    
    setErrors(newErrors)
  })
  
  return Form({
    children: [
      TextField(email, setEmail, 'Email')
        .foregroundColor(() => errors().email ? 'red' : 'black'),
      TextField(message, setMessage, 'Message')
        .foregroundColor(() => errors().message ? 'red' : 'black'),
      Text(() => errors().email || '').foregroundColor('red'),
      Text(() => errors().message || '').foregroundColor('red')
    ]
  })
}
```

### Theme Management

```typescript
function ThemeProvider({ children }) {
  const [theme, setTheme] = createSignal('light')
  
  // Apply theme to document
  createEffect(() => {
    const currentTheme = theme()
    document.documentElement.setAttribute('data-theme', currentTheme)
    document.body.className = `theme-${currentTheme}`
  })
  
  // Listen to system theme changes
  createEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e) => {
      if (theme() === 'auto') {
        setTheme(e.matches ? 'dark' : 'light')
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange)
    }
  })
  
  return VStack({ children })
}
```

## Performance Considerations

### Batched Effects

Effects are automatically batched when multiple signals change synchronously:

```typescript
const [a, setA] = createSignal(1)
const [b, setB] = createSignal(2)

createEffect(() => {
  console.log('Effect runs:', a(), b())
})

// These updates are batched - effect only runs once
setA(10)
setB(20)
// Logs: "Effect runs: 10 20"
```

### Conditional Dependencies

```typescript
const [showDetails, setShowDetails] = createSignal(false)
const [userDetails, setUserDetails] = createSignal(null)

createEffect(() => {
  // Only fetch when details should be shown
  if (showDetails()) {
    fetchUserDetails().then(setUserDetails)
  }
})
```

### Debounced Effects

```typescript
function SearchInput() {
  const [query, setQuery] = createSignal('')
  const [results, setResults] = createSignal([])
  
  createEffect(() => {
    const searchQuery = query()
    if (!searchQuery) {
      setResults([])
      return
    }
    
    // Debounce search requests
    const timeoutId = setTimeout(() => {
      searchAPI(searchQuery).then(setResults)
    }, 300)
    
    return () => clearTimeout(timeoutId)
  })
  
  return VStack({
    children: [
      TextField(query, setQuery, 'Search...'),
      () => results().length > 0 ? 
        SearchResults({ results: results() }) : null
    ]
  })
}
```

## Best Practices

### 1. Keep Effects Focused

```typescript
// ✅ Good - Single responsibility
createEffect(() => {
  localStorage.setItem('theme', theme())
})

createEffect(() => {
  document.title = `App - ${currentPage()}`
})

// ❌ Avoid - Multiple unrelated side effects
createEffect(() => {
  localStorage.setItem('theme', theme())
  document.title = `App - ${currentPage()}`
  console.log('Both changed')
})
```

### 2. Use Cleanup Functions

```typescript
// ✅ Good - Cleanup timers and listeners
createEffect(() => {
  const interval = setInterval(updateClock, 1000)
  return () => clearInterval(interval)
})

// ❌ Avoid - Memory leaks
createEffect(() => {
  setInterval(updateClock, 1000) // Never cleaned up
})
```

### 3. Handle Async Operations Properly

```typescript
// ✅ Good - Handle race conditions
createEffect(() => {
  let cancelled = false
  
  fetchData(id()).then(data => {
    if (!cancelled) {
      setData(data)
    }
  })
  
  return () => {
    cancelled = true
  }
})

// ❌ Avoid - Race conditions
createEffect(() => {
  fetchData(id()).then(setData) // May set stale data
})
```

## Enhanced Effects (v2.0)

TachUI v2.0 introduces enhanced effects with improved error handling, priority scheduling, and debugging capabilities:

### createEnhancedEffect

```typescript
import { createEnhancedEffect, UpdatePriority } from '@tachui/core'

const cleanup = createEnhancedEffect(() => {
  // Your reactive code here
  updateExpensiveCalculation(data())
}, {
  onError: (error) => {
    console.error('Effect failed:', error)
    setError(error.message)
    // Return recovery value or handle gracefully
  },
  priority: UpdatePriority.High,  // Scheduling priority
  debugName: 'expensiveCalc',     // Debug identification
  maxRetries: 3,                  // Automatic retry on error
  retryDelay: 1000               // Delay between retries (ms)
})
```

### Available Options

```typescript
interface EnhancedEffectOptions {
  onError?: (error: Error) => void    // Error recovery handler
  priority?: UpdatePriority           // Update scheduling priority
  debugName?: string                  // Debug name for identification
  maxRetries?: number                 // Maximum retry attempts (default: 0)
  retryDelay?: number                 // Delay between retries in ms (default: 1000)
}
```

### Update Priorities

```typescript
import { UpdatePriority } from '@tachui/core'

// Critical updates (user interactions, animations)
createEnhancedEffect(() => {
  updateUIImmediate()
}, { priority: UpdatePriority.Immediate })

// High priority (important state changes)
createEnhancedEffect(() => {
  updateCriticalState()
}, { priority: UpdatePriority.High })

// Normal priority (default behavior)
createEnhancedEffect(() => {
  updateRegularState()
}, { priority: UpdatePriority.Normal })

// Low priority (background calculations)
createEnhancedEffect(() => {
  performBackgroundWork()
}, { priority: UpdatePriority.Low })

// Idle priority (run when browser is idle)
createEnhancedEffect(() => {
  cleanupCaches()
}, { priority: UpdatePriority.Idle })
```

### Error Handling with Recovery

```typescript
import { createEnhancedEffect } from '@tachui/core'

createEnhancedEffect(() => {
  // Risky operation that might fail
  const result = processComplexData(input())
  setProcessedData(result)
}, {
  onError: (error) => {
    console.error('Processing failed:', error)
    
    // Set fallback data
    setProcessedData(getDefaultData())
    
    // Report error to monitoring service
    errorReporting.report(error)
    
    // Show user-friendly error message
    showNotification('Processing failed, using default data')
  },
  maxRetries: 2,      // Retry up to 2 times
  retryDelay: 500,    // Wait 500ms between retries
  debugName: 'dataProcessor'
})
```

### Automatic Retry Logic

```typescript
createEnhancedEffect(() => {
  // Network operation that might be intermittent
  return fetchCriticalData(userId())
}, {
  maxRetries: 3,
  retryDelay: 1000,   // Exponential backoff: 1s, 2s, 4s
  onError: (error, attempt) => {
    console.log(`Attempt ${attempt} failed:`, error.message)
    
    if (attempt >= 3) {
      // All retries exhausted
      setError('Failed to load data after multiple attempts')
      showOfflineMessage()
    }
  },
  debugName: 'criticalDataFetch'
})
```

## Error Handling (v2.0 Improvements)

### Enhanced Error Propagation

TachUI v2.0 properly propagates errors instead of silently suppressing them, making debugging much easier:

```typescript
// v2.0 - Errors properly propagate for better debugging
createEffect(() => {
  if (shouldFail()) {
    throw new Error('Something went wrong')
  }
  updateUI()
})

// The error will be thrown and visible in browser dev tools
// This makes debugging much easier compared to silent failures
```

### Graceful Error Handling

```typescript
// Traditional error handling still works
createEffect(() => {
  try {
    riskyOperation(data())
  } catch (error) {
    console.error('Effect error:', error)
    setError(error.message)
  }
})

// Enhanced error handling with automatic recovery
createEnhancedEffect(() => {
  riskyOperation(data())
}, {
  onError: (error) => {
    console.error('Effect failed:', error)
    setError(error.message)
    
    // Automatic recovery logic
    if (error.code === 'NETWORK_ERROR') {
      scheduleRetry()
    }
  }
})
```

### Async Error Handling

```typescript
// Traditional async error handling
createEffect(() => {
  fetchData(id())
    .then(setData)
    .catch(error => {
      console.error('Fetch failed:', error)
      setError(error.message)
    })
})

// Enhanced async error handling
createEnhancedEffect(() => {
  return fetchData(id()).then(setData)
}, {
  onError: (error) => {
    console.error('Fetch failed:', error)
    setError(error.message)
    setLoading(false)
  },
  maxRetries: 2,
  retryDelay: 1000
})
```

## Debugging

### Named Effects

```typescript
createEffect(() => {
  console.log('User effect running for:', userId())
}, {
  name: 'userEffect'
})
```

### Effect Logging

```typescript
createEffect(() => {
  console.log('Dependencies:', {
    userId: userId(),
    isActive: isActive()
  })
  
  // Effect logic here
})
```

## Migration Utilities (v2.0)

TachUI v2.0 provides utilities to help migrate and analyze your effects:

### Migrating to Enhanced Effects

```typescript
import { 
  migrateToEnhancedEffect, 
  analyzeEffectPerformance,
  getEffectMetrics 
} from '@tachui/core'

// Migrate existing effect with enhanced features
const enhancedEffect = migrateToEnhancedEffect(existingEffect, {
  priority: UpdatePriority.High,
  debugName: 'migratedEffect',
  onError: (error) => {
    console.error('Migrated effect failed:', error)
  },
  maxRetries: 1
})
```

### Performance Analysis

```typescript
import { analyzeEffectPerformance, enableEffectProfiling } from '@tachui/core'

// Enable effect profiling
const stopProfiling = enableEffectProfiling({ verbose: true })

// Analyze effect performance
const analysis = analyzeEffectPerformance()
console.log('Effect performance:', {
  averageExecutionTime: analysis.averageExecutionTime,
  totalEffects: analysis.totalEffects,
  errorRate: analysis.errorRate,
  recommendations: analysis.recommendations
})

// Get specific effect metrics
const metrics = getEffectMetrics('myEffectName')
console.log('Effect metrics:', {
  executionCount: metrics.executionCount,
  averageTime: metrics.averageTime,
  errorCount: metrics.errorCount,
  lastExecution: metrics.lastExecution
})

// Later...
stopProfiling()
```

### Backwards Compatibility

All existing code continues to work unchanged:

```typescript
// v1.x code works exactly the same
createEffect(() => {
  console.log('Traditional effect still works:', data())
})

// Gradually adopt v2.0 features
createEnhancedEffect(() => {
  console.log('Enhanced effect with error handling:', data())
}, {
  onError: (error) => console.error('Effect failed:', error),
  debugName: 'gradualUpgrade'
})
```

## Migration Guide

### From React useEffect

```typescript
// React
useEffect(() => {
  document.title = title
}, [title])

// TachUI - Dependencies tracked automatically
createEffect(() => {
  document.title = title()
})

// TachUI v2.0 - Enhanced with error handling
createEnhancedEffect(() => {
  document.title = title()
}, {
  onError: (error) => console.error('Title update failed:', error),
  debugName: 'documentTitle'
})
```

### From Vue watchEffect

```typescript
// Vue
watchEffect(() => {
  document.title = title.value
})

// TachUI
createEffect(() => {
  document.title = title()
})

// TachUI v2.0 - Enhanced with priorities
createEnhancedEffect(() => {
  document.title = title()
}, {
  priority: UpdatePriority.Low, // Non-critical UI update
  debugName: 'documentTitle'
})
```

### From Angular effects

```typescript
// Angular
effect(() => {
  document.title = this.title()
})

// TachUI - Very similar API
createEffect(() => {
  document.title = title()
})

// TachUI v2.0 - Enhanced capabilities
createEnhancedEffect(() => {
  document.title = title()
}, {
  onError: (error) => {
    console.error('Effect failed:', error)
    // Fallback behavior
    document.title = 'Application'
  }
})
```

## See Also

- **[createSignal](/api/create-signal)** - Create reactive signals
- **[createMemo](/api/create-computed)** - Computed values derived from signals
- **[Signals Guide](/guide/signals)** - Understanding reactive programming
- **[Component Lifecycle](/guide/components#lifecycle)** - Component lifecycle patterns