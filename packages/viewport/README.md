# @tachui/viewport

> Viewport management and device detection for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/viewport.svg)](https://www.npmjs.com/package/@tachui/viewport)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI viewport package provides comprehensive viewport and window management capabilities inspired by SwiftUI's window system. It handles multi-window applications, device detection, platform adaptation, and provides a unified API across web, desktop, and mobile platforms.

## Features

- 🪟 **Multi-Window Management** - Create and manage multiple windows/modals/portals
- 🖥️ **Platform Detection** - Comprehensive device and browser capability detection
- 📱 **Mobile Adaptation** - Handle safe areas, orientation, and mobile-specific patterns
- ⚡ **Performance Optimized** - Window pooling and efficient state management
- 🎨 **SwiftUI-inspired API** - Familiar patterns for iOS/macOS developers
- 🔧 **TypeScript-first** - Complete type safety with comprehensive interfaces
- 🌐 **Cross-Platform** - Works consistently across web, Electron, and mobile browsers

## Installation

```bash
npm install @tachui/core @tachui/viewport
# or
pnpm add @tachui/core @tachui/viewport
```

## Quick Start

### Basic Window Management

```typescript
import {
  initializeViewportSystem,
  useOpenWindow,
  useDismissWindow,
} from '@tachui/viewport'
import { VStack, Button, Text } from '@tachui/core'

// Initialize the viewport system
const viewportManager = initializeViewportSystem()

const MyApp = () => {
  const openWindow = useOpenWindow()
  const dismissWindow = useDismissWindow()

  const openSettings = async () => {
    await openWindow(
      'settings',
      VStack({
        children: [
          Text('Settings Window'),
          Button('Close', () => dismissWindow('settings')),
        ],
      })
    )
  }

  return VStack({
    children: [Text('Main Application'), Button('Open Settings', openSettings)],
  })
}
```

### Platform Detection

```typescript
import { PlatformUtils, detectViewportEnvironment } from '@tachui/viewport'

const MyComponent = () => {
  const environment = detectViewportEnvironment()

  if (PlatformUtils.isMobile()) {
    return MobileLayout()
  } else if (PlatformUtils.isElectron()) {
    return DesktopLayout()
  } else {
    return WebLayout()
  }
}
```

### Window Groups for Data-Driven Windows

```typescript
import { WindowGroup } from '@tachui/viewport'

// Create a document-based window group
const DocumentGroup = WindowGroup.create('document', 'Document')

const MyApp = () => {
  const openDocument = async documentData => {
    await DocumentGroup.openWindow(documentData, doc =>
      VStack({
        children: [
          Text(`Editing: ${doc.name}`),
          // Document editing UI
        ],
      })
    )
  }

  return VStack({
    children: [
      Button('New Document', () => openDocument({ name: 'Untitled' })),
    ],
  })
}
```

## Core Concepts

### Viewport Types

The package supports different viewport types depending on platform capabilities:

- **Window**: Native OS windows (Electron, desktop browsers)
- **Modal**: Overlay modals for web browsers
- **Portal**: DOM portals for complex layouts
- **Sheet**: Bottom sheets for mobile interfaces
- **Popover**: Contextual popovers and tooltips

### Platform Adaptation

The system automatically chooses the best viewport type based on platform capabilities:

```typescript
import { getViewportManager } from '@tachui/viewport'

const manager = getViewportManager()
const optimalType = manager.getOptimalWindowType({
  preferNativeWindow: true,
})
// Returns 'window' on Electron, 'modal' on web, 'sheet' on mobile
```

### Window Lifecycle

Windows follow a complete lifecycle with events and cleanup:

```typescript
const windowInstance = await openWindow('my-window', content)

// Listen to window events
windowInstance.onShow(() => console.log('Window shown'))
windowInstance.onHide(() => console.log('Window hidden'))
windowInstance.onClose(() => console.log('Window closed'))

// Window operations
await windowInstance.show()
await windowInstance.focus()
await windowInstance.minimize()
await windowInstance.close()
```

## Advanced Features

### Window Pooling

For better performance, windows can be pooled and reused:

```typescript
import { WindowGroup } from '@tachui/viewport'

const group = WindowGroup.create('pooled-windows')

// Configure window pooling
group.configurePool({
  enabled: true,
  maxPoolSize: 5,
  reuseThreshold: 100, // ms
  keepAliveTime: 30000, // 30 seconds
})

// Windows are automatically pooled and reused
await group.openWindow(data, renderFunction)
```

### State Synchronization

Share state across windows in a group:

```typescript
const group = WindowGroup.create('synchronized-windows')

// Enable state synchronization
group.enableStateSync('group') // 'none' | 'group' | 'global'

// Sync state across all windows in group
group.syncState('selectedItem', currentItem)

// Listen for state changes
group.onStateChange('selectedItem', item => {
  console.log('Selection changed:', item)
})
```

### Window Grouping Strategies

Organize multiple windows with different strategies:

```typescript
const group = WindowGroup.create('tabbed-windows')

// Configure tabbing
group.configureTabbing({
  enabled: true,
  maxTabs: 10,
  tabPosition: 'top',
  allowDetach: true,
  allowReorder: true,
})

// Set grouping strategy
group.setGroupingStrategy('tabs') // 'tabs' | 'stack' | 'cascade' | 'tile'
```

## Environment Integration

### SwiftUI-Style Environment

Access viewport functionality through environment values:

```typescript
import {
  ViewportEnvironmentProvider,
  useViewportEnvironment,
  useCurrentWindow,
} from '@tachui/viewport'

const App = () => {
  return ViewportEnvironmentProvider().children([AppContent()])
}

const AppContent = () => {
  const environment = useViewportEnvironment()
  const currentWindow = useCurrentWindow()

  const openNewWindow = () => {
    environment.openWindow('new-window', content)
  }

  return Button('New Window', openNewWindow)
}
```

### Cross-Window Communication

Communicate between windows with message passing:

```typescript
const window1 = await openWindow('window-1', content)
const window2 = await openWindow('window-2', content)

// Send message from window1 to window2
window1.postMessage({ type: 'data-update', payload: newData })

// Listen for messages in window2
window2.onMessage(message => {
  if (message.type === 'data-update') {
    updateLocalData(message.payload)
  }
})
```

## Platform-Specific Features

### Web Browser Support

- Modal overlays with backdrop blur
- DOM portals for complex layouts
- Popup windows when available
- Responsive modal sizing

### Electron Integration

- Native OS windows with full controls
- Window positioning and sizing
- Menu bar integration
- Inter-process communication

### Mobile Browser Support

- Bottom sheet presentations
- Safe area handling
- Orientation-aware layouts
- Touch-optimized interactions

## API Reference

### Core Functions

```typescript
// Initialization
initializeViewportSystem(options?: ViewportOptions): ViewportManager

// Environment hooks
useOpenWindow(): (id: string, component: Component, options?: WindowOptions) => Promise<ViewportInstance>
useDismissWindow(): (id: string) => Promise<void>
useViewportInfo(): ViewportEnvironment
useCurrentWindow(): ViewportInstance | null

// Platform utilities
PlatformUtils.isElectron(): boolean
PlatformUtils.isMobile(): boolean
PlatformUtils.supportsMultiWindow(): boolean
PlatformUtils.supportsNativeWindows(): boolean

// Detection functions
detectViewportEnvironment(): ViewportEnvironment
createCapabilityChecker(): CapabilityChecker
```

### Components

```typescript
// Window components
App(scenes: AppScene[]): AppComponent
Window(id: string, content: Component): WindowComponent
WindowGroup<T>(id: string, dataType: string): WindowGroupComponent<T>
```

### Types

```typescript
interface ViewportEnvironment {
  platform: 'web' | 'electron' | 'mobile' | 'embedded'
  capabilities: ViewportCapabilities
  userAgent: string
  screenSize: { width: number; height: number }
  isTouch: boolean
}

interface WindowOptions {
  title?: string
  width?: number
  height?: number
  resizable?: boolean
  modal?: boolean
  preferNativeWindow?: boolean
  // ... more options
}
```

## Browser Compatibility

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **Electron** applications
- **Mobile browsers** (iOS Safari, Chrome Mobile)
- **Progressive Web Apps** with manifest support

## Performance Considerations

### Window Pooling Benefits

- Reduces window creation overhead
- Faster window reuse for repeated operations
- Memory-efficient window management
- Configurable pool size and retention

### Bundle Size

The @tachui/viewport package is approximately **15KB** minified and gzipped, making it suitable for both web and desktop applications.

### Memory Management

- Automatic cleanup of event listeners
- Window pooling to reduce garbage collection
- Efficient state synchronization
- Lazy loading of platform-specific features

## Migration from @tachui/core

If you were previously using viewport functionality from @tachui/core, here's how to migrate:

```typescript
// Old (from @tachui/core)
import { Viewport, initializeViewportSystem } from '@tachui/core'

// New (from @tachui/viewport)
import { Viewport, initializeViewportSystem } from '@tachui/viewport'

// The APIs remain the same, just import from the new package
```

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI viewport functionality.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
