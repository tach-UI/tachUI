# Component Concatenation API

## Overview

tachUI's component concatenation system provides a SwiftUI-inspired way to combine multiple components into a single, optimized rendering unit. This enables powerful composition patterns while maintaining performance through intelligent optimization and caching.

## Core Interfaces

### `Concatenatable<T>`

The base interface that all concatenatable components must implement:

```typescript
interface Concatenatable<T = any> {
  concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U>
  toSegment(): ComponentSegment
  isConcatenatable(): boolean
}
```

### `ComponentSegment`

Represents a single component within a concatenated structure:

```typescript
interface ComponentSegment {
  id: string
  component: ComponentInstance
  modifiers: Modifier[]
  render(): DOMNode
}
```

### `ConcatenationMetadata`

Metadata that describes the accessibility and semantic structure of concatenated content:

```typescript
interface ConcatenationMetadata {
  totalSegments: number
  accessibilityRole: 'text' | 'group' | 'composite'
  semanticStructure: 'inline' | 'block' | 'mixed'
}
```

## Basic Usage

### Simple Text Concatenation

```typescript
import { Text } from '@tachui/core'

// Basic concatenation
const greeting = Text("Hello, ")
  .concat(Text("World!"))

// Chain multiple concatenations
const message = Text("Welcome ")
  .concat(Text("to "))
  .concat(Text("tachUI"))
```

### Cross-Component Concatenation

```typescript
import { Text, Image, Button } from '@tachui/core'

// Mix text and images
const iconWithLabel = Image("icon.svg", { alt: "Settings" })
  .concat(Text(" Settings"))

// Create interactive content
const buttonWithIcon = Button("Save", saveAction)
  .concat(Image("save-icon.svg", { alt: "" }))
```

## Advanced Features

### Automatic Text Optimization

The concatenation system automatically optimizes adjacent text components:

```typescript
// These three text components...
const original = Text("Hello ")
  .concat(Text("beautiful "))
  .concat(Text("world!"))

// Are automatically merged into a single optimized component
// Result: <span>Hello beautiful world!</span>
```

### Accessibility-Aware Concatenation

The system automatically handles accessibility attributes:

```typescript
const accessibleContent = Image("avatar.jpg", { 
  alt: "User avatar",
  accessibilityLabel: "Profile picture of John Doe" 
})
.concat(Text("John Doe"))
.concat(Button("Edit Profile", editAction))

// Results in proper ARIA structure:
// <span role="group" aria-label="Profile picture of John Doe John Doe Edit Profile">
//   <img alt="User avatar" aria-label="Profile picture of John Doe" />
//   <span>John Doe</span>
//   <button>Edit Profile</button>
// </span>
```

## Performance Optimization

### Caching System

The concatenation system includes an intelligent LRU cache:

```typescript
import { TextConcatenationOptimizer } from '@tachui/core/concatenation'

// Check cache statistics
const stats = TextConcatenationOptimizer.getCacheStats()
console.log(`Cache size: ${stats.size}/${stats.maxSize}`)

// Clear cache if needed (useful for testing)
TextConcatenationOptimizer.clearCache()
```

### Optimization Analysis

Analyze potential optimizations before applying them:

```typescript
const segments = [textSegment1, textSegment2, textSegment3]

// Check if optimization would be beneficial
if (TextConcatenationOptimizer.shouldOptimize(segments)) {
  const analysis = TextConcatenationOptimizer.analyzeOptimizationOpportunities(segments)
  console.log(`Can reduce ${analysis.totalSegments} to ${analysis.totalSegments - analysis.optimizableTextPairs} segments`)
}
```

## Component-Specific Behavior

### Text Components
- Adjacent text components are automatically merged
- Compatible modifiers are preserved
- Content is concatenated seamlessly

### Image Components
- Maintain individual rendering
- Contribute to group accessibility structure
- Support inline composition patterns

### Interactive Components (Button, Link)
- Always result in 'composite' accessibility role
- Preserve individual interaction handlers
- Maintain proper focus management

## Error Handling

### Concatenation Validation

```typescript
// Check if a component supports concatenation
if (myComponent.isConcatenatable()) {
  const result = myComponent.concat(otherComponent)
} else {
  console.warn('Component does not support concatenation')
}
```

### Debug Information

In development mode, concatenated components include debug attributes:

```html
<span 
  class="tachui-concatenated text-composition"
  data-concatenated-segments="3"
  data-semantic-structure="inline"
  data-accessibility-role="text"
>
  <!-- Component content -->
</span>
```

## Best Practices

### 1. Group Related Content
```typescript
// Good: Logically related content
const userCard = Image(user.avatar)
  .concat(Text(user.name))
  .concat(Text(user.title))

// Avoid: Unrelated content
const mixed = Text("Welcome")
  .concat(Button("Delete Account", deleteAction)) // Unrelated!
```

### 2. Consider Accessibility
```typescript
// Provide meaningful alt text for images
const accessibleIcon = Image("warning.svg", { 
  alt: "Warning",
  accessibilityLabel: "Important: This action cannot be undone" 
})
.concat(Text("Delete permanently"))
```

### 3. Leverage Automatic Optimization
```typescript
// Let the system optimize adjacent text
const longText = Text("This ")
  .concat(Text("will "))
  .concat(Text("be "))
  .concat(Text("optimized "))
  .concat(Text("automatically"))

// Result: Single merged text component
```

### 4. Chain Modifiers After Concatenation
```typescript
const styledContent = Text("Hello")
  .concat(Text(" World"))
  .modifier
  .padding(16)
  .backgroundColor('#f0f0f0')
```

## Type Safety

The concatenation system maintains full TypeScript support:

```typescript
// Type-safe concatenation
const textConcat: ConcatenatedComponent<TextProps | TextProps> = 
  Text("Hello").concat(Text("World"))

// Mixed types are properly inferred
const mixedConcat: ConcatenatedComponent<TextProps | ImageProps> = 
  Text("Icon:").concat(Image("icon.svg"))
```

## Integration with Modifiers

Concatenated components work seamlessly with the modifier system:

```typescript
const styledConcatenation = Text("Label: ")
  .concat(Text("Value"))
  .modifier
  .padding(8)
  .border('1px solid #ccc')
  .borderRadius(4)
```

Modifiers applied to concatenated components affect the entire composition, while individual component modifiers are preserved within segments.