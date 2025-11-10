# Spacer Component

Flexible space component that expands to fill available space in layout containers, providing SwiftUI-style flexible layouts.

## Overview

The Spacer component creates flexible space that expands to fill available room in its parent container. It's essential for:

- **Pushing content apart** in HStack and VStack layouts
- **Center alignment** by using spacers on both sides
- **Responsive spacing** that adapts to container size
- **Toolbar layouts** with flexible spacing between elements

## Basic Usage

```typescript
import { Spacer, HStack, Button } from '@tachui/core'

// Push buttons to opposite ends
HStack({
  children: [
    Button("Cancel"),
    Spacer(), // Fills remaining space
    Button("OK")
  ]
})
```

## Props

```typescript
interface SpacerProps {
  minLength?: number
  debugLabel?: string
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minLength` | `number` | `0` | Minimum space in pixels |
| `debugLabel` | `string` | - | Debug identifier for development |

## Layout Behavior

### In HStack (Horizontal Layout)

```typescript
import { HStack, Button, Text, Spacer } from '@tachui/core'

// Navigation bar layout
HStack({
  children: [
    Button("Back"),           // Left side
    Spacer(),                 // Flexible space
    Text("Page Title"),       // Center
    Spacer(),                 // Flexible space  
    Button("More")            // Right side
  ]
})
```

### In VStack (Vertical Layout)

```typescript
import { VStack, Text, Button, Spacer } from '@tachui/core'

// Card with footer at bottom
VStack({
  children: [
    Text("Card Title")
      .modifier
      .font({ size: 18, weight: 'bold' })
      .build(),
    
    Text("Card content goes here..."),
    
    Spacer(), // Pushes footer to bottom
    
    Button("Action")
  ]
})
.modifier
.height(300)
.padding(16)
.build()
```

## Common Patterns

### Toolbar Layout

Create flexible toolbars with consistent spacing:

```typescript
import { HStack, Button, Text, Spacer } from '@tachui/core'

const Toolbar = () =>
  HStack({
    children: [
      // Left group
      Button("Save"),
      Button("Export"),
      
      Spacer(), // Flexible space
      
      // Center title
      Text("Document.txt")
        .modifier
        .font({ weight: 'bold' })
        .build(),
      
      Spacer(), // Flexible space
      
      // Right group
      Button("Share"),
      Button("Settings")
    ],
    spacing: 8
  })
  .modifier
  .padding({ horizontal: 16, vertical: 8 })
  .backgroundColor('white')
  .border({ bottom: { width: 1, color: '#e0e0e0' } })
  .build()
```

### Center Content

Center content vertically and horizontally:

```typescript
import { VStack, HStack, Text, Spacer } from '@tachui/core'

const CenteredLayout = () =>
  VStack({
    children: [
      Spacer(), // Top flexible space
      
      HStack({
        children: [
          Spacer(), // Left flexible space
          
          Text("Perfectly Centered")
            .modifier
            .font({ size: 24, weight: 'bold' })
            .build(),
          
          Spacer()  // Right flexible space
        ]
      }),
      
      Spacer()   // Bottom flexible space
    ]
  })
  .modifier
  .css({ minHeight: '100vh' })
  .build()
```

### Modal Footer

Create modal dialogs with actions at the bottom:

```typescript
import { VStack, HStack, Text, Button, Spacer } from '@tachui/core'

const Modal = ({ title, content }: { title: string, content: string }) =>
  VStack({
    children: [
      // Header
      Text(title)
        .modifier
        .font({ size: 20, weight: 'bold' })
        .build(),
      
      // Content
      Text(content)
        .modifier
        .padding({ vertical: 16 })
        .build(),
      
      Spacer(), // Push buttons to bottom
      
      // Actions
      HStack({
        children: [
          Spacer(), // Push buttons to right
          Button("Cancel"),
          Button("Confirm")
        ],
        spacing: 12
      })
    ]
  })
  .modifier
  .width(400)
  .height(300)
  .padding(24)
  .backgroundColor('white')
  .cornerRadius(12)
  .shadow({ x: 0, y: 8, blur: 24, color: 'rgba(0,0,0,0.15)' })
  .build()
```

### Sidebar Layout

Create responsive sidebar layouts:

```typescript
import { HStack, VStack, Button, Text, Spacer } from '@tachui/core'

const AppLayout = () =>
  HStack({
    children: [
      // Sidebar
      VStack({
        children: [
          Text("Navigation")
            .modifier
            .font({ size: 18, weight: 'bold' })
            .build(),
          
          Button("Dashboard"),
          Button("Projects"),
          Button("Team"),
          Button("Analytics"),
          
          Spacer(), // Push footer items to bottom
          
          Button("Settings"),
          Button("Logout")
        ],
        spacing: 8
      })
      .modifier
      .width(200)
      .padding(16)
      .backgroundColor('#f5f5f5')
      .css({ minHeight: '100vh' })
      .build(),
      
      // Main content area
      VStack({
        children: [
          Text("Main Content Area")
            .modifier
            .font({ size: 24, weight: 'bold' })
            .build()
        ]
      })
      .modifier
      .padding(24)
      .flexGrow(1) // Takes remaining space
      .build()
    ]
  })
```

## Minimum Length

Set minimum space requirements:

```typescript
import { HStack, Button, Spacer } from '@tachui/core'

// Ensure minimum 20px space even in constrained layouts
HStack({
  children: [
    Button("Very Long Button Text"),
    Spacer({ minLength: 20 }), // At least 20px space
    Button("Another Button")
  ]
})
.modifier
.width(300) // Constrained width
.build()
```

## Responsive Spacers

Create responsive layouts that adapt to screen size:

```typescript
import { VStack, HStack, Text, Button, Spacer } from '@tachui/core'

const ResponsiveCard = () => {
  const [isMobile, setMobile] = createSignal(window.innerWidth < 768)
  
  createEffect(() => {
    const checkSize = () => setMobile(window.innerWidth < 768)
    window.addEventListener('resize', checkSize)
    return () => window.removeEventListener('resize', checkSize)
  })
  
  return isMobile() ? 
    // Mobile: Stack vertically
    VStack({
      children: [
        Text("Mobile Layout"),
        Text("Content stacked vertically"),
        Spacer({ minLength: 16 }),
        Button("Action")
      ]
    }) :
    // Desktop: Horizontal layout
    HStack({
      children: [
        Text("Desktop Layout"),
        Spacer(),
        Text("Content spread horizontally"),
        Spacer(),
        Button("Action")
      ]
    })
}
```

## Multiple Spacers

Use multiple spacers for proportional spacing:

```typescript
import { HStack, Button, Text, Spacer } from '@tachui/core'

// Three sections with proportional spacing
HStack({
  children: [
    Button("Section 1"),
    
    Spacer(), // 1 part of space
    
    Text("Section 2")
      .modifier
      .textAlign('center')
      .build(),
    
    Spacer(), // 1 part of space (equal to first)
    
    Button("Section 3")
  ]
})
```

## Integration with Other Components

### Form Layouts

```typescript
import { VStack, HStack, TextField, Button, Spacer } from '@tachui/core'

const ContactForm = () =>
  VStack({
    children: [
      TextField({ placeholder: "Name" }),
      TextField({ placeholder: "Email" }),
      TextField({ placeholder: "Message", multiline: true }),
      
      Spacer({ minLength: 16 }), // Minimum spacing before actions
      
      HStack({
        children: [
          Button("Clear"),
          Spacer(), // Push submit to right
          Button("Submit")
        ]
      })
    ],
    spacing: 12
  })
  .modifier
  .padding(20)
  .maxWidth(400)
  .build()
```

### List Item Layouts

```typescript
import { HStack, VStack, Text, Button, Spacer } from '@tachui/core'

const ListItem = ({ title, subtitle, action }: {
  title: string
  subtitle: string  
  action: () => void
}) =>
  HStack({
    children: [
      VStack({
        children: [
          Text(title)
            .modifier
            .font({ weight: 'bold' })
            .build(),
          Text(subtitle)
            .modifier
            .opacity(0.7)
            .font({ size: 14 })
            .build()
        ],
        spacing: 4,
        alignment: 'leading'
      }),
      
      Spacer(), // Flexible space between content and action
      
      Button("Edit", action)
        .modifier
        .backgroundColor('#4F46E5')
        .foregroundColor('white')
        .cornerRadius(6)
        .padding({ horizontal: 12, vertical: 6 })
        .build()
    ],
    alignment: 'center'
  })
  .modifier
  .padding(16)
  .backgroundColor('white')
  .cornerRadius(8)
  .border({ width: 1, color: '#e0e0e0' })
  .build()
```

## Best Practices

### Performance

```typescript
// ✅ Good - Use Spacer for flexible layouts
HStack({
  children: [
    Text("Start"),
    Spacer(), // Efficient flexible space
    Text("End")
  ]
})

// ❌ Avoid - Manual width calculations
HStack({
  children: [
    Text("Start"),
    VStack().width(200).build(), // Fixed width, not flexible
    Text("End")
  ]
})
```

### Semantic Layout

```typescript
// ✅ Good - Clear layout intention
HStack({
  children: [
    Text("Logo"),
    Spacer(), // Clearly separates logo from nav
    HStack({ children: navItems })
  ]
})

// ❌ Avoid - Excessive spacers
HStack({
  children: [
    Spacer(), Spacer(), Text("Confusing"), Spacer(), Spacer()
  ]
})
```

### Accessibility

```typescript
// Spacers don't affect accessibility directly, but help create
// clear visual hierarchy

HStack({
  children: [
    Text("Main Content"),
    Spacer(), // Creates clear visual separation
    Button("Secondary Action")
      .modifier
      .aria({ label: "Secondary action button" })
      .build()
  ]
})
```

## Debugging

Use debug labels to identify spacers during development:

```typescript
import { HStack, Text, Spacer } from '@tachui/core'

HStack({
  children: [
    Text("Left"),
    Spacer({ 
      debugLabel: "main-spacer" // Helps identify in dev tools
    }),
    Text("Right")
  ]
})
```

## See Also

- **[Layout Components](/components/layout)** - HStack, VStack, ZStack
- **[Layout Guide](/guide/layout)** - Layout principles and patterns
- **[Responsive Design](/guide/responsive-design)** - Adaptive layouts
- **[Flexbox Modifiers](/api/modifiers#flexbox-modifiers)** - Fine-grained layout control