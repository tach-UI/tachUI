# Testing Guide

A comprehensive guide to testing TachUI components, including best practices, examples, and common patterns.

## Overview

TachUI uses [Vitest](https://vitest.dev/) as its testing framework, providing a modern, fast testing experience with excellent TypeScript support. The framework includes specialized testing utilities for reactive components, modifiers, and layouts.

## Test Setup

### Configuration

TachUI tests are configured with:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // DOM environment for component testing
    globals: true,        // Global test functions
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      threshold: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  }
})
```

### Testing Utilities

TachUI provides testing utilities for common scenarios:

```typescript
import { 
  createTestComponent,
  mockDOMEnvironment,
  waitForReactiveUpdate,
  createSignalMock
} from '@tachui/core/testing'
```

## Component Testing

### Basic Component Tests

Testing a simple Text component:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Text } from '@tachui/core'
import { createSignal } from '@tachui/core/reactive'

describe('Text Component', () => {
  beforeEach(() => {
    // Mock DOM environment
    global.document = {
      ...global.document,
      createElement: vi.fn((tagName: string) => {
        return {
          tagName: tagName.toUpperCase(),
          style: {},
          textContent: '',
          setAttribute: vi.fn(),
          addEventListener: vi.fn()
        }
      })
    }
  })

  it('should render static text', () => {
    const textComponent = Text("Hello World")
    
    expect(textComponent).toBeDefined()
    expect(textComponent.props.content).toBe("Hello World")
  })

  it('should handle reactive text content', async () => {
    const [text, setText] = createSignal("Initial")
    const textComponent = Text(() => text())
    
    // Initial state
    expect(typeof textComponent.props.content).toBe('function')
    
    // Update reactive content
    setText("Updated")
    
    // Verify reactivity (implementation would update DOM)
    expect(text()).toBe("Updated")
  })

  it('should apply typography styling', () => {
    const styledText = Text("Styled Text")
      .modifier
      .fontSize(18)
      .fontWeight('bold')
      .foregroundColor('#007AFF')
      .build()
    
    expect(styledText.modifiers).toHaveLength(3)
    expect(styledText.modifiers[0].properties).toMatchObject({
      font: { size: 18 }
    })
  })
})
```

### Button Component Testing

Testing interactive components with event handlers:

```typescript
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@tachui/core'
import { createSignal } from '@tachui/core/reactive'

describe('Button Component', () => {
  it('should handle click events', () => {
    const clickHandler = vi.fn()
    const button = Button("Click Me", { onClick: clickHandler })
    
    expect(button.props.onClick).toBe(clickHandler)
  })

  it('should support different variants', () => {
    const filledButton = Button("Filled")
      .modifier
      .variant('filled')
      .backgroundColor('#007AFF')
      .build()
    
    const outlinedButton = Button("Outlined")
      .modifier
      .variant('outlined')
      .borderColor('#007AFF')
      .build()
    
    expect(filledButton.modifiers).toContain(
      expect.objectContaining({
        properties: expect.objectContaining({
          backgroundColor: '#007AFF'
        })
      })
    )
  })

  it('should handle disabled state', () => {
    const [isDisabled, setIsDisabled] = createSignal(false)
    
    const button = Button("Toggle")
      .modifier
      .disabled(isDisabled)
      .build()
    
    // Initially enabled
    expect(isDisabled()).toBe(false)
    
    // Disable button
    setIsDisabled(true)
    expect(isDisabled()).toBe(true)
  })
})
```

### Layout Component Testing

Testing layout containers:

```typescript
import { describe, it, expect } from 'vitest'
import { VStack, HStack, ZStack, Text } from '@tachui/core'

describe('Layout Components', () => {
  describe('VStack', () => {
    it('should arrange children vertically', () => {
      const vstack = VStack({
        children: [
          Text("First"),
          Text("Second"),
          Text("Third")
        ],
        spacing: 16,
        alignment: 'leading'
      })
      
      expect(vstack.props.children).toHaveLength(3)
      expect(vstack.props.spacing).toBe(16)
      expect(vstack.props.alignment).toBe('leading')
    })

    it('should apply modifiers to container', () => {
      const styledVStack = VStack({
        children: [Text("Content")]
      })
      .modifier
      .backgroundColor('#f0f0f0')
      .padding(20)
      .cornerRadius(8)
      .build()
      
      expect(styledVStack.modifiers).toHaveLength(3)
    })
  })

  describe('HStack', () => {
    it('should arrange children horizontally', () => {
      const hstack = HStack({
        children: [
          Text("Left"),
          Text("Center"),
          Text("Right")
        ],
        spacing: 12,
        alignment: 'center'
      })
      
      expect(hstack.props.alignment).toBe('center')
      expect(hstack.props.spacing).toBe(12)
    })
  })

  describe('ZStack', () => {
    it('should layer children on top of each other', () => {
      const zstack = ZStack({
        children: [
          Text("Background"),
          Text("Foreground")
        ],
        alignment: 'center'
      })
      
      expect(zstack.props.children).toHaveLength(2)
      expect(zstack.props.alignment).toBe('center')
    })
  })
})
```

## Modifier Testing

### Testing Individual Modifiers

```typescript
import { describe, it, expect } from 'vitest'
import { 
  layoutModifiers, 
  appearanceModifiers, 
  animationModifiers 
} from '@tachui/core/modifiers'

describe('Modifier System', () => {
  describe('Layout Modifiers', () => {
    it('should create padding modifier', () => {
      const paddingMod = layoutModifiers.padding(16)
      
      expect(paddingMod.type).toBe('layout')
      expect(paddingMod.properties.padding).toBe(16)
    })

    it('should create symmetric padding modifier', () => {
      const symmetricPadding = layoutModifiers.paddingSymmetric(20, 12)
      
      expect(symmetricPadding.properties.padding).toEqual({
        left: 20,
        right: 20,
        top: 12,
        bottom: 12
      })
    })

    it('should create frame modifier', () => {
      const frameMod = layoutModifiers.frame(200, 150)
      
      expect(frameMod.properties.frame).toEqual({
        width: 200,
        height: 150
      })
    })
  })

  describe('Appearance Modifiers', () => {
    it('should create color modifiers', () => {
      const bgMod = appearanceModifiers.backgroundColor('#007AFF')
      const fgMod = appearanceModifiers.foregroundColor('#ffffff')
      
      expect(bgMod.properties.backgroundColor).toBe('#007AFF')
      expect(fgMod.properties.foregroundColor).toBe('#ffffff')
    })

    it('should create font modifiers', () => {
      const fontMod = appearanceModifiers.font({
        size: 18,
        weight: 'bold',
        family: 'Arial'
      })
      
      expect(fontMod.properties.font).toEqual({
        size: 18,
        weight: 'bold',
        family: 'Arial'
      })
    })

    it('should create shadow modifier', () => {
      const shadowMod = appearanceModifiers.shadow({
        x: 0,
        y: 2,
        radius: 4,
        color: 'rgba(0,0,0,0.1)'
      })
      
      expect(shadowMod.properties.shadow).toEqual({
        x: 0,
        y: 2,
        radius: 4,
        color: 'rgba(0,0,0,0.1)'
      })
    })
  })

  describe('Animation Modifiers', () => {
    it('should create transition modifier', () => {
      const transitionMod = animationModifiers.transition('all', 300, 'ease')
      
      expect(transitionMod.properties.transition).toEqual({
        property: 'all',
        duration: 300,
        easing: 'ease',
        delay: 0
      })
    })

    it('should create fade animation', () => {
      const fadeInMod = animationModifiers.fadeIn(500)
      
      expect(fadeInMod.properties.animation.duration).toBe(500)
      expect(fadeInMod.properties.animation.keyframes).toEqual({
        '0%': { opacity: '0' },
        '100%': { opacity: '1' }
      })
    })
  })
})
```

### Modifier Chain Testing

```typescript
import { describe, it, expect } from 'vitest'
import { Elements } from '@tachui/core'

describe('Modifier Chaining', () => {
  it('should chain multiple modifiers', () => {
    const styledComponent = Elements.div({ children: 'Styled' })
      .modifier
      .backgroundColor('#ffffff')
      .padding(16)
      .cornerRadius(8)
      .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
      .transition('all', 200)
      .build()
    
    expect(styledComponent.modifiers).toHaveLength(5)
    
    // Verify modifier types
    const modifierTypes = styledComponent.modifiers.map(m => m.type)
    expect(modifierTypes).toContain('appearance')
    expect(modifierTypes).toContain('layout')
    expect(modifierTypes).toContain('animation')
  })

  it('should maintain modifier order', () => {
    const component = Elements.button({ children: 'Test' })
      .modifier
      .padding(8)        // Layout: priority 100
      .backgroundColor('#007AFF')  // Appearance: priority 200
      .onTap(() => {})   // Interaction: priority 300
      .transition('all', 150)  // Animation: priority 400
      .build()
    
    const priorities = component.modifiers.map(m => m.priority)
    expect(priorities).toEqual([100, 200, 300, 400])
  })
})
```

## Reactive System Testing

### Signal Testing

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal, createEffect, createComputed } from '@tachui/core/reactive'

describe('Reactive System', () => {
  describe('Signals', () => {
    it('should create and update signals', () => {
      const [count, setCount] = createSignal(0)
      
      expect(count()).toBe(0)
      
      setCount(5)
      expect(count()).toBe(5)
      
      setCount(prev => prev + 1)
      expect(count()).toBe(6)
    })

    it('should support signal equality checking', () => {
      const [value, setValue] = createSignal('test')
      let updateCount = 0
      
      createEffect(() => {
        value() // Subscribe to signal
        updateCount++
      })
      
      expect(updateCount).toBe(1)
      
      setValue('test') // Same value, should not trigger
      expect(updateCount).toBe(1)
      
      setValue('different') // Different value, should trigger
      expect(updateCount).toBe(2)
    })
  })

  describe('Computed Values', () => {
    it('should create computed values from signals', () => {
      const [firstName, setFirstName] = createSignal('John')
      const [lastName, setLastName] = createSignal('Doe')
      
      const fullName = createComputed(() => `${firstName()} ${lastName()}`)
      
      expect(fullName()).toBe('John Doe')
      
      setFirstName('Jane')
      expect(fullName()).toBe('Jane Doe')
    })

    it('should update when dependencies change', () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)
      
      const sum = createComputed(() => a() + b())
      
      expect(sum()).toBe(3)
      
      setA(5)
      expect(sum()).toBe(7)
      
      setB(10)
      expect(sum()).toBe(15)
    })
  })

  describe('Effects', () => {
    it('should run effects when dependencies change', () => {
      const [count, setCount] = createSignal(0)
      const results: number[] = []
      
      createEffect(() => {
        results.push(count())
      })
      
      expect(results).toEqual([0])
      
      setCount(1)
      expect(results).toEqual([0, 1])
      
      setCount(2)
      expect(results).toEqual([0, 1, 2])
    })
  })
})
```

### Component Reactivity Testing

```typescript
import { describe, it, expect } from 'vitest'
import { createSignal } from '@tachui/core/reactive'
import { Text, Elements } from '@tachui/core'

describe('Component Reactivity', () => {
  it('should update component when signal changes', async () => {
    const [text, setText] = createSignal('Initial')
    const [color, setColor] = createSignal('#000000')
    
    const reactiveComponent = Text(() => text())
      .modifier
      .foregroundColor(color)
      .build()
    
    // Initial state
    expect(reactiveComponent.props.content()).toBe('Initial')
    
    // Update signals
    setText('Updated')
    setColor('#007AFF')
    
    // Verify updates
    expect(reactiveComponent.props.content()).toBe('Updated')
    expect(color()).toBe('#007AFF')
  })

  it('should handle conditional rendering', () => {
    const [isVisible, setIsVisible] = createSignal(true)
    
    const conditionalComponent = Elements.div({
      children: isVisible() ? 'Visible' : ''
    })
    
    expect(conditionalComponent.props.children).toBe('Visible')
    
    setIsVisible(false)
    // Component would need re-evaluation in real implementation
  })
})
```

## Advanced Testing Patterns

### Custom Component Testing

```typescript
import { describe, it, expect } from 'vitest'
import { VStack, HStack, ZStack, Text, Elements } from '@tachui/core'
import { createSignal } from '@tachui/core/reactive'

// Custom component for testing
function Card(props: { title: string; content: string; onClick?: () => void }) {
  return VStack({
    children: [
      Text(props.title)
        .modifier
        .fontSize(18)
        .fontWeight('bold')
        .build(),
      
      Text(props.content)
        .modifier
        .fontSize(14)
        .foregroundColor('#666')
        .build()
    ],
    spacing: 8
  })
  .modifier
  .backgroundColor('#ffffff')
  .padding(16)
  .cornerRadius(8)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,0,0,0.1)' })
  .onTap(props.onClick || (() => {}))
  .build()
}

describe('Custom Components', () => {
  it('should create card component', () => {
    const card = Card({
      title: 'Test Card',
      content: 'This is test content'
    })
    
    expect(card.props.children).toHaveLength(2)
    expect(card.modifiers).toHaveLength(5) // bg, padding, corner, shadow, tap
  })

  it('should handle card click events', () => {
    const clickHandler = vi.fn()
    const card = Card({
      title: 'Clickable Card',
      content: 'Click me',
      onClick: clickHandler
    })
    
    // Find tap modifier
    const tapModifier = card.modifiers.find(m => 
      m.type === 'interaction' && m.properties.onTap
    )
    
    expect(tapModifier).toBeDefined()
    expect(tapModifier?.properties.onTap).toBe(clickHandler)
  })
})
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest'
import { VStack, HStack, ZStack, Text, Button, Elements } from '@tachui/core'
import { createSignal } from '@tachui/core/reactive'

describe('Component Integration', () => {
  it('should create complex UI with interactions', () => {
    const [count, setCount] = createSignal(0)
    const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
    
    const app = VStack({
      children: [
        // Header
        Text("Counter App")
          .modifier
          .fontSize(24)
          .fontWeight('bold')
          .textAlign('center')
          .build(),
        
        // Counter display
        Text(() => `Count: ${count()}`)
          .modifier
          .fontSize(36)
          .fontWeight('bold')
          .foregroundColor(() => theme() === 'dark' ? '#ffffff' : '#000000')
          .backgroundColor(() => theme() === 'dark' ? '#333333' : '#f0f0f0')
          .padding(20)
          .cornerRadius(8)
          .textAlign('center')
          .build(),
        
        // Button row
        HStack({
          children: [
            Button("Decrement", {
              onClick: () => setCount(c => c - 1)
            })
            .modifier
            .backgroundColor('#ff3b30')
            .foregroundColor('#ffffff')
            .build(),
            
            Button("Reset", {
              onClick: () => setCount(0)
            })
            .modifier
            .backgroundColor('#ff9500')
            .foregroundColor('#ffffff')
            .build(),
            
            Button("Increment", {
              onClick: () => setCount(c => c + 1)
            })
            .modifier
            .backgroundColor('#34c759')
            .foregroundColor('#ffffff')
            .build()
          ],
          spacing: 12
        }),
        
        // Theme toggle
        Button(() => `Theme: ${theme()}`, {
          onClick: () => setTheme(t => t === 'light' ? 'dark' : 'light')
        })
        .modifier
        .backgroundColor(() => theme() === 'dark' ? '#ffffff' : '#000000')
        .foregroundColor(() => theme() === 'dark' ? '#000000' : '#ffffff')
        .build()
      ],
      spacing: 16
    })
    .modifier
    .padding(20)
    .backgroundColor(() => theme() === 'dark' ? '#1a1a1a' : '#ffffff')
    .frame({ minHeight: '100vh' })
    .build()
    
    expect(app.props.children).toHaveLength(4)
    expect(count()).toBe(0)
    expect(theme()).toBe('light')
    
    // Test state changes
    setCount(5)
    expect(count()).toBe(5)
    
    setTheme('dark')
    expect(theme()).toBe('dark')
  })
})
```

## Testing Best Practices

### 1. Mock DOM Appropriately

```typescript
// Good: Minimal mock for what you need
function createMockElement(tagName: string) {
  return {
    tagName: tagName.toUpperCase(),
    style: {},
    setAttribute: vi.fn(),
    textContent: ''
  }
}

// Avoid: Over-mocking with unused properties
```

### 2. Test Component APIs, Not Implementation

```typescript
// Good: Test public API
it('should handle disabled state', () => {
  const button = Button("Test")
    .modifier
    .disabled(true)
    .build()
  
  expect(button.modifiers.some(m => m.properties.disabled)).toBe(true)
})

// Avoid: Testing internal DOM manipulation details
```

### 3. Use Descriptive Test Names

```typescript
// Good: Descriptive and specific
it('should apply red background color when variant is destructive')
it('should call onClick handler when button is tapped')
it('should update text content when signal changes')

// Avoid: Generic names
it('should work')
it('should render correctly')
```

### 4. Group Related Tests

```typescript
describe('Button Component', () => {
  describe('Basic Functionality', () => {
    // Basic rendering, props, etc.
  })
  
  describe('Event Handling', () => {
    // Click, hover, focus events
  })
  
  describe('Styling and Variants', () => {
    // Visual appearance tests
  })
  
  describe('Accessibility', () => {
    // ARIA attributes, keyboard navigation
  })
})
```

### 5. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty string content', () => {
    const text = Text("")
    expect(text.props.content).toBe("")
  })
  
  it('should handle null/undefined children', () => {
    const container = Elements.div({ children: null })
    expect(container.props.children).toBe(null)
  })
  
  it('should handle very large datasets', () => {
    const items = Array.from({ length: 1000 }, (_, i) => 
      Text(`Item ${i}`)
    )
    
    const list = VStack({ children: items })
    expect(list.props.children).toHaveLength(1000)
  })
})
```

## Running Tests

### Basic Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.ts

# Run tests matching pattern
npm test -- --grep "should handle click"
```

### Debugging Tests

```typescript
import { describe, it, expect } from 'vitest'

describe('Debugging Example', () => {
  it('should debug component state', () => {
    const component = Text("Debug me")
      .modifier
      .fontSize(16)
      .build()
    
    // Debug output
    console.log('Component:', component)
    console.log('Modifiers:', component.modifiers)
    console.log('Props:', component.props)
    
    expect(component).toBeDefined()
  })
})
```

### Test Coverage

TachUI maintains high test coverage standards:

- **Statements**: >80%
- **Branches**: >80%
- **Functions**: >80%
- **Lines**: >80%

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

## Performance Testing

For performance-critical components, include performance tests:

```typescript
import { describe, it, expect } from 'vitest'
import { Text } from '@tachui/core'

describe('Performance Tests', () => {
  it('should create 1000 components quickly', () => {
    const start = performance.now()
    
    const components = Array.from({ length: 1000 }, (_, i) =>
      Text(`Component ${i}`)
    )
    
    const end = performance.now()
    const duration = end - start
    
    expect(components).toHaveLength(1000)
    expect(duration).toBeLessThan(100) // Should take less than 100ms
  })
})
```

## Continuous Integration

TachUI tests run automatically on every commit:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run test:coverage
```

## Contributing Tests

When contributing to TachUI:

1. **Write tests first** (TDD approach preferred)
2. **Test both happy path and edge cases**
3. **Include performance tests for critical paths**
4. **Maintain >80% test coverage**
5. **Use descriptive test names and good organization**

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [TachUI Test Examples](https://github.com/whoughton/TachUI/tree/main/packages/core/tests)

---

*For more advanced testing scenarios, see the complete test suite in the [TachUI repository](https://github.com/whoughton/TachUI/tree/main/packages/core/tests)*