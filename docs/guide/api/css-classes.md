# CSS Classes API Reference

Complete API reference for TachUI's CSS Classes integration system. Add CSS classes from external frameworks (Tailwind CSS, Bootstrap, custom design systems) directly to any tachUI component.

## Quick Start

All TachUI components support the `css` property for seamless CSS framework integration:

```typescript
import { VStack, HStack, Text, Button } from '@tachui/core'

// Tailwind CSS integration
VStack({
  css: "bg-white rounded-lg shadow-md p-6",
  children: [
    Text("Card Title", { css: "text-xl font-bold text-gray-800 mb-2" }),
    Text("Description", { css: "text-gray-600" }),
    Button("Action", { css: "btn btn-primary mt-4" })
  ]
})
```

## Core Interface

### `CSSClassesProps`

Universal interface supported by all tachUI components:

```typescript
interface CSSClassesProps {
  css?: string | string[] | Signal<string | string[]>
}
```

**Supported Input Types:**
- **String**: `"class1 class2 class3"`
- **Array**: `["class1", "class2", "class3"]`
- **Reactive Signal**: `() => isDark() ? "dark theme-dark" : "light theme-light"`

## Usage Patterns

### Static CSS Classes

Apply static CSS classes to any component:

```typescript
// String format - space-separated
Text("Welcome", { css: "text-2xl font-bold text-center" })

// Array format - individual classes  
Button("Submit", { 
  css: ["btn", "btn-primary", "shadow-lg", "hover:bg-blue-600"]
})

// Mixed content
HStack({
  css: "flex items-center justify-between p-4",
  children: [...]
})
```

### Reactive CSS Classes

Use signals for dynamic class application:

```typescript
import { createSignal, createComputed } from '@tachui/core'

const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
const [isActive, setActive] = createSignal(false)

// Simple reactive classes
VStack({
  css: () => theme() === 'dark' ? "bg-gray-800 text-white" : "bg-white text-gray-800",
  children: [...]
})

// Complex reactive logic
const dynamicClasses = createComputed(() => [
  'component-base',
  `theme-${theme()}`,
  isActive() ? 'state-active' : 'state-inactive',
  theme() === 'dark' && isActive() ? 'glow-effect' : ''
].filter(Boolean))

Text("Dynamic Text", { css: dynamicClasses })
```

### Framework Integration

#### Tailwind CSS

Comprehensive Tailwind utility class support:

```typescript
// Card component with Tailwind
const TailwindCard = ({ title, content }: CardProps) =>
  VStack({
    css: "max-w-sm rounded overflow-hidden shadow-lg bg-white hover:shadow-xl transition-shadow",
    children: [
      Image({ 
        src: "image.jpg",
        css: "w-full h-48 object-cover"
      }),
      
      VStack({
        css: "px-6 py-4",
        children: [
          Text(title, { css: "font-bold text-xl mb-2 text-gray-900" }),
          Text(content, { css: "text-gray-700 text-base leading-relaxed" })
        ]
      }),
      
      HStack({
        css: "px-6 pt-4 pb-2 space-x-2",
        children: [
          Button("Read More", { css: "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" })
        ]
      })
    ]
  })

// Responsive design with Tailwind
VStack({
  css: "w-full md:w-1/2 lg:w-1/3 p-4",
  children: [...]
})

// Dark mode support
Text("Content", { 
  css: "text-gray-800 dark:text-gray-200" 
})
```

#### Bootstrap Integration

Full Bootstrap component support:

```typescript
// Bootstrap form
const BootstrapForm = () =>
  Form({
    css: "container mt-4",
    children: [
      Text("Contact Form", { css: "h2 mb-4" }),
      
      VStack({
        css: "row g-3",
        children: [
          // Form fields
          VStack({
            css: "col-md-6",
            children: [
              TextField({
                placeholder: "First Name",
                css: "form-control"
              })
            ]
          }),
          
          VStack({
            css: "col-md-6",
            children: [
              TextField({
                placeholder: "Last Name", 
                css: "form-control"
              })
            ]
          }),
          
          // Submit button
          VStack({
            css: "col-12",
            children: [
              Button("Submit", { css: "btn btn-primary btn-lg" })
            ]
          })
        ]
      })
    ]
  })

// Bootstrap components
Alert({
  title: "Success",
  message: "Form submitted successfully!",
  css: "alert alert-success"
})

Button("Danger Action", { 
  css: "btn btn-danger btn-outline" 
})
```

#### Custom Design Systems

Integration with custom CSS design tokens:

```typescript
// Design system integration
const DesignSystemCard = ({ title, content }: CardProps) =>
  VStack({
    css: "ds-card ds-elevation-2 ds-spacing-lg ds-surface-primary",
    children: [
      Text(title, { css: "ds-heading-3 ds-color-primary ds-weight-bold" }),
      
      Text(content, { 
        css: "ds-body-1 ds-color-secondary ds-spacing-top-md" 
      }),
      
      HStack({
        css: "ds-actions ds-spacing-top-lg ds-justify-space-between",
        children: [
          Button("Primary", { css: "ds-btn ds-btn-primary" }),
          Button("Secondary", { css: "ds-btn ds-btn-secondary" })
        ]
      })
    ]
  })

// CSS custom properties
VStack({
  css: "component-container",
  children: [
    Text("Custom Theme", { 
      css: "title" 
    })
  ]
})

// Corresponding CSS:
// .component-container {
//   background: var(--surface-primary);
//   border-radius: var(--radius-md);
//   padding: var(--space-lg);
// }
```

## Component Integration

### Layout Components

All layout components support CSS classes:

```typescript
// Stack layouts
VStack({
  css: "flex flex-col items-center space-y-4",
  children: [...]
})

HStack({
  css: "flex flex-row items-center justify-between",
  children: [...]
})

ZStack({
  css: "relative",
  children: [
    Image({ css: "absolute inset-0" }),
    Text("Overlay", { css: "absolute top-4 left-4 z-10" })
  ]
})

// ScrollView
ScrollView({
  css: "overflow-y-auto max-h-96 custom-scrollbar",
  children: [...]
})
```

### Interactive Components

Interactive components with state-based classes:

```typescript
const [isPressed, setPressed] = createSignal(false)

// Button with press states
Button("Interactive", {
  css: () => isPressed() 
    ? "btn btn-primary btn-pressed transform scale-95" 
    : "btn btn-primary hover:bg-blue-600 transition-transform",
  action: () => {
    setPressed(true)
    setTimeout(() => setPressed(false), 150)
  }
})

// Toggle with state classes  
const [enabled, setEnabled] = createSignal(false)

Toggle({
  isOn: enabled,
  onToggle: setEnabled,
  css: () => enabled() 
    ? "switch switch-on bg-green-500" 
    : "switch switch-off bg-gray-300"
})

// Form components
TextField({
  placeholder: "Enter text...",
  css: "input input-bordered w-full focus:ring-2 focus:ring-blue-500"
})
```

### Navigation Components

Navigation with styling support:

```typescript
// Navigation links
NavigationLink({
  destination: "/profile",
  css: "nav-link text-blue-600 hover:text-blue-800 underline",
  children: [Text("Profile")]
})

// Tab navigation
TabView({
  css: "tab-container border-b border-gray-200",
  children: [
    TabItem("Home", { css: "tab tab-active" }),
    TabItem("Profile", { css: "tab" }),
    TabItem("Settings", { css: "tab" })
  ]
})
```

## Advanced Features

### Class Processing

TachUI automatically processes and optimizes CSS classes:

```typescript
// Automatic deduplication
VStack({
  css: "flex flex-col flex", // Duplicate 'flex' removed
  children: [...]
})

// Class sanitization  
Text("Content", { 
  css: "my@class 123invalid" // Becomes: "my-class cls-123invalid"
})

// Array flattening
Button("Action", {
  css: [
    "btn btn-primary",           // Split into individual classes
    ["focus:ring-2", "shadow"],  // Nested arrays flattened
    "hover:bg-blue-600"
  ]
})
```

### Performance Optimization

Built-in optimizations for production use:

```typescript
// LRU cache for processed classes (1000 entries)
// Repeated class combinations are cached for faster processing

// Example: This will hit cache on subsequent uses
const commonClasses = "flex items-center justify-center p-4 rounded-lg shadow"

VStack({ css: commonClasses })  // Processed and cached
HStack({ css: commonClasses })  // Retrieved from cache
```

### Integration with Modifiers

CSS classes work seamlessly with TachUI's modifier system:

```typescript
// CSS classes + modifiers
VStack({
  css: "external-spacing custom-theme",
  children: [...]
})
.modifier
.backgroundColor('#f8f9fa')
.padding(16)
.cornerRadius(8)
.build()

// Class precedence: tachUI classes, CSS classes, then modifiers
// Result: <div class="tachui-vstack external-spacing custom-theme" style="background-color: #f8f9fa; padding: 16px; ...">
```

## Error Handling & Validation

### Development Warnings

TachUI provides helpful warnings in development mode:

```typescript
// Invalid class names (development only)
Text("Content", { css: "my@invalid#class" })
// Warning: Invalid characters in CSS class name. Converted to: "my-invalid-class"

// Duplicate classes (development only)  
Button("Action", { css: "btn btn btn-primary" })
// Warning: Duplicate CSS classes detected: "btn" appears 2 times
```

### Production Behavior

In production builds:
- Warnings are disabled for performance
- Class processing is optimized with caching
- Invalid characters are silently sanitized
- Duplicates are automatically removed

## Configuration Options

### Global Configuration

Configure CSS class processing behavior:

```typescript
import { configureCSSClasses } from '@tachui/core'

configureCSSClasses({
  // Enable/disable class sanitization  
  sanitizeClassNames: true,
  
  // Custom sanitization rules
  sanitizationRules: {
    allowNumbers: true,
    allowUnderscores: true,
    customReplacements: {
      '@': '-at-',
      '#': '-hash-'
    }
  },
  
  // Performance options
  enableCaching: true,
  maxCacheSize: 1000,
  
  // Development warnings
  warnDuplicateClasses: process.env.NODE_ENV === 'development',
  warnInvalidClasses: process.env.NODE_ENV === 'development'
})
```

## TypeScript Support

Full TypeScript integration with IntelliSense:

```typescript
// All components extend CSSClassesProps
interface ButtonProps extends ComponentProps, CSSClassesProps {
  title?: string | Signal<string>
  action?: () => void
  // ... other props
}

// Type-safe CSS class inputs
const classes: string[] = ["btn", "btn-primary"]
const reactiveClasses: Signal<string> = () => `theme-${currentTheme()}`

Button("Typed", { 
  css: classes,        // ✅ Valid
  css: reactiveClasses, // ✅ Valid
  css: 123             // ❌ TypeScript error
})
```

## Best Practices

### 1. Class Organization

```typescript
// ✅ Good: Organize classes by purpose
VStack({
  css: [
    // Layout
    "flex flex-col",
    // Spacing  
    "p-6 gap-4",
    // Appearance
    "bg-white rounded-lg shadow-md",
    // Responsive
    "md:p-8 lg:max-w-2xl"
  ],
  children: [...]
})

// ❌ Avoid: Long unorganized class strings  
VStack({
  css: "flex flex-col p-6 gap-4 bg-white rounded-lg shadow-md md:p-8 lg:max-w-2xl text-gray-800 border border-gray-200",
  children: [...]
})
```

### 2. Reactive Classes

```typescript
// ✅ Good: Use computed for complex logic
const cardClasses = createComputed(() => [
  'card',
  'card-' + size(),
  theme() === 'dark' ? 'card-dark' : 'card-light',
  isHovered() ? 'card-hover' : '',
  isSelected() ? 'card-selected' : ''
].filter(Boolean).join(' '))

VStack({ css: cardClasses })

// ❌ Avoid: Complex inline reactive logic
VStack({
  css: () => 'card card-' + size() + (theme() === 'dark' ? ' card-dark' : ' card-light') + (isHovered() ? ' card-hover' : '') + (isSelected() ? ' card-selected' : '')
})
```

### 3. Framework Compatibility

```typescript
// ✅ Good: Test classes in browser dev tools
VStack({
  css: "bg-blue-500 hover:bg-blue-600", // Verify hover works
  children: [...]
})

// ✅ Good: Use framework-specific patterns
Text("Responsive", { 
  css: "text-sm md:text-base lg:text-lg" // Tailwind responsive
})

Button("Bootstrap", { 
  css: "btn btn-primary btn-lg" // Bootstrap button
})
```

### 4. Performance

```typescript
// ✅ Good: Cache complex class combinations
const cardBaseClasses = "bg-white rounded-lg shadow-md p-6"

// Reuse cached classes
VStack({ css: cardBaseClasses })
HStack({ css: cardBaseClasses })

// ❌ Avoid: Recreating identical class strings
VStack({ css: "bg-white rounded-lg shadow-md p-6" })
HStack({ css: "bg-white rounded-lg shadow-md p-6" })
```

## Migration Guide

### From Plain HTML + CSS

```html
<!-- Before: HTML + CSS -->
<div class="card bg-white rounded-lg shadow-md p-6">
  <h2 class="text-xl font-bold text-gray-800">Title</h2>
  <p class="text-gray-600">Description</p>
  <button class="btn btn-primary mt-4">Action</button>
</div>
```

```typescript
// After: TachUI + CSS Classes
VStack({
  css: "card bg-white rounded-lg shadow-md p-6",
  children: [
    Text("Title", { css: "text-xl font-bold text-gray-800" }),
    Text("Description", { css: "text-gray-600" }),
    Button("Action", { css: "btn btn-primary mt-4" })
  ]
})
```

### From CSS-in-JS

```typescript
// Before: Styled components or CSS-in-JS
const StyledCard = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 24px;
`

// After: TachUI + CSS classes
VStack({
  css: "bg-white rounded-lg shadow-md p-6",
  children: [...]
})
```

## Related APIs

- **[Modifiers API](./modifiers.md)** - TachUI's built-in styling system
- **[Components API](../components/)** - All components support CSS classes
- **[Reactive System](./create-signal.md)** - For reactive CSS class updates

## Framework Guides

- **[CSS Framework Integration Guide](../guide/css-framework-integration.md)** - Complete setup guide for popular CSS frameworks