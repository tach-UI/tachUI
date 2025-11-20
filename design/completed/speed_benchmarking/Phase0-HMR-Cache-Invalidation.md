# Phase 0: HMR Cache Invalidation Mechanism

**Date**: 2025-10-21
**Purpose**: Specify HMR cache invalidation for proxy-based modifier system
**Related**: SwiftModifiers-Implementation-Plan.md Phase 2

## Overview

The proxy-based modifier system uses WeakMaps to cache:
1. **Proxy instances**: `WeakMap<Component, ComponentProxy>`
2. **Modifier functions**: `WeakMap<Component, Map<string | symbol, Function>>`

During Hot Module Replacement (HMR) in development, these caches must be invalidated to reflect code changes immediately.

## Problem Statement

### Without HMR Cache Invalidation

```typescript
// Developer modifies modifier implementation
export function padding(value: number) {
  return (component) => {
    console.log('NEW: Applying padding', value) // Added debug log
    component.style.padding = `${value}px`
  }
}
```

**Issue**: Cached modifier functions still use old implementation
- ❌ Debug log never appears
- ❌ Changes require full page reload
- ❌ Poor developer experience

### With HMR Cache Invalidation

```typescript
// HMR detects change and invalidates caches
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    invalidateModifierCaches()
  })
}
```

**Result**:
- ✅ Debug log appears immediately
- ✅ Changes apply without full reload
- ✅ Smooth development experience

## Architecture

### Cache Structure

```typescript
// packages/core/src/modifiers/proxy-cache.ts

/**
 * Global caches for proxy-based modifier system
 */

// Cache 1: Component -> Proxy mapping
export const proxyCache = new WeakMap<Component, ComponentProxy>()

// Cache 2: Component -> Modifier functions mapping
export const modifierFunctionCache = new WeakMap<
  Component,
  Map<string | symbol, Function>
>()

// Cache 3: Proxy creation count (for debugging)
export const proxyCacheStats = {
  created: 0,
  hits: 0,
  invalidations: 0,
}
```

### Invalidation API

```typescript
// packages/core/src/modifiers/proxy-cache.ts

/**
 * Invalidate all modifier caches
 * Called during HMR to refresh modifier implementations
 */
export function invalidateModifierCaches(): void {
  // WeakMaps don't have a clear() method
  // Instead, we need to recreate them

  // Note: Old caches will be garbage collected automatically
  // when all references are released

  if (process.env.NODE_ENV === 'development') {
    console.log('🔄 HMR: Invalidating modifier caches')
    proxyCacheStats.invalidations++
  }

  // Strategy: Use versioning to invalidate without clearing WeakMaps
  incrementCacheVersion()
}

/**
 * Cache version for HMR invalidation
 */
let cacheVersion = 0

export function getCacheVersion(): number {
  return cacheVersion
}

export function incrementCacheVersion(): void {
  cacheVersion++

  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 Cache version incremented to ${cacheVersion}`)
  }
}
```

### Version-Based Invalidation

```typescript
// packages/core/src/modifiers/proxy-system.ts

import { getCacheVersion, proxyCache, modifierFunctionCache } from './proxy-cache'

/**
 * Cached proxy data with version
 */
interface CachedProxyData {
  proxy: ComponentProxy
  version: number
}

/**
 * Enhanced cache with versioning
 */
const versionedProxyCache = new WeakMap<Component, CachedProxyData>()

/**
 * Get or create proxy for component
 */
export function getComponentProxy(component: Component): ComponentProxy {
  const currentVersion = getCacheVersion()
  const cached = versionedProxyCache.get(component)

  // Check if cached proxy is still valid
  if (cached && cached.version === currentVersion) {
    proxyCacheStats.hits++
    return cached.proxy
  }

  // Create new proxy
  const proxy = createComponentProxy(component)

  versionedProxyCache.set(component, {
    proxy,
    version: currentVersion,
  })

  proxyCacheStats.created++
  return proxy
}
```

## HMR Integration

### Vite Integration

```typescript
// packages/core/src/modifiers/hmr.ts

/**
 * Register HMR handlers for modifier cache invalidation
 */
export function registerModifierHMR() {
  if (!import.meta.hot) return

  // Accept HMR updates for modifier modules
  import.meta.hot.accept((newModule) => {
    if (newModule) {
      invalidateModifierCaches()

      // Re-register modifiers with new implementations
      if (typeof newModule.registerModifiers === 'function') {
        newModule.registerModifiers()
      }
    }
  })

  // Listen for custom HMR events
  import.meta.hot.on('tachui:invalidate-modifiers', () => {
    invalidateModifierCaches()
  })
}

// Auto-register in development
if (process.env.NODE_ENV === 'development') {
  registerModifierHMR()
}
```

### Module-Level Setup

```typescript
// packages/modifiers/src/layout/padding.ts

import { globalModifierRegistry } from '@tachui/registry'

export function paddingFactory(value: number) {
  return (component) => {
    // Modifier implementation
    component.style.padding = `${value}px`
  }
}

// Register modifier
globalModifierRegistry.register('padding', paddingFactory)

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // Re-register with updated implementation
    globalModifierRegistry.register('padding', paddingFactory)

    // Invalidate caches
    import.meta.hot?.send('tachui:invalidate-modifiers')
  })
}
```

### Plugin Integration

```typescript
// packages/core/vite-plugin/modifier-hmr.ts

import type { Plugin } from 'vite'

/**
 * Vite plugin for TachUI modifier HMR
 */
export function tachUIModifierHMR(): Plugin {
  return {
    name: 'tachui-modifier-hmr',

    handleHotUpdate({ file, server }) {
      // Detect modifier file changes
      if (file.includes('/modifiers/') || file.endsWith('modifiers.ts')) {
        console.log('🔥 HMR: Modifier file changed:', file)

        // Broadcast invalidation event
        server.ws.send({
          type: 'custom',
          event: 'tachui:invalidate-modifiers',
          data: { file },
        })
      }
    },
  }
}
```

### Usage in vite.config.ts

```typescript
// packages/core/vite.config.ts

import { defineConfig } from 'vite'
import { tachUIModifierHMR } from './vite-plugin/modifier-hmr'

export default defineConfig({
  plugins: [
    tachUIModifierHMR(),
  ],
})
```

## Implementation Details

### Feature Flag Control

```typescript
// Only enable HMR cache invalidation if feature flag is set
if (globalModifierRegistry.isFeatureEnabled('hmrCacheInvalidation')) {
  registerModifierHMR()
}
```

### Performance Considerations

```typescript
/**
 * Throttled cache invalidation to prevent excessive invalidations
 */
let invalidationTimeout: ReturnType<typeof setTimeout> | null = null

export function invalidateModifierCachesThrottled(delay: number = 100): void {
  if (invalidationTimeout) {
    clearTimeout(invalidationTimeout)
  }

  invalidationTimeout = setTimeout(() => {
    invalidateModifierCaches()
    invalidationTimeout = null
  }, delay)
}
```

### Cache Statistics

```typescript
/**
 * Get cache statistics for debugging
 */
export function getCacheStatistics() {
  return {
    version: getCacheVersion(),
    created: proxyCacheStats.created,
    hits: proxyCacheStats.hits,
    invalidations: proxyCacheStats.invalidations,
    hitRate: proxyCacheStats.hits / (proxyCacheStats.hits + proxyCacheStats.created),
  }
}

// Expose in development
if (process.env.NODE_ENV === 'development') {
  (window as any).__TACHUI_CACHE_STATS__ = getCacheStatistics
}
```

## Testing Strategy

### HMR Invalidation Tests

```typescript
// __tests__/hmr-cache-invalidation.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import {
  getCacheVersion,
  incrementCacheVersion,
  invalidateModifierCaches,
  proxyCacheStats,
} from '../modifiers/proxy-cache'

describe('HMR Cache Invalidation', () => {
  beforeEach(() => {
    // Reset cache stats
    proxyCacheStats.created = 0
    proxyCacheStats.hits = 0
    proxyCacheStats.invalidations = 0
  })

  it('should increment cache version on invalidation', () => {
    const initialVersion = getCacheVersion()

    invalidateModifierCaches()

    expect(getCacheVersion()).toBe(initialVersion + 1)
    expect(proxyCacheStats.invalidations).toBe(1)
  })

  it('should invalidate cached proxies after version increment', () => {
    const component = createTestComponent()

    // Get proxy (creates cache entry)
    const proxy1 = getComponentProxy(component)
    expect(proxyCacheStats.created).toBe(1)
    expect(proxyCacheStats.hits).toBe(0)

    // Get again (should hit cache)
    const proxy2 = getComponentProxy(component)
    expect(proxy2).toBe(proxy1)
    expect(proxyCacheStats.created).toBe(1)
    expect(proxyCacheStats.hits).toBe(1)

    // Invalidate cache
    invalidateModifierCaches()

    // Get after invalidation (should create new proxy)
    const proxy3 = getComponentProxy(component)
    expect(proxy3).not.toBe(proxy1)
    expect(proxyCacheStats.created).toBe(2)
  })

  it('should handle multiple invalidations', () => {
    const component = createTestComponent()

    getComponentProxy(component) // Create
    invalidateModifierCaches()
    getComponentProxy(component) // Recreate
    invalidateModifierCaches()
    getComponentProxy(component) // Recreate again

    expect(proxyCacheStats.created).toBe(3)
    expect(proxyCacheStats.invalidations).toBe(2)
  })
})
```

### Integration Tests

```typescript
// __tests__/hmr-integration.test.ts

describe('HMR Integration', () => {
  it('should apply updated modifier implementation after HMR', async () => {
    // Initial modifier
    let paddingValue = '16px'
    globalModifierRegistry.register('padding', (value) => (component) => {
      component.style.padding = paddingValue
    })

    const component = Button('Test')
    component.padding(16) // Uses initial implementation

    expect(component.style.padding).toBe('16px')

    // Simulate HMR update
    paddingValue = '32px' // Change implementation
    globalModifierRegistry.register('padding', (value) => (component) => {
      component.style.padding = paddingValue
    })
    invalidateModifierCaches()

    // Apply modifier again
    component.padding(16) // Should use new implementation

    expect(component.style.padding).toBe('32px')
  })
})
```

### Manual Testing Procedure

1. **Start dev server**:
```bash
pnpm dev
```

2. **Create test component**:
```typescript
const button = Button('Test')
  .modifier.padding(16)
  .modifier.foregroundColor('red')
```

3. **Modify padding modifier**:
```typescript
// Add console.log
export function paddingFactory(value: number) {
  return (component) => {
    console.log('UPDATED: Applying padding', value) // NEW
    component.style.padding = `${value}px`
  }
}
```

4. **Verify HMR**:
- ✅ Console shows "🔄 HMR: Invalidating modifier caches"
- ✅ Console shows "UPDATED: Applying padding 16"
- ✅ No full page reload required

## Monitoring & Debugging

### Development Console Commands

```typescript
// Check cache statistics
__TACHUI_CACHE_STATS__()
// {
//   version: 5,
//   created: 42,
//   hits: 138,
//   invalidations: 5,
//   hitRate: 0.767
// }

// Manual invalidation
__TACHUI_INVALIDATE_CACHE__()
// 🔄 HMR: Invalidating modifier caches
// 📊 Cache version incremented to 6
```

### Logging

```typescript
// Enable verbose HMR logging
if (process.env.TACHUI_DEBUG_HMR === 'true') {
  import.meta.hot?.on('tachui:invalidate-modifiers', (data) => {
    console.log('🔥 Modifier invalidation triggered:', data)
    console.log('📊 Cache stats before:', getCacheStatistics())

    invalidateModifierCaches()

    console.log('📊 Cache stats after:', getCacheStatistics())
  })
}
```

## Performance Impact

### Expected Performance

| Operation | Time | Impact |
|-----------|------|--------|
| Cache invalidation | <1ms | Negligible |
| Proxy recreation | <0.1ms | Minimal |
| HMR event handling | <5ms | Acceptable |

### Optimization Strategies

1. **Throttling**: Debounce rapid invalidations (100ms window)
2. **Selective Invalidation**: Only invalidate affected modules
3. **Lazy Recreation**: Only recreate proxies on next access

## Rollout Plan

### Phase 1: Development Only
```typescript
if (process.env.NODE_ENV === 'development') {
  globalModifierRegistry.setFeatureFlags({
    hmrCacheInvalidation: true,
  })
}
```

### Phase 2: Opt-in for Testing
```typescript
if (process.env.TACHUI_ENABLE_HMR_CACHE === 'true') {
  registerModifierHMR()
}
```

### Phase 3: Default for Development
```typescript
// Enabled by default in development
// Controlled via feature flag for easy disable
```

## Documentation

### User Guide

```markdown
## HMR Support

TachUI modifiers support Hot Module Replacement (HMR) in development.
When you modify a modifier implementation, changes apply immediately
without a full page reload.

### Enable HMR

HMR is enabled by default in development. To disable:

\`\`\`typescript
globalModifierRegistry.setFeatureFlags({
  hmrCacheInvalidation: false,
})
\`\`\`

### Debug HMR

Enable verbose logging:

\`\`\`bash
TACHUI_DEBUG_HMR=true pnpm dev
\`\`\`
```

## Checklist

- [ ] Implement cache versioning system
- [ ] Create invalidation API
- [ ] Add Vite plugin for HMR detection
- [ ] Register HMR handlers in modifier modules
- [ ] Add feature flag control
- [ ] Implement cache statistics
- [ ] Write invalidation tests
- [ ] Write integration tests
- [ ] Add development logging
- [ ] Document HMR behavior
- [ ] Test with real HMR scenarios
- [ ] Verify no memory leaks

## Next Steps

1. ✅ Specify HMR cache invalidation mechanism
2. ⏳ Implement cache versioning (Phase 2)
3. ⏳ Create Vite plugin (Phase 3)
4. ⏳ Add HMR tests (Phase 4)
5. ⏳ Validate in real development workflow (Phase 6)

---

**Specification Complete**: 2025-10-21
**Implementation Phase**: Phase 2-3
**Owner**: Implementation Team
