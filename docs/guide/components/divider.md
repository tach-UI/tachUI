# Divider Component

The Divider component provides clean visual separation between content elements, similar to SwiftUI's Divider. It's a simple but essential component for organizing layouts and improving visual hierarchy.

## Overview

Divider creates a line separator that can be oriented horizontally or vertically, with customizable styling, thickness, color, and spacing options.

## Basic Usage

```typescript
import { Divider, VStack, Text } from '@tachui/core'

function BasicDivider() {
  return VStack({
    children: [
      Text("Section A"),
      Divider(),
      Text("Section B"),
      Divider(),
      Text("Section C")
    ]
  })
}
```

## Orientations

### Horizontal Divider (Default)

```typescript
function HorizontalExample() {
  return VStack({
    children: [
      Text("Above the line"),
      Divider(), // Horizontal by default
      Text("Below the line")
    ]
  })
}
```

### Vertical Divider

```typescript
function VerticalExample() {
  return HStack({
    children: [
      Text("Left side"),
      Divider({ orientation: 'vertical' }),
      Text("Right side")
    ]
  })
}
```

## Customization

### Color and Thickness

```typescript
function StyledDivider() {
  return VStack({
    children: [
      Text("Custom Red Divider"),
      Divider({
        color: '#FF3B30',
        thickness: 2
      }),
      Text("Custom Blue Divider"),
      Divider({
        color: '#007AFF',
        thickness: 3
      })
    ]
  })
}
```

### Length and Margin

```typescript
function SizedDivider() {
  return VStack({
    children: [
      Text("Full width divider"),
      Divider(),
      
      Text("50% width divider"),
      Divider({
        length: '50%',
        margin: 32
      }),
      
      Text("Fixed 200px divider"),
      Divider({
        length: 200,
        margin: 16
      })
    ]
  })
}
```

### Line Styles

```typescript
function StyledLines() {
  return VStack({
    children: [
      Text("Solid Line (default)"),
      Divider({ style: 'solid' }),
      
      Text("Dashed Line"),
      Divider({ 
        style: 'dashed',
        thickness: 2,
        color: '#8E8E93'
      }),
      
      Text("Dotted Line"),
      Divider({ 
        style: 'dotted',
        thickness: 3,
        color: '#FF9500'
      })
    ]
  })
}
```

## Reactive Dividers

```typescript
import { createSignal, createComputed } from '@tachui/core'

function ReactiveDivider() {
  const [isDarkMode, setIsDarkMode] = createSignal(false)
  const [thickness, setThickness] = createSignal(1)
  
  const dividerColor = createComputed(() => 
    isDarkMode() ? '#FFFFFF' : '#000000'
  )
  
  return VStack({
    children: [
      Button(`${isDarkMode() ? 'Light' : 'Dark'} Mode`)
        .onTap(() => setIsDarkMode(!isDarkMode()))
        ,
        
      Divider({
        color: dividerColor, // Reactive color
        thickness: thickness, // Reactive thickness
        opacity: 0.8
      }),
      
      Text("Dynamic divider changes with theme"),
      
      Button("Increase Thickness")
        .onTap(() => setThickness(t => Math.min(t + 1, 5)))
        
    ]
  })
}
```

## Utility Functions

### DividerUtils.thin()

```typescript
function ThinDividers() {
  return VStack({
    children: [
      Text("Thin divider"),
      DividerUtils.thin('#E5E5E5'),
      Text("Another section")
    ]
  })
}
```

### DividerUtils.thick()

```typescript
function ThickDividers() {
  return VStack({
    children: [
      Text("Thick divider"),
      DividerUtils.thick('#007AFF'),
      Text("Another section")
    ]
  })
}
```

### DividerUtils.vertical()

```typescript
function VerticalDividers() {
  return HStack({
    children: [
      Text("Column 1"),
      DividerUtils.vertical(100, 2), // Height: 100px, thickness: 2px
      Text("Column 2"),
      DividerUtils.vertical('50vh'), // 50% viewport height
      Text("Column 3")
    ]
  })
}
```

### DividerUtils.dashed() and DividerUtils.dotted()

```typescript
function StylizedDividers() {
  return VStack({
    children: [
      Text("Dashed divider"),
      DividerUtils.dashed('#FF9500', 2),
      
      Text("Dotted divider"),
      DividerUtils.dotted('#34C759', 3),
      
      Text("Another section")
    ]
  })
}
```

### DividerUtils.subtle() and DividerUtils.prominent()

```typescript
function EmphasisDividers() {
  return VStack({
    children: [
      Text("Subtle divider (low emphasis)"),
      DividerUtils.subtle(),
      
      Text("Normal content"),
      
      Text("Important section"),
      DividerUtils.prominent(), // More prominent visual separation
      
      Text("Important content")
    ]
  })
}
```

## Custom Themes

```typescript
import { DividerStyles } from '@tachui/core'

// Create custom divider theme
const darkTheme = DividerStyles.createTheme({
  colors: {
    default: '#333333',
    light: '#666666',
    medium: '#999999',
    heavy: '#CCCCCC'
  },
  thickness: {
    thin: 0.5,
    medium: 1,
    thick: 2
  },
  spacing: {
    small: 4,
    medium: 8,
    large: 16
  }
})

function ThemedDividers() {
  return VStack({
    children: [
      Text("Custom themed dividers"),
      Divider({
        color: darkTheme.colors.medium,
        thickness: darkTheme.thickness.medium,
        margin: darkTheme.spacing.large
      }),
      Text("Styled with custom theme")
    ]
  })
}
```

## Common Layout Patterns

### Section Separators

```typescript
function SectionLayout() {
  return VStack({
    children: [
      // Header
      VStack({
        children: [
          Text("Settings").fontSize(24).fontWeight('bold'),
          Text("Manage your preferences").fontSize(14).foregroundColor('#8E8E93')
        ]
      }),
      
      DividerUtils.subtle(),
      
      // Account section
      VStack({
        children: [
          Text("Account").fontSize(18).fontWeight('600'),
          Text("Profile settings"),
          Text("Privacy settings"),
          Text("Security settings")
        ]
      }),
      
      Divider({
        color: DividerStyles.colors.primary,
        thickness: 2,
        margin: 24
      }),
      
      // Appearance section
      VStack({
        children: [
          Text("Appearance").fontSize(18).fontWeight('600'),
          Text("Theme settings"),
          Text("Display settings")
        ]
      })
    ]
  })
}
```

### Sidebar Layout

```typescript
function SidebarLayout() {
  return HStack({
    children: [
      // Sidebar
      VStack({
        children: [
          Text("Navigation"),
          Text("Home"),
          Text("Projects"),
          Text("Settings")
        ]
      })
      .minWidth(200)
      .padding(16)
      ,
      
      // Vertical divider between sidebar and content
      DividerUtils.vertical('100vh', 1),
      
      // Main content area
      VStack({
        children: [
          Text("Main Content"),
          Text("Your content goes here...")
        ]
      })
      .flexGrow(1)
      .padding(16)
      
    ]
  })
}
```

### List Item Separators

```typescript
function ListWithDividers() {
  const items = [
    "First Item",
    "Second Item", 
    "Third Item",
    "Fourth Item"
  ]
  
  const children = []
  for (let i = 0; i < items.length; i++) {
    children.push(Text(items[i]))
    
    if (i < items.length - 1) {
      children.push(DividerUtils.subtle())
    }
  }
  
  return VStack({
    children
  })
  .padding(16)
  .backgroundColor('#FFFFFF')
  .cornerRadius(8)
  
}
```

## Accessibility

Dividers are automatically given proper semantic markup for screen readers:

```typescript
// Rendered with proper accessibility attributes
Divider({
  // Automatically gets:
  // role="separator" 
  // aria-orientation="horizontal" or "vertical"
})
```

## Best Practices

### 1. Use Appropriate Thickness

```typescript
// ✅ Good - Subtle for content separation
Divider({ thickness: 1, opacity: 0.6 })

// ✅ Good - Prominent for major section breaks
Divider({ thickness: 2, color: '#007AFF' })

// ❌ Avoid - Too thick for most use cases
Divider({ thickness: 10 })
```

### 2. Consider Visual Hierarchy

```typescript
// ✅ Good - Different emphasis levels
VStack({
  children: [
    Text("Major Section").fontSize(24),
    DividerUtils.prominent(), // Strong separator
    
    Text("Subsection").fontSize(18),
    DividerUtils.subtle(), // Subtle separator
    
    Text("Content...")
  ]
})
```

### 3. Appropriate Margins

```typescript
// ✅ Good - Balanced spacing
Divider({ margin: 16 })

// ✅ Good - Contextual spacing
Divider({ 
  margin: context === 'compact' ? 8 : 24 
})

// ❌ Avoid - No spacing consideration
Divider({ margin: 0 })
```

### 4. Color Coordination

```typescript
// ✅ Good - Coordinated with theme
const theme = {
  background: '#FFFFFF',
  divider: '#E5E5E5',
  text: '#1A1A1A'
}

Divider({
  color: theme.divider,
  margin: 16
})
```

## Performance Considerations

Dividers are lightweight components with minimal performance impact:

- **Static dividers**: No reactive overhead
- **Reactive dividers**: Only update when signals change
- **DOM efficient**: Single element with CSS styling

```typescript
// Efficient reactive divider
const [theme] = createSignal('light')
const dividerColor = createComputed(() => 
  theme() === 'dark' ? '#333' : '#E5E5E5'
)

Divider({ color: dividerColor }) // Only updates when theme changes
```

## API Reference

### DividerProps

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `color` | `string \| Signal<string>` | `'#E5E5E5'` | Divider color |
| `thickness` | `number \| Signal<number>` | `1` | Line thickness in pixels |
| `length` | `number \| string \| Signal<number \| string>` | `'100%'` | Divider length |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Divider orientation |
| `margin` | `number \| Signal<number>` | `16` | Margin around divider |
| `style` | `'solid' \| 'dashed' \| 'dotted'` | `'solid'` | Line style |
| `opacity` | `number \| Signal<number>` | `1` | Opacity level |

### DividerUtils Methods

- `DividerUtils.thin(color?)` - Create thin divider
- `DividerUtils.medium(color?)` - Create medium divider  
- `DividerUtils.thick(color?)` - Create thick divider
- `DividerUtils.vertical(height?, thickness?)` - Create vertical divider
- `DividerUtils.dashed(color?, thickness?)` - Create dashed divider
- `DividerUtils.dotted(color?, thickness?)` - Create dotted divider
- `DividerUtils.subtle()` - Create subtle divider
- `DividerUtils.prominent()` - Create prominent divider

### DividerStyles

- `DividerStyles.theme` - Default divider theme
- `DividerStyles.createTheme(overrides)` - Create custom theme
- `DividerStyles.colors` - Predefined color constants