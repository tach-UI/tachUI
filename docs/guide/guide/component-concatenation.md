# Component Concatenation Guide

## What is Component Concatenation?

Component concatenation in tachUI is inspired by SwiftUI's ability to combine multiple components into a single, cohesive unit. This pattern allows you to build complex UI elements by composing simpler components while maintaining optimal performance through automatic optimization.

## Why Use Concatenation?

### 1. **Natural Composition**
Build complex UI elements by combining simple components:

```typescript
// Instead of manually creating complex markup
<div className="user-card">
  <img src={user.avatar} alt={user.name} />
  <span>{user.name}</span>
  <button onClick={editUser}>Edit</button>
</div>

// Use natural component composition
const userCard = Image(user.avatar, { alt: user.name })
  .concat(Text(user.name))
  .concat(Button("Edit", editUser))
```

### 2. **Automatic Optimization**
The system automatically optimizes your compositions:

```typescript
// These separate text components...
const greeting = Text("Hello, ")
  .concat(Text(user.firstName))
  .concat(Text(" "))
  .concat(Text(user.lastName))
  .concat(Text("!"))

// Are automatically merged into a single optimized DOM element
// Result: <span>Hello, John Doe!</span>
```

### 3. **Built-in Accessibility**
Accessibility is handled automatically with proper ARIA attributes:

```typescript
const accessibleButton = Image("delete-icon.svg", { alt: "Delete" })
  .concat(Text("Delete Item"))

// Automatically generates proper accessibility structure
// with role="group" and combined aria-label
```

## Getting Started

### Basic Text Concatenation

The simplest form of concatenation combines text components:

```typescript
import { Text } from '@tachui/core'

// Create a greeting
const greeting = Text("Welcome to ")
  .concat(Text("tachUI"))
  .concat(Text("!"))

// Use in your component
const WelcomeMessage = () => {
  return VStack([
    greeting,
    Text("Let's build something amazing!")
  ])
}
```

### Adding Visual Elements

Combine text with images for rich content:

```typescript
import { Text, Image } from '@tachui/core'

// Status indicator with icon
const statusIndicator = Image("success-icon.svg", { 
  alt: "Success",
  width: 16,
  height: 16 
})
.concat(Text(" Upload complete"))

// Navigation item with icon
const navItem = Image("home-icon.svg", { alt: "" })
  .concat(Text("Home"))
```

### Interactive Concatenations

Include buttons and links for interactive content:

```typescript
import { Text, Button, Link } from '@tachui/core'

// Call-to-action with multiple elements
const cta = Text("Ready to get started? ")
  .concat(Button("Sign Up", handleSignup))
  .concat(Text(" or "))
  .concat(Link("learn more", "/learn-more"))
```

## Advanced Patterns

### User Interface Cards

Build complex card interfaces through concatenation:

```typescript
const UserProfileCard = (user: User) => {
  const header = Image(user.avatar, { 
    alt: `${user.name}'s avatar`,
    width: 48,
    height: 48 
  })
  .concat(Text(user.name))
  .concat(Text(user.title))

  const actions = Button("Message", () => openMessage(user))
    .concat(Button("Follow", () => followUser(user)))

  return VStack([
    header,
    Text(user.bio),
    actions
  ])
}
```

### Dynamic Content

Create concatenations with dynamic content:

```typescript
import { createSignal } from '@tachui/core'

const DynamicGreeting = () => {
  const [name, setName] = createSignal("World")
  
  const greeting = Text("Hello, ")
    .concat(Text(name)) // Reactive text
    .concat(Text("!"))
  
  return VStack([
    greeting,
    TextField(name, setName, { placeholder: "Enter your name" })
  ])
}
```

### Form Labels and Inputs

Enhance form usability with concatenated labels:

```typescript
const FormField = (label: string, required: boolean = false) => {
  const labelElement = Text(label)
    .concat(required ? Text(" *").color('red') : Text(""))

  return VStack([
    labelElement,
    TextField("", () => {}, { placeholder: `Enter ${label.toLowerCase()}` })
  ])
}
```

## Performance Considerations

### Automatic Text Merging

The system automatically merges adjacent text components for optimal DOM structure:

```typescript
// Source code
const address = Text(user.street)
  .concat(Text(", "))
  .concat(Text(user.city))
  .concat(Text(", "))
  .concat(Text(user.state))

// Rendered as single element
// <span>123 Main St, New York, NY</span>
```

### Caching System

Concatenation results are cached for improved performance:

```typescript
// First render: optimization performed and cached
const content1 = Text("Hello").concat(Text(" World"))

// Second render: retrieved from cache
const content2 = Text("Hello").concat(Text(" World"))
```

### Development Mode Debugging

In development, concatenated components include helpful debug information:

```typescript
// Development render includes debug attributes
<span 
  class="tachui-concatenated text-composition"
  data-concatenated-segments="2"
  data-semantic-structure="inline"
  data-accessibility-role="text"
>
  Hello World
</span>
```

## Accessibility Features

### Automatic ARIA Support

The system automatically generates appropriate ARIA attributes:

```typescript
const iconButton = Image("settings-icon.svg", { alt: "Settings" })
  .concat(Text("User Settings"))
  .concat(Button("Edit", editSettings))

// Results in:
// <span role="group" aria-label="Settings User Settings Edit">
//   <!-- Individual components with proper accessibility -->
// </span>
```

### Screen Reader Optimization

Content is optimized for screen readers with natural reading flow:

```typescript
const notification = Image("warning-icon.svg", { 
  alt: "Warning",
  accessibilityLabel: "Important notice" 
})
.concat(Text("Your session will expire in 5 minutes"))
.concat(Button("Extend Session", extendSession))

// Screen reader announces:
// "Important notice. Your session will expire in 5 minutes. Extend Session button"
```

### Keyboard Navigation

Interactive concatenated components maintain proper tab order:

```typescript
const navBar = Link("Home", "/")
  .concat(Text(" | "))
  .concat(Link("About", "/about"))
  .concat(Text(" | "))
  .concat(Button("Login", showLogin))

// Tab order: Home link → About link → Login button
```

## Best Practices

### 1. Group Related Content

```typescript
// ✅ Good: Logically related elements
const productInfo = Image(product.image)
  .concat(Text(product.name))
  .concat(Text(`$${product.price}`))

// ❌ Avoid: Unrelated content
const mixed = Text("Welcome")
  .concat(Button("Delete Account", deleteAccount))
```

### 2. Use Semantic Structure

```typescript
// ✅ Good: Clear information hierarchy
const article = Text(article.title)
  .concat(Text(`By ${article.author}`))
  .concat(Text(article.excerpt))

// ✅ Good: Action-oriented grouping
const cardActions = Button("Edit", editItem)
  .concat(Button("Share", shareItem))
  .concat(Button("Delete", deleteItem))
```

### 3. Consider Mobile Experience

```typescript
// Responsive concatenation for mobile
const mobileNavItem = Image(icon, { width: 24, height: 24 })
  .concat(Text(label))
  .modifier
  .responsive({
    mobile: { flexDirection: 'column', fontSize: 12 },
    desktop: { flexDirection: 'row', fontSize: 16 }
  })
```

### 4. Provide Meaningful Alt Text

```typescript
// ✅ Good: Descriptive alt text
const statusMessage = Image("success.svg", { 
  alt: "Success",
  accessibilityLabel: "Operation completed successfully" 
})
.concat(Text("File uploaded successfully"))

// ❌ Avoid: Empty or generic alt text
const badExample = Image("icon.svg", { alt: "icon" })
  .concat(Text("Some text"))
```

## Common Patterns

### Status Indicators

```typescript
const StatusIndicator = (status: 'success' | 'warning' | 'error', message: string) => {
  const icon = Image(`${status}-icon.svg`, { alt: status })
  return icon.concat(Text(message))
}

// Usage
StatusIndicator('success', 'Changes saved')
StatusIndicator('warning', 'Connection unstable')
StatusIndicator('error', 'Upload failed')
```

### Breadcrumb Navigation

```typescript
const Breadcrumb = (items: Array<{ label: string, href?: string }>) => {
  let breadcrumb = null
  
  items.forEach((item, index) => {
    const element = item.href 
      ? Link(item.label, item.href)
      : Text(item.label)
    
    if (breadcrumb === null) {
      breadcrumb = element
    } else {
      breadcrumb = breadcrumb
        .concat(Text(' > '))
        .concat(element)
    }
  })
  
  return breadcrumb
}
```

### Rich Text Formatting

```typescript
const RichText = (content: string) => {
  // Simple bold text example
  return Text("This text has ")
    .concat(Text("bold").fontWeight('bold'))
    .concat(Text(" and "))
    .concat(Text("italic").fontStyle('italic'))
    .concat(Text(" formatting"))
}
```

## Integration with Other Features

### With Modifiers

```typescript
const styledContent = Text("Important: ")
  .concat(Text("Read this carefully"))
  .modifier
  .padding(16)
  .backgroundColor('#fff3cd')
  .border('1px solid #ffeaa7')
  .borderRadius(4)
```

### With State Management

```typescript
import { createSignal } from '@tachui/core'

const Counter = () => {
  const [count, setCount] = createSignal(0)
  
  const display = Text("Count: ")
    .concat(Text(() => count().toString()))
  
  return VStack([
    display,
    Button("+", () => setCount(count() + 1))
  ])
}
```

### With Conditional Rendering

```typescript
const ConditionalContent = ({ showIcon }: { showIcon: boolean }) => {
  let content = Text("Hello World")
  
  if (showIcon) {
    content = Image("hello-icon.svg", { alt: "Hello" })
      .concat(content)
  }
  
  return content
}
```

This concatenation system provides a powerful, flexible way to compose UI elements while maintaining excellent performance and accessibility. Use it to build more maintainable and expressive component compositions in your tachUI applications.