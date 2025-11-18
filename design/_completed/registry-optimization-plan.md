# Registry Optimization Plan

## Goal
Reduce production bundle from 11KB → 4-5KB while preserving full plugin ecosystem support.

## Architecture: Dual Export Strategy

```
@tachui/registry
├── src/
│   ├── core/              # Production code (~4-5KB)
│   │   ├── registry.ts    # Core ModifierRegistry class
│   │   ├── metadata.ts    # Metadata & plugin registration
│   │   ├── validation.ts  # Security validation
│   │   └── types.ts       # Core types
│   │
│   ├── dev/               # Development code (~3-4KB)
│   │   ├── diagnostics.ts # getDiagnostics, validateRegistry
│   │   ├── testing.ts     # createIsolatedRegistry, reset
│   │   └── logger.ts      # All console.* statements
│   │
│   ├── index.ts           # Production entry (imports core only)
│   └── dev.ts             # Development entry (imports core + dev)
```

## Implementation Strategy

### 1. Core Registry (Production) - `src/core/registry.ts`

**Keep in production:**
```typescript
class ModifierRegistryImpl {
  // Core storage
  private modifiers = new Map<string, ModifierFactory>()
  private lazyLoaders = new Map<string, ModifierLoader>()
  private loadingPromises = new Map<string, Promise<ModifierFactory>>()

  // Plugin ecosystem support
  private metadata = new Map<string | symbol, ModifierMetadata>()
  private plugins = new Map<string, PluginInfo>()

  // Essential methods
  register(name, factory) { ... }
  registerLazy(name, loader) { ... }
  get(name, options?) { ... }
  has(name) { ... }
  list() { ... }

  // Plugin ecosystem
  registerMetadata(metadata) { ... }
  registerPlugin(info) { ... }
  getMetadata(name) { ... }
  getAllMetadata() { ... }
  getModifiersByCategory(category) { ... }
  getConflicts() { ... }  // Simple version
  listPlugins() { ... }
}
```

**Remove from production:**
- ❌ Instance counting (`static instanceCount`)
- ❌ Instance ID tracking (`instanceId`, `createdAt`)
- ❌ All console.log/warn/error
- ❌ `getDiagnostics()` method
- ❌ Feature flags (use compile-time flags instead)
- ❌ Metadata history tracking (keep only current metadata)
- ❌ Complex conflict tracking with history

### 2. Development Features - `src/dev/`

**Move to `@tachui/registry/dev`:**
```typescript
// dev/diagnostics.ts
export function getDiagnostics(registry: ModifierRegistry) {
  return {
    modifierCount: registry.list().length,
    // ... detailed diagnostics
  }
}

export function validateRegistryDetailed(registry: ModifierRegistry) {
  // Enhanced validation with warnings
  console.log('🔍 Validating registry...')
  // ...
}

// dev/testing.ts
export function createIsolatedRegistry(): ModifierRegistry { ... }
export function resetGlobalRegistry(): void { ... }

// dev/logger.ts
export function enableRegistryLogging(registry: ModifierRegistry) {
  // Wrap methods with logging
}
```

### 3. Update Package Exports

**package.json:**
```json
{
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./dev": {
      "types": "./dist/dev.d.ts",
      "import": "./dist/dev.js"
    }
  }
}
```

### 4. Build Configuration Improvements

**vite.config.ts:**
```typescript
export default defineConfig(({ mode }) => ({
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode),
    '__DEV__': mode !== 'production'
  },
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        dev: resolve(__dirname, 'src/dev.ts')
      },
      formats: ['es']
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        dead_code: true,
        drop_console: mode === 'production', // Remove console in prod
        pure_funcs: mode === 'production' ? ['console.log', 'console.warn'] : []
      }
    },
    rollupOptions: {
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false
      }
    }
  }
}))
```

## Size Targets

| Component | Production | Development | Total |
|-----------|-----------|-------------|-------|
| Core registry methods | 1.5KB | - | 1.5KB |
| Lazy loading | 0.8KB | - | 0.8KB |
| Plugin + metadata | 1.0KB | - | 1.0KB |
| Conflict detection | 0.7KB | 0.5KB extra | 1.2KB |
| Validation | 0.3KB | - | 0.3KB |
| Error handling | 0.2KB | - | 0.2KB |
| Diagnostics | - | 0.5KB | 0.5KB |
| Console logging | - | 1.5KB | 1.5KB |
| Test utilities | - | 0.8KB | 0.8KB |
| Feature flags | - | 0.5KB | 0.5KB |
| History tracking | - | 0.7KB | 0.7KB |
| **TOTAL** | **~4.5KB** | **~4KB** | **~8.5KB** |

## Migration Guide

### Before (11KB always loaded):
```typescript
import { globalModifierRegistry, validateRegistry } from '@tachui/registry'
```

### After (4.5KB production):
```typescript
// Production code - only loads core
import { globalModifierRegistry } from '@tachui/registry'

// Development/testing - loads dev features too
import { validateRegistry, getDiagnostics } from '@tachui/registry/dev'
```

## Benefits

1. ✅ **~60% smaller production bundle** (11KB → 4.5KB)
2. ✅ **Full plugin ecosystem support preserved**
3. ✅ **All dev tools still available when needed**
4. ✅ **Better tree-shaking for user apps**
5. ✅ **Clear separation of concerns**
6. ✅ **No breaking changes** (both imports still work)

## Implementation Phases

### Phase 1: Extract dev features
- [ ] Create `src/dev/` directory structure
- [ ] Move diagnostics to `dev/diagnostics.ts`
- [ ] Move test utilities to `dev/testing.ts`
- [ ] Create logger wrapper for optional logging

### Phase 2: Optimize core
- [ ] Remove instance tracking from core
- [ ] Simplify conflict detection
- [ ] Remove console.* from core methods
- [ ] Update vite config with proper define/minify

### Phase 3: Update exports
- [ ] Update package.json exports
- [ ] Build both bundles
- [ ] Verify size targets

### Phase 4: Update consumers
- [ ] Update tests to use `@tachui/registry/dev`
- [ ] Update build scripts to use dev import
- [ ] Document the split in README

## Notes

- Keep metadata/plugin registration in production (needed for ecosystem)
- Conflict detection stays in production (users need to know about conflicts)
- History tracking can be dev-only (only for debugging)
- Console logs should be completely eliminated in production builds
