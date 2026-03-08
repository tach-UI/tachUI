# Core Concepts

TachUI combines SwiftUI's declarative syntax with SolidJS-style fine-grained reactivity to create a powerful and intuitive web framework. Understanding these core concepts will help you build efficient and maintainable applications.

## Architecture Overview

TachUI's architecture is built on three fundamental pillars:

```
SwiftUI Syntax → Reactive Signals → Direct DOM Updates
```

### 1. Declarative Components
Components describe what the UI should look like, not how to build it step by step.

### 2. Fine-Grained Reactivity
Only the parts of the DOM that need to change get updated, without virtual DOM overhead.

### 3. Direct DOM Manipulation
Updates go straight to the DOM with surgical precision for maximum performance.

## Reactive Signals

At the heart of TachUI is a SolidJS-inspired reactive system based on **Signals**.

### What are Signals?

Signals are reactive data containers that automatically track dependencies and update when their values change.

```typescript
import { createSignal } from '@tachui/core'

// Create a signal
const [count, setCount] = createSignal(0)

// Read the current value
console.log(count()) // 0

// Update the value
setCount(5)
console.log(count()) // 5
```

### Automatic Dependency Tracking

When you use a signal inside a component, TachUI automatically tracks that dependency:

```typescript
import { Text, Button, VStack } from '@tachui/core'

function Counter() {
  const [count, setCount] = createSignal(0)
  
  return VStack({
    children: [
      // This Text will automatically update when count changes
      Text(() => `Count: ${count()}`),
      
      Button('Increment', () => setCount(count() + 1))
    ]
  })
}
```

### Signal Benefits

- **Efficiency**: Only updates when values actually change
- **Performance**: No virtual DOM diffing overhead
- **Simplicity**: No complex state management patterns needed
- **Automatic**: Dependency tracking happens automatically

## SwiftUI-Style Components

TachUI components follow SwiftUI patterns for familiarity and consistency.

### Component Creation

```typescript
import { Text, Button, VStack } from '@tachui/core'

// Simple text component
const greeting = Text("Hello, World!")

// Component with children
const card = VStack({
  children: [
    Text("Card Title"),
    Text("Card content"),
    Button("Action", () => {})
  ],
  spacing: 16
})
```

### Modifier Chaining

Apply styling and behavior using SwiftUI-style modifiers:

```typescript
Text("Styled Text")
  .fontSize(24)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
```

## Layout System

TachUI provides SwiftUI-inspired layout containers:

### VStack - Vertical Layout

```typescript
VStack({
  children: [
    Text("Top"),
    Text("Middle"), 
    Text("Bottom")
  ],
  spacing: 16,
  alignment: 'center'
})
```

### HStack - Horizontal Layout

```typescript
HStack({
  children: [
    Text("Left"),
    Text("Center"),
    Text("Right")
  ],
  spacing: 12,
  alignment: 'center'
})
```

### ZStack - Layered Layout

```typescript
ZStack({
  children: [
    // Background layer
    Rectangle()
      .fill('#f0f0f0')
      .cornerRadius(8),
    
    // Foreground content
    Text("Overlay Text")
  ],
  alignment: 'center'
})
```

## State Management

TachUI provides SwiftUI-compatible state management patterns:

### @State - Local Component State

```typescript
import { State } from '@tachui/core'

function UserProfile() {
  const name = State("John Doe")
  const isEditing = State(false)
  
  return VStack({
    children: [
      Text(() => name.wrappedValue),
      Button(
        () => isEditing.wrappedValue ? "Save" : "Edit",
        () => isEditing.wrappedValue = !isEditing.wrappedValue
      )
    ]
  })
}
```

### @Binding - Two-Way Data Binding

```typescript
import { createBinding } from '@tachui/core'

function SettingsToggle({ isEnabled, onChange }) {
  const binding = createBinding(
    () => isEnabled(),
    (value) => onChange(value)
  )
  
  return Toggle({
    isOn: binding,
    label: "Enable Feature"
  })
}
```

## Component Lifecycle

Components in TachUI have lifecycle modifiers that mirror SwiftUI:

### onAppear & onDisappear

```typescript
VStack({
  children: [
    Text("Content")
  ]
})
.onAppear(() => {
  console.log("Component appeared")
})
.onDisappear(() => {
  console.log("Component disappeared")
})
```

### task - Async Operations

```typescript
VStack({
  children: [
    Text(() => data() || "Loading...")
  ]
})
.task(async () => {
  const response = await fetch('/api/data')
  const result = await response.json()
  setData(result)
})
```

## Performance Characteristics

TachUI's architecture provides several performance benefits:

### Fine-Grained Updates
- Only changed elements update, not entire component trees
- No virtual DOM diffing overhead
- Millisecond update times even with thousands of components

### Memory Efficiency
- Automatic cleanup of unused signals and effects
- WeakMap-based component tracking
- Minimal memory footprint

### Bundle Size
- Tree-shakeable components
- No runtime template compilation
- ~15.8KB gzipped for typical applications

## Best Practices

### 1. Embrace Reactive Patterns

```typescript
// ✅ Good - Reactive data flow
const [items, setItems] = createSignal([])
const filteredItems = createMemo(() => 
  items().filter(item => item.visible)
)

// ❌ Avoid - Manual DOM updates
let items = []
function updateList() {
  document.getElementById('list').innerHTML = items.map(renderItem).join('')
}
```

### 2. Use Computed Values for Derived State

```typescript
// ✅ Good - Computed values
const [firstName, setFirstName] = createSignal("")
const [lastName, setLastName] = createSignal("")
const fullName = createMemo(() => `${firstName()} ${lastName()}`)

// ❌ Avoid - Manual recalculation
let fullName = ""
function updateFullName() {
  fullName = firstName() + " " + lastName()
}
```

### 3. Leverage SwiftUI Patterns

```typescript
// ✅ Good - SwiftUI-style composition
function UserCard({ user }) {
  return VStack({
    children: [
      UserAvatar({ user }),
      UserInfo({ user }),
      UserActions({ user })
    ]
  })
  .padding(16)
  .background('white')
  .cornerRadius(12)
}

// ❌ Avoid - Imperative DOM manipulation
function UserCard({ user }) {
  const div = document.createElement('div')
  div.className = 'user-card'
  // ... manual DOM construction
  return div
}
```

## Next Steps

Now that you understand TachUI's core concepts:

1. **[Installation Guide](/guide/installation)** - Set up your development environment
2. **[Signals Guide](/guide/signals)** - Deep dive into reactive programming
3. **[Components Guide](/guide/components)** - Learn about all available components
4. **[Layout Guide](/guide/layout)** - Master the layout system
5. **[State Management](/guide/state-management)** - Advanced state patterns

## Key Takeaways

- **Signals** provide automatic, efficient reactivity
- **SwiftUI patterns** make components intuitive and composable
- **Direct DOM updates** eliminate virtual DOM overhead
- **Modifier chaining** creates clean, readable styling code
- **Fine-grained reactivity** ensures optimal performance

Understanding these concepts will help you build fast, maintainable applications with TachUI's unique approach to web development.