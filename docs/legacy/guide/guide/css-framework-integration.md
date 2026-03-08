# CSS Framework Integration

Complete guide for integrating TachUI with popular CSS frameworks and design systems. TachUI's `css` property enables seamless integration with any CSS framework while maintaining reactive capabilities and TypeScript support.

## Overview

TachUI components support CSS classes from external frameworks through the universal `css` property:

```typescript
// Any tachUI component can use CSS framework classes
VStack({
  css: "framework-classes go-here",
  children: [...]
})
```

**Supported Frameworks:**
- ✅ **Tailwind CSS** - Utility-first CSS framework
- ✅ **Bootstrap** - Component-based CSS framework  
- ✅ **Bulma** - Modern CSS framework based on Flexbox
- ✅ **Foundation** - Advanced responsive framework
- ✅ **Custom Design Systems** - Your own CSS frameworks and design tokens

## Tailwind CSS Integration

### Setup

1. **Install Tailwind CSS:**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

2. **Configure Tailwind (tailwind.config.js):**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

3. **Add Tailwind directives to your CSS:**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### Usage Patterns

#### Layout & Spacing

```typescript
import { VStack, HStack, Text, Button } from '@tachui/core'

// Flexbox layout with Tailwind
VStack({
  css: "flex flex-col items-center space-y-6 p-8",
  children: [
    Text("Welcome", { css: "text-4xl font-bold text-center" }),
    
    HStack({
      css: "flex flex-row items-center space-x-4",
      children: [
        Button("Get Started", { css: "bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors" }),
        Button("Learn More", { css: "border border-blue-500 text-blue-500 hover:bg-blue-50 px-6 py-2 rounded-lg transition-colors" })
      ]
    })
  ]
})
```

#### Responsive Design

```typescript
// Responsive grid system
VStack({
  css: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4",
  children: cards.map(card => 
    VStack({
      css: "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow",
      children: [
        Text(card.title, { css: "text-xl font-semibold mb-2" }),
        Text(card.content, { css: "text-gray-600 text-sm leading-relaxed" })
      ]
    })
  )
})

// Responsive typography
Text("Responsive Heading", { 
  css: "text-2xl md:text-3xl lg:text-4xl font-bold" 
})
```

#### Component Library with Tailwind

```typescript
// Reusable card component
const TailwindCard = ({ title, content, image }: CardProps) =>
  VStack({
    css: "max-w-sm rounded-lg overflow-hidden shadow-lg bg-white hover:shadow-xl transition-all duration-300",
    children: [
      image && Image({ 
        src: image,
        css: "w-full h-48 object-cover"
      }),
      
      VStack({
        css: "px-6 py-4",
        children: [
          Text(title, { 
            css: "font-bold text-xl mb-2 text-gray-900 line-clamp-2" 
          }),
          Text(content, { 
            css: "text-gray-700 text-base leading-relaxed line-clamp-3" 
          })
        ]
      }),
      
      HStack({
        css: "px-6 pb-4 pt-2 flex justify-end",
        children: [
          Button("Read More", { 
            css: "bg-blue-500 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75" 
          })
        ]
      })
    ]
  })

// Dark mode support
const [darkMode, setDarkMode] = createSignal(false)

VStack({
  css: () => darkMode() 
    ? "min-h-screen bg-gray-900 text-white" 
    : "min-h-screen bg-gray-50 text-gray-900",
  children: [
    Button("Toggle Theme", {
      css: () => darkMode()
        ? "bg-gray-700 hover:bg-gray-600 text-white"
        : "bg-white hover:bg-gray-100 text-gray-900",
      action: () => setDarkMode(!darkMode())
    })
  ]
})
```

## Bootstrap Integration

### Setup

1. **Install Bootstrap:**

```bash
npm install bootstrap
```

2. **Import Bootstrap CSS:**

```typescript
import 'bootstrap/dist/css/bootstrap.min.css'
```

3. **Optional: Import Bootstrap JS for interactive components:**

```typescript
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
```

### Usage Patterns

#### Grid System

```typescript
import { VStack, HStack, Text } from '@tachui/core'

// Bootstrap grid layout
VStack({
  css: "container-fluid",
  children: [
    HStack({
      css: "row",
      children: [
        VStack({
          css: "col-lg-4 col-md-6 col-sm-12",
          children: [
            Text("Column 1", { css: "h3" })
          ]
        }),
        VStack({
          css: "col-lg-4 col-md-6 col-sm-12", 
          children: [
            Text("Column 2", { css: "h3" })
          ]
        }),
        VStack({
          css: "col-lg-4 col-md-12",
          children: [
            Text("Column 3", { css: "h3" })
          ]
        })
      ]
    })
  ]
})
```

#### Bootstrap Components

```typescript
// Bootstrap form
const BootstrapForm = () =>
  Form({
    css: "container mt-4",
    children: [
      Text("Contact Form", { css: "h2 mb-4 text-center" }),
      
      VStack({
        css: "row g-3",
        children: [
          // Name fields
          VStack({
            css: "col-md-6",
            children: [
              Text("First Name", { css: "form-label" }),
              TextField({
                placeholder: "Enter first name",
                css: "form-control"
              })
            ]
          }),
          
          VStack({
            css: "col-md-6",
            children: [
              Text("Last Name", { css: "form-label" }),
              TextField({
                placeholder: "Enter last name",
                css: "form-control"
              })
            ]
          }),
          
          // Email field
          VStack({
            css: "col-12",
            children: [
              Text("Email", { css: "form-label" }),
              TextField({
                type: "email",
                placeholder: "name@example.com",
                css: "form-control"
              })
            ]
          }),
          
          // Submit button
          VStack({
            css: "col-12 text-center",
            children: [
              Button("Submit Form", { 
                css: "btn btn-primary btn-lg px-5" 
              })
            ]
          })
        ]
      })
    ]
  })

// Bootstrap alerts
Alert({
  title: "Success!",
  message: "Your form has been submitted successfully.",
  css: "alert alert-success alert-dismissible"
})

// Bootstrap buttons
HStack({
  css: "d-flex gap-2 justify-content-center",
  children: [
    Button("Primary", { css: "btn btn-primary" }),
    Button("Secondary", { css: "btn btn-secondary" }),
    Button("Success", { css: "btn btn-success" }),
    Button("Danger", { css: "btn btn-danger btn-outline" })
  ]
})
```

#### Bootstrap Navigation

```typescript
// Bootstrap navbar
const BootstrapNavbar = () =>
  HStack({
    css: "navbar navbar-expand-lg navbar-dark bg-dark",
    children: [
      VStack({
        css: "container-fluid",
        children: [
          Link({
            destination: "/",
            css: "navbar-brand fw-bold",
            children: [Text("MyApp")]
          }),
          
          HStack({
            css: "navbar-nav ms-auto",
            children: [
              Link({
                destination: "/home",
                css: "nav-link",
                children: [Text("Home")]
              }),
              Link({
                destination: "/about",
                css: "nav-link", 
                children: [Text("About")]
              }),
              Link({
                destination: "/contact",
                css: "nav-link",
                children: [Text("Contact")]
              })
            ]
          })
        ]
      })
    ]
  })
```

## Bulma Integration

### Setup

```bash
npm install bulma
```

```typescript
import 'bulma/css/bulma.min.css'
```

### Usage Examples

```typescript
// Bulma hero section
VStack({
  css: "hero is-primary is-fullheight",
  children: [
    VStack({
      css: "hero-body",
      children: [
        VStack({
          css: "container has-text-centered",
          children: [
            Text("Welcome", { css: "title is-1" }),
            Text("Beautiful web interfaces", { css: "subtitle is-3" }),
            Button("Get Started", { css: "button is-white is-large" })
          ]
        })
      ]
    })
  ]
})

// Bulma columns
HStack({
  css: "columns is-multiline",
  children: [
    VStack({
      css: "column is-one-third",
      children: [
        VStack({
          css: "card",
          children: [
            VStack({
              css: "card-content",
              children: [
                Text("Card Title", { css: "title is-4" }),
                Text("Card content here", { css: "content" })
              ]
            })
          ]
        })
      ]
    })
  ]
})
```

## Custom Design Systems

### Design Token Integration

```typescript
// CSS Custom Properties / Design Tokens
VStack({
  css: "design-system-container",
  children: [
    Text("Heading", { css: "ds-heading-primary" }),
    Text("Content", { css: "ds-body-text" }),
    Button("Action", { css: "ds-button ds-button--primary" })
  ]
})
```

```css
/* design-system.css */
:root {
  /* Spacing tokens */
  --ds-space-xs: 0.25rem;
  --ds-space-sm: 0.5rem;
  --ds-space-md: 1rem;
  --ds-space-lg: 1.5rem;
  --ds-space-xl: 2rem;
  
  /* Color tokens */
  --ds-color-primary: #007bff;
  --ds-color-secondary: #6c757d;
  --ds-color-success: #28a745;
  
  /* Typography tokens */
  --ds-font-size-sm: 0.875rem;
  --ds-font-size-base: 1rem;
  --ds-font-size-lg: 1.125rem;
  --ds-font-size-xl: 1.25rem;
}

.design-system-container {
  background: var(--ds-color-surface);
  padding: var(--ds-space-lg);
  border-radius: var(--ds-radius-md);
}

.ds-heading-primary {
  font-size: var(--ds-font-size-xl);
  font-weight: 600;
  color: var(--ds-color-primary);
  margin-bottom: var(--ds-space-md);
}

.ds-body-text {
  font-size: var(--ds-font-size-base);
  line-height: 1.5;
  color: var(--ds-color-text-secondary);
}

.ds-button {
  padding: var(--ds-space-sm) var(--ds-space-md);
  border-radius: var(--ds-radius-sm);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ds-button--primary {
  background: var(--ds-color-primary);
  color: white;
}

.ds-button--primary:hover {
  background: var(--ds-color-primary-dark);
  transform: translateY(-1px);
}
```

### Component Library Pattern

```typescript
// Reusable design system components
export const DSCard = ({ title, content, actions }: DSCardProps) =>
  VStack({
    css: "ds-card ds-elevation-2",
    children: [
      title && Text(title, { css: "ds-card__title" }),
      content && Text(content, { css: "ds-card__content" }),
      actions && HStack({
        css: "ds-card__actions",
        children: actions
      })
    ]
  })

export const DSButton = ({ variant = 'primary', size = 'medium', children, ...props }: DSButtonProps) =>
  Button({
    ...props,
    css: `ds-button ds-button--${variant} ds-button--${size}`,
    children
  })

// Usage
DSCard({
  title: "Feature Card",
  content: "This card uses our design system tokens.",
  actions: [
    DSButton({ variant: 'primary', children: [Text("Primary")] }),
    DSButton({ variant: 'secondary', children: [Text("Secondary")] })
  ]
})
```

## Reactive CSS Integration

### Theme Switching

```typescript
import { createSignal, createContext, useContext } from '@tachui/core'

// Theme context
const ThemeContext = createContext<{
  theme: () => 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
}>()

const ThemeProvider = ({ children }: { children: ComponentInstance[] }) => {
  const [theme, setTheme] = createSignal<'light' | 'dark'>('light')
  
  return VStack({
    css: () => `app-container theme-${theme()}`,
    children: [
      ThemeContext.Provider({
        value: { theme, setTheme },
        children
      })
    ]
  })
}

// Component using theme
const ThemedComponent = () => {
  const { theme, setTheme } = useContext(ThemeContext)!
  
  return VStack({
    css: () => [
      'themed-component',
      theme() === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800',
      'transition-colors duration-300'
    ],
    children: [
      Text("Current Theme", { 
        css: () => theme() === 'dark' ? 'text-gray-200' : 'text-gray-700'
      }),
      Button("Toggle Theme", {
        css: () => theme() === 'dark' 
          ? 'bg-gray-700 hover:bg-gray-600 text-white' 
          : 'bg-gray-200 hover:bg-gray-300 text-gray-800',
        action: () => setTheme(theme() === 'light' ? 'dark' : 'light')
      })
    ]
  })
}
```

### Responsive State

```typescript
import { createSignal, createEffect } from '@tachui/core'

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = createSignal<'sm' | 'md' | 'lg' | 'xl'>('md')
  
  createEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width < 640) setBreakpoint('sm')
      else if (width < 768) setBreakpoint('md')
      else if (width < 1024) setBreakpoint('lg')
      else setBreakpoint('xl')
    }
    
    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  })
  
  return breakpoint
}

// Responsive component
const ResponsiveCard = () => {
  const breakpoint = useBreakpoint()
  
  return VStack({
    css: () => [
      'card',
      breakpoint() === 'sm' ? 'p-4 text-sm' : 
      breakpoint() === 'md' ? 'p-6 text-base' :
      breakpoint() === 'lg' ? 'p-8 text-lg' : 'p-10 text-xl',
      'transition-all duration-300'
    ],
    children: [
      Text(() => `Current breakpoint: ${breakpoint()}`)
    ]
  })
}
```

## Best Practices

### 1. Performance Optimization

```typescript
// ✅ Good: Cache common class combinations
const cardClasses = "bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"

VStack({ css: cardClasses })
HStack({ css: cardClasses })

// ✅ Good: Use computed for complex reactive classes
const dynamicClasses = createComputed(() => [
  'base-classes',
  condition1() ? 'conditional-class-1' : '',
  condition2() ? 'conditional-class-2' : 'fallback-class'
].filter(Boolean).join(' '))
```

### 2. Accessibility

```typescript
// ✅ Good: Include accessibility classes
Button("Submit", { 
  css: "btn btn-primary focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" 
})

Text("Important Notice", { 
  css: "text-red-600 font-semibold" 
  // screenReader: "Critical alert: Important notice" // TachUI accessibility
})
```

### 3. CSS Framework Compatibility

```typescript
// ✅ Good: Test framework-specific features
VStack({
  css: "hover:scale-105 transition-transform", // Tailwind hover + transform
  children: [...]
})

Button("Bootstrap", { 
  css: "btn btn-primary btn-lg", // Bootstrap size variants
  // TachUI will preserve Bootstrap's button behavior
})
```

### 4. Debugging

```typescript
// Development: Use data attributes for debugging
VStack({
  css: process.env.NODE_ENV === 'development' 
    ? "debug-container bg-red-100 border-2 border-red-500" 
    : "production-container",
  children: [...]
})
```

## Troubleshooting

### Common Issues

1. **CSS Classes Not Applying:**
   ```typescript
   // ❌ Problem: Incorrect property name
   VStack({ className: "my-class" }) // Wrong!
   
   // ✅ Solution: Use css
   VStack({ css: "my-class" }) // Correct!
   ```

2. **Framework Styles Not Working:**
   ```typescript
   // Make sure CSS framework is imported before components
   import 'tailwindcss/tailwind.css'
   import { VStack } from '@tachui/core'
   ```

3. **Reactive Classes Not Updating:**
   ```typescript
   // ❌ Problem: Not using signal correctly
   VStack({ css: theme === 'dark' ? 'dark' : 'light' })
   
   // ✅ Solution: Use signal function
   VStack({ css: () => theme() === 'dark' ? 'dark' : 'light' })
   ```

### Debug Mode

Enable CSS class debugging in development:

```typescript
import { configureCSSClasses } from '@tachui/core'

configureCSSClasses({
  warnDuplicateClasses: true,
  warnInvalidClasses: true,
  // Logs all processed classes to console
  enableDebugLogging: process.env.NODE_ENV === 'development'
})
```

## Examples & Templates

### Complete App Examples

See the [examples directory](../examples/) for complete applications demonstrating CSS framework integration:

- **[CSS Framework Examples](../examples/css-framework-examples.md)** - Practical examples with Tailwind CSS, Bootstrap, and custom design systems

## Related Documentation

- **[CSS Classes API Reference](../api/css-classes.md)** - Complete API documentation
- **[Component Reference](../components/)** - All components support CSS classes
- **[Modifiers API](../api/modifiers.md)** - TachUI's built-in styling system