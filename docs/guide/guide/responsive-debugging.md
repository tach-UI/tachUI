# Responsive Debugging

TachUI provides comprehensive debugging tools to help you understand, inspect, and troubleshoot responsive behavior in your applications.

## Development Tools Overview

The responsive debugging system includes:

- **Visual Debug Overlay**: Real-time breakpoint and responsive information
- **Element Highlighting**: Visual identification of responsive elements
- **Responsive Inspector**: Detailed analysis of responsive values
- **Performance Monitoring**: Track responsive system performance
- **Browser Compatibility Testing**: Validate across different browsers
- **Console Logging**: Detailed responsive state information

## Visual Debug Overlay

### Enable Debug Overlay

The debug overlay provides real-time information about the current responsive state:

```typescript
import { ResponsiveDevTools } from '@tachui/core'

// Enable debug overlay in development
if (process.env.NODE_ENV === 'development') {
  ResponsiveDevTools.enable({
    showOverlay: true,              // Show debug overlay
    showBreakpoints: true,          // Show breakpoint information
    showPerformance: true,          // Show performance metrics
    position: 'top-right',          // Overlay position
    highlightResponsiveElements: true // Highlight responsive elements
  })
}
```

### Overlay Information

The debug overlay displays:

- **Current Breakpoint**: Active breakpoint name and viewport size
- **Breakpoint Ranges**: All available breakpoints and their values
- **Media Query Results**: Status of common media queries
- **Performance Metrics**: CSS cache statistics and generation times
- **Element Count**: Number of responsive elements on the page

### Customizing the Overlay

```typescript
ResponsiveDevTools.enable({
  showOverlay: true,
  position: 'bottom-left',        // Position in any corner
  logLevel: 'debug',              // Control console output
  refreshRate: 100,               // Update frequency in ms
  showAnimations: true,           // Animate breakpoint changes
  customStyles: {                 // Custom overlay styling
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    color: '#ffffff',
    fontSize: '12px',
    borderRadius: '8px'
  }
})
```

## Element Highlighting

### Visual Element Identification

Highlight responsive elements to understand layout structure:

```typescript
// Enable element highlighting
ResponsiveDevTools.enable({
  highlightResponsiveElements: true,
  highlightStyles: {
    outline: '2px dashed #007bff',    // Highlight style
    outlineOffset: '2px',
    backgroundColor: 'rgba(0, 123, 255, 0.1)'
  }
})
```

### Element Information Display

Highlighted elements show additional information:

```typescript
// Configure element information display
ResponsiveDevTools.enable({
  highlightResponsiveElements: true,
  showElementInfo: true,
  elementInfo: {
    showBreakpoints: true,          // Show which breakpoints affect element
    showResolvedValues: true,       // Show current resolved values
    showPerformanceMetrics: true,   // Show element-specific performance
    position: 'top-left'            // Info tooltip position
  }
})
```

## Responsive Inspector

### Inspect Responsive Values

Use the responsive inspector to analyze responsive value resolution:

```typescript
import { useResponsiveInspector } from '@tachui/core'

const DebuggableComponent = () => {
  const responsiveValue = {
    base: 16,
    md: 20,
    lg: 24,
    xl: 28
  }
  
  // Inspect responsive value behavior
  const inspector = useResponsiveInspector(responsiveValue, 'Font Size')
  const info = inspector()
  
  // Inspector provides detailed information
  console.log('Resolved Value:', info.resolvedValue)      // 20 (at md breakpoint)
  console.log('Active Breakpoint:', info.activeBreakpoint) // 'md'
  console.log('All Values:', info.allValues)              // Full responsive object
  console.log('Is Responsive:', info.isResponsive)        // true
  
  return Text("Inspected Text")
    .modifier
    .fontSize(responsiveValue)
    .build()
}
```

### Manual Value Inspection

Inspect any responsive value manually:

```typescript
// Inspect responsive values in console
ResponsiveDevTools.inspectResponsiveValue(
  { base: 16, md: 20, lg: 24 },
  'Custom Font Size'
)

// Output:
// 🔍 Responsive Value - Custom Font Size
//   Responsive object: { base: 16, md: 20, lg: 24 }
//   Resolved value (md): 20
//   Defined breakpoints:
//     base: 16
//   → md: 20  (current)
//     lg: 24
```

### Batch Inspection

Inspect multiple responsive values:

```typescript
const debugValues = {
  fontSize: { base: 16, md: 20, lg: 24 },
  padding: { base: 8, md: 12, lg: 16 },
  margin: { base: 4, md: 8, lg: 12 }
}

Object.entries(debugValues).forEach(([name, value]) => {
  ResponsiveDevTools.inspectResponsiveValue(value, name)
})
```

## Console Logging

### Responsive State Logging

Log comprehensive responsive state information:

```typescript
// Log current responsive state
ResponsiveDevTools.logResponsiveState()

// Output:
// 🔍 TachUI Responsive State
//   Current breakpoint: md
//   Viewport: 1024×768
//   Configuration: { base: '0px', sm: '640px', md: '768px', ... }
//   Media Query Results:
//     Mobile: false
//     Tablet: true
//     Desktop: false
//     Touch Device: false
//     Dark Mode: false
//     Reduced Motion: false
```

### Custom Logging

Configure detailed logging for debugging:

```typescript
ResponsiveDevTools.enable({
  logLevel: 'debug',              // Log level: error, warn, info, debug
  logBreakpointChanges: true,     // Log when breakpoints change
  logValueResolution: true,       // Log responsive value resolution
  logPerformanceWarnings: true,   // Log performance issues
  logCacheStatistics: true        // Log cache hit/miss information
})
```

### Structured Logging

Create structured logs for analysis:

```typescript
// Custom logging function
const logResponsiveDebug = (component: string, data: any) => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔧 Responsive Debug: ${component}`)
    console.log('Timestamp:', new Date().toISOString())
    console.log('Current Breakpoint:', getCurrentBreakpoint()())
    console.log('Viewport:', getViewportDimensions())
    console.log('Data:', data)
    console.groupEnd()
  }
}

// Usage in components
const MyComponent = () => {
  const responsiveValue = { base: 16, md: 20 }
  
  logResponsiveDebug('MyComponent', {
    responsiveValue,
    resolvedValue: useResponsiveValue(responsiveValue)()
  })
  
  return Text("Logged component").build()
}
```

## Performance Debugging

### Performance Monitoring

Monitor responsive system performance:

```typescript
import { ResponsivePerformanceMonitor } from '@tachui/core'

// Enable performance monitoring
ResponsivePerformanceMonitor.enable({
  trackCSSGeneration: true,
  trackBreakpointChanges: true,
  trackMemoryUsage: true,
  alertThreshold: 5 // Alert if operations take > 5ms
})

// Monitor in real-time
setInterval(() => {
  const stats = ResponsivePerformanceMonitor.getStats()
  
  if (stats.cssGeneration.average > 3) {
    console.warn('Slow CSS generation detected:', stats.cssGeneration)
  }
  
  if (stats.memoryUsage.current > 10) {
    console.warn('High memory usage:', stats.memoryUsage)
  }
}, 5000)
```

### Performance Profiling

Profile specific responsive operations:

```typescript
// Profile component rendering
const profileComponentRender = (componentName: string, renderFn: () => any) => {
  const startTime = performance.now()
  const startMemory = performance.memory?.usedJSHeapSize || 0
  
  const result = renderFn()
  
  const endTime = performance.now()
  const endMemory = performance.memory?.usedJSHeapSize || 0
  
  console.log(`📊 Performance Profile: ${componentName}`)
  console.log(`  Render Time: ${(endTime - startTime).toFixed(2)}ms`)
  console.log(`  Memory Delta: ${((endMemory - startMemory) / 1024 / 1024).toFixed(2)}MB`)
  
  return result
}

// Usage
const MyComponent = () => {
  return profileComponentRender('MyComponent', () => {
    return Text("Profiled component")
      .modifier
      .responsive({
        fontSize: { base: 16, md: 20, lg: 24 },
        padding: { base: 8, md: 12, lg: 16 }
      })
      .build()
  })
}
```

## Breakpoint Testing

### Test at Specific Breakpoints

Test component behavior at different breakpoints:

```typescript
import { testAtBreakpoint } from '@tachui/core/testing'

// Test component at mobile breakpoint
testAtBreakpoint('base', () => {
  const component = render(<ResponsiveComponent />)
  expect(component.getByText('Mobile Layout')).toBeInTheDocument()
})

// Test component at tablet breakpoint
testAtBreakpoint('md', () => {
  const component = render(<ResponsiveComponent />)
  expect(component.getByText('Tablet Layout')).toBeInTheDocument()
})

// Test component at desktop breakpoint
testAtBreakpoint('lg', () => {
  const component = render(<ResponsiveComponent />)
  expect(component.getByText('Desktop Layout')).toBeInTheDocument()
})
```

### Simulate Viewport Changes

Simulate viewport changes for testing:

```typescript
// Simulate different viewport sizes
const simulateViewport = (width: number, height: number) => {
  // Mock window dimensions
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width
  })
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height
  })
  
  // Trigger resize event
  window.dispatchEvent(new Event('resize'))
}

// Test different viewport sizes
describe('Responsive Behavior', () => {
  test('adapts to mobile viewport', () => {
    simulateViewport(375, 667) // iPhone size
    
    const component = render(<ResponsiveComponent />)
    expect(component).toHaveStyle('font-size: 16px')
  })
  
  test('adapts to tablet viewport', () => {
    simulateViewport(768, 1024) // iPad size
    
    const component = render(<ResponsiveComponent />)
    expect(component).toHaveStyle('font-size: 20px')
  })
  
  test('adapts to desktop viewport', () => {
    simulateViewport(1920, 1080) // Desktop size
    
    const component = render(<ResponsiveComponent />)
    expect(component).toHaveStyle('font-size: 24px')
  })
})
```

## Browser Compatibility Testing

### Cross-Browser Testing

Test responsive behavior across different browsers:

```typescript
import { BrowserCompatibility } from '@tachui/core'

// Test CSS features support
const testBrowserSupport = () => {
  const features = BrowserCompatibility.testCSSFeatures()
  
  console.log('Browser Support:', features)
  // {
  //   cssGrid: true,
  //   flexbox: true,
  //   customProperties: true,
  //   viewportUnits: true,
  //   mediaQueries: true,
  //   containerQueries: false
  // }
  
  if (!features.cssGrid) {
    console.warn('CSS Grid not supported, falling back to flexbox')
  }
  
  if (!features.containerQueries) {
    console.info('Container queries not supported, using media queries')
  }
}

// Run browser compatibility check
testBrowserSupport()
```

### Feature Detection

Implement graceful degradation based on browser capabilities:

```typescript
const ResponsiveBrowserComponent = () => {
  const features = BrowserCompatibility.testCSSFeatures()
  
  return VStack([
    Text("Browser Compatibility")
      .modifier
      .fontSize({ base: 16, md: 20 })
      .build(),
    
    // Use grid if supported, fallback to flexbox
    ...(features.cssGrid ? [
      GridComponent()
    ] : [
      FlexboxFallbackComponent()
    ])
  ])
  .modifier
  .responsive({
    base: { padding: 16 },
    md: { padding: 24 }
  })
  .build()
}
```

## Debug Configuration Export

### Export Configuration for Analysis

Export complete responsive configuration for external analysis:

```typescript
// Export comprehensive configuration
const debugConfig = ResponsiveDevTools.exportConfiguration()

console.log('Debug Configuration:', debugConfig)
// {
//   breakpoints: { base: '0px', sm: '640px', md: '768px', ... },
//   currentContext: { current: 'md', width: 1024, height: 768 },
//   performance: {
//     cache: { size: 247, hitRate: 0.847 },
//     timings: { cssGeneration: { average: 0.3 } }
//   },
//   mediaQueries: {
//     Mobile: false,
//     Tablet: true,
//     Desktop: false,
//     'Dark Mode': false
//   }
// }

// Save configuration to file for analysis
const saveDebugConfig = () => {
  const config = ResponsiveDevTools.exportConfiguration()
  const blob = new Blob([JSON.stringify(config, null, 2)], {
    type: 'application/json'
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `responsive-debug-${Date.now()}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}
```

## Common Debugging Scenarios

### Debugging Layout Issues

```typescript
// Debug layout that doesn't respond as expected
const debugLayout = (elementSelector: string) => {
  const element = document.querySelector(elementSelector)
  
  if (!element) {
    console.error('Element not found:', elementSelector)
    return
  }
  
  console.group('🔍 Layout Debug:', elementSelector)
  
  // Check computed styles
  const computedStyle = getComputedStyle(element)
  console.log('Display:', computedStyle.display)
  console.log('Position:', computedStyle.position)
  console.log('Width:', computedStyle.width)
  console.log('Height:', computedStyle.height)
  
  // Check responsive classes
  const responsiveClasses = Array.from(element.classList)
    .filter(cls => cls.includes('responsive') || cls.includes('tachui'))
  console.log('Responsive Classes:', responsiveClasses)
  
  // Check media query matches
  const mediaQueries = [
    '(max-width: 767px)',
    '(min-width: 768px)',
    '(min-width: 1024px)'
  ]
  
  mediaQueries.forEach(query => {
    const matches = window.matchMedia(query).matches
    console.log(`${query}: ${matches}`)
  })
  
  console.groupEnd()
}

// Usage
debugLayout('.my-responsive-component')
```

### Debugging Value Resolution

```typescript
// Debug why a responsive value isn't resolving correctly
const debugValueResolution = <T>(
  value: ResponsiveValue<T>,
  expectedValue: T,
  label: string
) => {
  const currentBp = getCurrentBreakpoint()()
  const resolved = useResponsiveValue(value)()
  
  console.group(`🔧 Value Resolution Debug: ${label}`)
  console.log('Input Value:', value)
  console.log('Current Breakpoint:', currentBp)
  console.log('Resolved Value:', resolved)
  console.log('Expected Value:', expectedValue)
  console.log('Match:', resolved === expectedValue ? '✅' : '❌')
  
  if (isResponsiveValue(value)) {
    const responsiveObj = value as Partial<Record<BreakpointKey, T>>
    console.log('Resolution Path:')
    
    const breakpointOrder: BreakpointKey[] = ['base', 'sm', 'md', 'lg', 'xl', '2xl']
    const currentIndex = breakpointOrder.indexOf(currentBp)
    
    for (let i = currentIndex; i >= 0; i--) {
      const bp = breakpointOrder[i]
      if (responsiveObj[bp] !== undefined) {
        console.log(`  Found at ${bp}:`, responsiveObj[bp])
        break
      } else {
        console.log(`  ${bp}: undefined`)
      }
    }
  }
  
  console.groupEnd()
}

// Usage
const fontSize = { base: 16, md: 20, lg: 24 }
debugValueResolution(fontSize, 20, 'Font Size')
```

### Debugging Performance Issues

```typescript
// Debug slow responsive operations
const debugPerformanceIssue = () => {
  const monitor = ResponsivePerformanceMonitor.getStats()
  
  console.group('⚡ Performance Debug')
  
  // Check CSS generation performance
  if (monitor.cssGeneration.average > 5) {
    console.warn('Slow CSS generation detected')
    console.log('Average time:', monitor.cssGeneration.average.toFixed(2), 'ms')
    console.log('Max time:', monitor.cssGeneration.max.toFixed(2), 'ms')
    
    // Check cache performance
    const cacheStats = cssRuleCache.getStats()
    console.log('Cache hit rate:', (cacheStats.hitRate * 100).toFixed(1), '%')
    
    if (cacheStats.hitRate < 0.8) {
      console.warn('Low cache hit rate - consider optimizing CSS generation')
    }
  }
  
  // Check memory usage
  if (monitor.memoryUsage.current > 10) {
    console.warn('High memory usage detected')
    console.log('Current:', monitor.memoryUsage.current.toFixed(2), 'MB')
    console.log('Peak:', monitor.memoryUsage.peak.toFixed(2), 'MB')
  }
  
  // Check breakpoint change frequency
  if (monitor.breakpointChanges.count > 20) {
    console.warn('High breakpoint change frequency')
    console.log('Changes:', monitor.breakpointChanges.count)
    console.log('Average time:', monitor.breakpointChanges.average.toFixed(2), 'ms')
  }
  
  console.groupEnd()
}

// Run performance debug
debugPerformanceIssue()
```

## Production Debugging

### Safe Production Debugging

Enable minimal debugging in production environments:

```typescript
// Production-safe debugging
if (process.env.NODE_ENV === 'production' && process.env.DEBUG_MODE === 'true') {
  ResponsiveDevTools.enable({
    showOverlay: false,           // No visual overlay in production
    logLevel: 'error',            // Only log errors
    showPerformance: true,        // Monitor performance
    highlightResponsiveElements: false
  })
}
```

### Remote Debugging

Set up remote debugging capabilities:

```typescript
// Send debug information to remote service
const sendDebugInfo = async () => {
  if (process.env.NODE_ENV === 'production') {
    const debugInfo = ResponsiveDevTools.exportConfiguration()
    
    try {
      await fetch('/api/debug/responsive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          viewport: { 
            width: window.innerWidth, 
            height: window.innerHeight 
          },
          debugInfo
        })
      })
    } catch (error) {
      console.error('Failed to send debug info:', error)
    }
  }
}

// Send debug info when issues are detected
window.addEventListener('error', sendDebugInfo)
```

These debugging tools and techniques will help you quickly identify and resolve responsive design issues, ensuring your TachUI applications work flawlessly across all devices and screen sizes.

## Related Guides

- [Responsive Design](./responsive-design.md) - Core responsive design concepts
- [Performance Optimization](./responsive-performance.md) - Optimize responsive performance
- [API Reference](../api/responsive-modifiers.md) - Complete API documentation
- [Real-World Examples](../examples/responsive-real-world.md) - Production examples