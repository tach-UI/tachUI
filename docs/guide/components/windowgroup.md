# WindowGroup

The `WindowGroup` component provides SwiftUI-compatible window group management, allowing you to create templates for multiple windows of the same type. This is ideal for document-based applications where users can open multiple instances.

## Basic Usage

```typescript
import { WindowGroup } from '@tachui/core/viewport'

// Simple window group
const MyWindowGroup = WindowGroup({
  id: 'documents',
  title: 'Document',
  children: () => DocumentView()
})
```

## Data-Driven Windows

WindowGroup excels at creating data-driven windows where each window represents a specific data object:

```typescript
// Define your data type
class Document {
  id!: string
  title!: string
  content!: string
  lastModified!: Date
}

// Create window group for documents
const DocumentGroup = WindowGroup({
  id: 'document-editor',
  title: 'Document Editor',
  for: Document,
  children: (document: Document) => DocumentEditor({ document }),
  width: 900,
  height: 700,
  resizable: true
})

// Usage
const openDocument = async (doc: Document) => {
  await DocumentGroup.openForData(doc)
}
```

## API Reference

### Props

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the window group |
| `title` | string | No | Default title for windows in this group |
| `for` | class constructor | No | Data type for data-driven windows |
| `children` | Function | Yes | Component factory function |
| `width` | number | No | Default window width (default: 800) |
| `height` | number | No | Default window height (default: 600) |
| `resizable` | boolean | No | Whether windows can be resized (default: true) |
| `minimizable` | boolean | No | Whether windows can be minimized (default: true) |
| `maximizable` | boolean | No | Whether windows can be maximized (default: true) |
| `modal` | boolean | No | Whether windows are modal (default: false) |

**Version 1.2 Properties:**
| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `groupingStrategy` | `'tabs' \| 'stack' \| 'cascade' \| 'tile'` | No | Window arrangement strategy (default: 'stack') |
| `tabConfig` | `WindowTabConfig` | No | Tab grouping configuration |
| `poolConfig` | `WindowPoolConfig` | No | Window pooling configuration |
| `stateSyncScope` | `'none' \| 'group' \| 'global'` | No | State synchronization scope (default: 'none') |
| `maxInstances` | number | No | Maximum concurrent windows (default: Infinity) |

### Methods

The WindowGroup component returns an object with these methods:

```typescript
interface WindowGroupComponent<T> {
  // Basic window management
  open(data?: T): Promise<void>
  openForData(data: T): Promise<void>
  closeAll(): Promise<void>
  getWindows(): ViewportInstance[]
  
  // Version 1.2: Configuration methods
  configureGrouping(strategy: WindowGroupingStrategy): void
  configureTabs(config: WindowTabConfig): void  
  configurePooling(config: WindowPoolConfig): void
  enableStateSync(scope: StateSyncScope): void
  
  // Version 1.2: State management
  syncGroupState<S>(key: string, value: S): void
  getGroupState<S>(key: string): S | undefined
  onGroupStateChange<S>(key: string, callback: (value: S) => void): () => void
  
  // Version 1.2: Access to underlying WindowGroup
  group: WindowGroup // Access to full WindowGroup API
  
  // Render method for integration
  render(): ComponentInstance
}
```

## Examples

### Version 1.2: Advanced Window Group

This example demonstrates the advanced Version 1.2 features:

```typescript
// Project-based document editor with advanced features
class ProjectDocument {
  constructor(
    public id: string,
    public title: string,
    public content: string = '',
    public projectId: string,
    public lastModified: Date = new Date()
  ) {}
}

// Advanced WindowGroup with Version 1.2 features
const ProjectDocuments = WindowGroup({
  id: 'project-documents',
  title: 'Project Document',
  for: ProjectDocument,
  children: (doc: ProjectDocument) => ProjectDocumentEditor({ document: doc }),
  
  // Version 1.2: Window grouping strategy
  groupingStrategy: 'tabs',
  
  // Version 1.2: Tab configuration
  tabConfig: {
    enabled: true,
    maxTabs: 8,
    tabPosition: 'top',
    allowDetach: true,
    allowReorder: true
  },
  
  // Version 1.2: Window pooling for performance
  poolConfig: {
    enabled: true,
    maxPoolSize: 5,
    reuseThreshold: 30000,  // 30 seconds
    keepAliveTime: 300000   // 5 minutes
  },
  
  // Version 1.2: Group-level state synchronization
  stateSyncScope: 'group',
  
  // Version 1.2: Limit concurrent windows
  maxInstances: 10
})

function ProjectDocumentEditor({ document }: { document: ProjectDocument }) {
  const [content, setContent] = createSignal(document.content)
  const [selectedTool, setSelectedTool] = createSignal('edit')
  const [projectTheme, setProjectTheme] = createSignal<'light' | 'dark'>('light')
  
  // Version 1.2: Listen for synchronized state changes
  createEffect(() => {
    // Listen for tool changes across all project windows
    const unsubscribeTool = ProjectDocuments.onGroupStateChange('selectedTool', (tool: string) => {
      setSelectedTool(tool)
    })
    
    // Listen for theme changes
    const unsubscribeTheme = ProjectDocuments.onGroupStateChange('theme', (theme: 'light' | 'dark') => {
      setProjectTheme(theme)
    })
    
    // Cleanup subscriptions
    onCleanup(() => {
      unsubscribeTool()
      unsubscribeTheme()
    })
  })
  
  const syncTool = (tool: string) => {
    setSelectedTool(tool)
    // Version 1.2: Sync tool selection across all project windows
    ProjectDocuments.syncGroupState('selectedTool', tool)
  }
  
  const handleSave = () => {
    document.content = content()
    document.lastModified = new Date()
    
    // Version 1.2: Notify other windows about the update
    ProjectDocuments.syncGroupState('documentUpdated', {
      documentId: document.id,
      timestamp: Date.now()
    })
  }
  
  return VStack({
    padding: 20,
    spacing: 16,
    backgroundColor: () => projectTheme() === 'dark' ? '#2a2a2a' : '#ffffff',
    children: [
      // Synchronized tool bar
      HStack({
        spacing: 8,
        children: [
          Button({
            title: 'Edit',
            action: () => syncTool('edit'),
            variant: () => selectedTool() === 'edit' ? 'primary' : 'secondary'
          }),
          Button({
            title: 'Review',
            action: () => syncTool('review'),
            variant: () => selectedTool() === 'review' ? 'primary' : 'secondary'
          }),
          Button({
            title: 'Comment',
            action: () => syncTool('comment'),
            variant: () => selectedTool() === 'comment' ? 'primary' : 'secondary'
          }),
          Spacer(),
          Text({
            content: () => `Tool: ${selectedTool()} (synced)`,
            fontSize: 12,
            opacity: 0.7
          })
        ]
      }),
      
      // Document editor
      TextField({
        value: content,
        onChange: setContent,
        multiline: true,
        minHeight: 400
      }),
      
      Button({
        title: 'Save',
        action: handleSave,
        variant: 'primary'
      })
    ]
  })
}

// Usage example
function ProjectApp() {
  const openProjectDocument = async (doc: ProjectDocument) => {
    await ProjectDocuments.openForData(doc)
  }
  
  const configureWindowGroup = () => {
    // Version 1.2: Dynamic configuration
    ProjectDocuments.configureGrouping('cascade')  // Change to cascade layout
    ProjectDocuments.syncGroupState('theme', 'dark') // Set dark theme for all windows
  }
  
  // Version 1.2: Listen for group events
  createEffect(() => {
    // Listen for window lifecycle events
    const unsubscribeCreated = ProjectDocuments.group.onWindowCreated((window) => {
      console.log(`Document window created: ${window.id}`)
    })
    
    const unsubscribeEmpty = ProjectDocuments.group.onGroupEmpty(() => {
      console.log('All project documents closed')
    })
    
    const unsubscribeFull = ProjectDocuments.group.onGroupFull(() => {
      console.log('Maximum project documents reached')
    })
    
    onCleanup(() => {
      unsubscribeCreated()
      unsubscribeEmpty()
      unsubscribeFull()
    })
  })
  
  return VStack({
    children: [
      Button({
        title: 'Configure Windows',
        action: configureWindowGroup
      }),
      Button({
        title: 'Open Document',
        action: () => openProjectDocument(new ProjectDocument('1', 'Doc1', '', 'project1'))
      })
    ]
  })
}
```

### Basic Document Editor

```typescript
import { WindowGroup, useOpenWindow } from '@tachui/core/viewport'
import { VStack, Button, Text } from '@tachui/core'

// Document data type
class TextDocument {
  constructor(
    public id: string,
    public title: string,
    public content: string = '',
    public saved: boolean = false
  ) {}
}

// Document editor component
function DocumentEditor({ document }: { document: TextDocument }) {
  const [content, setContent] = createSignal(document.content)
  const [saved, setSaved] = createSignal(document.saved)
  
  const handleSave = () => {
    document.content = content()
    document.saved = true
    setSaved(true)
  }
  
  return VStack({
    children: [
      Text({ content: () => document.title + (saved() ? '' : ' *') }),
      TextField({
        value: content,
        onChange: (value) => {
          setContent(value)
          setSaved(false)
        },
        multiline: true
      }),
      Button({
        title: 'Save',
        action: handleSave,
        disabled: () => saved()
      })
    ]
  })
}

// Window group for documents
const DocumentWindows = WindowGroup({
  id: 'text-documents',
  title: 'Text Document',
  for: TextDocument,
  children: (document: TextDocument) => DocumentEditor({ document }),
  width: 800,
  height: 600,
  resizable: true
})

// Main app component
function DocumentApp() {
  const documents = createSignal<TextDocument[]>([])
  
  const createNewDocument = async () => {
    const doc = new TextDocument(
      `doc-${Date.now()}`,
      `Untitled-${documents()[0].length + 1}`
    )
    documents()[1]([...documents()[0], doc])
    await DocumentWindows.openForData(doc)
  }
  
  const openDocument = async (doc: TextDocument) => {
    await DocumentWindows.openForData(doc)
  }
  
  return VStack({
    children: [
      Button({
        title: 'New Document',
        action: createNewDocument
      }),
      ...documents()[0].map(doc => 
        Button({
          title: doc.title,
          action: () => openDocument(doc)
        })
      )
    ]
  })
}
```

### Image Viewer

```typescript
class ImageFile {
  constructor(
    public id: string,
    public name: string,
    public url: string,
    public size: { width: number; height: number }
  ) {}
}

function ImageViewer({ image }: { image: ImageFile }) {
  return VStack({
    children: [
      Text({ content: image.name }),
      Image({
        src: image.url,
        alt: image.name,
        width: image.size.width,
        height: image.size.height
      })
    ]
  })
}

const ImageWindows = WindowGroup({
  id: 'image-viewer',
  title: 'Image Viewer',
  for: ImageFile,
  children: (image: ImageFile) => ImageViewer({ image }),
  width: Math.min(image.size.width + 100, 1200),
  height: Math.min(image.size.height + 100, 800),
  resizable: true
})
```

### Settings Group

For non-data-driven windows, you can create groups without the `for` parameter:

```typescript
const SettingsGroup = WindowGroup({
  id: 'settings',
  title: 'Settings',
  children: () => SettingsPanel(),
  width: 600,
  height: 400,
  resizable: false,
  modal: true
})

// Open settings window
await SettingsGroup.open()
```

## Integration with App

WindowGroup components are typically used within an App component:

```typescript
import { App } from '@tachui/core/viewport'

const MyApp = App({
  children: [
    // Document windows
    WindowGroup({
      id: 'documents',
      title: 'Document',
      for: Document,
      children: (doc) => DocumentEditor({ document: doc })
    }),
    
    // Settings window
    Window({
      id: 'settings',
      title: 'Settings',
      children: () => SettingsView()
    })
  ]
})
```

## Window Management

### Opening Windows

```typescript
// From within a component
const openWindow = useOpenWindow()

// Open a new window in the group
await openWindow('document-new', DocumentEditor({ document: newDoc }))

// Or use the group directly
await DocumentWindows.openForData(newDoc)
```

### Managing Multiple Instances

```typescript
function DocumentManager() {
  const [openDocuments, setOpenDocuments] = createSignal<TextDocument[]>([])
  
  const trackDocument = (doc: TextDocument) => {
    setOpenDocuments(prev => [...prev, doc])
    DocumentWindows.openForData(doc)
  }
  
  const closeAllDocuments = async () => {
    await DocumentWindows.closeAll()
    setOpenDocuments([])
  }
  
  return VStack({
    children: [
      Button({
        title: `Close All (${openDocuments().length} open)`,
        action: closeAllDocuments,
        disabled: () => openDocuments().length === 0
      })
    ]
  })
}
```

## Platform Adaptations

WindowGroup automatically adapts to different platforms:

### Desktop (Electron)
- Creates native BrowserWindow instances
- Full window management (minimize, maximize, close)
- Multi-monitor support

### Web Browser
- Uses popup windows when supported
- Falls back to modal overlays
- Portal rendering for embedded content

### Mobile
- Stack-based navigation
- Sheet presentations
- Gesture-based dismissal

## Best Practices

### 1. Use Meaningful IDs
```typescript
// Good: descriptive, unique IDs
WindowGroup({ id: 'markdown-editor', ... })
WindowGroup({ id: 'image-gallery', ... })

// Bad: generic IDs
WindowGroup({ id: 'group1', ... })
WindowGroup({ id: 'windows', ... })
```

### 2. Handle Data Changes
```typescript
function DocumentEditor({ document }: { document: Document }) {
  // Listen for external changes
  createEffect(() => {
    if (document.isDeleted) {
      // Close this window
      useDismissWindow()('current-window-id')
    }
  })
  
  return DocumentView({ document })
}
```

### 3. Optimize for Large Numbers of Windows
```typescript
// Limit concurrent windows
const MAX_WINDOWS = 10

const openDocument = async (doc: Document) => {
  const openWindows = DocumentWindows.getWindows()
  
  if (openWindows.length >= MAX_WINDOWS) {
    // Close oldest window
    const oldest = openWindows[0]
    await oldest.close()
  }
  
  await DocumentWindows.openForData(doc)
}
```

### 4. Handle Unsaved Changes
```typescript
function DocumentEditor({ document }: { document: Document }) {
  const [hasChanges, setHasChanges] = createSignal(false)
  
  // Prevent closing with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges()) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to close?'
      }
    }
    
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  })
  
  return DocumentEditor({ 
    document, 
    onChange: () => setHasChanges(true),
    onSave: () => setHasChanges(false)
  })
}
```

## Related Components

- [Window](./window.md) - Single-instance windows
- [App](./app.md) - Application container for window management
- See also: [Viewport Management Guide](../guide/viewport-management.md)