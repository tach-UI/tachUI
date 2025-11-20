---
cssclasses:
  - full-page
---

# Epic Otis: SwiftUI .infinity Frame Support

## Overview
tachUI currently lacks SwiftUI's `.infinity` constant for frame modifiers, which is a common pattern for creating responsive layouts. This epic outlines the implementation of `.infinity` support to achieve SwiftUI parity.

## Problem Statement
SwiftUI developers expect to use `.frame(maxWidth: .infinity)` to make views expand to fill available space. tachUI requires workarounds like `width('100%')` or `flexGrow(1)`, creating friction for developers familiar with SwiftUI patterns.

### Current Gap
```swift
// SwiftUI (not supported in tachUI)
Text("Hello")
    .frame(maxWidth: .infinity, maxHeight: .infinity)
    .frame(width: .infinity) // Fill available width
```

```typescript
// Current tachUI workarounds
Text("Hello")
    .modifier
    .width('100%')
    .height('100%')
    .build()
```

## Technical Design

### 1. Infinity Constant Definition

Create a special constant that represents infinite dimensions:

```typescript
// packages/core/src/constants/layout.ts
export const infinity = Symbol.for('tachui.infinity')

export type InfinityValue = typeof infinity

// Type-safe dimension type
export type Dimension = number | string | InfinityValue

// Export for SwiftUI compatibility
export const Infinity = {
  infinity: infinity
} as const
```

### 2. Update Size Modifier Types

Enhance modifier types to accept infinity values:

```typescript
// packages/core/src/modifiers/types.ts
import type { Dimension, InfinityValue } from '../constants/layout'

export interface SizeModifierProps {
  width?: Dimension
  height?: Dimension
  minWidth?: Dimension
  minHeight?: Dimension
  maxWidth?: Dimension
  maxHeight?: Dimension
}

// Helper to convert infinity to CSS
export function dimensionToCSS(value: Dimension | undefined): string | undefined {
  if (value === infinity) {
    return '100%'
  }
  if (typeof value === 'number') {
    return `${value}px`
  }
  return value
}
```

### 3. Update Frame Modifier Implementation

Enhance the frame modifier to handle infinity:

```typescript
// packages/core/src/modifiers/core.ts
import { infinity, type Dimension } from '../constants/layout'
import { dimensionToCSS } from './types'

export function frame(
  width?: Dimension,
  height?: Dimension,
  options?: {
    minWidth?: Dimension
    minHeight?: Dimension
    maxWidth?: Dimension
    maxHeight?: Dimension
    alignment?: Alignment
  }
): Modifier {
  return createLayoutModifier({
    frame: {
      width: dimensionToCSS(width),
      height: dimensionToCSS(height),
      minWidth: dimensionToCSS(options?.minWidth),
      minHeight: dimensionToCSS(options?.minHeight),
      maxWidth: dimensionToCSS(options?.maxWidth),
      maxHeight: dimensionToCSS(options?.maxHeight),
      alignment: options?.alignment
    }
  })
}
```

### 4. Update Individual Size Modifiers

Update all size-related modifiers:

```typescript
// packages/core/src/modifiers/size.ts
export function width(value: Dimension): Modifier {
  const cssValue = dimensionToCSS(value)
  return createCSSModifier({
    width: cssValue,
    // If infinity, ensure proper flex behavior
    ...(value === infinity && {
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: '0%'
    })
  })
}

export function maxWidth(value: Dimension): Modifier {
  if (value === infinity) {
    // Special handling: remove max-width constraint
    return createCSSModifier({
      maxWidth: 'none',
      width: '100%'
    })
  }
  return createCSSModifier({
    maxWidth: dimensionToCSS(value)
  })
}

// Similar updates for height, maxHeight, minWidth, minHeight
```

### 5. SwiftUI-Compatible API

Create a SwiftUI-style export:

```typescript
// packages/core/src/swiftui-compat.ts
export { infinity } from './constants/layout'

// Allow both .infinity and infinity imports
export const SwiftUI = {
  infinity: infinity
} as const
```

### 6. Enhanced Frame Overloads

Add convenience overloads for common patterns:

```typescript
// packages/core/src/modifiers/frame-utils.ts
export function fillMaxWidth(): Modifier {
  return frame(undefined, undefined, { maxWidth: infinity })
}

export function fillMaxHeight(): Modifier {
  return frame(undefined, undefined, { maxHeight: infinity })
}

export function fillMaxSize(): Modifier {
  return frame(undefined, undefined, { 
    maxWidth: infinity, 
    maxHeight: infinity 
  })
}

export function expand(): Modifier {
  return combineModifiers([
    frame(infinity, infinity),
    flexGrow(1)
  ])
}
```

## Implementation Plan

### Phase 1: Core Infrastructure (2 days)
1. Create infinity constant and types
2. Update modifier type definitions
3. Implement dimensionToCSS converter
4. Add comprehensive unit tests

### Phase 2: Modifier Updates (3 days)
1. Update frame() modifier
2. Update individual size modifiers (width, height, etc.)
3. Handle edge cases (precedence, conflicts)
4. Test with existing components

### Phase 3: SwiftUI Compatibility Layer (2 days)
1. Create SwiftUI-compatible exports
2. Add convenience helper functions
3. Update TypeScript definitions
4. Ensure tree-shaking works properly

### Phase 4: Documentation & Examples (2 days)
1. Update modifier documentation
2. Add infinity usage examples
3. Create migration guide from workarounds
4. Update component playground

## Usage Examples

### Basic Usage
```typescript
// Fill available width
Text("Full Width")
  .modifier
  .frame(maxWidth: infinity)
  .build()

// Fill both dimensions
Image("banner.jpg")
  .modifier
  .frame(width: infinity, height: 200)
  .build()

// SwiftUI-style import
import { infinity } from '@tachui/core'

Text("Centered")
  .modifier
  .frame(maxWidth: infinity, maxHeight: infinity)
  .alignment(.center)
  .build()
```

### Common Patterns
```typescript
// Full-width button
Button("Continue")
  .modifier
  .frame(maxWidth: infinity)
  .padding(16)
  .build()

// Expand to fill container
VStack([
  Text("Header"),
  ScrollView([/* content */])
    .modifier
    .frame(maxHeight: infinity) // Fill remaining space
    .build(),
  Text("Footer")
])

// Equal-width elements
HStack([
  Button("Cancel")
    .modifier
    .frame(maxWidth: infinity)
    .build(),
  Button("OK")
    .modifier
    .frame(maxWidth: infinity)
    .build()
])
```

## Testing Strategy

### Unit Tests
- Infinity constant behavior
- CSS conversion logic
- Modifier chain precedence
- Edge cases (negative values, conflicts)

### Integration Tests
- Component rendering with infinity
- Layout behavior in stacks
- Responsive behavior
- Performance impact

### Visual Tests
- Screenshot comparisons
- Cross-browser compatibility
- Mobile responsiveness

## Performance Considerations

1. **CSS Generation**: Optimize infinity-to-CSS conversion
2. **Runtime Overhead**: Minimal - simple symbol comparison
3. **Bundle Size**: ~200 bytes for infinity support
4. **Tree Shaking**: Ensure unused helpers are eliminated

## Migration Guide

### From Percentage Width
```typescript
// Before
.modifier.width('100%')

// After
.modifier.frame(maxWidth: infinity)
```

### From Flexbox
```typescript
// Before
.modifier.flexGrow(1).flexBasis('0%')

// After
.modifier.width(infinity)
```

### From Spacer Workarounds
```typescript
// Before
HStack([
  Text("Content"),
  Spacer() // To push content left
])

// After
Text("Content")
  .modifier
  .frame(maxWidth: infinity, alignment: .leading)
  .build()
```

## Success Metrics

1. **API Compatibility**: 100% SwiftUI frame modifier parity
2. **Developer Experience**: Reduced learning curve for SwiftUI developers
3. **Performance**: No measurable impact on render performance
4. **Bundle Size**: < 1KB addition to core bundle
5. **Test Coverage**: > 95% coverage for new functionality

## Timeline

- **Total Effort**: 9 days
- **Priority**: High (SwiftUI compatibility)
- **Dependencies**: None
- **Risk**: Low - additive feature

## Future Enhancements

1. **GeometryReader Integration**: Use infinity with geometry calculations
2. **Animation Support**: Animate to/from infinity dimensions
3. **Debugging Tools**: Visual indicators for infinity frames
4. **Performance Optimizations**: Batch infinity calculations