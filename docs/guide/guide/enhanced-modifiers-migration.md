# Enhanced Modifiers Migration Guide

A comprehensive guide for migrating to and adopting the enhanced modifier system in tachUI.

## Overview

The enhanced modifier system provides powerful extensions to existing tachUI modifiers while maintaining **100% backward compatibility**. This means:

- ✅ **No breaking changes**: All existing code continues working unchanged
- ✅ **Gradual adoption**: You can adopt enhanced features incrementally
- ✅ **Zero migration effort**: No forced updates required
- ✅ **Performance maintained**: No performance penalty for existing code

## Migration Strategy

### Phase 1: Immediate Benefits (No Code Changes)

You get these benefits immediately with no code changes:

```typescript
// Existing code gains new cursor values automatically
Button("Drag Handle", handleDrag)
  .modifier
  .cursor('grab') // ✨ New value now available
  .build()

// Enhanced validation in development
cursor('invalid-cursor') // ⚠️ Now warns in development mode
```

### Phase 2: Gradual Enhancement

Enhance specific use cases as needed:

```typescript
// Before: Limited corner radius
Text("Card")
  .modifier
  .cornerRadius(8) // All corners the same
  .build()

// After: Individual corner control
Text("Card")
  .modifier
  .cornerRadius({ top: 12, bottom: 4 }) // ✨ Different top/bottom
  .build()
```

### Phase 3: Advanced Features

Adopt advanced features for sophisticated designs:

```typescript
// Before: Single shadow
Button("Action", handleClick)
  .modifier
  .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
  .build()

// After: Multiple layered shadows
Button("Action", handleClick)
  .modifier
  .shadows([ // ✨ Multiple shadows for depth
    { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.1)' },
    { x: 0, y: 4, blur: 6, color: 'rgba(0,0,0,0.1)' },
    { x: 0, y: 8, blur: 25, color: 'rgba(0,0,0,0.12)' }
  ])
  .build()
```

## Feature-by-Feature Migration

### cornerRadius Enhancement

#### Current Usage (Still Works)
```typescript
// ✅ Continues working unchanged
Text("Rounded")
  .modifier
  .cornerRadius(10)
  .build()
```

#### Enhanced Options
```typescript
// ✨ New: Individual corners
Text("Custom Corners")
  .modifier
  .cornerRadius({
    topLeft: 10,
    bottomRight: 5
  })
  .build()

// ✨ New: SwiftUI terminology
Text("iOS Style")
  .modifier
  .cornerRadius({
    topLeading: 10,    // More familiar for iOS developers
    bottomTrailing: 5
  })
  .build()

// ✨ New: Shorthand properties
Text("Grouped Corners")
  .modifier
  .cornerRadius({
    top: 8,    // topLeft and topRight
    bottom: 4  // bottomLeft and bottomRight
  })
  .build()
```

### cursor Enhancement

#### Current Usage (Still Works)
```typescript
// ✅ All existing cursor values continue working
Button("Click", handleClick)
  .modifier
  .cursor('pointer')
  .build()
```

#### Enhanced Options
```typescript
// ✨ New: Additional cursor values
Button("Drag Handle", handleDrag)
  .modifier
  .cursor('grab') // New value
  .build()

Button("Dragging", handleDrag)
  .modifier
  .cursor('grabbing') // New value
  .build()

// ✨ New: Custom cursors
Image("custom-cursor")
  .modifier
  .cursor('url(custom.png), pointer') // Custom cursor with fallback
  .build()

// ✨ New: Development validation
cursor('invalid') // Warns in development mode
```

### shadow Enhancement

#### Current Usage (Still Works)
```typescript
// ✅ Existing shadow API unchanged
Button("Shadow", handleClick)
  .modifier
  .shadow({ x: 2, y: 4, blur: 8, color: 'rgba(0,0,0,0.2)' })
  .build()
```

#### Enhanced Options
```typescript
// ✨ New: Multiple shadows
import { shadows } from '@tachui/core'

Button("Layered", handleClick)
  .modifier
  .shadows([
    { x: 0, y: 1, blur: 3, color: 'rgba(0,0,0,0.1)' },
    { x: 0, y: 4, blur: 6, color: 'rgba(0,0,0,0.1)' }
  ])
  .build()

// ✨ New: Text shadows
import { textShadow } from '@tachui/core'

Text("Shadowed Text")
  .modifier
  .textShadow({ x: 1, y: 1, blur: 2, color: 'rgba(0,0,0,0.3)' })
  .build()

// ✨ New: Material Design presets
import { shadowPreset } from '@tachui/core'

Button("Material", handleClick)
  .modifier
  .shadowPreset('elevation-2')
  .build()

// ✨ New: Advanced shadow features
Button("Advanced", handleClick)
  .modifier
  .shadow({
    x: 0, y: 4, blur: 12, spread: 2, // Spread parameter
    color: 'rgba(0,122,255,0.3)',
    inset: false
  })
  .build()
```

### border Enhancement ✨ **Now Available**

All advanced border features are now part of the main border API! No separate import needed.

#### Current Usage (Still Works)
```typescript
// ✅ Simple border API unchanged
Button("Bordered", handleClick)
  .modifier
  .border(1, '#007AFF', 'solid')
  .build()
```

#### Enhanced Features (Available Now)
```typescript
// ✨ Individual border control
Button("Custom Borders", handleClick)
  .modifier
  .border({
    top: { width: 2, style: 'solid', color: '#007AFF' },
    bottom: { width: 1, style: 'dashed', color: '#FF3B30' }
  })
  .build()

// ✨ SwiftUI terminology (LTR-aware)
Button("Leading/Trailing", handleClick)
  .modifier
  .border({
    leading: { width: 2, color: '#007AFF' },  // Maps to left
    trailing: { width: 1, color: '#FF3B30' }  // Maps to right
  })
  .build()

// ✨ Shorthand properties
Button("Shorthand", handleClick)
  .modifier
  .border({
    horizontal: { width: 2, color: '#007AFF' }, // Left + right
    vertical: { width: 1, color: '#FF3B30' }    // Top + bottom
  })
  .build()

// ✨ Border direction functions
Button("Direction Functions", handleClick)
  .modifier
  .borderTop(2, '#007AFF', 'solid')      // Top only
  .borderHorizontal(1, '#ddd')           // Left + right
  .borderLeading(3, '#34C759')           // SwiftUI leading
  .build()

// ✨ Advanced features
Button("Advanced", handleClick)
  .modifier
  .border({
    width: 2,
    color: '#007AFF',
    image: 'linear-gradient(45deg, #007AFF, #FF3B30)', // Border images
    radius: { topLeft: 8, topRight: 8 },               // Integrated corner radius
    style: 'solid'
  })
  .build()

// ✨ Reactive values with Signals
Button("Reactive", handleClick)
  .modifier
  .border({
    width: () => isActive() ? 2 : 1,
    color: () => theme().borderColor,
    style: 'dashed'
  })
  .build()
```

### scroll Enhancement

#### New Feature (No Migration Needed)
```typescript
// ✨ New: Modern scroll behaviors
import { scroll, scrollBehavior, overscrollBehavior } from '@tachui/core'

ScrollView([...])
  .modifier
  .scroll({
    behavior: 'smooth',
    margin: { top: 10 },
    snap: { type: 'y mandatory', align: 'start' }
  })
  .build()

// ✨ New: Individual scroll modifiers
ScrollView([...])
  .modifier
  .scrollBehavior('smooth')
  .overscrollBehavior('contain')
  .build()
```

## Common Migration Patterns

### Pattern 1: Card Components

```typescript
// Before: Basic card styling
const BasicCard = () => {
  return VStack([content])
    .modifier
    .cornerRadius(8)
    .border(1, '#e0e0e0')
    .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
    .build()
}

// After: Enhanced card with sophisticated styling
const EnhancedCard = () => {
  return VStack([content])
    .modifier
    .cornerRadius({ top: 12, bottom: 8 }) // Different top/bottom
    .border({
      top: { width: 1, color: '#e0e0e0' },
      horizontal: { width: 0.5, color: '#f0f0f0' },
      bottom: { width: 2, color: '#007AFF' }
    })
    .shadowPreset('elevation-2') // Material Design shadow
    .build()
}
```

### Pattern 2: Interactive Elements

```typescript
// Before: Basic button
const BasicButton = () => {
  return Button("Action", handleClick)
    .modifier
    .cornerRadius(6)
    .cursor('pointer')
    .shadow({ x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' })
    .build()
}

// After: Enhanced interactive button
const EnhancedButton = (isPressed: boolean) => {
  return Button("Action", handleClick)
    .modifier
    .cornerRadius({ topLeading: 8, topTrailing: 8, bottomLeading: 4, bottomTrailing: 4 })
    .cursor('pointer')
    .shadows(isPressed ? 
      [{ x: 0, y: 1, blur: 2, color: 'rgba(0,0,0,0.2)', inset: true }] : // Pressed state
      [
        { x: 0, y: 2, blur: 4, color: 'rgba(0,0,0,0.1)' },
        { x: 0, y: 4, blur: 8, color: 'rgba(0,0,0,0.15)' }
      ]
    )
    .build()
}
```

### Pattern 3: Form Elements

```typescript
// Before: Basic form styling
const BasicInput = () => {
  return TextField("placeholder")
    .modifier
    .border(1, '#d1d5db')
    .cornerRadius(4)
    .build()
}

// After: Enhanced form with focus states
const EnhancedInput = (isFocused: boolean) => {
  return TextField("placeholder")
    .modifier
    .cornerRadius({ top: 6, bottom: 4 })
    .border(isFocused ? {
      width: 2,
      color: '#007AFF',
      radius: { top: 6, bottom: 4 }
    } : {
      width: 1,
      color: '#d1d5db'
    })
    .shadows(isFocused ? [
      { x: 0, y: 0, blur: 0, spread: 3, color: 'rgba(0,122,255,0.1)' }
    ] : [])
    .build()
}
```

## Best Practices for Migration

### 1. Start with High-Impact Areas

Focus on components that benefit most from enhanced styling:

```typescript
// ✅ High impact: Cards, buttons, form elements
Card.modifier.cornerRadius({ top: 12, bottom: 8 })

// ⚠️ Low impact: Simple text elements
Text("Simple").modifier.cornerRadius(4) // Keep simple
```

### 2. Use Design System Integration

```typescript
// ✅ Good: Integrate with design tokens
const designTokens = {
  radius: { small: 4, medium: 8, large: 12 },
  shadows: { elevation1: 'elevation-1', elevation2: 'elevation-2' }
}

Card.modifier
  .cornerRadius({ top: designTokens.radius.large, bottom: designTokens.radius.medium })
  .shadowPreset(designTokens.shadows.elevation2)
```

### 3. Gradual Feature Adoption

```typescript
// ✅ Gradual: Adopt features as needed
const migrationSteps = {
  // Step 1: Use new cursor values
  phase1: () => Button("Drag").modifier.cursor('grab'),
  
  // Step 2: Add individual corners
  phase2: () => Card.modifier.cornerRadius({ top: 12, bottom: 8 }),
  
  // Step 3: Multiple shadows
  phase3: () => Card.modifier.shadows([shadow1, shadow2]),
  
  // Step 4: Advanced border control
  phase4: () => Card.modifier.border({ leading: spec1, trailing: spec2 })
}
```

### 4. Team Migration Strategy

#### For Small Teams (1-3 developers)
```typescript
// Direct migration: Update components as you work on them
const teamStrategy = {
  approach: 'opportunistic',
  timeline: '2-4 weeks',
  process: 'Update during regular feature work'
}
```

#### For Large Teams (4+ developers)
```typescript
// Structured migration: Define standards and rollout plan
const teamStrategy = {
  approach: 'planned',
  timeline: '4-8 weeks',
  phases: [
    'Define enhanced modifier standards',
    'Update design system components',
    'Migrate high-traffic components',
    'Update remaining components'
  ]
}
```

## Performance Considerations

### Bundle Size Impact

```typescript
// Before enhanced modifiers
const before = {
  coreModifiers: '45KB',
  total: '45KB'
}

// After enhanced modifiers
const after = {
  coreModifiers: '45KB',
  enhancedModifiers: '4.2KB', // Minimal increase
  total: '49.2KB' // 9% increase for significant functionality gain
}
```

### Runtime Performance

```typescript
// Performance impact is minimal:
const performanceImpact = {
  // Existing API - no change
  cornerRadius: (value: number) => `${value}px`, // 0ms overhead
  
  // Enhanced API - minimal overhead
  cornerRadiusEnhanced: (config: object) => {
    // CSS generation: <1ms
    // Property resolution: <0.5ms
    // Total overhead: <1.5ms
  }
}
```

### Development vs Production

```typescript
// Development: Enhanced validation and warnings
if (process.env.NODE_ENV === 'development') {
  cursor('invalid-cursor') // ⚠️ Console warning
}

// Production: Optimized for performance
if (process.env.NODE_ENV === 'production') {
  cursor('invalid-cursor') // Silent - no validation overhead
}
```

## Testing Strategy

### Backward Compatibility Testing

```typescript
describe('Enhanced Modifiers Migration', () => {
  test('existing cornerRadius API unchanged', () => {
    const component = Text("Test")
      .modifier
      .cornerRadius(10) // ✅ Existing API
      .build()
    
    expect(getComputedStyle(component).borderRadius).toBe('10px')
  })
  
  test('enhanced cornerRadius provides new features', () => {
    const component = Text("Test")
      .modifier
      .cornerRadius({ topLeft: 10, bottomRight: 5 }) // ✨ Enhanced API
      .build()
    
    expect(getComputedStyle(component).borderTopLeftRadius).toBe('10px')
    expect(getComputedStyle(component).borderBottomRightRadius).toBe('5px')
  })
})
```

### Visual Regression Testing

```typescript
// Test visual consistency during migration
const visualTests = {
  beforeMigration: 'screenshot-before.png',
  afterMigration: 'screenshot-after.png',
  expectation: 'identical-unless-enhanced'
}
```

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: TypeScript Errors
```typescript
// ❌ Problem: TypeScript doesn't recognize new types
cornerRadius({ topLeft: 10 }) // Type error

// ✅ Solution: Import enhanced types
import type { CornerRadiusConfig } from '@tachui/core'
const config: CornerRadiusConfig = { topLeft: 10 }
```

#### Issue 2: Conflicting Modifiers
```typescript
// ❌ Problem: Applying both old and new APIs
Text("Test")
  .modifier
  .cornerRadius(10) // Old API
  .cornerRadius({ topLeft: 15 }) // New API - will override
  .build()

// ✅ Solution: Use one API consistently
Text("Test")
  .modifier
  .cornerRadius({ topLeft: 15, topRight: 10, bottomLeft: 10, bottomRight: 10 })
  .build()
```

#### Issue 3: Performance Concerns
```typescript
// ❌ Problem: Recreating complex configurations
const heavyConfig = {
  top: { width: 2, style: 'solid', color: '#007AFF' },
  right: { width: 1, style: 'dashed', color: '#FF3B30' },
  // ... complex configuration
}

// ✅ Solution: Reuse configurations
const borderConfigs = {
  card: { top: { width: 2, color: '#007AFF' } },
  button: { width: 1, color: '#007AFF' }
}
```

## Migration Checklist

### Pre-Migration
- [ ] Review current modifier usage
- [ ] Identify components that would benefit from enhancement
- [ ] Plan migration phases
- [ ] Set up testing strategy

### During Migration
- [ ] Update imports for enhanced modifiers
- [ ] Test backward compatibility
- [ ] Update TypeScript types
- [ ] Verify visual consistency
- [ ] Update component documentation

### Post-Migration
- [ ] Run performance benchmarks
- [ ] Update team guidelines
- [ ] Document enhanced patterns
- [ ] Plan future enhancements

## Conclusion

The enhanced modifier system provides a powerful upgrade path that respects existing code while enabling sophisticated new capabilities. The key benefits:

- **Zero Migration Risk**: Existing code continues working unchanged
- **Incremental Adoption**: Adopt features at your own pace
- **Improved Capabilities**: Individual control, SwiftUI alignment, modern CSS features
- **Performance Optimized**: Minimal bundle size and runtime impact

Start your migration by identifying high-impact components and gradually adopting enhanced features where they provide the most value. The system is designed to grow with your needs while maintaining the simplicity and reliability you expect from tachUI.