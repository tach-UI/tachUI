# Concatenation Performance Guide

## Overview

tachUI's component concatenation system is designed for optimal performance through intelligent caching, automatic optimization, and efficient DOM manipulation. This guide covers performance characteristics, optimization strategies, and best practices for high-performance applications.

## Performance Features

### 1. Automatic Text Merging

The system automatically merges adjacent text components to reduce DOM complexity:

```typescript
// Source: Multiple text components
const greeting = Text("Hello, ")
  .concat(Text("John"))
  .concat(Text("!"))
  .concat(Text(" Welcome to tachUI"))

// Optimized result: Single DOM element
// <span>Hello, John! Welcome to tachUI</span>
```

**Performance Impact:**
- Reduces DOM nodes from 4 to 1 (75% reduction)
- Decreases memory usage
- Improves rendering performance
- Reduces layout thrashing

### 2. LRU Caching System

Optimization results are cached using an LRU (Least Recently Used) strategy:

```typescript
import { TextConcatenationOptimizer } from '@tachui/core/concatenation'

// Check cache performance
const stats = TextConcatenationOptimizer.getCacheStats()
console.log(`Cache utilization: ${stats.size}/${stats.maxSize}`)

// Clear cache if needed (e.g., memory pressure)
if (stats.size === stats.maxSize) {
  TextConcatenationOptimizer.clearCache()
}
```

**Cache Configuration:**
- **Maximum size:** 100 entries
- **TTL (Time To Live):** 5 minutes
- **Eviction strategy:** LRU with timestamp validation

### 3. Smart Optimization Detection

The system analyzes segments before applying optimizations:

```typescript
const segments = [textSegment1, imageSegment, textSegment2, textSegment3]

// Only optimize when beneficial
if (TextConcatenationOptimizer.shouldOptimize(segments)) {
  const optimized = TextConcatenationOptimizer.optimize(segments)
  // Result: [textSegment1, imageSegment, mergedTextSegment]
}
```

## Performance Monitoring

### Development Mode Logging

Enable performance logging in development:

```typescript
// Set environment variable
process.env.NODE_ENV = 'development'

// Concatenation with performance logging
const result = Text("Hello")
  .concat(Text(" World"))
  .concat(Text("!"))

// Console output:
// "TachUI Concatenation: Optimized 3 → 1 segments (67% reduction)"
// "TachUI Concatenation: Optimization took 0.52ms for 3 segments"
```

### Performance Analysis

Analyze optimization opportunities:

```typescript
const analysis = TextConcatenationOptimizer.analyzeOptimizationOpportunities(segments)

console.log(`Optimization Analysis:
- Total segments: ${analysis.totalSegments}
- Text segments: ${analysis.textSegments}
- Image segments: ${analysis.imageSegments}
- Interactive segments: ${analysis.interactiveSegments}
- Optimizable pairs: ${analysis.optimizableTextPairs}
- Estimated reduction: ${analysis.estimatedReductionPercent}%`)
```

### Custom Performance Metrics

```typescript
const measureConcatenation = (name: string, concatenationFn: () => any) => {
  const start = performance.now()
  const result = concatenationFn()
  const end = performance.now()
  
  console.log(`${name} concatenation took ${(end - start).toFixed(2)}ms`)
  return result
}

// Usage
const userCard = measureConcatenation('User Card', () =>
  Image(user.avatar)
    .concat(Text(user.name))
    .concat(Text(user.title))
    .concat(Button("Follow", followUser))
)
```

## Optimization Strategies

### 1. Batch Text Operations

Group text operations to maximize merging benefits:

```typescript
// ✅ Good: Adjacent text components get merged
const address = Text(user.street)
  .concat(Text(", "))
  .concat(Text(user.city))
  .concat(Text(", "))
  .concat(Text(user.state))
  .concat(Text(" "))
  .concat(Text(user.zipCode))

// Result: Single merged text element

// ❌ Less optimal: Interleaved with other components
const scattered = Text(user.street)
  .concat(Image("location-icon.svg"))
  .concat(Text(user.city))
  .concat(Button("Edit", editAddress))
  .concat(Text(user.state))

// Result: No text merging possible
```

### 2. Minimize Concatenation Chains

Avoid extremely long concatenation chains:

```typescript
// ❌ Avoid: Very long chains
const longChain = Text("Part 1")
  .concat(Text("Part 2"))
  .concat(Text("Part 3"))
  // ... many more parts
  .concat(Text("Part 20"))

// ✅ Better: Group logically or use arrays
const parts = ["Part 1", "Part 2", "Part 3", /* ... */ "Part 20"]
const combined = Text(parts.join(" "))

// Or use VStack/HStack for layout
const groupedContent = VStack(
  parts.map(part => Text(part))
)
```

### 3. Memoize Expensive Concatenations

Use memoization for complex or frequently rendered concatenations:

```typescript
import { createMemo } from '@tachui/core'

const ExpensiveUserCard = (user: User) => {
  // Memoize the concatenation result
  const userHeader = createMemo(() => 
    Image(user.avatar, { width: 48, height: 48 })
      .concat(Text(user.name).fontSize(18))
      .concat(Text(user.title).fontSize(14))
      .concat(Text(`${user.followers} followers`).fontSize(12))
  )

  return VStack([
    userHeader(), // Cached result
    Text(user.bio),
    Button("Follow", () => followUser(user))
  ])
}
```

### 4. Optimize Modifier Usage

Apply modifiers efficiently in concatenated components:

```typescript
// ✅ Good: Single modifier application
const styledContent = Text("Important:")
  .concat(Text(" Read this message"))
  .color('#dc3545')
  .fontWeight('bold')
  .padding(16)

// ❌ Less efficient: Multiple modifier applications
const inefficient = Text("Important:").color('#dc3545')
  .concat(Text(" Read this message").color('#dc3545'))
```

## Memory Management

### Cache Management

Monitor and manage cache memory usage:

```typescript
class ConcatenationManager {
  private static memoryThreshold = 50 * 1024 * 1024 // 50MB
  
  static checkMemoryUsage() {
    if (performance.memory?.usedJSHeapSize > this.memoryThreshold) {
      console.warn('High memory usage detected, clearing concatenation cache')
      TextConcatenationOptimizer.clearCache()
    }
  }
  
  static startMemoryMonitoring() {
    setInterval(this.checkMemoryUsage, 30000) // Check every 30 seconds
  }
}
```

### Component Cleanup

Ensure proper cleanup of concatenated components:

```typescript
const DynamicConcatenation = () => {
  const [items, setItems] = createSignal<string[]>([])
  
  // Use cleanup function for complex concatenations
  onCleanup(() => {
    // Clear any component-specific caches
    TextConcatenationOptimizer.clearCache()
  })
  
  const concatenatedItems = createMemo(() => {
    let result = null
    
    items().forEach((item, index) => {
      const element = Text(item)
      
      if (result === null) {
        result = element
      } else {
        result = result.concat(Text(", ")).concat(element)
      }
    })
    
    return result
  })
  
  return concatenatedItems()
}
```

## Benchmarking

### Simple Performance Test

```typescript
const benchmarkConcatenation = () => {
  const iterations = 1000
  const textParts = Array.from({ length: 10 }, (_, i) => `Part ${i + 1}`)
  
  // Test 1: Individual concatenations
  console.time('Individual concatenations')
  for (let i = 0; i < iterations; i++) {
    let result = Text(textParts[0])
    for (let j = 1; j < textParts.length; j++) {
      result = result.concat(Text(textParts[j]))
    }
  }
  console.timeEnd('Individual concatenations')
  
  // Test 2: Single text component
  console.time('Single text component')
  for (let i = 0; i < iterations; i++) {
    const result = Text(textParts.join(' '))
  }
  console.timeEnd('Single text component')
  
  // Test 3: With caching (second run)
  console.time('Cached concatenations')
  for (let i = 0; i < iterations; i++) {
    let result = Text(textParts[0])
    for (let j = 1; j < textParts.length; j++) {
      result = result.concat(Text(textParts[j]))
    }
  }
  console.timeEnd('Cached concatenations')
}
```

### DOM Performance Comparison

```typescript
const compareDOMPerformance = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  
  // Test 1: Multiple DOM elements
  console.time('Multiple DOM elements')
  for (let i = 0; i < 1000; i++) {
    const span1 = document.createElement('span')
    span1.textContent = 'Hello, '
    const span2 = document.createElement('span')
    span2.textContent = 'World!'
    container.appendChild(span1)
    container.appendChild(span2)
  }
  console.timeEnd('Multiple DOM elements')
  
  container.innerHTML = '' // Clear
  
  // Test 2: Single merged element
  console.time('Single merged element')
  for (let i = 0; i < 1000; i++) {
    const span = document.createElement('span')
    span.textContent = 'Hello, World!'
    container.appendChild(span)
  }
  console.timeEnd('Single merged element')
  
  document.body.removeChild(container)
}
```

## Best Practices Summary

### 1. Design for Optimization
- Group adjacent text components when possible
- Minimize interleaving of different component types
- Use meaningful semantic groupings

### 2. Monitor Performance
- Enable development mode logging
- Use browser DevTools to monitor DOM complexity
- Implement custom performance metrics for critical paths

### 3. Cache Management
- Monitor cache hit rates
- Clear cache during memory pressure
- Use memoization for complex concatenations

### 4. Memory Efficiency
- Clean up component references
- Avoid creating unnecessary intermediate concatenations
- Use arrays and loops instead of long concatenation chains

### 5. Production Optimization
```typescript
// Production-ready concatenation with performance monitoring
const createOptimizedConcatenation = (
  components: Array<() => Concatenatable>,
  name: string
) => {
  return createMemo(() => {
    const start = performance.now()
    
    let result = components[0]()
    for (let i = 1; i < components.length; i++) {
      result = result.concat(components[i]())
    }
    
    const duration = performance.now() - start
    if (duration > 5) {
      console.warn(`Slow concatenation '${name}': ${duration.toFixed(2)}ms`)
    }
    
    return result
  })
}
```

The concatenation system is designed to provide excellent performance out of the box while giving you the tools to optimize further when needed. By following these guidelines and monitoring performance metrics, you can build highly performant applications with complex component compositions.