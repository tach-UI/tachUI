# Padding Modifiers - Complete Directional Padding System

## Overview

TachUI provides a comprehensive padding modifier system that matches SwiftUI's padding capabilities with full directional control, shorthand options, and convenient presets.

## Key Features

- **✅ Complete SwiftUI API Parity**: All SwiftUI padding modifiers implemented
- **✅ Directional Control**: Individual control over all four sides
- **✅ SwiftUI-style Leading/Trailing**: Semantic directional padding support  
- **✅ Shorthand Options**: Symmetric horizontal/vertical padding
- **✅ Preset Values**: Common padding sizes for consistent design
- **✅ Type Safety**: Prevents conflicting property combinations
- **✅ Comprehensive Testing**: 35 tests covering all edge cases

## API Reference

### Basic Padding

```typescript
import { padding } from '@tachui/core/modifiers'

// All sides equal
component.padding(16)           // 16px on all sides
component.padding({ all: 16 })  // Same as above

// Symmetric padding
component.padding({ 
  horizontal: 20,  // Left and right
  vertical: 12     // Top and bottom  
})
```

### Directional Padding Functions

```typescript
import { 
  paddingTop, 
  paddingBottom, 
  paddingLeft, 
  paddingRight,
  paddingLeading,   // SwiftUI-style (left in LTR)
  paddingTrailing   // SwiftUI-style (right in LTR)  
} from '@tachui/core/modifiers'

// Individual sides
component.paddingTop(16)
component.paddingBottom(24)
component.paddingLeft(12)
component.paddingRight(8)

// SwiftUI semantic directions
component.paddingLeading(16)   // Maps to left in LTR languages
component.paddingTrailing(8)   // Maps to right in LTR languages
```

### Symmetric Padding Functions

```typescript
import { 
  paddingHorizontal, 
  paddingVertical 
} from '@tachui/core/modifiers'

// Horizontal (left + right)
component.paddingHorizontal(20)

// Vertical (top + bottom)  
component.paddingVertical(12)
```

### Advanced Combinations

```typescript
// Mix symmetric and specific sides
component.padding({
  horizontal: 16,    // Sets left and right to 16px
  top: 8,           // Overrides vertical top to 8px
  bottom: 24        // Overrides vertical bottom to 24px
})

// SwiftUI-style with traditional directional
component.padding({
  leading: 20,      // Left in LTR
  trailing: 8,      // Right in LTR  
  vertical: 12      // Top and bottom
})

// Complex precedence handling
component.padding({
  horizontal: 16,   // Base horizontal padding
  left: 12,         // Override left side
  leading: 20       // Leading overrides left (processed last)
})
// Result: left=20px, right=16px
```

## Padding Presets

Consistent padding values for common UI patterns:

```typescript
import { paddingPresets } from '@tachui/core/modifiers'

// Size presets
component.paddingPresets.xs()    // 4px
component.paddingPresets.sm()    // 8px  
component.paddingPresets.md()    // 12px
component.paddingPresets.lg()    // 16px
component.paddingPresets.xl()    // 24px
component.paddingPresets.xxl()   // 32px

// Component-specific presets
component.paddingPresets.button()   // horizontal: 16px, vertical: 8px
component.paddingPresets.card()     // 16px all sides
component.paddingPresets.section()  // horizontal: 20px, vertical: 12px
```

## Builder Pattern Integration

All padding functions work seamlessly with TachUI's modifier builder:

```typescript
component
  .padding(16)                 // All sides
  .paddingTop(24)              // Override top
  .paddingHorizontal(20)       // Override horizontal
  .backgroundColor('#f0f0f0')
  .cornerRadius(8)
```

## Type Safety

The padding system uses TypeScript union types to prevent conflicting property combinations:

```typescript
// ✅ Valid - all sides
padding({ all: 16 })

// ✅ Valid - symmetric  
padding({ horizontal: 20, vertical: 12 })

// ✅ Valid - individual sides
padding({ top: 8, right: 12, bottom: 16, left: 20 })

// ✅ Valid - mixed with overrides
padding({ horizontal: 16, top: 24 })

// ❌ TypeScript error - can't mix 'all' with directional
padding({ all: 16, top: 8 })  // Compiler error
```

## Real-world Examples

### Card Component

```typescript
const CardComponent = () =>
  VStack()
    .padding({ all: 16 })           // Internal content padding
    .backgroundColor('#ffffff')
    .cornerRadius(12)
    .margin({ vertical: 8 })        // External spacing

// Alternative with presets
const CardComponent = () =>
  VStack()
    .paddingPresets.card()          // 16px all sides
    .backgroundColor('#ffffff')
    .cornerRadius(12)
```

### Button Component

```typescript
const PrimaryButton = (text: string) =>
  Text(text)
    .paddingPresets.button()        // horizontal: 16px, vertical: 8px
    .backgroundColor('#007AFF')
    .foregroundColor('#ffffff')
    .cornerRadius(8)

// Custom button padding
const LargeButton = (text: string) =>
  Text(text)
    .padding({ horizontal: 24, vertical: 12 })
    .backgroundColor('#007AFF')
    .foregroundColor('#ffffff')
    .cornerRadius(8)
```

### Form Section

```typescript
const FormSection = (content: ComponentInstance[]) =>
  VStack(content)
    .paddingPresets.section()       // horizontal: 20px, vertical: 12px
    .backgroundColor('#f8f9fa')
    .cornerRadius(8)
    .marginVertical(8)
```

### Asymmetric Layout

```typescript
const AsymmetricCard = () =>
  VStack()
    .padding({
      leading: 20,    // Extra space on the leading edge
      trailing: 12,   // Less space on trailing edge
      vertical: 16    // Standard vertical padding
    })
    .backgroundColor('#ffffff')
    .borderLeft('3px solid #007AFF')  // Leading edge accent
```

## Performance Considerations

- **Optimized CSS Output**: Generates minimal CSS properties
- **Smart Precedence**: Later properties override earlier ones predictably
- **No Runtime Overhead**: All calculations done at modifier creation time
- **Type-safe**: Compile-time validation prevents runtime errors

## Migration from Legacy Padding

If upgrading from the old layout-based padding system:

```typescript
// Before (LayoutModifier)
component.padding(16)                    // Created LayoutModifier

// After (PaddingModifier) - Same API, better implementation  
component.padding(16)                    // Creates dedicated PaddingModifier
component.paddingTop(8)                  // New directional functions
component.paddingLeading(12)             // New SwiftUI-style functions
component.paddingPresets.button()       // New preset system
```

## Browser Support

The padding modifier system works in all modern browsers:

- **Chrome/Edge**: Full support
- **Firefox**: Full support  
- **Safari**: Full support
- **Mobile browsers**: Full support

## Testing

The padding system includes comprehensive tests covering:

- ✅ All padding function variations (35 tests)
- ✅ Type safety and conflict prevention
- ✅ CSS property generation accuracy
- ✅ Precedence rules and overrides
- ✅ SwiftUI-style leading/trailing mapping
- ✅ Preset functionality
- ✅ Edge cases and error handling

## Summary

TachUI's padding modifier system provides complete SwiftUI API parity with additional web-specific enhancements:

**✅ Complete API Coverage**
- All SwiftUI padding modifiers implemented
- Additional directional functions (paddingLeft, paddingRight)
- Preset system for consistent design

**✅ Developer Experience**  
- Type-safe with compile-time validation
- Intuitive API matching SwiftUI patterns
- Comprehensive documentation and examples

**✅ Production Ready**
- 35 comprehensive tests
- Zero regressions in existing functionality
- Optimized CSS generation