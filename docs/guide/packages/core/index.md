---
title: '@tachui/core - Enhanced Documentation v0.9.0'
---

# @tachui/core

`@tachui/core` is runtime foundation that powers everything else—signals, scheduler, DOM renderer, hydration, and diagnostic utilities with fine-grained reactivity and SwiftUI-inspired API.

## Install

```bash
pnpm add @tachui/core@0.9.0
```

## Core Features

### 🎯 **Fine-grained Reactivity**
SolidJS-inspired signals with automatic dependency tracking and surgical DOM updates.

### ⚡ **Direct DOM Renderer**  
Zero VDOM overhead with keyed diffing and efficient reconciliation.

### 🏗️ **SwiftUI-Compatible API**
Familiar component and modifier syntax for iOS/macOS developers.

### 📦 **Modular Architecture**
Core runtime separates cleanly from components (@tachui/primitives) and modifiers (@tachui/modifiers).

### 🚀 **Performance Optimized**
Sub-millisecond updates, automatic batching, and memory-safe cleanup.

## Quick Start Examples

### Basic Counter App

```typescript
import { createSignal } from '@tachui/core'
import { VStack, Text, Button } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic' // Load modifiers

// Create reactive state
const [count, setCount] = createSignal(0)

// Build SwiftUI-style component with direct modifier calls
const counterApp = VStack({
  children: [
    Text(() => `Count: ${count()}`)
      .fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF'),

    Button('Increment', () => setCount(count() + 1))
      .backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8),
  ],
  spacing: 16,
  alignment: 'center',
})

// Mount to DOM
document.body.appendChild(counterApp)
```

### Reactive Data Display

```typescript
import { createSignal, createComputed } from '@tachui/core'
import { VStack, Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

const [firstName, setFirstName] = createSignal('John')
const [lastName, setLastName] = createSignal('Doe')

// Computed reactive values
const fullName = createComputed(() => `${firstName()} ${lastName()}`)
const greeting = createComputed(() => `Hello, ${fullName()}!`)

const userCard = VStack({
  children: [
    Text(greeting())
      .fontSize(20)
      .fontWeight('semibold')
      .foregroundColor('#007AFF'),
      
    Text('Click to change name')
      .fontSize(14)
      .foregroundColor('#666')
      .onTap(() => {
        setFirstName('Jane')
        setLastName('Smith')
      }),
  ],
  spacing: 8,
  padding: 16,
  backgroundColor('#f8f9fa'),
  cornerRadius(12),
})
```

### Asset Management

```typescript
import { createColorAsset, createFontAsset } from '@tachui/core'
import { VStack, Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

// Create reusable assets
const primaryColor = createColorAsset('#007AFF', {
  light: '#007AFF',
  dark: '#0A84FF',
})

const titleFont = createFontAsset({
  family: 'SF Pro Display',
  size: 24,
  weight: 'bold',
  style: 'normal',
})

const themedText = Text('Themed Content')
  .font(titleFont)
  .foregroundColor(primaryColor)
```

## Core API Reference

### Reactive System

#### `createSignal<T>(initialValue: T)`
Creates a reactive signal with getter and setter.

```typescript
const [value, setValue] = createSignal(0)

// Get current value
console.log(value()) // 0

// Set new value
setValue(42)

// Update with function
setValue(current => current + 1)
```

#### `createComputed<T>(fn: () => T)`
Creates a derived value that automatically updates when dependencies change.

```typescript
const [price, setPrice] = createSignal(100)
const [tax, setTax] = createSignal(0.08)

const total = createComputed(() => price() * (1 + tax()))

console.log(total()) // 108

setPrice(200) // Automatically updates total
console.log(total()) // 216
```

#### `createEffect(fn: () => void | (() => void))`
Runs side effects when dependencies change.

```typescript
const [count, setCount] = createSignal(0)

createEffect(() => {
  console.log(`Count changed to: ${count()}`)
  // Runs whenever count() changes
})

setCount(1) // Logs: "Count changed to: 1"
```

### Component System

#### `createComponent<T extends ComponentProps>(name: string, fn: (props: T) => DOMNode | DOMNode[])`
Creates a reusable component with TypeScript support.

```typescript
interface CardProps extends ComponentProps {
  title: string
  subtitle?: string
  onTap?: () => void
}

const Card = createComponent<CardProps>('Card', props => {
  return VStack({
    children: [
      Text(props.title)
        .fontSize(18)
        .fontWeight('bold'),
      props.subtitle ? Text(props.subtitle)
        .fontSize(14)
        .foregroundColor('#666') : null,
    ],
    spacing: 4,
    padding: 16,
    backgroundColor('white'),
    cornerRadius(8),
    shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' }),
    onTap: props.onTap,
  })
})

// Usage
const myCard = Card({
  title: 'Hello World',
  subtitle: 'This is a card',
  onTap: () => console.log('Card tapped'),
})
```

## Performance Features

### Concatenation Optimization

tachUI v0.9.0 includes revolutionary concatenation optimization that reduces bundle size by 94.9% for common patterns.

```typescript
// Optimized automatically
Text('Hello').concat(Text('World'))

// Uses minimal runtime (1.18KB) based on component needs
// Static patterns: 0KB runtime (compile-time)
// Dynamic patterns: 1.2-1.9KB selective runtime
```

### Memory Management

- **WeakMap-based cleanup** prevents memory leaks
- **Automatic dependency tracking** eliminates manual effect management  
- **Surgical DOM updates** minimize re-renders

### Batching

Multiple state updates are automatically batched for performance:

```typescript
const [count, setCount] = createSignal(0)
const [name, setName] = createSignal('')

// These updates are batched together
setCount(1)
setName('John')
// Only one DOM update occurs
```

## Integration Examples

### With @tachui/modifiers

```typescript
import { VStack, Text, Button } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'

const enhancedText = Text('Hello World')
  .fontSize(16)
  .fontWeight('medium')
  .foregroundColor('#333')
  .backgroundColor('#f0f0f0')
  .padding(12)
  .cornerRadius(6)
```

### With @tachui/symbols

```typescript
import { VStack, Button } from '@tachui/primitives'
import { Symbol } from '@tachui/symbols'
import '@tachui/modifiers/preload/basic'

const iconComponent = VStack({
  children: [
    Symbol('person.fill')
      .size(24)
      .foregroundColor('#007AFF'),
    Button('Open Profile', () => console.log('Profile opened')),
  ],
  spacing: 16,
  padding: 20,
  backgroundColor('white'),
  cornerRadius(12),
})
```

## Configuration

### Core Configuration

```typescript
import { tachui } from '@tachui/core'

tachui.configure({
  // Enable development warnings
  devMode: process.env.NODE_ENV === 'development',
  
  // Performance optimizations
  enableBatching: true,
  enableConcatenation: true,
  
  // Feature flags
  enableDebugTools: false,
  enableProfiling: false,
})
```

## Migration Notes

### From v0.8.1-alpha to v0.9.0

- **Breaking**: Primitives moved to `@tachui/primitives` package
- **Breaking**: Concrete modifiers moved to `@tachui/modifiers` package  
- **Enhanced**: Concatenation optimization reduces bundle size
- **Improved**: TypeScript types are more precise

```bash
# Update package versions
pnpm add @tachui/core@0.9.0 @tachui/primitives@0.9.0 @tachui/modifiers@0.9.0

# Update imports
import { createSignal } from '@tachui/core'
import { VStack, Text, Button } from '@tachui/primitives' 
import '@tachui/modifiers/preload/basic'

# New modifier syntax (NO .modifier or .build() needed)
Text('Hello')
  .fontSize(16)           // Direct modifier call
  .fontWeight('bold')      // Chain modifiers
// .build() not needed
```

## Status

✅ **Production Ready** - 99.6% test pass rate (1,233 tests)  
✅ **Performance Optimized** - Sub-millisecond updates  
✅ **Type Safe** - Full TypeScript support  
✅ **Memory Safe** - Automatic cleanup and leak prevention  

## Next Steps

- [Runtime internals](/packages/core/runtime)
- [Performance guidance](/packages/core/performance)  
- [Component development](/packages/primitives)
- [Modifier reference](/packages/modifiers)
- [API documentation](/api/runtime)