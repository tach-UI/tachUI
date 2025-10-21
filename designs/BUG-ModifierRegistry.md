---
cssclasses:
  - full-page
---

# BUG: Modifier Registry Singleton Pattern Failure

## Problem Summary

The TachUI modifier registry system experiences critical failures where modifiers are successfully registered (102 modifiers) but component lookups return empty results, causing runtime errors like \"modifier not found\" and TypeError exceptions.

## Root Cause Analysis

### ESM Module Isolation Issue

The core problem is **ESM (ES Modules) module isolation** breaking the singleton pattern implementation:

```typescript
// In packages/core/src/modifiers/registry.ts
let registryInstance: ModifierRegistryImpl | null = null  // ❌ Module-scoped

static getInstance(): ModifierRegistryImpl {
  if (!registryInstance) {
    registryInstance = new ModifierRegistryImpl()  // ❌ Each module gets its own copy
  }
  return registryInstance
}
```

### Import Path Fragmentation

Different parts of the system import the registry from different paths:

1. **Modifiers Package**: `@tachui/core/modifiers` → `./registry` 
2. **Builder System**: `./registry` (direct import)
3. **Grid Package**: `@tachui/core/modifiers/registry` (incorrect path)

Each import path creates a separate module instance with its own `registryInstance` variable.

### Evidence from Runtime Logs

```
@tachui/modifiers: Registered 102 modifiers. Registry total: 102
🏗️ Registry instance #1 created: k0gtfi7rs
🔍 getActiveRegistry returning globalModifierRegistry 
Object { registryId: \"k0gtfi7rs\", size: 0 }  // ❌ EMPTY!
🔧 Modifier 'padding' not found, creating lazy modifier
TypeError: (intermediate value)(...).modifier is not a function
```

## Technical Solutions

### Solution 1: Dedicated Registry Plugin (RECOMMENDED)

**Implementation Overview:**
```typescript
// Create @tachui/registry package with single import path
// packages/registry/src/singleton.ts
import { ModifierRegistryImpl } from '@tachui/core/modifiers/registry'

let instance: ModifierRegistryImpl | null = null
const SINGLETON_KEY = Symbol('tachui.registry.singleton')

export function getModifierRegistry(): ModifierRegistryImpl {
  if (!instance) {
    instance = new ModifierRegistryImpl()
    ;(instance as any)[SINGLETON_KEY] = true
    if (process.env.NODE_ENV === 'development') {
      console.log('🏗️ Registry singleton created via @tachui/registry')
    }
  }
  return instance
}

// Prevent external instantiation
export function createModifierRegistry(): never {
  throw new Error(
    'Use getModifierRegistry() from @tachui/registry for singleton access'
  )
}
```

**Pros:**
- ✅ **Single Import Path**: `@tachui/registry` becomes the ONLY way to access registry
- ✅ **Framework Enforcement**: No accidental multiple instances
- ✅ **Clean Architecture**: Dedicated responsibility separation
- ✅ **No Global State**: Module-scoped singleton
- ✅ **Testable**: Easy to mock/replace in tests
- ✅ **Future-Proof**: Extensible for other framework singletons

**Cons:**
- ❌ Requires creating new package
- ❌ Migration effort for existing imports
- ❌ Breaking change for consumers (can be gradual)

**Implementation Steps:**
1. Create `@tachui/registry` package with singleton management
2. Update all imports to use single path: `import { getModifierRegistry } from '@tachui/registry'`
3. Add build-time lint rules to prevent incorrect imports
4. Add runtime validation to detect unauthorized instances
5. Update documentation and provide migration guide

### Solution 2: GlobalThis Pattern

**Implementation Overview:**
```typescript
// Replace module-scoped variable with global object
const GLOBAL_REGISTRY_KEY = Symbol.for('tachui.modifierRegistry')

export class ModifierRegistryImpl implements ModifierRegistry {
  static getInstance(): ModifierRegistryImpl {
    const globalObj = globalThis ?? global ?? window ?? {}
    
    if (!globalObj[GLOBAL_REGISTRY_KEY]) {
      globalObj[GLOBAL_REGISTRY_KEY] = new ModifierRegistryImpl()
    }
    
    return globalObj[GLOBAL_REGISTRY_KEY] as ModifierRegistryImpl
  }
}
```

**Pros:**
- ✅ Works across all module systems (ESM, CommonJS, AMD)
- ✅ Environment agnostic (browser, Node.js, workers)
- ✅ Zero configuration required
- ✅ Minimal performance overhead
- ✅ Proven pattern used by major libraries

**Cons:**
- ❌ Uses global state (mitigated by Symbol namespacing)
- ❌ Requires careful cleanup in test environments

**Implementation Steps:**
1. Replace `registryInstance` module variable with global Symbol access
2. Add development-only warnings for multiple instances
3. Add test cleanup utilities
4. Update documentation with global state usage

### Solution 2: Module Federation Pattern

**Implementation Overview:**
```typescript
// Create dedicated singleton module
// packages/core/src/modifiers/singleton.ts
let instance: ModifierRegistryImpl | null = null

export function getRegistry(): ModifierRegistryImpl {
  if (!instance) {
    instance = new ModifierRegistryImpl()
  }
  return instance
}

// All imports use this single source:
import { getRegistry } from '@tachui/core/modifiers/singleton'
```

**Pros:**
- ✅ Clean dependency management
- ✅ Explicit singleton access
- ✅ No global state pollution

**Cons:**
- ❌ Requires all existing code to change import paths
- ❌ Breaking change for consumers
- ❌ More complex refactoring

**Implementation Steps:**
1. Create new singleton module
2. Update all import statements across codebase
3. Add migration guide for consumers
4. Update TypeScript declarations

### Solution 3: Dependency Injection Pattern

**Implementation Overview:**
```typescript
// Pass registry through component initialization
interface ComponentConfig {
  registry?: ModifierRegistry
}

const defaultConfig: ComponentConfig = {
  registry: new ModifierRegistryImpl() // Creates new instance
}

// Allow override:
setComponentConfig({ registry: sharedRegistry })

// Usage in components:
const registry = config.registry ?? createRegistry()
```

**Pros:**
- ✅ Explicit dependencies
- ✅ Testable with mock registries
- ✅ No global state

**Cons:**
- ❌ Requires configuration in every component
- ❌ Complex for large component trees
- ❌ Breaking change for component API

**Implementation Steps:**
1. Add registry parameter to component constructors
2. Create configuration system for registry injection
3. Update all component creation sites
4. Add TypeScript interfaces for configuration

### Solution 4: Service Locator Pattern

**Implementation Overview:**
```typescript
class RegistryLocator {
  private static services = new Map<string, any>()
  
  static register<T>(key: string, service: T): void {
    this.services.set(key, service)
  }
  
  static resolve<T>(key: string): T {
    return this.services.get(key)
  }
}

// Usage:
RegistryLocator.register('modifierRegistry', new ModifierRegistryImpl())
const registry = RegistryLocator.resolve<ModifierRegistry>('modifierRegistry')
```

**Pros:**
- ✅ Centralized service management
- ✅ Flexible service registration
- ✅ No direct global state exposure

**Cons:**
- ❌ Still uses global state internally
- ❌ More complex than necessary
- ❌ Requires service registration calls

**Implementation Steps:**
1. Create RegistryLocator class
2. Register services at application startup
3. Update all registry access points
4. Add error handling for missing services

## Recommended Solution: Dedicated Registry Plugin

### Rationale

The **Dedicated Registry Plugin** is now recommended because:

1. **Architecturally Superior**: Clean separation of concerns with dedicated singleton management
2. **Framework Control**: Single import path enforced by design
3. **No Global Pollution**: Module-scoped state instead of global state
4. **Better Testing**: Easy mocking and cleanup without global side effects
5. **Future Extensible**: Can manage other framework singletons
6. **Developer Experience**: Clear error messages and enforcement

### Plugin Architecture

```
@tachui/registry/
├── src/
│   ├── index.ts              # Single export point
│   ├── singleton.ts          # Singleton management
│   ├── validation.ts         # Runtime validation
│   └── types.ts              # Type definitions
├── package.json
└── README.md
```

### Migration Strategy

#### Phase 1: Create Plugin (Non-Breaking)
- Create `@tachui/registry` package
- Keep existing imports working with deprecation warnings
- Add new single-path API

#### Phase 2: Gradual Migration
- Update internal packages first
- Update public APIs with backward compatibility
- Add comprehensive testing

#### Phase 3: Enforcement
- Add lint rules preventing incorrect imports
- Update documentation
- Remove deprecated exports in future major version

### Implementation Plan

#### Phase 1: Core Fix
```typescript
// File: packages/core/src/modifiers/registry.ts
const GLOBAL_REGISTRY_KEY = Symbol.for('tachui.modifierRegistry')

export class ModifierRegistryImpl implements ModifierRegistry {
  static getInstance(): ModifierRegistryImpl {
    const globalObj = globalThis ?? global ?? window ?? {}
    
    if (!globalObj[GLOBAL_REGISTRY_KEY]) {
      globalObj[GLOBAL_REGISTRY_KEY] = new ModifierRegistryImpl()
      if (process.env.NODE_ENV === 'development') {
        console.log('🏗️ Created global ModifierRegistryImpl instance', { 
          instanceId: globalObj[GLOBAL_REGISTRY_KEY].__registryId 
        })
      }
    }
    
    return globalObj[GLOBAL_REGISTRY_KEY] as ModifierRegistryImpl
  }
}

// Remove module-scoped registryInstance variable
// let registryInstance: ModifierRegistryImpl | null = null
```

#### Phase 2: Safety Measures
```typescript
// Add development warnings
if (process.env.NODE_ENV === 'development') {
  const instanceCount = Object.keys(globalThis)
    .filter(key => key.startsWith('tachui.modifierRegistry'))
    .length
  
  if (instanceCount > 1) {
    console.warn('⚠️ Multiple registry instances detected')
  }
}

// Add test cleanup
export function __testResetRegistry(): void {
  const globalObj = globalThis ?? global ?? window ?? {}
  delete globalObj[GLOBAL_REGISTRY_KEY]
}
```

#### Phase 3: Documentation Updates
- Update AGENTS.md with global state usage
- Add troubleshooting section for registry issues
- Document test cleanup utilities

### Expected Results

#### Before Fix:
```
Registry instance #1: abc123 (registration)
Registry instance #2: abc123 (lookup, empty)
❌ Modifier 'padding' not found
```

#### After Fix:
```
Registry instance #1: abc123 (shared globally)
✅ Modifier 'padding' found, applied successfully
```

### Risk Assessment

- **Risk Level**: LOW
- **Breaking Changes**: NONE
- **Testing Required**: Integration tests for registry sharing
- **Rollback Plan**: Revert to module-scoped variable

### Alternative Solutions Considered

1. **Module Federation**: Requires extensive refactoring
2. **Dependency Injection**: Complex component tree changes
3. **Service Locator**: Over-engineering for this use case
4. **Build-time Deduplication**: Build tool specific, unreliable

## Updated Analysis: Registry Plugin Confirmed as Best Solution

### Fresh Perspective After Implementation Attempts

After attempting consistent import path fixes and encountering recurring failures, the **Registry Plugin approach is confirmed as the correct architectural solution**.

#### Why Import Path Unification Keeps Failing

1. **ESM Module Instance Isolation**: Even with consistent paths, different bundler configurations can create separate module instances
2. **Dependency Graph Complexity**: Complex monorepo setups can cause the same module to be resolved multiple times
3. **TypeScript Module Resolution**: Different `moduleResolution` settings can break singleton patterns
4. **Build Tool Variations**: Vite, Rollup, and Webpack handle module deduplication differently

#### Enhanced Registry Plugin Implementation

```typescript
// @tachui/registry/src/index.ts
export interface ModifierRegistryAPI {
  // Core framework usage
  getModifierRegistry(): ModifierRegistry
  
  // Developer extension API  
  registerModifier<T>(name: string, factory: ModifierFactory<T>): void
  hasModifier(name: string): boolean
  createCustomModifier<T>(name: string, implementation: T): Modifier
  
  // Development tools
  listModifiers(): string[]
  validateRegistry(): RegistryHealth
  
  // Testing support
  resetRegistry(): void // Test-only
  createIsolatedRegistry(): ModifierRegistry // Test-only
}

interface RegistryHealth {
  totalModifiers: number
  duplicateNames: string[]
  orphanedReferences: string[]
  instanceId: string
}
```

#### Developer Extension Use Cases

**Custom Modifier Registration:**
```typescript
import { registerModifier } from '@tachui/registry'

// Register custom modifier
registerModifier('glassmorphism', (intensity: number) => ({
  type: 'glassmorphism',
  priority: 100,
  properties: { intensity },
  apply: (node, context) => {
    node.style.backdropFilter = `blur(${intensity}px)`
    node.style.background = 'rgba(255, 255, 255, 0.1)'
    return node
  }
}))

// Usage in components
Text('Hello').glassmorphism(10).build()
```

**Plugin Development:**
```typescript
// Third-party plugin: @company/tachui-animations
import { getModifierRegistry } from '@tachui/registry'

export function installAnimationPlugin() {
  const registry = getModifierRegistry()
  
  registry.register('slideIn', createSlideInModifier)
  registry.register('fadeOut', createFadeOutModifier)
  registry.register('bounce', createBounceModifier)
}
```

**Runtime Debugging:**
```typescript
import { validateRegistry, listModifiers } from '@tachui/registry'

// Development debugging
if (process.env.NODE_ENV === 'development') {
  const health = validateRegistry()
  console.log(`Registry Health:`, health)
  console.log(`Available Modifiers:`, listModifiers())
}
```

#### Migration Benefits for Developers

1. **Single Import Path**: `import { ... } from '@tachui/registry'` - impossible to use wrong path
2. **Type Safety**: Full TypeScript support for custom modifier registration
3. **Development Tools**: Built-in debugging and validation
4. **Plugin Ecosystem**: Foundation for third-party modifier plugins
5. **Testing Support**: Isolated registries for unit tests

#### Implementation Timeline

**Phase 1: Core Plugin (Week 1)**
- Create `@tachui/registry` package
- Implement singleton management with developer API
- Add comprehensive TypeScript definitions

**Phase 2: Internal Migration (Week 2)**  
- Update all TachUI packages to use `@tachui/registry`
- Add lint rules to prevent old import patterns
- Update build configurations

**Phase 3: Developer Documentation (Week 3)**
- Create modifier extension guide
- Add plugin development examples
- Document testing strategies

**Phase 4: Public API (Week 4)**
- Release with backward compatibility
- Deprecation warnings for old imports
- Migration guide for existing projects

#### Risk Mitigation

1. **Backward Compatibility**: Maintain old exports with deprecation warnings
2. **Gradual Migration**: Internal packages first, then public API
3. **Comprehensive Testing**: Registry isolation in test environments
4. **Documentation**: Clear migration path and examples
5. **Rollback Plan**: Can revert to current approach if needed

## Final Conclusion

The **Registry Plugin approach is the definitive solution** because:

1. **Solves Root Cause**: Eliminates ESM module isolation by architectural design
2. **Developer-Friendly**: Provides clean API for custom modifiers and plugins  
3. **Future-Proof**: Foundation for extensible modifier ecosystem
4. **One-Time Cost**: Migration pain is front-loaded, problem permanently solved
5. **Better Performance**: Eliminates duplicate module instances, improves bundle efficiency

The GlobalThis pattern was considered but rejected due to architectural concerns and preference for clean module-based solutions. The Registry Plugin provides the same singleton guarantees without global state pollution.