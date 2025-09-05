# @tachui/cli

> Comprehensive developer tooling and CLI for tachUI framework

[![npm version](https://img.shields.io/npm/v/@tachui/cli.svg)](https://www.npmjs.com/package/@tachui/cli)
[![License: MPL-2.0](https://img.shields.io/badge/License-MPL--2.0-blue.svg)](https://opensource.org/licenses/MPL-2.0)

## Overview

The tachUI CLI (`tacho`) provides comprehensive developer tooling including project scaffolding, code generation, SwiftUI migration utilities, performance analysis, and development server capabilities.

## Features

- 🚀 **Project Scaffolding** - Create new tachUI projects with templates
- 🔧 **Code Generation** - Generate components, pages, and plugins
- 📱 **SwiftUI Migration** - Convert SwiftUI code to tachUI
- ⚡ **Performance Tools** - Bundle analysis and optimization
- 🔍 **Development Server** - Hot reload and debugging capabilities
- 🧪 **Testing Utilities** - Test generation and runner integration

## Installation

### Global Installation

```bash
npm install -g @tachui/cli@0.8.0-alpha
# or
pnpm add -g @tachui/cli@0.8.0-alpha
```

### Local Project Installation

```bash
npm install --save-dev @tachui/cli@0.8.0-alpha
# or
pnpm add -D @tachui/cli@0.8.0-alpha
```

## Quick Start

### Create New Project

```bash
# Create a new tachUI project
tacho create my-app

# Create with specific template
tacho create my-app --template react-integration
tacho create my-app --template mobile-first
tacho create my-app --template desktop-app
```

### Generate Components

```bash
# Generate a new component
tacho generate component UserProfile
tacho generate component --interactive

# Generate a page with routing
tacho generate page ProductDetail --route "/products/:id"

# Generate a plugin
tacho generate plugin MyCustomPlugin
```

## Commands

### Project Management

```bash
# Create new project
tacho create <project-name> [options]

# Initialize tachUI in existing project
tacho init

# Add tachUI packages to existing project
tacho add forms navigation symbols
```

### Code Generation

```bash
# Generate component
tacho generate component <ComponentName>
tacho g c <ComponentName>  # Shorthand

# Generate page
tacho generate page <PageName> --route <route>

# Generate plugin
tacho generate plugin <PluginName>

# Generate form
tacho generate form <FormName> --fields name:string,email:email,age:number
```

### SwiftUI Migration

```bash
# Migrate SwiftUI file to tachUI
tacho migrate swiftui ./MyView.swift

# Migrate entire SwiftUI project
tacho migrate swiftui-project ./MySwiftUIApp

# Interactive migration with suggestions
tacho migrate --interactive ./ContentView.swift
```

### Development Tools

```bash
# Start development server
tacho dev
tacho serve --port 3000

# Build project
tacho build
tacho build --mode production

# Analyze bundle size
tacho analyze
tacho bundle-size --detailed
```

### Performance & Optimization

```bash
# Performance analysis
tacho perf analyze
tacho perf benchmark

# Bundle optimization
tacho optimize --tree-shake
tacho optimize --compress-assets

# Audit dependencies
tacho audit
tacho audit --security
```

## Templates

### Available Project Templates

```bash
# Basic tachUI application
tacho create my-app --template basic

# React.js integration
tacho create my-app --template react-integration

# Vue.js integration
tacho create my-app --template vue-integration

# Mobile-first application
tacho create my-app --template mobile-first

# Desktop application with Electron
tacho create my-app --template desktop

# Full-stack application with backend
tacho create my-app --template fullstack
```

### Component Templates

```bash
# Basic component
tacho generate component Button

# Component with props interface
tacho generate component UserCard --props "user:User,onClick:Function"

# Form component with validation
tacho generate component LoginForm --type form

# List component with data binding
tacho generate component TodoList --type list --data-source todos
```

## Configuration

### `tacho.config.js`

```javascript
export default {
  // Project settings
  projectName: 'my-tachui-app',
  version: '1.0.0',

  // Development server
  dev: {
    port: 3000,
    host: 'localhost',
    open: true,
    https: false,
  },

  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    target: 'es2020',
  },

  // Code generation preferences
  generate: {
    componentsDir: 'src/components',
    pagesDir: 'src/pages',
    pluginsDir: 'src/plugins',
    typescript: true,
    cssModules: false,
  },

  // SwiftUI migration settings
  migration: {
    outputDir: 'src/migrated',
    preserveComments: true,
    generateTypes: true,
    swiftUIVersion: '5.0',
  },
}
```

## SwiftUI Migration

### Supported SwiftUI Features

```bash
# Migrate common SwiftUI patterns
tacho migrate swiftui MyView.swift

# What gets converted:
# - VStack, HStack, ZStack → VStack, HStack, ZStack
# - Text, Button, Image → Text, Button, Image
# - @State → createSignal
# - @ObservedObject → createComputed
# - .modifier chains → .modifier chains
# - NavigationView → NavigationView
# - List, ForEach → List, ForEach
```

### Migration Examples

**Before (SwiftUI):**

```swift
struct ContentView: View {
    @State private var count = 0

    var body: some View {
        VStack(spacing: 20) {
            Text("Count: \(count)")
                .font(.title)
                .foregroundColor(.blue)

            Button("Increment") {
                count += 1
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
        }
    }
}
```

**After (tachUI):**

```typescript
import { createSignal } from '@tachui/core'
import { VStack, Text, Button } from '@tachui/primitives'

const ContentView = () => {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .modifier.font({ size: 24, weight: 'bold' })
        .foregroundColor('#007AFF')
        .build(),

      Button('Increment', () => setCount(count() + 1))
        .modifier.padding(16)
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .cornerRadius(8)
        .build(),
    ],
    spacing: 20,
  }).build()
}
```

## Plugin Development

### Create Plugin Template

```bash
tacho generate plugin MyPlugin --type enhancement

# Generates:
# - src/plugins/MyPlugin/
# - index.ts (main plugin file)
# - components/ (plugin components)
# - types.ts (TypeScript definitions)
# - README.md (plugin documentation)
```

### Plugin Structure

```typescript
// Generated plugin template
import { createTachUIPlugin } from '@tachui/core'

export const MyPlugin = createTachUIPlugin({
  name: 'MyPlugin',
  version: '1.0.0',
  components: {
    // Custom components
  },
  modifiers: {
    // Custom modifiers
  },
  utilities: {
    // Helper functions
  },
})

export default MyPlugin
```

## Development Server

```bash
# Start development server with hot reload
tacho dev

# Start with custom configuration
tacho dev --port 3000 --host 0.0.0.0 --https

# Start with specific environment
tacho dev --mode development --env local
```

Features:

- **Hot Module Replacement** - Instant updates without page refresh
- **Error Overlay** - In-browser error display
- **Performance Metrics** - Real-time performance monitoring
- **Component Inspector** - Debug component hierarchy

## Performance Tools

### Bundle Analysis

```bash
# Analyze bundle composition
tacho analyze

# Generate detailed report
tacho analyze --output report.html --detailed

# Compare bundle sizes
tacho analyze --compare baseline.json
```

### Performance Profiling

```bash
# Profile application performance
tacho perf profile --duration 30s

# Benchmark specific components
tacho perf benchmark --components Button,Text,VStack

# Memory usage analysis
tacho perf memory --watch
```

## Integration Examples

### React Integration

```bash
tacho create my-react-app --template react-integration

# Generates project with:
# - React + tachUI setup
# - Custom React hooks for tachUI signals
# - Component interoperability
# - Shared state management
```

### Vue Integration

```bash
tacho create my-vue-app --template vue-integration

# Generates project with:
# - Vue 3 + tachUI setup
# - Vue composition API integration
# - Reactive property bindings
# - Component bridge utilities
```

## Examples

Check out generated project examples:

- **[Basic App](https://github.com/tach-UI/tachUI/tree/main/apps/examples/cli/basic-app)**
- **[React Integration](https://github.com/tach-UI/tachUI/tree/main/apps/examples/cli/react-integration)**
- **[SwiftUI Migration](https://github.com/tach-UI/tachUI/tree/main/apps/examples/cli/swiftui-migration)**

## API Reference

- **[CLI Commands](https://github.com/tach-UI/tachUI/blob/main/docs/api/cli/src/functions/main.md)**
- **[Configuration Options](https://github.com/tach-UI/tachUI/blob/main/docs/guide/cli/configuration.md)**
- **[Plugin Development](https://github.com/tach-UI/tachUI/blob/main/docs/guide/cli/plugins.md)**

## Requirements

- **Node.js** 20.0+
- **@tachui/core** ^0.8.0-alpha or later
- **TypeScript** 5.0+ (recommended)

## Contributing

See the main [Contributing Guide](https://github.com/tach-UI/tachUI/blob/main/CONTRIBUTING.md) for information on contributing to tachUI CLI.

## License

Mozilla Public License 2.0 - see [LICENSE](https://github.com/tach-UI/tachUI/blob/main/LICENSE) for details.
