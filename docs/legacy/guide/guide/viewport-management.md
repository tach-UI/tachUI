# Viewport Management System

TachUI's Viewport Management System provides SwiftUI-compatible window and scene management for web, desktop, and mobile platforms. This system enables you to create multi-window applications with native-feeling window management while maintaining cross-platform compatibility.

## Overview

The Viewport Management System consists of several key components:

- **WindowGroup** - Creates groups of windows that can have multiple instances
- **Window** - Creates single, unique windows
- **App** - Top-level scene container that manages window groups
- **Viewport Environment** - SwiftUI-style environment values for window operations

## Core Concepts

### Window vs WindowGroup

- **Window**: A single, unique window that prevents duplicates. Perfect for settings, about windows, or main application windows.
- **WindowGroup**: A template for creating multiple windows of the same type. Ideal for document-based applications where users can open multiple files.

### Platform Adaptation

The viewport system automatically adapts to different environments:

- **Web browsers**: Uses modals, portals, and popup windows as fallbacks
- **Electron apps**: Creates native desktop windows with full window management
- **Mobile devices**: Adapts to mobile constraints with sheets and overlays

## Basic Usage

### Setting Up Your App

```typescript
import { App, WindowGroup, Window } from '@tachui/core/viewport'

const MyApp = App({
  children: [
    // Document-based windows
    WindowGroup({
      id: 'document',
      title: 'Document',
      for: class Document { id!: string; title!: string },
      children: (doc) => DocumentView({ document: doc })
    }),

    // Single windows
    Window({
      id: 'settings',
      title: 'Settings',
      children: () => SettingsView()
    })
  ]
})
```

### Opening Windows

```typescript
import { useOpenWindow } from '@tachui/core/viewport'

function MyComponent() {
  const openWindow = useOpenWindow()

  const handleOpenSettings = async () => {
    await openWindow('settings', SettingsView())
  }

  const handleNewDocument = async () => {
    const doc = { id: 'doc-1', title: 'Untitled' }
    await openWindow(`document-${doc.id}`, DocumentView({ document: doc }))
  }

  return VStack({
    children: [
      Button({
        title: 'Open Settings',
        action: handleOpenSettings
      }),
      Button({
        title: 'New Document',
        action: handleNewDocument
      })
    ]
  })
}
```

## Environment Integration

The viewport system provides SwiftUI-style environment values:

```typescript
import { useViewportEnvironment } from '@tachui/core/viewport'

function MyComponent() {
  const { openWindow, dismissWindow, viewportEnvironment } = useViewportEnvironment()

  // Check platform capabilities
  if (viewportEnvironment.capabilities.multiWindow) {
    // Can open multiple native windows
  }

  // Open and close windows
  const handleOpen = () => openWindow('my-window', MyWindowContent())
  const handleClose = () => dismissWindow('my-window')

  return VStack({
    children: [
      Button({ title: 'Open Window', action: handleOpen }),
      Button({ title: 'Close Window', action: handleClose })
    ]
  })
}
```

## Window Configuration

You can configure windows with various options:

```typescript
Window({
  id: 'my-window',
  title: 'My Window',
  width: 800,
  height: 600,
  resizable: true,
  minimizable: true,
  maximizable: true,
  alwaysOnTop: false,
  modal: false,
  children: () => MyWindowContent()
})
```

### Configuration Options

| Option | Type | Description |
|--------|------|-------------|
| `id` | string | Unique identifier for the window |
| `title` | string | Window title |
| `width` | number | Initial width in pixels |
| `height` | number | Initial height in pixels |
| `resizable` | boolean | Whether the window can be resized |
| `minimizable` | boolean | Whether the window can be minimized |
| `maximizable` | boolean | Whether the window can be maximized |
| `alwaysOnTop` | boolean | Whether the window stays above others |
| `modal` | boolean | Whether the window is modal |

## Advanced Features (Version 1.2)

TachUI's Version 1.2 Viewport Management introduces powerful advanced features for complex window workflows:

### Window Grouping Strategies

Control how multiple windows are arranged and managed:

```typescript
const DocumentGroup = WindowGroup({
  id: 'documents',
  title: 'Document',
  for: Document,
  groupingStrategy: 'tabs', // 'tabs' | 'stack' | 'cascade' | 'tile'
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// Change grouping strategy dynamically
DocumentGroup.configureGrouping('cascade')
```

**Available Strategies:**
- **`tabs`** - Group windows as tabs (desktop platforms)
- **`stack`** - Stack windows on top of each other (default)
- **`cascade`** - Cascade windows with offset positioning
- **`tile`** - Arrange windows in a grid layout

### Window Pooling and Reuse

Improve performance by reusing window instances:

```typescript
const EditorsGroup = WindowGroup({
  id: 'editors',
  for: Document,
  poolConfig: {
    enabled: true,
    maxPoolSize: 5,           // Keep up to 5 windows in pool
    reuseThreshold: 30000,    // Reuse windows idle < 30s
    keepAliveTime: 300000     // Keep pooled windows for 5min
  },
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// Check pooled windows
const pooledWindows = EditorsGroup.group.getPooledWindows()
console.log(`${pooledWindows.length} windows in pool`)
```

### State Synchronization

Share reactive state across multiple windows:

```typescript
// Group-level state sync
const ProjectGroup = WindowGroup({
  id: 'project-windows',
  for: Project,
  stateSyncScope: 'group', // 'none' | 'group' | 'global'
  children: (project: Project) => ProjectView({ project })
})

// Sync state across all windows in the group
ProjectGroup.syncGroupState('currentTheme', 'dark')
ProjectGroup.syncGroupState('selectedTool', 'brush')

// Listen for state changes
ProjectGroup.onGroupStateChange('currentTheme', (theme) => {
  console.log(`Theme changed to: ${theme}`)
})

// Global state sync (across all windows)
const globalManager = useViewportManager()
globalManager.syncGlobalState('userPreferences', preferences)
```

### Tab Grouping Configuration

Configure advanced tabbing behavior for desktop platforms:

```typescript
const TabbedGroup = WindowGroup({
  id: 'tabbed-editors',
  for: Document,
  groupingStrategy: 'tabs',
  tabConfig: {
    enabled: true,
    maxTabs: 10,
    tabPosition: 'top',      // 'top' | 'bottom' | 'left' | 'right'
    allowDetach: true,       // Users can detach tabs to new windows
    allowReorder: true       // Users can reorder tabs
  },
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// Update tab configuration
TabbedGroup.configureTabs({
  enabled: true,
  tabPosition: 'bottom',
  allowDetach: false,
  allowReorder: true
})
```

### Window Lifecycle Events

Track window creation, destruction, and reuse:

```typescript
const DocumentGroup = WindowGroup({
  id: 'documents',
  for: Document,
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// Window-level events
DocumentGroup.group.onWindowCreated((window) => {
  console.log(`New window created: ${window.id}`)
  analytics.track('window_created', { windowId: window.id })
})

DocumentGroup.group.onWindowDestroyed((windowId) => {
  console.log(`Window destroyed: ${windowId}`)
  analytics.track('window_destroyed', { windowId })
})

DocumentGroup.group.onWindowReused((window, previousData) => {
  console.log(`Window reused: ${window.id}`)
  // Clean up any data from previous use
  cleanupWindowState(window)
})

// Group-level events
DocumentGroup.group.onGroupEmpty(() => {
  console.log('All windows in group closed')
})

DocumentGroup.group.onGroupFull(() => {
  console.log('Group reached maximum capacity')
})
```

### Enhanced Window Management

Control window limits and behavior:

```typescript
const LimitedGroup = WindowGroup({
  id: 'limited-windows',
  for: Document,
  maxInstances: 5, // Maximum 5 windows open at once
  poolConfig: {
    enabled: true,
    maxPoolSize: 3
  },
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// When limit is reached, oldest windows are automatically pooled or closed
await LimitedGroup.openForData(newDocument) // May close oldest window
```

### Window Groups with Data

WindowGroup supports data-driven window creation:

```typescript
class Document {
  id!: string
  title!: string
  content!: string
}

const DocumentGroup = WindowGroup({
  id: 'documents',
  title: 'Document',
  for: Document,
  children: (doc: Document) => DocumentEditor({ document: doc })
})

// Open specific document
await DocumentGroup.openForData(myDocument)
```

### Cross-Platform Utilities

```typescript
import { PlatformUtils, WindowConfigs } from '@tachui/core/viewport'

// Check platform capabilities
if (PlatformUtils.supportsNativeWindows()) {
  // Use native window features
}

if (PlatformUtils.isMobile()) {
  // Adapt for mobile
}

// Use predefined window configurations
const settingsWindow = Window({
  ...WindowConfigs.settings('My App Settings'),
  children: () => SettingsView()
})
```

### Window Lifecycle Events

```typescript
import { useViewportManager } from '@tachui/core/viewport'

function MyComponent() {
  const manager = useViewportManager()

  // Listen for window events
  manager.onWindowOpened((window) => {
    console.log(`Window opened: ${window.id}`)
  })

  manager.onWindowClosed((windowId) => {
    console.log(`Window closed: ${windowId}`)
  })

  return MyView()
}
```

## Platform-Specific Behavior

### Web Browser

In web browsers, the viewport system provides these fallbacks:

1. **Popup Windows** - For browsers that support window.open()
2. **Modal Overlays** - Full-screen modals with backdrop
3. **Portal Rendering** - In-page portals for embedded content

### Electron Desktop

For Electron applications:

1. **Native Windows** - Full BrowserWindow instances
2. **Window Management** - Native minimize, maximize, close
3. **Cross-Window Communication** - IPC-based messaging

### Mobile

On mobile devices:

1. **Sheet Presentation** - iOS-style sheet modals
2. **Full-Screen Navigation** - Stack-based navigation
3. **Gesture Support** - Swipe to dismiss

## Best Practices

### 1. Use Appropriate Window Types

- Use `Window` for singleton windows (settings, about, preferences)
- Use `WindowGroup` for document-based or data-driven windows

### 2. Handle Platform Differences

```typescript
import { PlatformUtils } from '@tachui/core/viewport'

if (PlatformUtils.isMobile()) {
  // Use simplified mobile UI
  return MobileView()
} else {
  // Use full desktop UI with multiple windows
  return DesktopView()
}
```

### 3. Manage Window State

```typescript
function DocumentWindow({ document }: { document: Document }) {
  const [isDirty, setIsDirty] = createSignal(false)

  // Prevent closing unsaved documents
  useEffect(() => {
    window.addEventListener('beforeunload', (e) => {
      if (isDirty()) {
        e.preventDefault()
        e.returnValue = ''
      }
    })
  })

  return DocumentEditor({
    document,
    onChange: () => setIsDirty(true)
  })
}
```

### 4. Optimize Performance

```typescript
// Lazy-load window content
const LazyWindow = Window({
  id: 'heavy-window',
  title: 'Heavy Content',
  children: () => lazy(() => import('./HeavyComponent'))
})
```

## API Reference

### Core Functions

- `App({ children })` - Create app with window scenes
- `Window({ id, title, children, ...options })` - Create single window
- `WindowGroup({ id, title, for?, children, groupingStrategy?, tabConfig?, poolConfig?, stateSyncScope?, maxInstances?, ...options })` - Create window group with Version 1.2 features
- `useOpenWindow()` - Hook for opening windows
- `useDismissWindow()` - Hook for closing windows
- `useViewportEnvironment()` - Access viewport environment
- `useViewportManager()` - Access viewport manager directly

### Version 1.2 WindowGroup API

**Configuration Methods:**
- `configureGrouping(strategy)` - Set window grouping strategy
- `configureTabs(config)` - Configure tab behavior
- `configurePooling(config)` - Configure window pooling
- `enableStateSync(scope)` - Enable state synchronization

**State Management:**
- `syncGroupState(key, value)` - Sync state within group
- `getGroupState(key)` - Get shared group state
- `onGroupStateChange(key, callback)` - Listen for state changes

**Lifecycle Events:**
- `onWindowCreated(callback)` - Window creation events
- `onWindowDestroyed(callback)` - Window destruction events
- `onWindowReused(callback)` - Window reuse events
- `onGroupEmpty(callback)` - Group empty events
- `onGroupFull(callback)` - Group full events

**Pool Management:**
- `getPooledWindows()` - Get windows in pool
- `returnToPool(window)` - Return window to pool

### Utility Objects

- `WindowConfigs` - Predefined window configurations
- `PlatformUtils` - Platform detection utilities
- `ViewportConstants` - System constants

### Types

- `ViewportInstance` - Window instance interface
- `WindowOptions` - Window configuration options
- `ViewportEnvironment` - Environment information
- `WindowGroup` - Window group interface

**Version 1.2 Types:**
- `WindowGroupingStrategy` - `'tabs' | 'stack' | 'cascade' | 'tile'`
- `StateSyncScope` - `'none' | 'group' | 'global'`
- `WindowTabConfig` - Tab grouping configuration
- `WindowPoolConfig` - Window pooling configuration

## Version 1.2 Best Practices

### 1. Choose the Right Grouping Strategy

```typescript
// For document editing apps - use tabs
const DocumentGroup = WindowGroup({
  groupingStrategy: 'tabs',
  tabConfig: { enabled: true, allowDetach: true }
})

// For image editing - use cascade for easy comparison
const ImageGroup = WindowGroup({
  groupingStrategy: 'cascade'
})

// For monitoring dashboards - use tile
const DashboardGroup = WindowGroup({
  groupingStrategy: 'tile'
})
```

### 2. Configure Pooling Appropriately

```typescript
// For frequently opened/closed windows - enable pooling
const PreviewGroup = WindowGroup({
  poolConfig: {
    enabled: true,
    maxPoolSize: 5,
    reuseThreshold: 10000, // 10 seconds
    keepAliveTime: 60000   // 1 minute
  }
})

// For heavy windows - disable pooling to save memory
const HeavyGroup = WindowGroup({
  poolConfig: { enabled: false }
})
```

### 3. Use State Sync Strategically

```typescript
// Group sync for related windows
const ProjectGroup = WindowGroup({
  stateSyncScope: 'group', // Share state within project windows
})

// Global sync for app-wide settings
const globalManager = useViewportManager()
globalManager.syncGlobalState('theme', 'dark') // All windows
```

### 4. Handle Window Limits Gracefully

```typescript
const LimitedGroup = WindowGroup({
  maxInstances: 10,
  poolConfig: { enabled: true, maxPoolSize: 5 }
})

// Listen for capacity events
LimitedGroup.group.onGroupFull(() => {
  showNotification('Maximum windows reached. Oldest will be reused.')
})
```

### 5. Optimize for Platform

```typescript
import { useViewportEnvironment } from '@tachui/core/viewport'

function MyWindowGroup() {
  const { environment } = useViewportEnvironment()

  // Adjust strategy based on platform
  const strategy = environment.platform === 'mobile' ? 'stack' : 'tabs'

  return WindowGroup({
    groupingStrategy: strategy,
    tabConfig: {
      enabled: environment.platform !== 'mobile'
    }
  })
}
```

## Migration from Other Frameworks

### From Electron

```typescript
// Before (Electron)
const win = new BrowserWindow({ width: 800, height: 600 })
win.loadFile('index.html')

// After (TachUI)
const MyWindow = Window({
  id: 'main',
  width: 800,
  height: 600,
  children: () => MyAppContent()
})
```

### From Web Modal Libraries

```typescript
// Before (Modal library)
showModal({
  title: 'Settings',
  content: SettingsComponent
})

// After (TachUI)
const openWindow = useOpenWindow()
await openWindow('settings', SettingsComponent())
```

This viewport system provides a unified, SwiftUI-inspired approach to window management that works across all platforms while maintaining native performance and user experience expectations.

## Examples

- **[Basic Viewport Example](../examples/viewport-example.md)** - Simple multi-window document application
- **[Version 1.2 Advanced Example](../examples/viewport-example.md)** - Complex project management app with grouping, pooling, and state sync
