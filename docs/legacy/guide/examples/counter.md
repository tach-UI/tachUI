# Counter Example

A simple reactive counter that demonstrates the fundamentals of TachUI's signal-based state management and component composition.

## Overview

This example showcases:
- **Reactive signals** with `createSignal`
- **Component composition** with layout containers
- **Event handling** with button actions
- **Conditional rendering** based on state
- **SwiftUI-style modifiers** for styling

## Live Demo

```typescript
import { 
  createSignal, 
  Text, 
  Button, 
  VStack, 
  HStack,
  renderComponent 
} from '@tachui/core'

function Counter() {
  const [count, setCount] = createSignal(0)
  
  const increment = () => setCount(count() + 1)
  const decrement = () => setCount(count() - 1)
  const reset = () => setCount(0)
  
  return VStack({
    children: [
      // Title
      Text("Counter Example")
        .fontSize(24)
        .fontWeight('bold')
        .foregroundColor('#2c3e50')
        .margin({ bottom: 16 }),
      
      // Counter display
      Text(() => count().toString())
        .fontSize(48)
        .fontWeight('300')
        .foregroundColor(() => {
          const value = count()
          if (value > 0) return '#27ae60'
          if (value < 0) return '#e74c3c'
          return '#34495e'
        })
        .padding(20)
        .backgroundColor('#ecf0f1')
        .cornerRadius(12)
        .margin({ bottom: 24 }),
      
      // Control buttons
      HStack({
        children: [
          Button("−", decrement)
            .fontSize(20)
            .backgroundColor('#e74c3c')
            .foregroundColor('white')
            .padding({ horizontal: 20, vertical: 12 })
            .cornerRadius(8)
            .disabled(() => count() <= -10),
          
          Button("Reset", reset)
            .fontSize(16)
            .backgroundColor('#95a5a6')
            .foregroundColor('white')
            .padding({ horizontal: 16, vertical: 12 })
            .cornerRadius(8),
          
          Button("+", increment)
            .fontSize(20)
            .backgroundColor('#27ae60')
            .foregroundColor('white')
            .padding({ horizontal: 20, vertical: 12 })
            .cornerRadius(8)
            .disabled(() => count() >= 10)
        ],
        spacing: 12,
        alignment: 'center'
      }),
      
      // Status text
      Text(() => {
        const value = count()
        if (value === 0) return "Click + or − to start counting"
        if (value > 0) return `${value} above zero`
        return `${Math.abs(value)} below zero`
      })
        .fontSize(14)
        .foregroundColor('#7f8c8d')
        .margin({ top: 16 }),
      
      // Progress indicator
      () => count() !== 0 ? 
        VStack({
          children: [
            Text("Progress")
              .fontSize(12)
              .fontWeight('600')
              .foregroundColor('#34495e')
              .margin({ top: 16, bottom: 8 }),
            
            HStack({
              children: Array.from({ length: 10 }, (_, i) => {
                const isActive = Math.abs(count()) > i
                return VStack({
                  children: []
                })
                .width(12)
                .height(8)
                .backgroundColor(isActive ? '#3498db' : '#ecf0f1')
                .cornerRadius(2)
              }),
              spacing: 4,
              alignment: 'center'
            })
          ]
        }) : null
    ],
    spacing: 0,
    alignment: 'center'
  })
  .padding(32)
  .backgroundColor('#ffffff')
  .minHeight('100vh')
  .justifyContent('center')
}

// Render the counter
const container = document.getElementById('app')
renderComponent(Counter(), container)
```

## Key Concepts Demonstrated

### 1. Signal-Based State Management

```typescript
const [count, setCount] = createSignal(0)
```

- **Reactive state**: The `count` signal automatically triggers UI updates
- **Functional updates**: `setCount(count() + 1)` for incrementing
- **Getter pattern**: `count()` to read the current value

### 2. Conditional Styling

```typescript
.foregroundColor(() => {
  const value = count()
  if (value > 0) return '#27ae60'  // Green for positive
  if (value < 0) return '#e74c3c'  // Red for negative
  return '#34495e'                 // Gray for zero
})
```

The text color changes dynamically based on the counter value.

### 3. Conditional Rendering

```typescript
() => count() !== 0 ? ProgressIndicator() : null
```

The progress indicator only appears when the counter is not zero.

### 4. Computed Properties in Templates

```typescript
Text(() => {
  const value = count()
  if (value === 0) return "Click + or − to start counting"
  if (value > 0) return `${value} above zero`
  return `${Math.abs(value)} below zero`
})
```

Status messages update automatically based on the current count.

### 5. Dynamic Button States

```typescript
Button("−", decrement)
  .disabled(() => count() <= -10)

Button("+", increment)
  .disabled(() => count() >= 10)
```

Buttons disable at the limits (-10 to +10) to prevent extreme values.

## Enhanced Version

Here's an enhanced counter with additional features:

```typescript
function EnhancedCounter() {
  const [count, setCount] = createSignal(0)
  const [step, setStep] = createSignal(1)
  const [history, setHistory] = createSignal([0])
  
  const increment = () => {
    const newValue = count() + step()
    setCount(newValue)
    setHistory(prev => [...prev, newValue])
  }
  
  const decrement = () => {
    const newValue = count() - step()
    setCount(newValue)
    setHistory(prev => [...prev, newValue])
  }
  
  const undo = () => {
    const hist = history()
    if (hist.length > 1) {
      const newHistory = hist.slice(0, -1)
      setHistory(newHistory)
      setCount(newHistory[newHistory.length - 1])
    }
  }
  
  return VStack({
    children: [
      // Counter display
      Text(() => count().toString())
        .fontSize(64)
        .fontWeight('bold')
        .foregroundColor('#2c3e50')
        .textAlign('center'),
      
      // Step size control
      HStack({
        children: [
          Text("Step size:")
            .fontSize(14)
            .foregroundColor('#7f8c8d'),
          
          ...([1, 2, 5, 10].map(value => 
            Button(value.toString(), () => setStep(value))
              .fontSize(12)
              .backgroundColor(() => step() === value ? '#3498db' : '#ecf0f1')
              .foregroundColor(() => step() === value ? 'white' : '#2c3e50')
              .padding({ horizontal: 8, vertical: 4 })
              .cornerRadius(4)
          ))
        ],
        spacing: 8,
        alignment: 'center'
      })
      .margin({ bottom: 16 }),
      
      // Main controls
      HStack({
        children: [
          Button(`−${step()}`, decrement)
            .backgroundColor('#e74c3c')
            .foregroundColor('white')
            .padding({ horizontal: 16, vertical: 12 })
            .cornerRadius(8),
          
          Button("Undo", undo)
            .backgroundColor('#f39c12')
            .foregroundColor('white')
            .padding({ horizontal: 16, vertical: 12 })
            .cornerRadius(8)
            .disabled(() => history().length <= 1),
          
          Button(`+${step()}`, increment)
            .backgroundColor('#27ae60')
            .foregroundColor('white')
            .padding({ horizontal: 16, vertical: 12 })
            .cornerRadius(8)
        ],
        spacing: 12
      }),
      
      // History display
      VStack({
        children: [
          Text("History")
            .fontSize(14)
            .fontWeight('600')
            .foregroundColor('#2c3e50')
            .margin({ bottom: 8 }),
          
          HStack({
            children: () => history()
              .slice(-10) // Show last 10 values
              .map((value, index, arr) => 
                Text(value.toString())
                  .fontSize(12)
                  .padding({ horizontal: 6, vertical: 3 })
                  .backgroundColor(index === arr.length - 1 ? '#3498db' : '#ecf0f1')
                  .foregroundColor(index === arr.length - 1 ? 'white' : '#2c3e50')
                  .cornerRadius(4)
              ),
            spacing: 4,
            alignment: 'center'
          })
        ]
      })
      .margin({ top: 24 })
    ],
    spacing: 16,
    alignment: 'center'
  })
  .padding(32)
}
```

## Interactive Features

### Keyboard Support

Add keyboard controls to the counter:

```typescript
function KeyboardCounter() {
  const [count, setCount] = createSignal(0)
  
  // Keyboard event handling
  createEffect(() => {
    const handleKeyPress = (event) => {
      switch (event.key) {
        case 'ArrowUp':
        case '+':
          event.preventDefault()
          setCount(count() + 1)
          break
        case 'ArrowDown':
        case '-':
          event.preventDefault()
          setCount(count() - 1)
          break
        case 'r':
        case 'R':
          event.preventDefault()
          setCount(0)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyPress)
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  })
  
  return VStack({
    children: [
      Text(() => count().toString())
        .fontSize(48)
        .fontWeight('bold'),
      
      Text("Use ↑/↓ arrows, +/- keys, or 'R' to reset")
        .fontSize(12)
        .foregroundColor('#7f8c8d')
        .textAlign('center')
    ],
    spacing: 16,
    alignment: 'center'
  })
}
```

### Animation Effects

Add smooth animations to value changes:

```typescript
function AnimatedCounter() {
  const [count, setCount] = createSignal(0)
  const [isIncrementing, setIsIncrementing] = createSignal(false)
  
  const animatedIncrement = () => {
    setIsIncrementing(true)
    setCount(count() + 1)
    
    setTimeout(() => {
      setIsIncrementing(false)
    }, 200)
  }
  
  return VStack({
    children: [
      Text(() => count().toString())
        .fontSize(48)
        .fontWeight('bold')
        .transform(() => isIncrementing() ? 'scale(1.1)' : 'scale(1)')
        .transition('transform', 200, 'ease-out')
        .foregroundColor(() => isIncrementing() ? '#27ae60' : '#2c3e50'),
      
      Button("Animate +1", animatedIncrement)
        .backgroundColor('#3498db')
        .foregroundColor('white')
        .padding({ horizontal: 16, vertical: 12 })
        .cornerRadius(8)
    ],
    spacing: 16,
    alignment: 'center'
  })
}
```

## Testing the Counter

### Unit Testing

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal } from '@tachui/core'

describe('Counter Logic', () => {
  it('should increment correctly', () => {
    const [count, setCount] = createSignal(0)
    
    setCount(count() + 1)
    expect(count()).toBe(1)
    
    setCount(count() + 5)
    expect(count()).toBe(6)
  })
  
  it('should handle negative numbers', () => {
    const [count, setCount] = createSignal(0)
    
    setCount(count() - 3)
    expect(count()).toBe(-3)
  })
  
  it('should reset to zero', () => {
    const [count, setCount] = createSignal(42)
    
    setCount(0)
    expect(count()).toBe(0)
  })
})
```

## What's Next?

This counter example demonstrates TachUI's core reactive principles. To learn more:

1. **[Todo List Example](/examples/todo)** - More complex state management
2. **[Data Fetching Example](/examples/data-fetching)** - Async operations
3. **[Signals Guide](/guide/signals)** - Deep dive into reactivity
4. **[Component Guide](/guide/components)** - Component composition patterns

The counter is a perfect starting point for understanding how TachUI's signals create reactive, efficient user interfaces with minimal code.