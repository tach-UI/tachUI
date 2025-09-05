# @tachui/devtools

Development & debugging tools for the tachUI framework. Provides runtime inspection, performance profiling, component debugging, and development-only features that enhance the developer experience.

## Features

### 🔍 Component Inspector

- Runtime component tree inspection
- Component props and state inspection
- Modifier chain debugging
- Visual component highlighting

### 📊 Performance Profiler

- Real-time performance monitoring
- Component render profiling
- Memory usage tracking
- Bundle size analysis

### 🐛 Debug Utilities

- Enhanced console logging
- Development error boundaries
- Hot reload integration
- Development panel overlay

### 🧪 Testing Utilities

- Component testing helpers
- Mock data providers
- Visual regression testing
- Accessibility testing

## Installation

```bash
pnpm add @tachui/devtools@0.8.0-alpha
```

## Usage

### Component Inspector

```typescript
import { ComponentInspector } from '@tachui/devtools'

const App = () => {
  return VStack().children([
    MainContent(),

    // Only in development
    Show(() => import.meta.env.DEV).children([
      ComponentInspector()
        .position('bottom-left')
        .features([
          'component-tree',
          'props-inspection',
          'state-inspection',
          'modifier-inspection',
        ])
        .hotkey('Cmd+Shift+I'),
    ]),
  ])
}
```

### Performance Profiler

```typescript
import { PerformanceProfiler } from '@tachui/devtools'

if (import.meta.env.DEV) {
  PerformanceProfiler.initialize({
    metrics: [
      'component-renders',
      'reactive-updates',
      'modifier-applications',
      'memory-usage',
      'bundle-size',
    ],
    thresholds: {
      renderTime: 16, // Warn if component render > 16ms
      memoryGrowth: 10, // Warn if memory grows > 10MB
      bundleSize: 500, // Warn if bundle > 500KB
      reactiveCycles: 50, // Warn if > 50 reactive updates/sec
    },
  })
}
```

### Development Panel

```typescript
import { DevPanel } from '@tachui/devtools'

const App = () => {
  return VStack().children([
    AppContent(),

    // Development panel overlay
    Show(() => import.meta.env.DEV).children([
      DevPanel()
        .position('bottom-right')
        .collapsible(true)
        .hotkey('Cmd+Shift+D')
        .tabs([
          'component-inspector',
          'performance-profiler',
          'memory-monitor',
          'network-inspector',
          'console-logger',
          'accessibility-checker',
        ]),
    ]),
  ])
}
```

## API Reference

### Component Inspector

- `ComponentInspector()` - Main inspector component
- `PropInspector(component)` - Props inspection utility
- `StateInspector(component)` - State inspection utility
- `ModifierInspector()` - Modifier chain inspector

### Performance Profiler

- `PerformanceProfiler.initialize(config)` - Initialize profiler
- `RenderProfiler.wrap(component, config)` - Wrap component for profiling
- `MemoryProfiler.startMonitoring(config)` - Start memory monitoring

### Debug Utilities

- `DebugConsole.create(config)` - Enhanced console logger
- `ErrorBoundary(options)` - Development error boundary
- `HotReload.configure(config)` - Hot reload configuration

### Testing Utilities

- `ComponentTester.create(component)` - Component testing helper
- `MockProvider.create(mocks)` - Mock data provider
- `SnapshotTester.create(config)` - Visual regression testing
- `A11yTester.create(config)` - Accessibility testing

## Development

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test

# Build package
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint
```

## Bundle Size

- **Total**: ~35KB (gzipped)
- **Inspector**: ~15KB
- **Profiler**: ~10KB
- **Debug**: ~5KB
- **Testing**: ~5KB

## Dependencies

**Requires:**

- `@tachui/core` - Core framework functionality
- `@tachui/primitives` - Basic UI components

**Note:** This package is automatically excluded from production bundles and only loads in development mode.

## Contributing

See the main [Contributing Guide](../../CONTRIBUTING.md) for information on contributing to tachUI devtools functionality.
