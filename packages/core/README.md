# @tachui/core

> The core tachUI framework - SwiftUI-inspired web development with fine-grained reactivity

[![npm version](https://img.shields.io/npm/v/@tachui/core.svg)](https://www.npmjs.com/package/@tachui/core)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

tachUI core provides a SwiftUI-inspired declarative framework for building web applications with fine-grained reactivity, direct DOM manipulation, and a familiar component-based architecture.

## Features

- 🎯 **SwiftUI-compatible API** - Familiar components and modifiers
- ⚡ **Fine-grained reactivity** - SolidJS-inspired signal system
- 🏗️ **50+ Components** - Complete UI component library
- 🎨 **Chainable modifiers** - SwiftUI-style component styling
- 📱 **Responsive design** - Built-in breakpoint system
- 🔧 **TypeScript-first** - Complete type safety
- 🚀 **Performance-focused** - Direct DOM manipulation

## Quick Start

### Installation

```bash
npm install @tachui/core@0.8.1-alpha
# or
pnpm add @tachui/core@0.8.1-alpha
```

### Basic Example

```typescript
import { Text, Button, VStack, createSignal } from '@tachui/core'

// Create reactive state
const [count, setCount] = createSignal(0)

// Build SwiftUI-style components
const counterApp = VStack({
  children: [
    Text(() => `Count: ${count()}`)
      .modifier.fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF')
      .build(),

    Button('Increment', () => setCount(count() + 1))
      .modifier.backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8)
      .build(),
  ],
  spacing: 16,
  alignment: 'center',
})

// Mount to DOM
counterApp.mount('#app')
```

## Core Components

### Layout

- **VStack, HStack, ZStack** - Flexible layout containers
- **Grid** - Advanced grid systems with responsive support
- **ScrollView** - Scrollable content with pull-to-refresh
- **Spacer** - Flexible space distribution

### Content & Input

- **Text** - Typography with reactive content
- **Image** - Progressive loading with content modes
- **Button** - Interactive buttons with states
- **BasicInput** - Text input with validation
- **Toggle** - Switch controls with reactive binding

### Data & Logic

- **List, ForEach, Section** - Dynamic content rendering
- **Show, Unless, When** - Conditional rendering
- **Form** - Form containers with validation

## Modifier System

Chain modifiers just like SwiftUI:

```typescript
Text('Hello tachUI')
  .modifier.fontSize(18)
  .fontWeight('semibold')
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('#f0f8ff')
  .cornerRadius(12)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,122,255,0.2)' })
  .onTap(() => console.log('Tapped!'))
  .build()
```

### Available Modifiers

- **Layout**: `.frame()`, `.padding()`, `.margin()`, `.position()`
- **Appearance**: `.foregroundColor()`, `.backgroundColor()`, `.font()`, `.cornerRadius()`
- **Visual Effects**: `.shadow()`, `.opacity()`, `.clipShape()`, `.backdrop()`
- **Interactions**: `.onTap()`, `.onHover()`, `.disabled()`, `.cursor()`
- **Responsive**: `.responsive()` - breakpoint-based styling

## Reactivity System

Fine-grained reactive updates using signals:

```typescript
import { createSignal, createComputed, createEffect } from '@tachui/core'

// Create reactive state
const [name, setName] = createSignal('World')
const [count, setCount] = createSignal(0)

// Computed values
const greeting = createComputed(() => `Hello, ${name()}!`)

// Side effects
createEffect(() => {
  console.log(`Count changed to: ${count()}`)
})

// Update state
setName('tachUI')
setCount(count() + 1)
```

## TypeScript Support

Full TypeScript support with excellent IntelliSense:

```typescript
import { ComponentProps, Modifier } from '@tachui/core'

// Typed component props
interface MyComponentProps extends ComponentProps {
  title: string
  count: number
  onUpdate?: (value: number) => void
}

// Custom components with modifiers
const MyComponent = createComponent<MyComponentProps>('MyComponent', props => {
  return Text(props.title)
    .modifier.fontSize(props.count > 10 ? 20 : 16)
    .build()
})
```

## Performance

tachUI's architecture provides:

- **Surgical DOM updates** - Only affected elements re-render
- **Automatic dependency tracking** - No manual effect management
- **Memory-safe cleanup** - WeakMap-based automatic cleanup
- **Sub-millisecond updates** - Direct DOM manipulation

### Concatenation Optimization (New in 0.8.1-alpha)

Revolutionary bundle size reduction for component concatenation patterns:

```typescript
// Before: Uses full 87.76KB concatenation runtime
Text('Hello').build().concat(Text('World').build())

// After: Smart optimization with 94.9% bundle reduction
// • Static patterns: 0KB runtime (compile-time concatenation)
// • Dynamic patterns: 1.2-1.9KB selective runtime based on accessibility needs
```

- **Automatic Detection**: TypeScript AST analysis finds `.build().concat()` patterns
- **Smart Runtime Selection**: Minimal (1.18KB), ARIA (1.42KB), or Full (1.93KB) based on component needs
- **CLI Integration**: Use `tachui analyze --concatenation` for optimization insights
- **Production Ready**: 27 tests passing, handles 250+ files in <500ms

## Modifier Type Generation

tachUI ships tooling to keep modifier chaining types in sync with the registry.

### One-off generation

```bash
pnpm --filter @tachui/core generate-modifier-types
```

### CI verification / conflict detection

```bash
# Verifies that generated files are up to date
pnpm --filter @tachui/core generate-modifier-types -- --check

# Optionally fail when metadata conflicts are detected
pnpm --filter @tachui/core generate-modifier-types -- --check --fail-on-conflict
```

### Watch mode

```bash
pnpm --filter @tachui/core generate-modifier-types -- --watch
```

### Monorepo generation

Generate declarations for multiple packages at once:

```bash
pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,forms,navigation
```

The tooling automatically hydrates modifier metadata via `@tachui/modifiers` (for runtime definitions) and `@tachui/devtools` (for parameter signatures/documentation).

## Plugin Ecosystem

Extend tachUI with additional packages:

- **[@tachui/forms](https://npm.im/@tachui/forms)** - Advanced form components
- **[@tachui/navigation](https://npm.im/@tachui/navigation)** - Navigation and routing
- **[@tachui/symbols](https://npm.im/@tachui/symbols)** - Icon system
- **[@tachui/mobile-patterns](https://npm.im/@tachui/mobile-patterns)** - Mobile UI patterns

## Documentation

- **[Getting Started Guide](https://github.com/tach-UI/tachUI/blob/main/docs/guide/getting-started.md)**
- **[Component Reference](https://github.com/tach-UI/tachUI/blob/main/docs/guide/components/)**
- **[API Documentation](https://github.com/tach-UI/tachUI/tree/main/docs/api/)**
- **[Examples](https://github.com/tach-UI/tachUI/tree/main/apps/examples/)**

## Community

- **[GitHub Issues](https://github.com/tach-UI/tachUI/issues)** - Report bugs and request features
- **[GitHub Discussions](https://github.com/tach-UI/tachUI/discussions)** - Ask questions and share ideas
- **[Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md)** - How to contribute

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.

---

**tachUI** - The future of SwiftUI-inspired web development 🚀
