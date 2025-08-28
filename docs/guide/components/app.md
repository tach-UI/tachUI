# App

The `App` component serves as the top-level container for your TachUI application's window management system. It manages all Window and WindowGroup scenes and provides the SwiftUI-style app structure.

## Basic Usage

```typescript
import { App, Window, WindowGroup } from '@tachui/core/viewport'

const MyApp = App({
  children: [
    Window({
      id: 'main',
      title: 'My App',
      children: () => MainView()
    }),
    
    Window({
      id: 'settings',
      title: 'Settings',
      children: () => SettingsView()
    })
  ]
})
```

## API Reference

### Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `children` | WindowScene[] | Yes | Array of Window and WindowGroup components |

### Methods

```typescript
interface AppComponent {
  // Initialize the application
  initialize(): Promise<void>
  
  // Get a scene by ID
  getScene(id: string): WindowScene | undefined
  
  // Open a specific scene
  openScene(id: string, data?: any): Promise<void>
  
  // Render method for integration
  render(): ComponentInstance
}
```

## Examples

### Basic Application

```typescript
import { App, Window } from '@tachui/core/viewport'

function MainWindow() {
  return VStack({
    padding: 20,
    children: [
      Text({ content: 'Welcome to My App' }),
      Button({
        title: 'Open Settings',
        action: () => MyApp.openScene('settings')
      })
    ]
  })
}

function SettingsWindow() {
  return VStack({
    padding: 20,
    children: [
      Text({ content: 'Settings' }),
      // Settings UI...
    ]
  })
}

const MyApp = App({
  children: [
    Window({
      id: 'main',
      title: 'My Application',
      width: 800,
      height: 600,
      children: () => MainWindow()
    }),
    
    Window({
      id: 'settings',
      title: 'Settings',
      width: 600,
      height: 400,
      modal: true,
      children: () => SettingsWindow()
    })
  ]
})

// Initialize the app
await MyApp.initialize()
```

### Document-Based Application

```typescript
import { App, Window, WindowGroup } from '@tachui/core/viewport'

class Document {
  constructor(
    public id: string,
    public title: string,
    public content: string = ''
  ) {}
}

function DocumentEditor({ document }: { document: Document }) {
  const [content, setContent] = createSignal(document.content)
  
  return VStack({
    children: [
      Text({ content: document.title }),
      TextField({
        value: content,
        onChange: setContent,
        multiline: true
      })
    ]
  })
}

function MainWindow() {
  const documents = createSignal<Document[]>([])
  
  const createNewDocument = async () => {
    const doc = new Document(
      `doc-${Date.now()}`,
      `Untitled-${documents()[0].length + 1}`
    )
    documents()[1]([...documents()[0], doc])
    await MyApp.openScene('document', doc)
  }
  
  return VStack({
    children: [
      Button({
        title: 'New Document',
        action: createNewDocument
      }),
      List({
        items: documents,
        itemBuilder: (doc) => Button({
          title: doc.title,
          action: () => MyApp.openScene('document', doc)
        })
      })
    ]
  })
}

const MyApp = App({
  children: [
    Window({
      id: 'main',
      title: 'Document Manager',
      children: () => MainWindow()
    }),
    
    WindowGroup({
      id: 'document',
      title: 'Document',
      for: Document,
      children: (doc: Document) => DocumentEditor({ document: doc })
    }),
    
    Window({
      id: 'preferences',
      title: 'Preferences',
      modal: true,
      children: () => PreferencesWindow()
    })
  ]
})
```

### Multi-Platform Application

```typescript
import { App, Window, WindowGroup, PlatformUtils } from '@tachui/core/viewport'

function createPlatformSpecificApp() {
  const baseWindows = [
    Window({
      id: 'main',
      title: 'My App',
      children: () => MainView()
    })
  ]
  
  // Add platform-specific windows
  if (PlatformUtils.supportsMultiWindow()) {
    baseWindows.push(
      Window({
        id: 'inspector',
        title: 'Inspector',
        width: 300,
        height: 500,
        alwaysOnTop: true,
        children: () => InspectorView()
      })
    )
  }
  
  if (!PlatformUtils.isMobile()) {
    baseWindows.push(
      Window({
        id: 'preferences',
        title: 'Preferences',
        modal: true,
        children: () => PreferencesView()
      })
    )
  }
  
  return App({ children: baseWindows })
}

const MyApp = createPlatformSpecificApp()
```

## Application Lifecycle

### Initialization

```typescript
const MyApp = App({
  children: [/* windows */]
})

// Initialize the app and viewport system
await MyApp.initialize()

// App is ready to use
await MyApp.openScene('main')
```

### Scene Management

```typescript
// Get a scene by ID
const mainWindow = MyApp.getScene('main')

// Open scenes programmatically
await MyApp.openScene('settings')
await MyApp.openScene('document', myDocument) // With data

// Check if scene exists
if (MyApp.getScene('inspector')) {
  await MyApp.openScene('inspector')
} else {
  console.log('Inspector not available on this platform')
}
```

## Integration with Viewport System

The App component automatically sets up the viewport environment:

```typescript
import { initializeViewportSystem } from '@tachui/core/viewport'

// App automatically calls this during initialization
const manager = initializeViewportSystem()

// You can also initialize manually with custom options
const customManager = initializeViewportSystem({
  customAdapter: new MyCustomAdapter(),
  platformConfig: {
    web: {
      modalBackdropBlur: true,
      animationDuration: 300
    }
  }
})
```

## Event Handling

```typescript
const MyApp = App({
  children: [/* scenes */]
})

// Listen for app lifecycle events
MyApp.initialize().then(() => {
  console.log('App initialized')
  
  // Set up global event handlers
  const manager = useViewportManager()
  
  manager.onWindowOpened((window) => {
    console.log(`Window opened: ${window.id}`)
  })
  
  manager.onWindowClosed((windowId) => {
    console.log(`Window closed: ${windowId}`)
  })
})
```

## App Structure Patterns

### Single Window Application

```typescript
const SingleWindowApp = App({
  children: [
    Window({
      id: 'main',
      title: 'My Single Window App',
      children: () => MainApplicationView()
    })
  ]
})
```

### Multi-Window Utility

```typescript
const UtilityApp = App({
  children: [
    Window({
      id: 'main',
      title: 'Main Tool',
      children: () => MainTool()
    }),
    
    Window({
      id: 'palette',
      title: 'Tool Palette',
      width: 250,
      height: 400,
      alwaysOnTop: true,
      children: () => ToolPalette()
    }),
    
    Window({
      id: 'inspector',
      title: 'Inspector',
      width: 300,
      height: 500,
      alwaysOnTop: true,
      children: () => PropertyInspector()
    })
  ]
})
```

### Document-Centric Application

```typescript
const DocumentApp = App({
  children: [
    // Optional: Main window for document management
    Window({
      id: 'browser',
      title: 'Document Browser',
      children: () => DocumentBrowser()
    }),
    
    // Document editing windows
    WindowGroup({
      id: 'textDocument',
      title: 'Text Document',
      for: TextDocument,
      children: (doc) => TextEditor({ document: doc })
    }),
    
    WindowGroup({
      id: 'imageDocument',
      title: 'Image Document',
      for: ImageDocument,
      children: (doc) => ImageEditor({ document: doc })
    }),
    
    // Shared utilities
    Window({
      id: 'preferences',
      title: 'Preferences',
      modal: true,
      children: () => PreferencesPanel()
    })
  ]
})
```

## Error Handling

```typescript
const MyApp = App({
  children: [/* scenes */]
})

try {
  await MyApp.initialize()
  await MyApp.openScene('main')
} catch (error) {
  console.error('Failed to initialize app:', error)
  
  // Show error dialog
  await MyApp.openScene('error', { 
    message: error.message,
    details: error.stack
  })
}
```

## Testing Applications

```typescript
import { describe, it, expect } from 'vitest'

describe('MyApp', () => {
  it('should initialize successfully', async () => {
    const app = App({
      children: [
        Window({
          id: 'test',
          title: 'Test Window',
          children: () => TestComponent()
        })
      ]
    })
    
    await expect(app.initialize()).resolves.toBeUndefined()
  })
  
  it('should open scenes', async () => {
    const app = App({
      children: [
        Window({
          id: 'main',
          title: 'Main',
          children: () => MainComponent()
        })
      ]
    })
    
    await app.initialize()
    await expect(app.openScene('main')).resolves.toBeUndefined()
    
    const manager = useViewportManager()
    expect(manager.getWindow('main')).toBeDefined()
  })
})
```

## Best Practices

### 1. Organize Scenes Logically

```typescript
// Group related functionality
const MyApp = App({
  children: [
    // Core application
    Window({ id: 'main', ... }),
    
    // User preferences
    Window({ id: 'preferences', ... }),
    Window({ id: 'account', ... }),
    
    // Content editing
    WindowGroup({ id: 'textEditor', ... }),
    WindowGroup({ id: 'imageEditor', ... }),
    
    // Utilities
    Window({ id: 'inspector', ... }),
    Window({ id: 'console', ... })
  ]
})
```

### 2. Handle Platform Differences

```typescript
function createApp() {
  const scenes = []
  
  // Always include core functionality
  scenes.push(
    Window({ id: 'main', title: 'Main', ... })
  )
  
  // Add platform-specific features
  if (!PlatformUtils.isMobile()) {
    scenes.push(
      Window({ id: 'preferences', modal: true, ... })
    )
  }
  
  if (PlatformUtils.supportsMultiWindow()) {
    scenes.push(
      Window({ id: 'inspector', alwaysOnTop: true, ... })
    )
  }
  
  return App({ children: scenes })
}
```

### 3. Manage Application State

```typescript
class AppState {
  currentDocument = createSignal<Document | null>(null)
  recentDocuments = createSignal<Document[]>([])
  preferences = createSignal<Preferences>({})
}

const appState = new AppState()

const MyApp = App({
  children: [
    Window({
      id: 'main',
      children: () => MainView({ appState })
    }),
    WindowGroup({
      id: 'document',
      for: Document,
      children: (doc) => {
        // Update current document
        appState.currentDocument[1](doc)
        return DocumentEditor({ document: doc, appState })
      }
    })
  ]
})
```

### 4. Lazy Load Heavy Components

```typescript
const MyApp = App({
  children: [
    Window({
      id: 'main',
      children: () => MainView()
    }),
    
    Window({
      id: 'advanced-editor',
      children: () => lazy(() => import('./AdvancedEditor'))
    })
  ]
})
```

## Related Components

- [Window](./window.md) - Single-instance windows
- [WindowGroup](./windowgroup.md) - Multi-instance window management
- See also: [Viewport Management Guide](../guide/viewport-management.md)