  ## Getting Started

  ### Prerequisites

Node.js: 20+
pnpm: 10.14.0+ (recommended) or npm 9+
TypeScript: 5.8+ support in your editor

  ### Installation

  Install the core framework:

  ```bash
# Using pnpm (recommended)
pnpm add @tachui/core@0.7.0-alpha1

# Using npm
npm install @tachui/core@0.7.0-alpha1

# Using yarn
yarn add @tachui/core@0.7.0-alpha1

Optional Plugins

Add additional functionality as needed:

# Form components and validation
pnpm add @tachui/forms@0.7.0-alpha1

# Navigation system
pnpm add @tachui/navigation@0.7.0-alpha1

# Icon system (Lucide integration)
pnpm add @tachui/symbols@0.7.0-alpha1

# Mobile patterns (alerts, action sheets)
pnpm add @tachui/mobile-patterns@0.7.0-alpha1

  Project Setup

  Create a basic HTML file:

  <!DOCTYPE html>
  <html>
  <head>
    <title>My tachUI App</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
  </html>

  Create your main TypeScript file (src/main.ts):

  import { mountRoot, VStack, Text, Button, createSignal } from '@tachui/core'

  // Create reactive state
  const [count, setCount] = createSignal(0)

  // Build your app
  const App = () => VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .modifier.fontSize(24)
        .fontWeight('bold')
        .build(),

      Button('Increment', () => setCount(count() + 1))
        .modifier.backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding({ horizontal: 20, vertical: 10 })
        .cornerRadius(8)
        .build()
    ],
    spacing: 16,
    alignment: 'center'
  })

  // Mount to DOM
  mountRoot(App)

  Build Setup

  Configure your build tool. For Vite (recommended):

  pnpm add -D vite typescript

  Create vite.config.ts:

  import { defineConfig } from 'vite'

  export default defineConfig({
    build: {
      target: 'es2020'
    }
  })

  Add scripts to package.json:

  {
    "scripts": {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    }
  }

  Start Development

  pnpm dev

  Visit http://localhost:5173 to see your app running!

  This provides a complete getting started flow from installation through first running app, following the patterns established in the tachUI documentation
   and examples.
