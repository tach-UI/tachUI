# Window

The `Window` component creates single, unique windows that prevent duplicates. This is perfect for singleton windows like settings, about dialogs, or main application windows.

## Basic Usage

```typescript
import { Window } from '@tachui/core/viewport'

const SettingsWindow = Window({
  id: 'settings',
  title: 'Settings',
  children: () => SettingsPanel(),
  width: 600,
  height: 400,
  resizable: false
})
```

## API Reference

### Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the window |
| `title` | string | No | Window title |
| `children` | Function | Yes | Component factory function |
| `width` | number | No | Window width in pixels (default: 800) |
| `height` | number | No | Window height in pixels (default: 600) |
| `x` | number | No | Initial X position |
| `y` | number | No | Initial Y position |
| `resizable` | boolean | No | Whether window can be resized (default: true) |
| `minimizable` | boolean | No | Whether window can be minimized (default: true) |
| `maximizable` | boolean | No | Whether window can be maximized (default: true) |
| `modal` | boolean | No | Whether window is modal (default: false) |
| `alwaysOnTop` | boolean | No | Whether window stays above others (default: false) |

### Methods

The Window component returns an object with these methods:

```typescript
interface WindowSceneComponent {
  // Open this window
  open(): Promise<void>
  
  // Close this window
  close(): Promise<void>
  
  // Render method for integration
  render(): ComponentInstance
}
```

## Examples

### Settings Window

```typescript
import { Window, useOpenWindow, useDismissWindow } from '@tachui/core/viewport'
import { VStack, Text, Toggle, Button } from '@tachui/core'

function SettingsPanel() {
  const [darkMode, setDarkMode] = createSignal(false)
  const [notifications, setNotifications] = createSignal(true)
  const dismissWindow = useDismissWindow()
  
  const handleSave = () => {
    // Save settings logic
    localStorage.setItem('darkMode', darkMode().toString())
    localStorage.setItem('notifications', notifications().toString())
    
    // Close window
    dismissWindow('settings')
  }
  
  return VStack({
    padding: 20,
    spacing: 16,
    children: [
      Text({ 
        content: 'Application Settings',
        fontSize: 18,
        fontWeight: 'bold'
      }),
      
      Toggle({
        title: 'Dark Mode',
        isOn: darkMode,
        onChange: setDarkMode
      }),
      
      Toggle({
        title: 'Enable Notifications',
        isOn: notifications,
        onChange: setNotifications
      }),
      
      HStack({
        spacing: 12,
        children: [
          Button({
            title: 'Cancel',
            action: () => dismissWindow('settings')
          }),
          Button({
            title: 'Save',
            action: handleSave,
            variant: 'primary'
          })
        ]
      })
    ]
  })
}

// Create the settings window
const SettingsWindow = Window({
  id: 'settings',
  title: 'Settings',
  width: 500,
  height: 350,
  resizable: false,
  modal: true,
  children: () => SettingsPanel()
})

// Usage in main app
function MainApp() {
  const openWindow = useOpenWindow()
  
  return VStack({
    children: [
      Button({
        title: 'Open Settings',
        action: () => openWindow('settings', SettingsPanel(), {
          width: 500,
          height: 350,
          modal: true
        })
      })
    ]
  })
}
```

### About Dialog

```typescript
function AboutDialog() {
  const dismissWindow = useDismissWindow()
  
  return VStack({
    padding: 24,
    spacing: 16,
    alignment: 'center',
    children: [
      Image({
        src: '/app-icon.png',
        width: 64,
        height: 64
      }),
      
      Text({
        content: 'My Application',
        fontSize: 20,
        fontWeight: 'bold'
      }),
      
      Text({
        content: 'Version 1.0.0',
        fontSize: 14,
        opacity: 0.7
      }),
      
      Text({
        content: 'Built with TachUI Framework',
        fontSize: 12,
        opacity: 0.5
      }),
      
      Button({
        title: 'Close',
        action: () => dismissWindow('about'),
        variant: 'primary'
      })
    ]
  })
}

const AboutWindow = Window({
  id: 'about',
  title: 'About My App',
  width: 400,
  height: 300,
  resizable: false,
  modal: true,
  children: () => AboutDialog()
})
```

### Utility Window (Inspector)

```typescript
function InspectorPanel() {
  const [selectedElement, setSelectedElement] = createSignal(null)
  const [properties, setProperties] = createSignal({})
  
  return VStack({
    padding: 12,
    spacing: 8,
    children: [
      Text({
        content: 'Inspector',
        fontSize: 14,
        fontWeight: 'bold'
      }),
      
      ScrollView({
        children: [
          // Property editor
          ...Object.entries(properties()).map(([key, value]) =>
            HStack({
              children: [
                Text({ content: key, fontSize: 12 }),
                TextField({ 
                  value: () => value,
                  onChange: (newValue) => {
                    setProperties(prev => ({
                      ...prev,
                      [key]: newValue
                    }))
                  }
                })
              ]
            })
          )
        ]
      })
    ]
  })
}

const InspectorWindow = Window({
  id: 'inspector',
  title: 'Inspector',
  width: 280,
  height: 400,
  resizable: true,
  alwaysOnTop: true,
  children: () => InspectorPanel()
})
```

## Integration with App

Window components are used within App components to define your application's window structure:

```typescript
import { App, Window, WindowGroup } from '@tachui/core/viewport'

const MyApp = App({
  children: [
    // Main application window
    Window({
      id: 'main',
      title: 'My Application',
      children: () => MainApplicationView()
    }),
    
    // Settings window
    Window({
      id: 'settings',
      title: 'Settings',
      children: () => SettingsPanel(),
      modal: true
    }),
    
    // About dialog
    Window({
      id: 'about',
      title: 'About',
      children: () => AboutDialog(),
      modal: true
    }),
    
    // Document windows (multiple instances)
    WindowGroup({
      id: 'documents',
      title: 'Document',
      for: Document,
      children: (doc) => DocumentEditor({ document: doc })
    })
  ]
})
```

## Opening Windows

### Using Hooks

```typescript
import { useOpenWindow } from '@tachui/core/viewport'

function MenuBar() {
  const openWindow = useOpenWindow()
  
  const handleOpenSettings = () => {
    openWindow('settings', SettingsPanel(), {
      width: 500,
      height: 400,
      modal: true
    })
  }
  
  const handleOpenAbout = () => {
    openWindow('about', AboutDialog(), {
      width: 350,
      height: 250,
      modal: true
    })
  }
  
  return HStack({
    children: [
      Button({ title: 'Settings', action: handleOpenSettings }),
      Button({ title: 'About', action: handleOpenAbout })
    ]
  })
}
```

### Direct Window Methods

```typescript
// Open window directly
await SettingsWindow.open()

// Close window directly
await SettingsWindow.close()
```

### Environment Values

```typescript
import { useViewportEnvironment } from '@tachui/core/viewport'

function MyComponent() {
  const { openWindow, dismissWindow } = useViewportEnvironment()
  
  return Button({
    title: 'Toggle Settings',
    action: async () => {
      const manager = useViewportManager()
      const existing = manager.getWindow('settings')
      
      if (existing) {
        await dismissWindow('settings')
      } else {
        await openWindow('settings', SettingsPanel())
      }
    }
  })
}
```

## Window Configurations

TachUI provides predefined configurations for common window types:

```typescript
import { WindowConfigs } from '@tachui/core/viewport'

// Settings window
const SettingsWindow = Window({
  id: 'settings',
  ...WindowConfigs.settings('My App Settings'),
  children: () => SettingsPanel()
})

// Dialog window
const AlertWindow = Window({
  id: 'alert',
  ...WindowConfigs.dialog('Alert'),
  children: () => AlertDialog()
})

// Inspector window
const InspectorWindow = Window({
  id: 'inspector',
  ...WindowConfigs.inspector('Inspector'),
  children: () => InspectorPanel()
})
```

Available configurations:
- `WindowConfigs.settings(title)` - Modal settings window
- `WindowConfigs.dialog(title)` - Small modal dialog
- `WindowConfigs.inspector(title)` - Tall, narrow utility window
- `WindowConfigs.palette(title)` - Small tool palette window
- `WindowConfigs.document(title)` - Standard document window

## Platform Behavior

### Desktop (Electron)
- Creates native BrowserWindow
- Full window controls (minimize, maximize, close)
- Native window management

### Web Browser
- Uses popup windows when available
- Falls back to modal overlays
- Respects popup blocker settings

### Mobile
- Presents as full-screen modals
- Sheet presentation on iOS-style interfaces
- Stack-based navigation

## Preventing Duplicates

Window automatically prevents multiple instances of the same window:

```typescript
const openWindow = useOpenWindow()

// First call opens the window
await openWindow('settings', SettingsPanel())

// Second call focuses existing window instead of creating duplicate
await openWindow('settings', SettingsPanel()) // Focuses existing
```

## Best Practices

### 1. Use Descriptive IDs

```typescript
// Good
Window({ id: 'app-settings', ... })
Window({ id: 'user-preferences', ... })

// Bad
Window({ id: 'window1', ... })
Window({ id: 'modal', ... })
```

### 2. Handle Window State

```typescript
function SettingsPanel() {
  const [hasChanges, setHasChanges] = createSignal(false)
  const dismissWindow = useDismissWindow()
  
  const handleClose = () => {
    if (hasChanges()) {
      // Show confirmation dialog
      const confirmed = confirm('You have unsaved changes. Close anyway?')
      if (!confirmed) return
    }
    dismissWindow('settings')
  }
  
  return VStack({
    children: [
      // Settings UI
      Button({
        title: 'Close',
        action: handleClose
      })
    ]
  })
}
```

### 3. Size Windows Appropriately

```typescript
// Settings: compact and focused
Window({
  id: 'settings',
  width: 500,
  height: 400,
  resizable: false
})

// Main window: large and resizable
Window({
  id: 'main',
  width: 1200,
  height: 800,
  resizable: true
})

// Dialog: small and fixed
Window({
  id: 'confirm',
  width: 300,
  height: 150,
  resizable: false,
  modal: true
})
```

### 4. Use Appropriate Modality

```typescript
// Settings: modal to focus user attention
Window({
  id: 'settings',
  modal: true,
  children: () => SettingsPanel()
})

// Inspector: non-modal utility
Window({
  id: 'inspector',
  modal: false,
  alwaysOnTop: true,
  children: () => InspectorPanel()
})
```

## Related Components

- [WindowGroup](./windowgroup.md) - Multi-instance window management
- [App](./app.md) - Application container for windows
- See also: [Viewport Management Guide](../guide/viewport-management.md)