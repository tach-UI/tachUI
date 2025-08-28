# Getting Started

TachUI is a SwiftUI-inspired web framework that brings declarative UI development to the web with fine-grained reactivity and AI-powered developer experience.

> **📖 Component Documentation**: For complete component documentation with TachUI-specific syntax, see our [TachUI Components Guide](/guide/tachui-components).

## Installation

### Current Installation (Alpha)

TachUI is currently in alpha. Install manually for existing projects:

```bash
npm install @tachui/core

# Optional packages
npm install @tachui/navigation  # For NavigationView, TabView, routing
```

### Quick Start Template

Create a new project with Vite and TachUI:

```bash
# Create new Vite project
npm create vite@latest my-tachui-app -- --template vanilla-ts
cd my-tachui-app

# Install TachUI
npm install @tachui/core
npm install @tachui/navigation  # Optional: for navigation components

# Start development
npm run dev
```

This gives you:
- ✅ Optimal Vite configuration
- ✅ TypeScript setup with strict types  
- ✅ Hot module replacement
- ✅ Modern build tooling

## Your First Component

Create a simple counter component:

```typescript
// Counter.ts
import { createSignal, VStack, Text, Button } from '@tachui/core'

export const Counter = () => {
  const [count, setCount] = createSignal(0)
  
  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .modifier
        .fontSize(24)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .build(),
      
      Button("Increment")
        .modifier
        .variant('filled')
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .cornerRadius(8)
        .padding({ horizontal: 16, vertical: 12 })
        .onTap(() => setCount(count() + 1))
        .build()
    ],
    spacing: 16,
    alignment: 'center'
  })
  .modifier
  .padding(32)
  .backgroundColor('#f9f9f9')
  .cornerRadius(12)
  .build()
}
```

## Core Concepts

### Signals (Reactive State)

Signals are the foundation of TachUI's reactivity:

```typescript
const [count, setCount] = createSignal(0)

// Read the current value
console.log(count()) // 0

// Update the value
setCount(5)

// Functional updates
setCount(prev => prev + 1)
```

### Effects (Side Effects)

Effects run when their dependencies change:

```typescript
createEffect(() => {
  console.log('Count changed:', count())
})
```

### Computed Values (Derived State)

Computed values automatically update when dependencies change:

```typescript
const doubled = createComputed(() => count() * 2)
```

## Building Your App

### Development

```bash
npm run dev
```

Opens your app at `http://localhost:5173` with:
- 🔥 Hot module reloading
- ⚡ Fast reactive updates
- 🔧 TypeScript checking
- 📝 Source maps for debugging

### Production Build

```bash
npm run build
```

Creates an optimized production build with:
- 📦 Tree-shaken bundles  
- ⚡ Optimized reactive code
- 🗜️ Compressed assets
- 📊 Bundle analysis

## Common Issues

### "State can only be used within a component context" Error

**Problem:** You get this error when trying to use `State()` in your components.

**Quick Fix:** Wrap your component with `withComponentContext`:

```typescript
import { State, withComponentContext, VStack, Text } from '@tachui/core'

// ❌ This causes the error
function MyComponent() {
  const count = State(0) // ERROR!
  return Text(count.wrappedValue)
}

// ✅ Fix: Wrap your component
function _MyComponent() {
  const count = State(0) // Works!
  return Text(count.wrappedValue)
}

export const MyComponent = withComponentContext(_MyComponent, 'MyComponent')
```

**Why this happens:** When component functions that use `State()` are called by other components, they need proper context wrapping. See the [State Management Guide](/guide/state-management#component-context-wrapping) for complete details.

## Next Steps

- [Learn about Signals](/guide/signals) - Core reactive primitives
- [Explore Components](/guide/components) - UI building blocks  
- [Set up AI Tools](/guide/ai-integration) - Boost your productivity
- [View Examples](/examples/) - Real-world examples

## Need Help?

- [API Documentation](/api/) - Complete API reference
- [GitHub Issues](https://github.com/whoughton/TachUI/issues) - Report bugs
- [Discord Community](https://discord.gg/tachui) - Get help from the community