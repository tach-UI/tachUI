# Responsive Performance Optimization

TachUI's responsive system is designed for optimal performance, but understanding how to leverage its optimization features and best practices will help you build faster, more efficient applications.

## Performance Overview

TachUI's responsive system includes several built-in optimizations:

- **CSS Rule Caching**: Generated CSS is cached to prevent regeneration
- **Rule Deduplication**: Identical responsive rules are automatically deduplicated  
- **Batched CSS Injection**: Multiple responsive changes are batched together
- **Lazy Evaluation**: Responsive values are computed only when needed
- **Efficient Event Handling**: Optimized resize listeners with debouncing
- **Memory Management**: Automatic cleanup prevents memory leaks

## Performance Monitoring

### Built-in Performance Monitor

TachUI includes a performance monitoring system to track responsive system performance:

```typescript
import { ResponsivePerformanceMonitor } from '@tachui/core'

// Enable performance monitoring
ResponsivePerformanceMonitor.enable({
  trackCSSGeneration: true,     // Track CSS generation time
  trackBreakpointChanges: true, // Track breakpoint change performance
  trackMemoryUsage: true,       // Track memory usage
  sampleRate: 0.1              // Sample 10% of operations
})

// Get performance statistics
const stats = ResponsivePerformanceMonitor.getStats()
console.log(stats)
// {
//   cssGeneration: { count: 150, total: 45.2, average: 0.3, min: 0.1, max: 2.1 },
//   breakpointChanges: { count: 12, total: 8.5, average: 0.7, min: 0.3, max: 1.2 },
//   memoryUsage: { current: 2.1, peak: 3.4, average: 2.8 }
// }

// Reset statistics
ResponsivePerformanceMonitor.reset()
```

### Real-time Performance Monitoring

Monitor performance in real-time during development:

```typescript
// Enable real-time monitoring with visual overlay
import { ResponsiveDevTools } from '@tachui/core'

ResponsiveDevTools.enable({
  showPerformance: true,        // Show performance metrics in overlay
  logPerformanceWarnings: true, // Log performance warnings to console
  performanceThreshold: 5       // Warn if operations take longer than 5ms
})
```

### Custom Performance Tracking

Track performance for specific responsive operations:

```typescript
import { ResponsivePerformanceMonitor } from '@tachui/core'

// Track custom operation
const measureOperation = async (operationName: string, operation: () => any) => {
  const startTime = performance.now()
  
  try {
    const result = await operation()
    const duration = performance.now() - startTime
    
    ResponsivePerformanceMonitor.recordOperation(operationName, duration)
    
    if (duration > 10) {
      console.warn(`Slow responsive operation: ${operationName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  } catch (error) {
    const duration = performance.now() - startTime
    ResponsivePerformanceMonitor.recordError(operationName, duration, error)
    throw error
  }
}

// Usage
await measureOperation('complex-responsive-layout', () => {
  return createComplexResponsiveLayout()
})
```

## CSS Generation Optimization

### Optimized CSS Generator

Use the optimized CSS generator for maximum performance:

```typescript
import { OptimizedCSSGenerator } from '@tachui/core'

// Configure optimization options
const optimizedCSS = OptimizedCSSGenerator.generateOptimizedCSS(
  '.my-component',
  {
    fontSize: { base: 16, md: 20, lg: 24 },
    padding: { base: 8, md: 12, lg: 16 },
    color: { base: '#333', md: '#000' }
  },
  {
    minify: true,           // Minify generated CSS
    deduplicate: true,      // Remove duplicate rules
    batch: true,            // Batch multiple generations
    cache: true,            // Enable caching
    prefixOptimization: true // Optimize vendor prefixes
  }
)
```

### CSS Rule Caching

TachUI automatically caches generated CSS rules, but you can control caching behavior:

```typescript
import { cssRuleCache } from '@tachui/core'

// Get cache statistics
const cacheStats = cssRuleCache.getStats()
console.log(cacheStats)
// {
//   size: 247,           // Number of cached rules
//   hitRate: 0.847,      // Cache hit rate (84.7%)
//   memoryUsage: 1.2     // Memory usage in MB
// }

// Clear cache if needed (not recommended in production)
cssRuleCache.clear()

// Configure cache settings
cssRuleCache.configure({
  maxSize: 1000,          // Maximum number of cached rules
  maxMemory: 5,           // Maximum memory usage in MB
  ttl: 3600000           // Time to live in milliseconds (1 hour)
})
```

### Batch CSS Operations

Batch multiple CSS operations for better performance:

```typescript
import { OptimizedCSSGenerator } from '@tachui/core'

// Batch multiple CSS generations
const batchedOperations = [
  {
    selector: '.component-1',
    config: { fontSize: { base: 16, md: 20 } }
  },
  {
    selector: '.component-2', 
    config: { padding: { base: 8, md: 12 } }
  },
  {
    selector: '.component-3',
    config: { margin: { base: 4, md: 8 } }
  }
]

// Process batch for optimal performance
const batchedCSS = OptimizedCSSGenerator.generateBatchedCSS(batchedOperations, {
  minify: true,
  deduplicate: true
})
```

## Runtime Performance Optimization

### Efficient Breakpoint Listeners

Optimize breakpoint change handling:

```typescript
import { useBreakpoint, createBreakpointOptimizer } from '@tachui/core'

// Use optimized breakpoint detection
const OptimizedComponent = () => {
  // Create optimized breakpoint listener with debouncing
  const bp = useBreakpoint({
    debounceMs: 100,        // Debounce breakpoint changes
    throttleMs: 50,         // Throttle rapid changes
    lazyEvaluation: true    // Only compute when accessed
  })
  
  // Use specific breakpoint checks for better performance
  const isMobile = bp.isBelow('md')      // Cached result
  const isDesktop = bp.isAbove('lg')     // Cached result
  
  return Text("Optimized component")
    .modifier
    .fontSize(isMobile() ? 16 : 20)
    .build()
}
```

### Lazy Responsive Values

Use lazy evaluation for expensive responsive computations:

```typescript
import { useResponsiveValue, createLazyResponsiveValue } from '@tachui/core'

// Expensive computation that should be lazy
const expensiveResponsiveValue = createLazyResponsiveValue(() => ({
  base: calculateComplexValue('mobile'),
  md: calculateComplexValue('tablet'), 
  lg: calculateComplexValue('desktop')
}), [dependency1, dependency2]) // Dependencies for cache invalidation

const OptimizedComponent = () => {
  // Value is only computed when actually needed
  const value = expensiveResponsiveValue()
  
  return Text("Lazy loaded content")
    .modifier
    .fontSize(value)
    .build()
}
```

### Memory Management

Optimize memory usage for responsive components:

```typescript
import { ResponsiveMemoryManager } from '@tachui/core'

// Component with automatic cleanup
const MemoryOptimizedComponent = () => {
  // Register component for memory tracking
  ResponsiveMemoryManager.registerComponent('MyComponent')
  
  const bp = useBreakpoint()
  
  // Cleanup on unmount
  onCleanup(() => {
    ResponsiveMemoryManager.unregisterComponent('MyComponent')
  })
  
  return Text("Memory optimized")
    .modifier
    .fontSize(bp.current() === 'base' ? 16 : 20)
    .build()
}

// Monitor memory usage
const memoryStats = ResponsiveMemoryManager.getStats()
console.log(memoryStats)
// {
//   activeComponents: 15,
//   totalMemoryUsage: 3.2, // MB
//   averagePerComponent: 0.21 // MB
// }
```

## Bundle Size Optimization

### Tree Shaking

Import only the responsive features you need:

```typescript
// ✅ Good: Import specific features
import { 
  useBreakpoint, 
  ResponsiveGridPatterns,
  OptimizedCSSGenerator 
} from '@tachui/core'

// ❌ Avoid: Importing entire responsive module
import * as Responsive from '@tachui/core/responsive'
```

### Conditional Loading

Load advanced responsive features only when needed:

```typescript
// Conditionally import advanced features
const loadAdvancedResponsive = async () => {
  if (process.env.NODE_ENV === 'development') {
    const { ResponsiveDevTools } = await import('@tachui/core/responsive/dev-tools')
    return ResponsiveDevTools
  }
  return null
}

// Load development tools only in development
const DevTools = await loadAdvancedResponsive()
if (DevTools) {
  DevTools.enable({ showOverlay: true })
}
```

### Production Optimizations

Configure responsive system for production:

```typescript
// Production configuration
import { configureResponsiveSystem } from '@tachui/core'

configureResponsiveSystem({
  production: true,           // Enable production optimizations
  disableDebugTools: true,    // Disable debug tools
  aggressiveCaching: true,    // More aggressive caching
  minifyCSS: true,           // Minify all generated CSS
  prefixOptimization: true,   // Optimize CSS prefixes
  treeshaking: true          // Enable tree shaking optimizations
})
```

## Performance Best Practices

### 1. Minimize Responsive Computations

Avoid creating responsive values in render loops:

```typescript
// ❌ Bad: Creating responsive values in render
const BadComponent = ({ items }: { items: Item[] }) => {
  return VStack(
    items.map(item => 
      Text(item.name)
        .modifier
        // Bad: Creates new responsive value for each item
        .fontSize({ base: 14, md: 16, lg: 18 })
        .build()
    )
  ).build()
}

// ✅ Good: Reuse responsive values
const GoodComponent = ({ items }: { items: Item[] }) => {
  // Create responsive value once
  const responsiveFontSize = { base: 14, md: 16, lg: 18 }
  
  return VStack(
    items.map(item => 
      Text(item.name)
        .modifier
        .fontSize(responsiveFontSize) // Reuse the same object
        .build()
    )
  ).build()
}
```

### 2. Use Specific Breakpoint Checks

Use specific breakpoint checks instead of general responsive objects when possible:

```typescript
// ✅ Good: Specific breakpoint check
const OptimizedComponent = () => {
  const bp = useBreakpoint()
  const fontSize = bp.isBelow('md')() ? 16 : 20
  
  return Text("Optimized")
    .modifier
    .fontSize(fontSize)
    .build()
}

// ❌ Less optimal: Full responsive object for simple case
const LessOptimalComponent = () => {
  return Text("Less optimal")
    .modifier
    .fontSize({ base: 16, md: 20 })
    .build()
}
```

### 3. Batch Responsive Changes

Batch multiple responsive changes together:

```typescript
// ✅ Good: Batch responsive changes
const BatchedComponent = () => {
  return Text("Batched changes")
    .modifier
    .responsive({
      fontSize: { base: 16, md: 20 },
      padding: { base: 8, md: 12 },
      color: { base: '#333', md: '#000' }
    })
    .build()
}

// ❌ Less optimal: Individual responsive modifiers
const IndividualComponent = () => {
  return Text("Individual changes")
    .modifier
    .fontSize({ base: 16, md: 20 })
    .padding({ base: 8, md: 12 })
    .color({ base: '#333', md: '#000' })
    .build()
}
```

### 4. Optimize Media Query Usage

Use built-in media queries instead of custom ones when possible:

```typescript
import { MediaQueries } from '@tachui/core'

// ✅ Good: Use built-in media queries (cached and optimized)
Text("Optimized media query")
  .modifier
  .mediaQuery(MediaQueries.darkMode, { color: '#ffffff' })
  .mediaQuery(MediaQueries.reducedMotion, { transition: 'none' })
  .build()

// ❌ Less optimal: Custom media queries (not cached)
Text("Custom media query")
  .modifier
  .mediaQuery('(prefers-color-scheme: dark)', { color: '#ffffff' })
  .mediaQuery('(prefers-reduced-motion: reduce)', { transition: 'none' })
  .build()
```

### 5. Profile Responsive Performance

Regularly profile your responsive performance:

```typescript
// Performance profiling in development
if (process.env.NODE_ENV === 'development') {
  import { ResponsivePerformanceMonitor, ResponsiveDevTools } from '@tachui/core'
  
  // Enable comprehensive monitoring
  ResponsivePerformanceMonitor.enable({
    trackCSSGeneration: true,
    trackBreakpointChanges: true,
    trackMemoryUsage: true,
    detailedProfiling: true
  })
  
  // Log performance summary every 30 seconds
  setInterval(() => {
    const stats = ResponsivePerformanceMonitor.getStats()
    console.log('Responsive Performance Summary:', stats)
    
    // Warn about performance issues
    if (stats.cssGeneration.average > 5) {
      console.warn('CSS generation is slow, consider optimization')
    }
    
    if (stats.memoryUsage.current > 10) {
      console.warn('High memory usage detected')
    }
  }, 30000)
}
```

## Debugging Performance Issues

### Performance Debugging Tools

Use built-in debugging tools to identify performance bottlenecks:

```typescript
import { ResponsiveDevTools, ResponsivePerformanceMonitor } from '@tachui/core'

// Enable debug mode with performance monitoring
ResponsiveDevTools.enable({
  showPerformance: true,
  logLevel: 'debug',
  performanceThreshold: 3, // Warn about operations > 3ms
  memoryThreshold: 5      // Warn about memory usage > 5MB
})

// Log detailed performance information
ResponsiveDevTools.logPerformanceProfile()
```

### Common Performance Issues

#### Slow CSS Generation

```typescript
// Diagnose slow CSS generation
const diagnostics = OptimizedCSSGenerator.getDiagnostics()

if (diagnostics.averageGenerationTime > 5) {
  console.warn('Slow CSS generation detected')
  console.log('Cache hit rate:', diagnostics.cacheHitRate)
  console.log('Duplicate rules:', diagnostics.duplicateRules)
  
  // Optimize by enabling more aggressive caching
  OptimizedCSSGenerator.configure({
    aggressiveCaching: true,
    batchSize: 50,
    deduplicationLevel: 'aggressive'
  })
}
```

#### Memory Leaks

```typescript
// Detect memory leaks
const memoryMonitor = setInterval(() => {
  const stats = ResponsivePerformanceMonitor.getMemoryStats()
  
  if (stats.trend === 'increasing' && stats.current > stats.average * 1.5) {
    console.warn('Potential memory leak detected')
    console.log('Current usage:', stats.current, 'MB')
    console.log('Average usage:', stats.average, 'MB')
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc()
    }
  }
}, 10000)
```

#### Excessive Breakpoint Changes

```typescript
// Monitor breakpoint change frequency
let breakpointChangeCount = 0
let lastBreakpoint = ''

const unsubscribe = useBreakpoint().current.subscribe(newBreakpoint => {
  if (newBreakpoint !== lastBreakpoint) {
    breakpointChangeCount++
    lastBreakpoint = newBreakpoint
    
    // Reset counter every minute
    setTimeout(() => {
      if (breakpointChangeCount > 10) {
        console.warn(
          `High breakpoint change frequency: ${breakpointChangeCount} changes per minute`
        )
      }
      breakpointChangeCount = 0
    }, 60000)
  }
})
```

## Performance Testing

### Automated Performance Testing

Create automated tests for responsive performance:

```typescript
// Performance test suite
describe('Responsive Performance', () => {
  beforeEach(() => {
    ResponsivePerformanceMonitor.reset()
  })
  
  test('CSS generation should be fast', () => {
    const startTime = performance.now()
    
    // Generate CSS for multiple components
    for (let i = 0; i < 100; i++) {
      OptimizedCSSGenerator.generateOptimizedCSS(
        `.component-${i}`,
        {
          fontSize: { base: 16, md: 20, lg: 24 },
          padding: { base: 8, md: 12, lg: 16 }
        }
      )
    }
    
    const duration = performance.now() - startTime
    expect(duration).toBeLessThan(50) // Should complete in under 50ms
  })
  
  test('Memory usage should be reasonable', () => {
    const initialMemory = ResponsivePerformanceMonitor.getMemoryStats().current
    
    // Create many responsive components
    const components = Array.from({ length: 50 }, (_, i) => 
      createResponsiveComponent(`component-${i}`)
    )
    
    const finalMemory = ResponsivePerformanceMonitor.getMemoryStats().current
    const memoryIncrease = finalMemory - initialMemory
    
    expect(memoryIncrease).toBeLessThan(5) // Should use less than 5MB
    
    // Cleanup
    components.forEach(component => component.dispose())
  })
  
  test('Cache hit rate should be high', () => {
    // Generate identical CSS multiple times
    const selector = '.test-component'
    const config = { fontSize: { base: 16, md: 20 } }
    
    for (let i = 0; i < 10; i++) {
      OptimizedCSSGenerator.generateOptimizedCSS(selector, config)
    }
    
    const cacheStats = cssRuleCache.getStats()
    expect(cacheStats.hitRate).toBeGreaterThan(0.8) // 80% hit rate
  })
})
```

### Performance Benchmarking

Benchmark responsive performance across different scenarios:

```typescript
// Benchmark suite
const runPerformanceBenchmark = async () => {
  const results = {}
  
  // Benchmark CSS generation
  results.cssGeneration = await benchmark('CSS Generation', () => {
    OptimizedCSSGenerator.generateOptimizedCSS('.test', {
      fontSize: { base: 16, md: 20, lg: 24 },
      padding: { base: 8, md: 12, lg: 16 },
      margin: { base: 4, md: 8, lg: 12 }
    })
  }, 1000)
  
  // Benchmark breakpoint changes
  results.breakpointChanges = await benchmark('Breakpoint Changes', () => {
    // Simulate breakpoint change
    window.dispatchEvent(new Event('resize'))
  }, 100)
  
  // Benchmark responsive value resolution
  results.valueResolution = await benchmark('Value Resolution', () => {
    const responsive = { base: 16, md: 20, lg: 24 }
    useResponsiveValue(responsive)()
  }, 1000)
  
  console.log('Performance Benchmark Results:', results)
  return results
}

const benchmark = async (name: string, operation: () => any, iterations: number) => {
  const times = []
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now()
    await operation()
    const end = performance.now()
    times.push(end - start)
  }
  
  return {
    name,
    iterations,
    total: times.reduce((a, b) => a + b, 0),
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort()[Math.floor(times.length / 2)]
  }
}
```

By following these performance optimization guidelines and using TachUI's built-in performance tools, you can ensure your responsive applications remain fast and efficient across all devices and screen sizes.

## Related Guides

- [Responsive Design](./responsive-design.md) - Core responsive design concepts
- [Responsive Debugging](./responsive-debugging.md) - Debug responsive layouts
- [API Reference](../api/responsive-modifiers.md) - Complete API documentation
- [Migration Guide](./responsive-migration.md) - Migrate from other frameworks