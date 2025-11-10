# Installation

Get started with TachUI in your web project with these simple installation steps.

## Quick Start

### 1. Install TachUI

```bash
npm install @tachui/core
```

Or with yarn:

```bash
yarn add @tachui/core
```

Or with pnpm:

```bash
pnpm add @tachui/core
```

#### Optional Packages

```bash
# Navigation components (NavigationView, TabView, routing)
npm install @tachui/navigation

# Combined installation
npm install @tachui/core @tachui/navigation
```

### 2. Create Your First Component

```typescript
import { Text, Button, VStack } from '@tachui/primitives'
import { createSignal } from '@tachui/core'

function App() {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .fontSize(24)
        .fontWeight('bold'),

      Button('Increment', () => setCount(count() + 1))
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding(12)
        .cornerRadius(8),
    ],
    spacing: 16,
  })
    .padding(32)
    .backgroundColor('#f5f5f5')
    .minHeight('100vh')
    .justifyContent('center')
    .alignItems('center')
}

export default App
```

### 3. Render to DOM

```typescript
import { renderComponent } from '@tachui/core'
import App from './App'

const container = document.getElementById('root')
renderComponent(App(), container)
```

## Project Setup Options

### Option 1: Use Tacho CLI (Recommended)

The fastest way to get started with TachUI is using the Tacho CLI:

```bash
# Install Tacho CLI globally
npm install -g @tachui/cli

# Create a new project
tacho init my-tachui-app

# Navigate to your project
cd my-tachui-app

# Start development server
tacho dev
```

The Tacho CLI provides:

- **Project templates** with best practices
- **Development server** with hot reload
- **Build optimization** for production
- **Component scaffolding** tools

### Option 2: Manual Vite Setup

If you prefer manual setup or want to integrate TachUI into an existing project:

#### 1. Create Vite Project

```bash
npm create vite@latest my-tachui-app -- --template vanilla-ts
cd my-tachui-app
npm install
```

#### 2. Install TachUI

```bash
npm install @tachui/core
npm install @tachui/navigation  # Optional: for navigation components
```

#### 3. Configure Vite

Update your `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import { tachui } from '@tachui/vite-plugin'

export default defineConfig({
  plugins: [
    tachui({
      // Enable SwiftUI syntax transformation
      transformSyntax: true,
      // Enable development debugging
      debug: true,
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
```

#### 4. Update main.ts

```typescript
import './style.css'
import { renderComponent } from '@tachui/core'
import App from './App'

const app = document.querySelector<HTMLDivElement>('#app')!

renderComponent(App(), app)
```

### Option 3: Add to Existing Project

To add TachUI to an existing JavaScript/TypeScript project:

#### 1. Install Dependencies

```bash
npm install @tachui/core
npm install @tachui/navigation  # Optional: for navigation components
npm install -D @tachui/vite-plugin
```

#### 2. Update Build Configuration

For **Vite** projects, add the TachUI plugin:

```typescript
// vite.config.ts
import { tachui } from '@tachui/vite-plugin'

export default defineConfig({
  plugins: [
    tachui(),
    // ... your other plugins
  ],
})
```

For **Webpack** projects:

```javascript
// webpack.config.js
const { TachuiWebpackPlugin } = require('@tachui/webpack-plugin')

module.exports = {
  plugins: [
    new TachuiWebpackPlugin(),
    // ... your other plugins
  ],
}
```

#### 3. Start Using TachUI Components

```typescript
import { Text, Button, VStack } from '@tachui/primitives'
import { NavigationView, NavigationLink } from '@tachui/navigation'

// Use alongside your existing components
function MyTachuiComponent() {
  return VStack({
    children: [
      Text('TachUI component in existing app!'),
      Button('Click me', () => alert('Hello from TachUI!')),
    ],
  })
}

// With navigation
function MyNavigationComponent() {
  return NavigationView(() =>
    VStack({
      children: [
        Text('Home Screen'),
        NavigationLink(() => Text('Detail View'), 'Go to Detail'),
      ],
    })
  )
}
```

## TypeScript Configuration

TachUI is built with TypeScript-first design. Update your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"]
}
```

## Development Server

### With Tacho CLI

```bash
tacho dev
```

Features:

- **Hot Module Replacement** with component state preservation
- **Real-time error overlay** with source maps
- **Performance monitoring** dashboard
- **Component inspector** for debugging

### With Vite

```bash
npm run dev
```

The TachUI Vite plugin provides:

- **SwiftUI syntax transformation** in real-time
- **Development debugging** tools
- **Error reporting** with helpful suggestions

## Production Build

### With Tacho CLI

```bash
tacho build
```

Optimizations:

- **Tree shaking** for minimal bundle size
- **Dead code elimination**
- **Component optimization**
- **Asset optimization**

### With Vite

```bash
npm run build
```

## Environment Requirements

### Node.js Version

TachUI requires Node.js 18.0.0 or higher:

```bash
node --version  # Should be >= 18.0.0
```

### Browser Support

TachUI supports all modern browsers:

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### TypeScript Support

- **TypeScript**: 4.9+ (5.0+ recommended)
- **ESNext modules** with bundler resolution
- **Strict mode** recommended for best developer experience

## Package Structure

Understanding TachUI's package structure:

```
@tachui/core
├── components/     # UI components (Text, Button, etc.)
├── reactive/       # Signal system and reactivity
├── modifiers/      # SwiftUI-style modifiers
├── runtime/        # DOM rendering and lifecycle
└── types/          # TypeScript definitions

@tachui/navigation  # Navigation components (NavigationView, TabView, routing)
@tachui/cli         # Tacho command-line interface
@tachui/vite-plugin # Vite integration
```

## Import Patterns

### Recommended Imports

```typescript
// Core components and utilities
import {
  Text,
  Button,
  TextField,
  Image,
  VStack,
  HStack,
  ZStack,
  createSignal,
  createMemo,
  createEffect,
  renderComponent,
} from '@tachui/core'

// State management
import { State, Binding } from '@tachui/core'

// Form components
import { Picker, Toggle } from '@tachui/primitives'
import { Form, Section } from '@tachui/advanced-forms'
import { Slider } from '@tachui/advanced-forms'

// Navigation components
import { NavigationView, NavigationLink, TabView } from '@tachui/navigation'
```

### Tree Shaking

TachUI supports full tree shaking - only import what you use:

```typescript
// ✅ Good - Only imports what's needed
import { Text, Button } from '@tachui/primitives'

// ❌ Avoid - Imports entire library
import * as TachUI from '@tachui/core'
```

## Next Steps

Once TachUI is installed:

1. **[Core Concepts](/guide/concepts)** - Understand TachUI's reactive architecture
2. **[Developer Quick Start](/guide/developer-getting-started)** - Comprehensive tutorial
3. **[Components Guide](/guide/components)** - Learn about available components
4. **[Signals Guide](/guide/signals)** - Master reactive programming

## Troubleshooting

### Common Installation Issues

#### Node Version Error

```bash
# Update Node.js
nvm install 18
nvm use 18
```

#### TypeScript Errors

```bash
# Install TypeScript if needed
npm install -D typescript

# Generate fresh tsconfig.json
npx tsc --init
```

#### Build Errors with Vite

Check that the TachUI plugin is properly configured:

```typescript
// vite.config.ts
import { tachui } from '@tachui/vite-plugin'

export default defineConfig({
  plugins: [tachui()], // Must be included
})
```

### Getting Help

- **[GitHub Issues](https://github.com/whoughton/TachUI/issues)** - Bug reports and feature requests
- **[Documentation](/guide/)** - Comprehensive guides and API reference
- **[Examples](/examples/)** - Real-world usage examples

## Ready to Build?

With TachUI installed, you're ready to start building reactive web applications with SwiftUI-inspired syntax. Check out the [Developer Quick Start](/guide/developer-getting-started) for a comprehensive tutorial!
