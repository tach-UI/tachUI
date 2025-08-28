# TachUI Plugin System

The TachUI Plugin System enables modular development, bundle size optimization, and extensible framework architecture. This streamlined system allows developers to create, install, and manage plugins that extend TachUI's core functionality.

## Overview

The simplified plugin system provides:

- **Modular Architecture**: Separate complex features into optional plugins
- **Bundle Optimization**: 40-60% smaller bundles for basic applications
- **Type Safety**: Complete TypeScript integration with clean interfaces
- **Lifecycle Management**: Install and uninstall plugins with automatic cleanup
- **Zero Configuration**: Plugins work out of the box with minimal setup
- **Performance Focused**: Streamlined architecture for maximum performance

## Quick Start

### Installing a Plugin

```typescript
import { installPlugin } from '@tachui/core'
import { FormsPlugin } from '@tachui/forms'

// Install the forms plugin
await installPlugin(FormsPlugin)
```

### Creating a Simple Plugin

```typescript
import { type TachUIPlugin, type TachUIInstance } from '@tachui/core'

const MyPlugin: TachUIPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom TachUI plugin',
  
  async install(instance: TachUIInstance) {
    // Register components and services
    instance.registerComponent('MyComponent', MyComponent, {
      category: 'custom',
      tags: ['example']
    })
    instance.registerService('myService', new MyService())
  },
  
  async uninstall() {
    // Optional cleanup - components and services are automatically removed
    console.log('My plugin uninstalled')
  }
}

export default MyPlugin
```

## Core Concepts

### Plugin Definition

A plugin is defined using the simplified `TachUIPlugin` interface:

```typescript
interface TachUIPlugin {
  name: string                    // Unique plugin name
  version: string                 // Semantic version
  description?: string            // Optional plugin description
  
  // Lifecycle methods
  install(instance: TachUIInstance): void | Promise<void>
  uninstall?(): void | Promise<void>
}
```

### Component Registration Options

```typescript
interface ComponentRegistrationOptions {
  category?: string               // Component category (e.g., 'forms', 'layout')
  tags?: string[]                // Component tags for discovery
}
```

### TachUI Instance API

The simplified `TachUIInstance` provides essential registration APIs for plugins:

```typescript
interface TachUIInstance {
  // Component registration
  registerComponent(name: string, component: Component, options?: ComponentRegistrationOptions): void
  
  // Service registration
  registerService(name: string, service: any): void
  getService<T = any>(name: string): T | undefined
  hasService(name: string): boolean
  unregisterService(name: string): boolean
  
  // Plugin management
  installPlugin(plugin: TachUIPlugin): Promise<void>
  uninstallPlugin(pluginName: string): Promise<void>
  isPluginInstalled(pluginName: string): boolean
  getInstalledPlugins(): string[]
  
  // Component registry access
  components: {
    has(name: string): boolean
    get(name: string): ComponentRegistration | undefined
    list(): ComponentRegistration[]
    listByCategory(category: string): ComponentRegistration[]
  }
  
  // System management
  reset(): Promise<void>
  getStats(): SystemStats
}
```

## Plugin Development

### Creating a Plugin

Define plugins using the simple `TachUIPlugin` interface:

```typescript
import { type TachUIPlugin } from '@tachui/core'

const MyAdvancedPlugin: TachUIPlugin = {
  name: '@myorg/advanced-plugin',
  version: '2.1.0',
  description: 'Advanced plugin with multiple components and services',
  
  async install(instance) {
    // Register multiple components
    instance.registerComponent('AdvancedList', AdvancedList, {
      category: 'data',
      tags: ['list', 'virtual', 'performance']
    })
    
    instance.registerComponent('DataGrid', DataGrid, {
      category: 'data',
      tags: ['grid', 'table', 'sortable']
    })
    
    // Register services
    instance.registerService('dataProcessor', new DataProcessor())
    instance.registerService('cacheService', new CacheService())
    
    console.log('Advanced plugin installed successfully')
  },
  
  async uninstall() {
    // Custom cleanup if needed
    console.log('Advanced plugin cleanup completed')
  }
}
```

### Component Registration

Register components with category and tags for organization:

```typescript
// Basic registration
instance.registerComponent('MyButton', MyButton)

// Registration with metadata
instance.registerComponent('MyAdvancedButton', MyAdvancedButton, {
  category: 'input',           // Component category
  tags: ['button', 'interactive', 'form']
})

// Form components registration
instance.registerComponent('EmailField', EmailField, {
  category: 'forms',
  tags: ['input', 'email', 'validation']
})

instance.registerComponent('PhoneField', PhoneField, {
  category: 'forms', 
  tags: ['input', 'phone', 'formatting']
})
```

### Service Registration

Register services for shared functionality:

```typescript
const MyPlugin: TachUIPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async install(instance) {
    // Simple service registration
    instance.registerService('apiClient', new ApiClient())
    
    // Service with configuration
    const config = {
      apiUrl: 'https://api.example.com',
      timeout: 5000,
      retries: 3
    }
    instance.registerService('httpService', new HttpService(config))
    
    // Utility service
    instance.registerService('formatters', {
      currency: (value: number) => `$${value.toFixed(2)}`,
      date: (value: Date) => value.toLocaleDateString(),
      phone: (value: string) => value.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3')
    })
  }
}
```

## Plugin Management

### Installing Plugins

```typescript
import { globalTachUIInstance } from '@tachui/core'
// OR import your specific instance
// import { myTachUIInstance } from './my-instance'

// Simple installation using global instance
await globalTachUIInstance.installPlugin(MyPlugin)

// Or create your own instance
import { SimplifiedTachUIInstance } from '@tachui/core'
const instance = new SimplifiedTachUIInstance()
await instance.installPlugin(MyPlugin)
```

### Plugin Lifecycle Management

```typescript
import { globalTachUIInstance } from '@tachui/core'

// Check if plugin is installed
if (globalTachUIInstance.isPluginInstalled('my-plugin')) {
  console.log('Plugin is installed')
}

// Uninstall plugin
await globalTachUIInstance.uninstallPlugin('my-plugin')

// Get all installed plugins
const pluginNames = globalTachUIInstance.getInstalledPlugins()
console.log('Installed plugins:', pluginNames)

// Get system statistics
const stats = globalTachUIInstance.getStats()
console.log('System stats:', {
  plugins: stats.plugins.installed,
  components: stats.components.totalComponents,
  services: stats.services.registered
})
```

### Component Discovery

Discover and inspect registered components:

```typescript
import { globalTachUIInstance } from '@tachui/core'

// Check if component exists
if (globalTachUIInstance.components.has('EmailField')) {
  console.log('EmailField is available')
}

// Get component registration info
const emailField = globalTachUIInstance.components.get('EmailField')
console.log('EmailField info:', {
  name: emailField?.name,
  category: emailField?.category,
  tags: emailField?.tags,
  plugin: emailField?.plugin
})

// List all components in a category
const formComponents = globalTachUIInstance.components.listByCategory('forms')
console.log('Form components:', formComponents.map(c => c.name))

// List all components
const allComponents = globalTachUIInstance.components.list()
console.log('All components:', allComponents.length)
```

## Plugin Development Helpers

### Batch Component Registration

```typescript
const MyFormsPlugin: TachUIPlugin = {
  name: 'my-forms-plugin',
  version: '1.0.0',
  
  async install(instance) {
    // Register multiple form components
    const formComponents = [
      { name: 'MyTextField', component: MyTextField },
      { name: 'MySelectField', component: MySelectField },
      { name: 'MyCheckboxField', component: MyCheckboxField },
      { name: 'MyRadioGroup', component: MyRadioGroup }
    ]
    
    formComponents.forEach(({ name, component }) => {
      instance.registerComponent(name, component, {
        category: 'forms',
        tags: ['input', 'form', 'validation']
      })
    })
    
    // Register form utilities
    instance.registerService('formValidation', new FormValidationService())
    instance.registerService('formState', new FormStateManager())
  }
}
```

### Plugin Testing

```typescript
import { SimplifiedTachUIInstance } from '@tachui/core'
import { describe, it, expect, beforeEach } from 'vitest'

describe('MyPlugin', () => {
  let instance: SimplifiedTachUIInstance
  
  beforeEach(() => {
    instance = new SimplifiedTachUIInstance()
  })
  
  it('should install and register components', async () => {
    await instance.installPlugin(MyPlugin)
    
    // Verify plugin is installed
    expect(instance.isPluginInstalled('my-plugin')).toBe(true)
    
    // Verify components are registered
    expect(instance.components.has('MyComponent')).toBe(true)
    
    // Verify services are registered
    expect(instance.hasService('myService')).toBe(true)
  })
  
  it('should uninstall cleanly', async () => {
    await instance.installPlugin(MyPlugin)
    await instance.uninstallPlugin('my-plugin')
    
    // Verify plugin is uninstalled
    expect(instance.isPluginInstalled('my-plugin')).toBe(false)
    
    // Verify components are removed
    expect(instance.components.has('MyComponent')).toBe(false)
  })
})
```

## Best Practices

### Plugin Structure

```
my-plugin/
├── src/
│   ├── components/          # Plugin components
│   ├── modifiers/          # Custom modifiers
│   ├── utils/              # Plugin utilities
│   ├── types.ts            # TypeScript types
│   └── index.ts            # Plugin entry point
├── docs/                   # Plugin documentation
├── tests/                  # Plugin tests
├── package.json
└── README.md
```

### Plugin Entry Point

```typescript
// src/index.ts
import { type TachUIPlugin } from '@tachui/core'
import { MyComponent, MyOtherComponent } from './components'
import { MyService } from './services'
import { formatUtils } from './utils'

const MyPlugin: TachUIPlugin = {
  name: '@myorg/my-plugin',
  version: '1.0.0',
  description: 'My awesome TachUI plugin',
  
  async install(instance) {
    // Register all components
    instance.registerComponent('MyComponent', MyComponent, {
      category: 'custom',
      tags: ['example', 'demo']
    })
    
    instance.registerComponent('MyOtherComponent', MyOtherComponent, {
      category: 'custom',
      tags: ['example', 'utility']
    })
    
    // Register services
    instance.registerService('myService', new MyService())
    instance.registerService('formatUtils', formatUtils)
  }
}

// Export plugin and components for direct use
export default MyPlugin
export { MyComponent, MyOtherComponent, MyService, formatUtils }
export type * from './types'
```

### Error Handling

```typescript
const MyPlugin: TachUIPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  
  async install(instance) {
    try {
      // Plugin installation logic
      const dbService = await setupDatabase()
      instance.registerService('database', dbService)
      
      instance.registerComponent('MyComponent', MyComponent, {
        category: 'data',
        tags: ['database', 'crud']
      })
      
      console.log('Plugin installed successfully')
    } catch (error) {
      // Clean up on failure
      await cleanup()
      throw new Error(`Failed to install my-plugin: ${error.message}`)
    }
  },
  
  async uninstall() {
    try {
      // Custom cleanup - components and services are automatically cleaned up
      const dbService = globalTachUIInstance.getService('database')
      await dbService?.disconnect()
    } catch (error) {
      console.warn('Cleanup error in my-plugin:', error)
      // Don't throw - allow uninstallation to complete
    }
  }
}
```

### Performance Considerations

```typescript
const MyPerformancePlugin: TachUIPlugin = {
  name: 'performance-plugin',
  version: '1.0.0',
  
  async install(instance) {
    // Lazy load heavy components only when needed
    const { HeavyDataGrid } = await import('./components/HeavyDataGrid')
    instance.registerComponent('HeavyDataGrid', HeavyDataGrid, {
      category: 'data',
      tags: ['performance', 'virtual', 'grid']
    })
    
    // Register lightweight utility components immediately
    instance.registerComponent('LoadingSpinner', LoadingSpinner, {
      category: 'ui',
      tags: ['loading', 'spinner']
    })
    
    // Use shared services for expensive operations
    instance.registerService('dataCache', new DataCacheService())
    instance.registerService('virtualizer', new VirtualizationService())
    
    console.log('Performance plugin loaded efficiently')
  }
}
```

## Troubleshooting

### Common Issues

1. **Plugin Not Loading**
   ```typescript
   // Check if plugin is installed
   if (!globalTachUIInstance.isPluginInstalled('my-plugin')) {
     await globalTachUIInstance.installPlugin(MyPlugin)
   }
   ```

2. **Component Already Registered**
   ```typescript
   // Check if component exists before registering
   if (!instance.components.has('MyButton')) {
     instance.registerComponent('MyButton', MyButton)
   }
   ```

3. **Service Not Found**
   ```typescript
   // Check service availability
   if (instance.hasService('myService')) {
     const service = instance.getService('myService')
     // Use service safely
   } else {
     console.warn('Service myService not available')
   }
   ```

### Debugging Plugins

Use console logging and stats for debugging:

```typescript
const MyPlugin: TachUIPlugin = {
  name: 'debug-plugin',
  version: '1.0.0',
  
  async install(instance) {
    console.log('Installing debug plugin...')
    
    // Get stats before installation
    const statsBefore = instance.getStats()
    console.log('Stats before:', statsBefore)
    
    // Register components
    instance.registerComponent('DebugComponent', DebugComponent)
    instance.registerService('debugService', new DebugService())
    
    // Get stats after installation
    const statsAfter = instance.getStats()
    console.log('Stats after:', statsAfter)
    
    console.log('Debug plugin installed successfully')
  }
}
```

## Plugin Ecosystem

### Official Plugins

- [`@tachui/forms`](./plugins/forms.md) - Advanced form components and validation (95KB)
- `@tachui/navigation` - Navigation patterns and routing (46KB)
- `@tachui/symbols` - Icon and symbol components (lightweight)
- `@tachui/charts` - Chart components (future release)
- `@tachui/ui` - Polish components like alerts and toasts (future release)

### Community Plugins

Community plugins follow the naming convention `tachui-plugin-*` or `@scope/tachui-*`.

### Plugin Discovery

Find plugins using npm search:
```bash
npm search tachui-plugin
npm search @tachui
```

## API Reference

### Core Types

```typescript
// Main plugin interface
interface TachUIPlugin {
  name: string
  version: string
  description?: string
  install(instance: TachUIInstance): void | Promise<void>
  uninstall?(): void | Promise<void>
}

// Component registration
interface ComponentRegistrationOptions {
  category?: string
  tags?: string[]
}

// Component registry entry
interface ComponentRegistration {
  name: string
  component: Component
  category?: string
  tags?: string[]
  plugin?: string
}

// System statistics
interface SystemStats {
  plugins: {
    installed: number
    list: string[]
  }
  components: {
    totalComponents: number
    categories: Record<string, number>
    plugins: Record<string, number>
    tags: Record<string, number>
  }
  services: {
    registered: number
    list: string[]
  }
}
```

### Core Classes

```typescript
// Main TachUI instance
class SimplifiedTachUIInstance implements TachUIInstance {
  // Plugin management
  installPlugin(plugin: TachUIPlugin): Promise<void>
  uninstallPlugin(pluginName: string): Promise<void>
  isPluginInstalled(pluginName: string): boolean
  getInstalledPlugins(): string[]
  
  // Component registration
  registerComponent(name: string, component: Component, options?: ComponentRegistrationOptions): void
  components: SimplifiedComponentRegistry
  
  // Service management
  registerService(name: string, service: any): void
  getService<T = any>(name: string): T | undefined
  hasService(name: string): boolean
  unregisterService(name: string): boolean
  
  // System management
  reset(): Promise<void>
  getStats(): SystemStats
}
```

For complete API documentation, see the TypeScript definitions in the `@tachui/core` package. All plugin interfaces are fully typed with comprehensive IntelliSense support.