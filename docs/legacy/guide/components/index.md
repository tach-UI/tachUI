# TachUI Components

Complete reference for all TachUI components. Each component provides SwiftUI-compatible APIs with web-optimized implementations.

## Window Management

Multi-platform window and scene management:

- **[App](./app.md)** - Application container for window management
- **[Window](./window.md)** - Single-instance windows (settings, about dialogs)
- **[WindowGroup](./windowgroup.md)** - Multi-instance window management (documents)

## User Interface

Interactive components for user interface:

- **[Text](./text.md)** - Typography component with reactive content and extensive styling
- **[Button](./button.md)** - Interactive buttons with press states and variants
- **[Image](./image.md)** - 🖼️ **NEW**: Image display with loading states, content modes, and lazy loading
- **[Symbol](../symbols/index.md)** - SwiftUI-inspired icon system with animations and rendering modes
- **[Alert](./alert.md)** - Modal dialogs with backdrop and animations (from `@tachui/mobile-patterns`)
- **[ActionSheet](./actionsheet.md)** - Mobile-style action selection (from `@tachui/mobile-patterns`)
- **[Menu](./menu.md)** - Dropdown menus with keyboard navigation
- **[DatePicker](./datepicker.md)** - Date and time selection (from `@tachui/advanced-forms`)
- **[Stepper](./stepper.md)** - Numeric input with increment/decrement (from `@tachui/advanced-forms`)

## Dynamic Rendering

Components for conditional and list rendering:

- **[Show](./show.md)** - Reactive conditional rendering with fallback support
- **[ForEach](./foreach.md)** - Efficient list rendering with automatic updates
- **[For](./for.md)** - SolidJS-compatible list rendering syntax

## Input Components

Components for collecting user input:

- **[BasicInput](./basicinput.md)** - Lightweight text input for Core-only applications

## Layout & Structure

Core layout components for organizing content:

- **[Layout Components](./layout.md)** - 📐 **NEW**: VStack, HStack, ZStack - fundamental layout containers
- **[Grid Components](./grid.md)** - 🔲 **NEW**: SwiftUI-style Grid, LazyVGrid, LazyHGrid with CSS Grid performance
- **[Spacer](./spacer.md)** - 🫧 **NEW**: Flexible space component for layout spacing

## Navigation & Routing

Components for organizing and navigating content:

- **[NavigationStack](./navigation-stack.md)** - SwiftUI-compatible stack navigation
- **[NavigationLink](./navigation-link.md)** - Declarative navigation links  
- **[SimpleTabView](./simple-tab-view.md)** - SwiftUI-compatible tab navigation
- **[Divider](./divider.md)** - Visual separators with styling options
- **[Link](./link.md)** - Web-specific navigation links

## Component Categories

### Window Management
Window management components provide SwiftUI-style multi-window support:

```typescript
// App container
const MyApp = App({
  children: [
    Window({ id: 'main', ... }),
    WindowGroup({ id: 'documents', for: Document, ... })
  ]
})

// Single window
const SettingsWindow = Window({
  id: 'settings',
  title: 'Settings',
  modal: true,
  children: () => SettingsView()
})

// Document windows
const DocumentWindows = WindowGroup({
  id: 'text-editor',
  for: TextDocument,
  children: (doc) => TextEditor({ document: doc })
})
```

### Interactive Components
Components that respond to user interaction:

```typescript
import { Alert, ActionSheet } from '@tachui/mobile-patterns'

// Alert dialog
Alert({
  title: 'Confirmation',
  message: 'Are you sure?',
  primaryButton: { title: 'Yes', action: confirm },
  secondaryButton: { title: 'Cancel', role: 'cancel' }
})

// Action sheet
ActionSheet({
  title: 'Choose Action',
  actions: [
    { title: 'Edit', action: editItem },
    { title: 'Delete', action: deleteItem, destructive: true }
  ]
})

// Date picker
DatePicker({
  selection: selectedDate,
  displayedComponents: [.date, .hourAndMinute]
})

// Basic text input
const [text, setText] = createSignal('')
BasicInput({
  text,
  setText,
  placeholder: 'Enter your name...',
  onChange: (value) => console.log('Input changed:', value),
  onSubmit: (value) => handleSubmit(value)
})
```

### Navigation Components
Components for organizing and navigating content:

```typescript
// Menu with items
Menu({
  title: 'Options',
  children: [
    MenuButton({ title: 'New File', action: createFile }),
    MenuButton({ title: 'Open...', action: openFile }),
    Divider(),
    MenuButton({ title: 'Quit', action: quit })
  ]
})

// Navigation link
Link({
  destination: '/profile',
  children: [Text({ content: 'View Profile' })]
})
```

## Platform Adaptations

TachUI components automatically adapt to different platforms:

### Desktop (Electron)
- Native window management
- Desktop-style menus and dialogs
- Keyboard shortcuts and accelerators

### Web Browser
- Modal overlays and popups
- Responsive design patterns
- Web accessibility standards

### Mobile
- Touch-optimized interactions
- Sheet presentations and action sheets
- Gesture-based navigation

## Usage Patterns

### Modal Dialogs

```typescript
// Settings modal
const showSettings = async () => {
  await openWindow('settings', SettingsView(), {
    modal: true,
    width: 500,
    height: 400
  })
}

// Confirmation alert
const confirmDelete = () => {
  Alert({
    title: 'Delete Item',
    message: 'This action cannot be undone.',
    primaryButton: { 
      title: 'Delete', 
      action: deleteItem,
      role: 'destructive' 
    },
    secondaryButton: { 
      title: 'Cancel', 
      role: 'cancel' 
    }
  })
}
```

### Document Management

```typescript
// Document-based app
const DocumentApp = App({
  children: [
    WindowGroup({
      id: 'textDocument',
      for: TextDocument,
      children: (doc) => TextEditor({ document: doc })
    }),
    
    Window({
      id: 'browser',
      title: 'Document Browser',
      children: () => DocumentBrowser()
    })
  ]
})

// Open document
await DocumentApp.openScene('textDocument', myDocument)
```

### Utility Windows

```typescript
// Inspector palette
const InspectorWindow = Window({
  id: 'inspector',
  title: 'Inspector',
  width: 300,
  height: 500,
  alwaysOnTop: true,
  children: () => PropertyInspector()
})

// Tool palette
const ToolPalette = Window({
  id: 'tools',
  title: 'Tools',
  width: 250,
  height: 400,
  alwaysOnTop: true,
  children: () => ToolSelector()
})
```

## Best Practices

### 1. Choose Appropriate Components

- Use `Window` for singleton windows (settings, about)
- Use `WindowGroup` for document-based applications
- Use `Alert` for simple confirmations
- Use `ActionSheet` for action selection on mobile

### 2. Handle Platform Differences

```typescript
import { PlatformUtils } from '@tachui/core/viewport'

if (PlatformUtils.isMobile()) {
  // Use ActionSheet
  ActionSheet({ ... })
} else {
  // Use Menu
  Menu({ ... })
}
```

### 3. Manage Component Lifecycle

```typescript
// Clean up resources
useEffect(() => {
  const cleanup = () => {
    // Dispose of heavy components
  }
  
  return cleanup
})
```

### 4. Optimize Performance

```typescript
// Lazy load heavy components
const LazyEditor = lazy(() => import('./HeavyTextEditor'))

Window({
  id: 'editor',
  children: () => LazyEditor()
})
```

## Component Development

Creating custom components that integrate with TachUI:

```typescript
// Custom component with TachUI integration
function MyCustomComponent(props: MyProps) {
  const openWindow = useOpenWindow()
  const viewportInfo = useViewportInfo()
  
  // Adapt to platform
  if (viewportInfo.platform === 'mobile') {
    return MobileVersion(props)
  }
  
  return DesktopVersion(props)
}
```

## Related Guides

- [Viewport Management Guide](../guide/viewport-management.md) - Complete window management system
- [Component Development](../guide/components.md) - Creating custom components
- [State Management](../guide/state-management.md) - Managing component state
- [Performance Guide](../guide/performance.md) - Optimizing component performance