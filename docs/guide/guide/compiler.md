# Compiler System

TachUI's compiler transforms SwiftUI-style syntax into efficient reactive DOM code at build time. This guide covers how the transformation system works and how to use it effectively.

## Overview

The TachUI compiler consists of three main phases:

1. **Parsing**: SwiftUI syntax → Abstract Syntax Tree (AST)
2. **Transformation**: AST optimization and analysis  
3. **Code Generation**: AST → Reactive DOM manipulation code

## Vite Plugin Setup

Add the TachUI plugin to your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { createTachUIPlugin } from '@tachui/core'

export default defineConfig({
  plugins: [
    createTachUIPlugin({
      // File extensions to transform
      include: ['.tsx', '.ts'],
      
      // Files to exclude
      exclude: ['node_modules/**', '**/*.test.*'],
      
      // Development optimizations
      dev: process.env.NODE_ENV === 'development',
      
      // Transformation options
      transform: {
        treeShaking: true,     // Remove unused code
        sourceMaps: true,      // Generate source maps
        target: 'es2022',      // Target JavaScript version
        constantFolding: true  // Optimize constants
      }
    })
  ]
})
```

## Supported Syntax

### Layout Components

```typescript
// Vertical stack
VStack {
  Text("Title")
  Text("Subtitle")
}

// Horizontal stack  
HStack {
  Button("Cancel")
  Button("OK")
}

// Overlay stack
ZStack {
  Text("Background")
  Text("Foreground")
}
```

### UI Components

```typescript
// Text with styling
Text("Hello World")
  .modifier
  .font("24px")
  .foregroundColor("blue")
  .padding()
  .build()

// Interactive button
Button("Click Me")
  .modifier
  .background("green")
  .foregroundColor("white")
  .cornerRadius(8)
  .onTapGesture(() => handleClick())
  .build()
```

### Modifiers

| Modifier | Description | Example |
|----------|-------------|---------|
| `.padding()` | Add padding | `.padding()` or `.padding(16)` |
| `.background(color)` | Set background color | `.background("blue")` |
| `.foregroundColor(color)` | Set text color | `.foregroundColor("red")` |
| `.font(size)` | Set font size | `.font("18px")` |
| `.cornerRadius(px)` | Round corners | `.cornerRadius(8)` |
| `.opacity(value)` | Set opacity | `.opacity(0.8)` |
| `.frame(w, h)` | Set dimensions | `.frame(200, 100)` |
| `.onTapGesture(fn)` | Click handler | `.onTapGesture(handler)` |

## Transformation Process

### Input: SwiftUI Syntax

```typescript
VStack {
  Text("Welcome to TachUI")
    .modifier
    .font("24px")
    .foregroundColor("blue")
    .padding()
    .build()
  
  Button("Get Started")
    .modifier
    .background("blue")
    .foregroundColor("white")
    .cornerRadius(8)
    .onTapGesture(() => navigate("/home"))
    .build()
}
.modifier
.padding()
.build()
```

### Output: Reactive DOM Code

```typescript
import { createSignal, createEffect, createComputed } from '@tachui/core/reactive'

// VStack component
const container1 = document.createElement('div')
container1.className = 'tachui-v flex flex-col'

// Text component
const textElement2 = document.createElement('span')
textElement2.className = 'tachui-text'
textElement2.textContent = "Welcome to TachUI"
Object.assign(textElement2.style, {
  fontSize: "24px",
  color: "blue",
  padding: "8px"
})

container1.appendChild(textElement2)

// Button component
const buttonElement3 = document.createElement('button')
buttonElement3.className = 'tachui-button'
buttonElement3.textContent = "Get Started"
Object.assign(buttonElement3.style, {
  backgroundColor: "blue",
  color: "white",
  borderRadius: 8px
})
buttonElement3.addEventListener('click', () => navigate("/home"))

container1.appendChild(buttonElement3)

// Apply container padding
Object.assign(container1.style, {
  padding: "8px"
})
```

## AST Structure

The parser generates a typed AST with these node types:

### ComponentNode
```typescript
interface ComponentNode {
  type: 'Component'
  name: string           // 'VStack', 'Text', 'Button', etc.
  children: ASTNode[]    // Child components
  modifiers: ModifierNode[]  // Applied modifiers
  loc: SourceLocation    // Source position
}
```

### ModifierNode  
```typescript
interface ModifierNode {
  type: 'Modifier'
  name: string           // 'padding', 'background', etc.
  arguments: Expression[]    // Modifier arguments
  loc: SourceLocation
}
```

## Optimization Features

### Tree Shaking
Unused components and modifiers are automatically removed:

```typescript
// Only generates code for used components
import { Text, Button } from '@tachui/core'  // VStack not imported
```

### Constant Folding
Compile-time constant evaluation:

```typescript
// Input
Text("Hello").modifier.opacity(0.5 + 0.3).build()

// Output  
textElement.style.opacity = 0.8  // Pre-calculated
```

### Bundle Size Optimization
- Dead code elimination
- Minimal runtime overhead
- Component-level code splitting

## Performance Characteristics

### Build Time
- **Fast parsing**: ~1000 LOC/ms
- **Efficient AST**: Minimal memory usage
- **Parallel processing**: Multi-threaded transformation

### Runtime Performance
- **Zero virtual DOM**: Direct DOM manipulation
- **Surgical updates**: Only changed elements update
- **Minimal bundle**: ~5KB runtime + components used

## Development Features

### Hot Module Reloading
The plugin supports HMR for TachUI components:

```typescript
// Automatic reload on component changes
if (import.meta.hot) {
  import.meta.hot.accept()
}
```

### Source Maps
Full source map support for debugging:

```typescript
// Enable in development
transform: {
  sourceMaps: true
}
```

### Error Messages
Detailed error reporting with source locations:

```
TachUI transformation failed in src/App.tsx:15:8
Expected closing brace for VStack component
  13 | VStack {
  14 |   Text("Hello")
> 15 |   // Missing closing brace
     |        ^
```

## Advanced Usage

### Custom Components
Extend the parser for custom components:

```typescript
// Register custom component
const plugin = createTachUIPlugin({
  customComponents: ['MyButton', 'CustomCard']
})
```

### Plugin Hooks
Access transformation hooks:

```typescript
const plugin = createTachUIPlugin({
  hooks: {
    beforeTransform: (code, filename) => {
      console.log('Transforming:', filename)
    },
    afterTransform: (result) => {
      console.log('Generated:', result.code.length, 'bytes')
    }
  }
})
```

## TypeScript Integration

Full TypeScript support with strict type checking:

```typescript
// Automatic type inference
const [count, setCount] = createSignal(0)  // count: () => number

// Component props are type-safe
Text(count())  // ✅ Valid
Text(42)       // ✅ Valid  
Text({})       // ❌ Type error
```

## Next Steps

- [Component System](/guide/components) - Building reusable components
- [Reactive System](/guide/signals) - Understanding signals and effects
- [Performance Guide](/guide/performance) - Optimization techniques
- [API Reference](/api/compiler) - Complete compiler API