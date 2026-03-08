# API Reference

Complete TypeScript API reference for TachUI's reactive system, components, and utilities.

## Reactive System

The core of TachUI's reactivity is built on SolidJS-inspired signals that provide fine-grained updates with automatic dependency tracking.

### Core Functions

- **[createSignal](/api/create-signal)** - Create reactive signals for state management
- **[createComputed / createMemo](/api/create-computed)** - Computed values that update when dependencies change  
- **[createEffect](/api/create-effect)** - Side effects that react to signal changes
- **[Utilities](/api/utilities)** - Helper functions and reactive utilities

## Validation System

TachUI includes a comprehensive validation system that enhances developer experience with intelligent error detection and recovery.

### Developer Experience APIs

- **[Validation API](/api/validation)** - 🔍 **NEW**: Complete validation system API with error recovery, IDE integration, and debugging tools
- **Error Detection** - Real-time component and modifier validation
- **Smart Recovery** - Automatic error recovery with fallback strategies  
- **IDE Integration** - VS Code extension foundation with IntelliSense
- **Visual Debugging** - Advanced debugging tools with overlays and analytics
- **Performance Optimization** - Zero overhead in production builds

## Security APIs

TachUI provides comprehensive security features for plugin systems and application protection.

### Security System

- **[Security API](/api/security)** - 🔐 **NEW**: Complete security API reference with feature flags, plugin verification, permissions, and sandboxing
- **Plugin Signing** - Cryptographic verification of plugin authenticity
- **Permission System** - Capability-based access control for plugins
- **Input Sanitization** - XSS protection and input validation
- **WebWorker Sandbox** - Isolated plugin execution environment
- **Content Security Policy** - CSP header management and configuration

## Component APIs

TachUI provides SwiftUI-inspired components with TypeScript-first design.

### Component Composition

- **[Component Concatenation](/api/component-concatenation)** - 🔗 **NEW**: SwiftUI-style component concatenation system with automatic optimization and accessibility support

### Styling & Effects

- **[CSS Classes](/api/css-classes)** - 🎨 **NEW**: Universal CSS class integration with Tailwind CSS, Bootstrap, and custom design systems
- **[Gradients](/api/gradients)** - 🎨 Complete gradient API with LinearGradient, Asset integration, and theme reactivity
- **[Hover Effects](/api/hover-effects)** - 🎯 **NEW**: SwiftUI-style hover effects, custom hover styles, and interactive states
- **[Transforms](/api/transforms)** - 🔄 **NEW**: CSS transforms with SwiftUI-style modifiers, 3D transforms, and hardware acceleration
- **[Visual Effects](/api/visual-effects)** - ✨ **NEW**: CSS filters, backdrop filters, glassmorphism, and modern visual effects

### Basic Components

```typescript
import { 
  Text, 
  Button, 
  TextField, 
  Image,
  VStack, 
  HStack, 
  ZStack 
} from '@tachui/core'
```

### Conditional & List Rendering

```typescript
import {
  Show,        // Conditional rendering with when/fallback
  For,         // SolidJS-compatible list rendering with 'each' prop
  ForEach      // TachUI-native list rendering with 'data' prop
} from '@tachui/core'
```

### Form Components

```typescript
import {
  Form,
  Section, 
  Picker,
  Slider,
  Toggle
} from '@tachui/core'
```

### Navigation Components

```typescript
import {
  NavigationStack,
  NavigationLink,
  SimpleTabView,
  tabItem
} from '@tachui/navigation'
```

## State Management APIs

SwiftUI-compatible property wrappers for managing application state.

```typescript
import {
  State,
  Binding,
  createBinding,
  EnvironmentObject,
  createEnvironmentKey
} from '@tachui/core'
```

## Modifier System

TachUI features a comprehensive modifier system with multi-property modifiers and raw CSS support:

```typescript
Text("Hello World")
  .modifier
  .typography({
    size: 24,
    weight: 'bold',
    align: 'center',
    color: '#007AFF'
  })
  .margin({ vertical: 16, horizontal: 8 })
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
  .css({
    backdropFilter: 'blur(10px)',
    containerType: 'inline-size'
  })
  .build()
```

### Modifier Categories

- **[Content Modifiers](/api/modifiers#content-modifiers)** - 🔒 **NEW**: Secure HTML content rendering with .asHTML() modifier and XSS protection
- **[Size Modifiers](/api/modifiers#size-modifiers)** - width, height, min/max dimensions
- **[Margin Modifiers](/api/modifiers#margin-modifiers)** - External spacing with type safety
- **[Typography Modifiers](/api/modifiers#typography-modifiers)** - Comprehensive text styling
- **[Visual Effects](/api/visual-effects)** - Backdrop filters, glassmorphism, and modern visual effects
- **[Border Modifiers](/api/modifiers#border-modifiers)** - Directional border support
- **[Flexbox Modifiers](/api/modifiers#flexbox-modifiers)** - Modern layout with flexbox
- **[Utility Modifiers](/api/modifiers#utility-modifiers)** - Cursor, overflow, position, z-index
- **[CSS Modifier](/api/modifiers#css-modifier)** - Raw CSS for future-proofing

**[Complete Modifier API Reference →](/api/modifiers)**

## Navigation API

TachUI's navigation system provides 100% SwiftUI-compatible navigation components:

- **[Navigation](./navigation.md)** - Complete SwiftUI-compatible navigation API reference
- **[Mounting](./mounting.md)** - Application mounting and reactive contexts

## Type Definitions

TachUI is built with TypeScript-first design. All components, modifiers, and APIs include comprehensive type definitions.

### Component Props

Every component has strongly-typed props with full IntelliSense support:

```typescript
interface TextProps {
  content?: string | (() => string) | Signal<string>
  // ... other props
}

interface ButtonProps {
  title?: string | (() => string) | Signal<string>
  action?: () => void | Promise<void>
  // ... other props
}
```

### Modifier Types

Modifiers are fully typed with proper return types for chaining:

```typescript
interface ModifierBuilder<T> {
  // Multi-property modifiers
  size(options: SizeOptions): ModifierBuilder<T>
  margin(options: MarginOptions): ModifierBuilder<T>
  typography(options: TypographyOptions): ModifierBuilder<T>
  
  // Individual modifiers
  width(value: number | string): ModifierBuilder<T>
  textAlign(value: TextAlign): ModifierBuilder<T>
  flexGrow(value: number): ModifierBuilder<T>
  
  // CSS modifier
  css(properties: CSSOptions): ModifierBuilder<T>
  cssProperty(property: string, value: string | number): ModifierBuilder<T>
  
  // Build method
  build(): T
}
```

## Usage Patterns

### Reactive Programming

```typescript
import { createSignal, createMemo, createEffect } from '@tachui/core'

const [count, setCount] = createSignal(0)
const doubled = createMemo(() => count() * 2)

createEffect(() => {
  console.log('Count changed:', count())
})
```

### Component Composition

```typescript
import { VStack, Text, Button } from '@tachui/core'

function Counter() {
  const [count, setCount] = createSignal(0)
  
  return VStack({
    children: [
      Text(() => `Count: ${count()}`),
      Button('Increment', () => setCount(count() + 1))
    ],
    spacing: 16
  })
}
```

## Next Steps

- **[Reactive System Guide](/guide/signals)** - Learn reactive programming patterns
- **[TachUI Components Guide](/guide/tachui-components)** - Master TachUI component syntax and patterns  
- **[Examples](/examples/)** - See real-world usage patterns
- **[Getting Started](/guide/installation)** - Set up your first TachUI project