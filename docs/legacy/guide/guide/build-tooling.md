# Build Tooling & Project Setup

Comprehensive guide for setting up TachUI projects with modern build tools, development workflows, and best practices.

## 🛠️ Recommended Development Stack

### Core Tools

**Bundler: Vite (Recommended)**
```bash
npm create vite@latest my-app -- --template vanilla
# or
npm create vite@latest my-app -- --template vanilla-ts
```

**Why Vite?**
- ⚡ **Lightning fast** - Native ESM dev server
- 🔥 **Hot Module Replacement** - Instant updates
- 📦 **Optimized builds** - Rollup-based production builds
- 🔧 **Zero config** - Works out of the box with TachUI
- 🌐 **Framework agnostic** - Perfect for TachUI's approach

**Alternative: Webpack + Babel**
```bash
npm install webpack webpack-cli webpack-dev-server
npm install babel-loader @babel/core @babel/preset-env
```

### Development Tools

**TypeScript (Highly Recommended)**
```bash
npm install -D typescript @types/node
```

**Code Quality**
```bash
npm install -D eslint prettier
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

**Testing**
```bash
npm install -D vitest @vitest/ui
# or
npm install -D jest @types/jest
```

## 📁 Project Structure

### Recommended Layout

```
my-tachui-app/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components (Button, Input, etc.)
│   │   ├── layout/          # Layout components (Header, Sidebar, etc.)
│   │   └── feature/         # Feature-specific components
│   ├── stores/              # State management
│   │   ├── app-store.js     # Global app state
│   │   ├── user-store.js    # User-specific state
│   │   └── index.js         # Store exports
│   ├── utils/               # Helper functions
│   │   ├── api.js           # API utilities
│   │   ├── storage.js       # LocalStorage helpers
│   │   └── validation.js    # Form validation
│   ├── styles/              # Global styles
│   │   ├── globals.css      # Global CSS
│   │   ├── variables.css    # CSS custom properties
│   │   └── components.css   # Component-specific styles
│   ├── assets/              # Static assets
│   │   ├── images/          # Images
│   │   ├── icons/           # SVG icons
│   │   └── fonts/           # Custom fonts
│   ├── libs/                # External libraries
│   │   └── tachui/          # TachUI framework
│   ├── types/               # TypeScript type definitions
│   │   ├── api.ts           # API types
│   │   ├── components.ts    # Component types
│   │   └── global.d.ts      # Global type declarations
│   ├── main.js              # Application entry point
│   └── app.js               # Main app component
├── public/                  # Static public assets
│   ├── favicon.ico
│   ├── robots.txt
│   └── manifest.json
├── dist/                    # Build output (generated)
├── tests/                   # Test files
│   ├── unit/               # Unit tests
│   ├── integration/        # Integration tests
│   └── e2e/                # End-to-end tests
├── docs/                   # Project documentation
├── .env                    # Environment variables
├── .env.local              # Local environment overrides
├── .gitignore              # Git ignore rules
├── vite.config.js          # Vite configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
└── README.md               # Project documentation
```

## ⚙️ Configuration Files

### Vite Configuration

**Basic Vite Config (`vite.config.js`):**
```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // TachUI alias for cleaner imports
  resolve: {
    alias: {
      '@tachui/core': './src/libs/tachui/index.js',
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@stores': resolve(__dirname, 'src/stores'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles'),
      '@assets': resolve(__dirname, 'src/assets')
    }
  },

  // Development server configuration
  server: {
    port: 3000,
    host: true, // Listen on all addresses
    open: true  // Auto-open browser
  },

  // Build configuration
  build: {
    // Output directory
    outDir: 'dist',
    
    // Generate source maps for debugging
    sourcemap: true,
    
    // Optimize bundle size
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['@tachui/core'],
          utils: ['./src/utils']
        }
      }
    },
    
    // Asset handling
    assetsDir: 'assets',
    assetsInlineLimit: 4096,
    
    // Modern build optimizations
    target: 'esnext',
    minify: 'esbuild'
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },

  // CSS configuration
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`
      }
    },
    modules: {
      localsConvention: 'camelCase'
    }
  }
})
```

**Advanced Vite Config with Plugins:**
```javascript
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    // Auto-import TachUI functions
    {
      name: 'tachui-auto-import',
      transform(code, id) {
        if (id.endsWith('.js') || id.endsWith('.ts')) {
          // Auto-import frequently used TachUI functions
          const autoImports = [
            'createSignal',
            'createComputed', 
            'createEffect'
          ]
          
          const hasImports = autoImports.some(fn => 
            code.includes(fn) && !code.includes(`import.*${fn}`)
          )
          
          if (hasImports) {
            const importStatement = `import { ${autoImports.join(', ')} } from '@tachui/core';\n`
            return importStatement + code
          }
        }
        return null
      }
    }
  ],

  resolve: {
    alias: {
      '@tachui/core': './src/libs/tachui/index.js',
      '@': resolve(__dirname, 'src')
    }
  }
})
```

### TypeScript Configuration

**Base TypeScript Config (`tsconfig.json`):**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "node",
    "skipLibCheck": true,
    
    /* Bundler mode */
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    
    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    /* Path mapping */
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@styles/*": ["src/styles/*"],
      "@assets/*": ["src/assets/*"],
      "@tachui/core": ["src/libs/tachui/index.js"]
    },
    
    /* Output */
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.js",
    "src/**/*.tsx",
    "src/**/*.jsx"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "tests"
  ]
}
```

### Package.json Scripts

**Recommended Scripts:**
```json
{
  "name": "my-tachui-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "serve": "vite preview --port 4173",
    
    "type-check": "tsc --noEmit",
    "lint": "eslint src --ext .js,.ts,.jsx,.tsx",
    "lint:fix": "eslint src --ext .js,.ts,.jsx,.tsx --fix",
    "format": "prettier --write src/**/*.{js,ts,jsx,tsx,css,md}",
    
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    
    "clean": "rm -rf dist node_modules/.vite",
    "reset": "npm run clean && npm install",
    
    "analyze": "npx vite-bundle-analyzer",
    "size": "npm run build && bundlesize"
  },
  "dependencies": {
    "@tachui/core": "file:./src/libs/tachui"
  },
  "devDependencies": {
    "vite": "^5.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "bundlesize": "^0.18.0"
  }
}
```

## 🎯 Development Workflow

### Local Development

**Start Development Server:**
```bash
npm run dev
```

**Features Available:**
- ✅ **Hot Module Replacement** - Changes reflect instantly
- ✅ **Error Overlay** - Build errors shown in browser
- ✅ **Source Maps** - Debug original code
- ✅ **Live Reloading** - Page refreshes on file changes
- ✅ **TypeScript Checking** - Real-time type checking

**Development Best Practices:**
```javascript
// Use environment variables for configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// Enable development debugging
if (import.meta.env.DEV) {
  console.log('🚀 TachUI App in Development Mode')
  
  // Add development helpers
  window.debugTachUI = {
    signals: [], // Track signals for debugging
    stores: []   // Track stores for debugging
  }
}

// Conditional development features
if (import.meta.env.DEV) {
  // Development-only code
  import('./dev-tools.js').then(devTools => {
    devTools.init()
  })
}
```

### Code Quality

**ESLint Configuration (`.eslintrc.js`):**
```javascript
module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [
    '@typescript-eslint'
  ],
  rules: {
    // TachUI-specific rules
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    
    // Import organization
    'import/order': ['error', {
      'groups': ['builtin', 'external', 'internal', 'parent', 'sibling'],
      'newlines-between': 'always'
    }]
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
          ['@', './src'],
          ['@tachui/core', './src/libs/tachui']
        ]
      }
    }
  }
}
```

**Prettier Configuration (`.prettierrc`):**
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### Testing Setup

**Vitest Configuration (`vite.config.js`):**
```javascript
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'dist/'
      ]
    }
  }
})
```

**Test Setup (`tests/setup.js`):**
```javascript
import { beforeEach } from 'vitest'

// Global test setup
beforeEach(() => {
  // Reset TachUI state between tests
  if (window.TachUI) {
    window.TachUI.resetGlobalState()
  }
  
  // Clear DOM
  document.body.innerHTML = ''
  
  // Reset local storage
  localStorage.clear()
})

// Mock browser APIs if needed
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
```

## 🚀 Production Build

### Build Configuration

**Optimized Production Build:**
```bash
# Build for production
npm run build

# Preview production build locally
npm run preview

# Analyze bundle size
npm run analyze
```

**Build Optimization Tips:**

1. **Code Splitting:**
```javascript
// Dynamic imports for code splitting
const HeavyComponent = lazy(() => import('./components/HeavyComponent'))

// Route-based splitting
const routes = [
  {
    path: '/dashboard',
    component: () => import('./pages/Dashboard')
  }
]
```

2. **Tree Shaking:**
```javascript
// Import only what you need
import { createSignal, createComputed } from '@tachui/core'

// Instead of
import * as TachUI from '@tachui/core'
```

3. **Asset Optimization:**
```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
})
```

### Environment Configuration

**Environment Variables (`.env`):**
```bash
# Development
VITE_APP_TITLE=My TachUI App
VITE_API_URL=http://localhost:3001
VITE_DEBUG=true

# Production (.env.production)
VITE_APP_TITLE=My TachUI App
VITE_API_URL=https://api.myapp.com
VITE_DEBUG=false
```

**Using Environment Variables:**
```javascript
// Access environment variables
const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  debug: import.meta.env.VITE_DEBUG === 'true',
  version: import.meta.env.VITE_APP_VERSION
}

// Environment-specific behavior
if (import.meta.env.PROD) {
  // Production-only code
  console.log = () => {} // Disable console.log in production
}
```

## 📊 Performance Monitoring

### Bundle Analysis

**Analyze Bundle Size:**
```bash
# Install bundle analyzer
npm install -D vite-bundle-analyzer

# Add to package.json scripts
"analyze": "vite-bundle-analyzer"

# Run analysis
npm run analyze
```

**Bundle Size Monitoring:**
```json
// package.json
"bundlesize": [
  {
    "path": "./dist/assets/*.js",
    "maxSize": "250kb",
    "compression": "gzip"
  },
  {
    "path": "./dist/assets/*.css",
    "maxSize": "50kb",
    "compression": "gzip"
  }
]
```

### Performance Optimizations

**Lazy Loading:**
```javascript
// Component lazy loading
const LazyComponent = createSignal(null)

// Load component when needed
function loadComponent() {
  import('./components/HeavyComponent.js')
    .then(module => {
      LazyComponent[1](module.default)
    })
}
```

**Memory Management:**
```javascript
// Cleanup effects when components unmount
const cleanup = createEffect(() => {
  const interval = setInterval(() => {
    // Periodic task
  }, 1000)
  
  // Return cleanup function
  return () => clearInterval(interval)
})
```

## 🚀 Deployment

### Static Hosting

**Vercel:**
```bash
npm install -g vercel
vercel --prod
```

**Netlify:**
```bash
# Build command: npm run build
# Publish directory: dist
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages:**
```bash
# Add to package.json
"deploy": "npm run build && gh-pages -d dist"
```

### Server Deployment

**Express.js Static Server:**
```javascript
// server.js
import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const port = process.env.PORT || 3000

// Serve static files
app.use(express.static(join(__dirname, 'dist')))

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'))
})

app.listen(port, () => {
  console.log(`Server running on port ${port}`)
})
```

**Docker Deployment:**
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
COPY server.js ./

EXPOSE 3000

CMD ["node", "server.js"]
```

## 🎯 Best Practices Summary

### Development
- ✅ Use Vite for fast development
- ✅ Enable TypeScript for type safety
- ✅ Set up ESLint and Prettier
- ✅ Configure path aliases for clean imports
- ✅ Use environment variables for configuration

### Code Organization
- ✅ Organize components by feature
- ✅ Separate stores for state management
- ✅ Create reusable utility functions
- ✅ Use consistent naming conventions

### Performance
- ✅ Implement code splitting
- ✅ Optimize bundle size
- ✅ Monitor performance metrics
- ✅ Clean up resources properly

### Production
- ✅ Enable source maps for debugging
- ✅ Configure proper caching headers
- ✅ Monitor bundle size limits
- ✅ Test production builds locally

---

This comprehensive setup provides a solid foundation for building scalable TachUI applications with modern development practices.