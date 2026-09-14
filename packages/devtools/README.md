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
pnpm add @tachui/devtools
```

## Usage

### Component Inspector

There is no `ComponentInspector` overlay component. Inspection is a singleton
you enable and query — `globalDevTools`, or `getDevTools()`.

```typescript
import { globalDevTools } from '@tachui/devtools'

if (import.meta.env.DEV) {
  globalDevTools.configure({ trackReactiveOperations: true })
  globalDevTools.enable()
}

// The component tree, as a snapshot or as a signal you can observe
const tree = globalDevTools.getComponentTree()
const roots = globalDevTools.getRootComponents()
const live = globalDevTools.getComponentTreeSignal()

// Find something specific
const buttons = globalDevTools.findComponentsByName('Button')

// What it has recorded
const events = globalDevTools.getDebugEvents()
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

### 🚧 Development Panel (planned)

`DevPanel` — a docked overlay with tabs for the inspector, profiler, memory and
network — is not implemented. `globalDevTools` above is the programmatic
equivalent of its component-inspector tab.

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

### Bundle Optimization (New in 0.8.8-alpha)

Enhanced production bundling with environment-specific exports:

- **Development Mode**: Full debugging and profiling capabilities (~35KB)
- **Production Mode**: Minimal stubs that tree-shake to near 0KB
- **Smart Exports**: Conditional loading based on `NODE_ENV` and `import.meta.env.DEV`
- **Build Integration**: Automatic exclusion from production bundles via Vite/Webpack plugins

## Dependencies

**Requires:**

- `@tachui/core` - Core framework functionality
- `@tachui/primitives` - Basic UI components

**Note:** This package is automatically excluded from production bundles and only loads in development mode.

## Contributing

See the main [Contributing Guide](../../CONTRIBUTING.md) for information on contributing to tachUI devtools functionality.
