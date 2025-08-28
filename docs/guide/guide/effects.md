# Effects

Effects are functions that run in response to signal changes, perfect for side effects like DOM manipulation, network requests, logging, and synchronization. TachUI provides several types of effects for different use cases.

## Core Effect Types

TachUI provides multiple effect functions for different scenarios:

```typescript
import { 
  createEffect,      // Standard effect
  createRenderEffect, // Runs during render phase
  createOnceEffect,  // Runs only once
  createSyncEffect   // Synchronous execution
} from '@tachui/core'
```

## createEffect - Standard Effects

The primary way to handle side effects in reactive code:

```typescript
import { createSignal, createEffect } from '@tachui/core'

const [count, setCount] = createSignal(0)
const [name, setName] = createSignal('TachUI')

// Effect runs when dependencies change
createEffect(() => {
  console.log(`Count: ${count()}, Name: ${name()}`)
  document.title = `${name()} - Count: ${count()}`
})

setCount(5) // Logs and updates title
setName('My App') // Logs and updates title again
```

### Effect Options

Configure effects with options for debugging and control:

```typescript
interface EffectOptions {
  name?: string  // Debug name for easier identification
}

createEffect(() => {
  // Effect logic here
  updateAnalytics(count())
}, { 
  name: 'analyticsUpdater' 
})
```

## Effect Lifecycle & Cleanup

Effects can return cleanup functions to prevent memory leaks:

```typescript
import { createEffect, onCleanup } from '@tachui/core'

const [isActive, setIsActive] = createSignal(false)

createEffect(() => {
  if (isActive()) {
    console.log('Starting timer')
    
    const timer = setInterval(() => {
      console.log('Timer tick')
    }, 1000)
    
    // Cleanup when effect re-runs or component unmounts
    onCleanup(() => {
      console.log('Stopping timer')
      clearInterval(timer)
    })
  }
})

// When isActive changes from true to false, cleanup runs automatically
setIsActive(true)  // Starts timer
setIsActive(false) // Stops timer
```

### Advanced Cleanup Patterns

```typescript
createEffect(() => {
  const controller = new AbortController()
  
  // Async operation with cleanup
  fetch('/api/data', { signal: controller.signal })
    .then(response => response.json())
    .then(data => {
      console.log('Data loaded:', data)
    })
    .catch(error => {
      if (error.name !== 'AbortError') {
        console.error('Fetch failed:', error)
      }
    })
  
  // Cleanup cancels the fetch
  onCleanup(() => {
    controller.abort()
    console.log('Fetch cancelled')
  })
})
```

## createRenderEffect - Render Phase Effects

Effects that run during the render phase, useful for DOM updates:

```typescript
import { createRenderEffect } from '@tachui/core'

const [theme, setTheme] = createSignal('light')

createRenderEffect(() => {
  // Runs during render phase
  document.documentElement.setAttribute('data-theme', theme())
  document.body.className = `theme-${theme()}`
})
```

## createOnceEffect - One-Time Effects

Effects that run only once, regardless of dependency changes:

```typescript
import { createOnceEffect } from '@tachui/core'

const [user, setUser] = createSignal(null)

createOnceEffect(() => {
  // Runs only once, even if user changes
  console.log('Component initialized')
  
  // Load initial data
  loadUserData().then(userData => {
    setUser(userData)
  })
})
```

## createSyncEffect - Synchronous Effects

Effects that run synchronously, useful for immediate DOM updates:

```typescript
import { createSyncEffect } from '@tachui/core'

const [scrollPosition, setScrollPosition] = createSignal(0)

createSyncEffect(() => {
  // Runs synchronously when scrollPosition changes
  window.scrollTo(0, scrollPosition())
})
```

## Common Effect Patterns

### Data Fetching

```typescript
const [userId, setUserId] = createSignal<string | null>(null)
const [userData, setUserData] = createSignal(null)
const [loading, setLoading] = createSignal(false)
const [error, setError] = createSignal<string | null>(null)

createEffect(() => {
  const id = userId()
  
  if (!id) {
    setUserData(null)
    return
  }
  
  setLoading(true)
  setError(null)
  
  const controller = new AbortController()
  
  fetch(`/api/users/${id}`, { signal: controller.signal })
    .then(response => {
      if (!response.ok) throw new Error('Failed to fetch user')
      return response.json()
    })
    .then(data => {
      setUserData(data)
      setLoading(false)
    })
    .catch(err => {
      if (err.name !== 'AbortError') {
        setError(err.message)
        setLoading(false)
      }
    })
  
  onCleanup(() => {
    controller.abort()
  })
})
```

### Local Storage Synchronization

```typescript
const [settings, setSettings] = createSignal({
  theme: 'light',
  language: 'en',
  notifications: true
})

// Load from localStorage on init
createOnceEffect(() => {
  const saved = localStorage.getItem('app-settings')
  if (saved) {
    try {
      setSettings(JSON.parse(saved))
    } catch (error) {
      console.warn('Failed to parse saved settings:', error)
    }
  }
})

// Save to localStorage when settings change
createEffect(() => {
  localStorage.setItem('app-settings', JSON.stringify(settings()))
})
```

### Window Event Listeners

```typescript
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
  
  onCleanup(() => {
    window.removeEventListener('resize', handleResize)
  })
})
```

### Debounced Effects

```typescript
const [searchTerm, setSearchTerm] = createSignal('')
const [searchResults, setSearchResults] = createSignal([])

createEffect(() => {
  const term = searchTerm().trim()
  
  if (!term) {
    setSearchResults([])
    return
  }
  
  // Debounce search
  const timeoutId = setTimeout(async () => {
    try {
      const results = await searchAPI(term)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    }
  }, 300)
  
  onCleanup(() => {
    clearTimeout(timeoutId)
  })
})
```

### WebSocket Connection Management

```typescript
const [isConnected, setIsConnected] = createSignal(false)
const [messages, setMessages] = createSignal<string[]>([])

createEffect(() => {
  const ws = new WebSocket('wss://api.example.com/chat')
  
  ws.onopen = () => {
    console.log('WebSocket connected')
    setIsConnected(true)
  }
  
  ws.onmessage = (event) => {
    setMessages(prev => [...prev, event.data])
  }
  
  ws.onclose = () => {
    console.log('WebSocket disconnected')
    setIsConnected(false)
  }
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error)
  }
  
  onCleanup(() => {
    ws.close()
  })
})
```

### Animation Effects

```typescript
const [isVisible, setIsVisible] = createSignal(false)

createEffect(() => {
  const element = document.getElementById('animated-element')
  if (!element) return
  
  if (isVisible()) {
    element.style.opacity = '0'
    element.style.transform = 'translateY(20px)'
    
    // Animate in
    const animation = element.animate([
      { opacity: '0', transform: 'translateY(20px)' },
      { opacity: '1', transform: 'translateY(0)' }
    ], {
      duration: 300,
      easing: 'ease-out',
      fill: 'forwards'
    })
    
    onCleanup(() => {
      animation.cancel()
    })
  } else {
    // Animate out
    const animation = element.animate([
      { opacity: '1', transform: 'translateY(0)' },
      { opacity: '0', transform: 'translateY(-20px)' }
    ], {
      duration: 200,
      easing: 'ease-in',
      fill: 'forwards'
    })
    
    onCleanup(() => {
      animation.cancel()
    })
  }
})
```

## Error Handling in Effects

Always handle errors gracefully in effects:

```typescript
createEffect(() => {
  try {
    // Risky operation
    const result = riskyOperation(someSignal())
    updateUI(result)
  } catch (error) {
    console.error('Effect failed:', error)
    handleError(error)
  }
})

// Async error handling
createEffect(() => {
  const loadData = async () => {
    try {
      const data = await fetchData()
      setData(data)
    } catch (error) {
      console.error('Data loading failed:', error)
      setError(error.message)
    }
  }
  
  loadData()
})
```

## Effect Performance Tips

### 1. Minimize Dependencies

```typescript
// ✅ Good - Only depends on what's needed
createEffect(() => {
  if (user().isActive) {
    updateActiveStatus()
  }
})

// ❌ Avoid - Unnecessary dependencies
createEffect(() => {
  const userData = user() // Accesses all user data
  if (userData.isActive) {
    updateActiveStatus()
  }
})
```

### 2. Use Untrack for Non-Reactive Reads

```typescript
import { untrack } from '@tachui/core'

createEffect(() => {
  // This will react to currentUser changes
  const user = currentUser()
  
  // This won't create a dependency on settings
  const theme = untrack(() => settings().theme)
  
  updateUserDisplay(user, theme)
})
```

### 3. Batch Related Updates

```typescript
import { batch } from '@tachui/core'

createEffect(() => {
  const data = fetchedData()
  
  // Batch related updates to prevent multiple re-renders
  batch(() => {
    setProcessedData(processData(data))
    setMetadata(extractMetadata(data))
    setIsLoading(false)
  })
})
```

## Best Practices

### 1. Effects vs Computed Values

```typescript
// ✅ Use computed for derived state
const fullName = createComputed(() => `${firstName()} ${lastName()}`)

// ✅ Use effects for side effects
createEffect(() => {
  console.log('Name changed to:', fullName())
})
```

### 2. Always Clean Up Resources

```typescript
// ✅ Good - Proper cleanup
createEffect(() => {
  const subscription = observable.subscribe(handleData)
  
  onCleanup(() => {
    subscription.unsubscribe()
  })
})

// ❌ Bad - Memory leak
createEffect(() => {
  observable.subscribe(handleData) // Never cleaned up!
})
```

### 3. Use Descriptive Names

```typescript
// ✅ Good - Clear purpose
createEffect(() => {
  // Analytics logic
}, { name: 'trackUserAnalytics' })

createEffect(() => {
  // Theme logic  
}, { name: 'applyThemeChanges' })
```

### 4. Handle Edge Cases

```typescript
createEffect(() => {
  const element = document.getElementById('target')
  
  // Handle missing elements gracefully
  if (!element) {
    console.warn('Target element not found')
    return
  }
  
  // Safe to use element
  element.textContent = message()
})
```

## Debugging Effects

### Using Effect Names

```typescript
createEffect(() => {
  console.log('User effect running')
  updateUserDisplay()
}, { name: 'userDisplayUpdater' })

// The name appears in debugging tools and error messages
```

### Manual Effect Control

```typescript
import { createRoot } from '@tachui/core'

// Create a controlled reactive scope
const dispose = createRoot((dispose) => {
  const cleanup = createEffect(() => {
    // Effect logic
  })
  
  return () => {
    cleanup() // Clean up specific effect
    dispose() // Clean up entire reactive scope
  }
})

// Later, clean up when needed
dispose()
```

## Advanced Patterns

### Conditional Effects

```typescript
const [feature, setFeature] = createSignal<'A' | 'B' | null>(null)

createEffect(() => {
  const currentFeature = feature()
  
  switch (currentFeature) {
    case 'A':
      setupFeatureA()
      onCleanup(cleanupFeatureA)
      break
    case 'B':
      setupFeatureB()
      onCleanup(cleanupFeatureB)
      break
    default:
      // No active feature
      break
  }
})
```

### Effect Composition

```typescript
function useTimer(interval: number) {
  const [tick, setTick] = createSignal(0)
  
  createEffect(() => {
    const timer = setInterval(() => {
      setTick(prev => prev + 1)
    }, interval)
    
    onCleanup(() => clearInterval(timer))
  })
  
  return tick
}

// Usage
function MyComponent() {
  const tick = useTimer(1000)
  
  return Text(() => `Tick: ${tick()}`)
}
```

## Next Steps

- [Learn about Signals](/guide/signals) - Foundation reactive primitives
- [Explore Computed Values](/guide/computed) - Derived reactive state
- [State Management](/guide/state-management) - Higher-level state patterns
- [Memory Management](/guide/cleanup) - Advanced cleanup patterns