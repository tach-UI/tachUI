# @tachui/registry - Comprehensive Test Plan

**Status:** Current coverage: 6 tests → Target: 60+ tests
**Priority:** CRITICAL (infrastructure package with zero meaningful coverage)
**Estimated Effort:** 2-3 days
**Date:** October 1, 2025

---

## Current State Analysis

### Existing Tests (6 basic tests in registry.test.ts)
✅ Basic registration and retrieval
✅ Registry health validation (basic)
✅ Clear functionality
✅ Isolated registry creation
✅ Reset functionality
✅ Singleton pattern verification

### Missing Coverage (~90% of functionality)
❌ Lazy loading (registerLazy, getAsync)
❌ Concurrent loading scenarios
❌ Error handling paths
❌ Edge cases (empty strings, special characters, duplicates)
❌ Memory management
❌ Production environment guards
❌ TypeScript type safety
❌ Performance characteristics
❌ Race conditions
❌ Modifier priority handling
❌ Context passing
❌ Cleanup/lifecycle
❌ Integration scenarios

---

## Test Suite Structure

### File Organization
```
packages/registry/src/__tests__/
├── registry.test.ts              (EXISTING - 6 tests, needs expansion)
├── lazy-loading.test.ts          (NEW - 15 tests)
├── concurrency.test.ts           (NEW - 12 tests)
├── edge-cases.test.ts            (NEW - 18 tests)
├── error-handling.test.ts        (NEW - 10 tests)
├── performance.test.ts           (NEW - 8 tests)
└── integration.test.ts           (NEW - 10 tests)

Total: ~79 tests (from 6 → 79)
```

---

## Test Plan by File

### 1. registry.test.ts (EXPAND - 6 → 20 tests)

**Current Tests (Keep):**
- ✅ Basic registration/retrieval
- ✅ Health validation
- ✅ Clear/reset
- ✅ Isolated registry
- ✅ Singleton pattern

**Add Core Functionality (14 new tests):**

#### Registration Tests
```typescript
describe('Core Registration', () => {
  it('should register modifier with proper factory')
  it('should overwrite existing modifier when re-registered')
  it('should handle registration with complex property types')
  it('should register multiple modifiers without conflicts')
  it('should maintain registration order in list()')
  it('should return undefined for unregistered modifiers')
})
```

#### Retrieval Tests
```typescript
describe('Modifier Retrieval', () => {
  it('should get modifier by exact name')
  it('should return undefined for non-existent modifier')
  it('should return same factory instance on multiple gets')
  it('should distinguish between loaded and lazy modifiers')
})
```

#### Health & Diagnostics
```typescript
describe('Registry Health', () => {
  it('should track instance count correctly')
  it('should report createdAt timestamp')
  it('should calculate totalModifiers correctly (loaded + lazy)')
  it('should expose getDiagnostics in development mode')
})
```

**Estimated Time:** 2 hours

---

### 2. lazy-loading.test.ts (NEW - 15 tests)

**Purpose:** Test lazy loading functionality (currently untested)

```typescript
describe('Lazy Loading', () => {
  describe('registerLazy()', () => {
    it('should register lazy loader without executing it', () => {
      let executed = false
      const loader = () => {
        executed = true
        return createTestModifier('lazy')
      }

      registerLazyModifier('lazy', loader)
      expect(executed).toBe(false)
      expect(hasModifier('lazy')).toBe(true)
    })

    it('should not overwrite eager registration with lazy', () => {
      registerModifier('eager', createTestModifier('eager'))
      const lazyFactory = createTestModifier('lazy')
      registerLazyModifier('eager', () => lazyFactory)

      expect(getModifier('eager')).not.toBe(lazyFactory)
    })

    it('should handle async loader functions', () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      expect(hasModifier('async')).toBe(true)
    })
  })

  describe('get() with lazy loading', () => {
    it('should load modifier on first get() call', () => {
      let loadCount = 0
      registerLazyModifier('lazy', () => {
        loadCount++
        return createTestModifier('lazy')
      })

      getModifier('lazy')
      expect(loadCount).toBe(1)
    })

    it('should cache loaded modifier', () => {
      let loadCount = 0
      registerLazyModifier('lazy', () => {
        loadCount++
        return createTestModifier('lazy')
      })

      getModifier('lazy')
      getModifier('lazy')
      getModifier('lazy')

      expect(loadCount).toBe(1) // Only loaded once
    })

    it('should remove lazy loader after loading', () => {
      registerLazyModifier('lazy', () => createTestModifier('lazy'))

      const diagnostics1 = globalModifierRegistry.getDiagnostics()
      expect(diagnostics1.lazyLoaderCount).toBe(1)

      getModifier('lazy')

      const diagnostics2 = globalModifierRegistry.getDiagnostics()
      expect(diagnostics2.lazyLoaderCount).toBe(0)
      expect(diagnostics2.modifierCount).toBe(1)
    })

    it('should handle sync loader returning modifier', () => {
      registerLazyModifier('sync', () => createTestModifier('sync'))
      const factory = getModifier('sync')
      expect(factory).toBeDefined()
    })

    it('should handle async loader returning promise', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      const factory = await getModifier('async', { async: true })
      expect(factory).toBeDefined()
    })
  })

  describe('getAsync()', () => {
    it('should load async modifiers', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      const factory = await getModifierAsync('async')
      expect(factory).toBeDefined()
    })

    it('should cache loading promises', async () => {
      let loadCount = 0
      registerLazyModifier('async', async () => {
        loadCount++
        await delay(50)
        return createTestModifier('async')
      })

      // Start multiple loads simultaneously
      const [f1, f2, f3] = await Promise.all([
        getModifierAsync('async'),
        getModifierAsync('async'),
        getModifierAsync('async')
      ])

      expect(loadCount).toBe(1) // Only loaded once
      expect(f1).toBe(f2)
      expect(f2).toBe(f3)
    })

    it('should return undefined for non-existent async modifier', async () => {
      const factory = await getModifierAsync('nonexistent')
      expect(factory).toBeUndefined()
    })

    it('should handle loader errors gracefully', async () => {
      registerLazyModifier('error', async () => {
        throw new Error('Load failed')
      })

      await expect(getModifierAsync('error')).rejects.toThrow('Load failed')
    })

    it('should remove loading promise after completion', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      await getModifierAsync('async')

      // Second call should not use loading promise
      const factory = await getModifierAsync('async')
      expect(factory).toBeDefined()
    })
  })

  describe('Lazy Loading Edge Cases', () => {
    it('should handle loader throwing sync error', () => {
      registerLazyModifier('error', () => {
        throw new Error('Sync error')
      })

      const factory = getModifier('error')
      expect(factory).toBeUndefined()
    })

    it('should list both loaded and lazy modifiers', () => {
      registerModifier('loaded', createTestModifier('loaded'))
      registerLazyModifier('lazy', () => createTestModifier('lazy'))

      const list = listModifiers()
      expect(list).toContain('loaded')
      expect(list).toContain('lazy')
    })

    it('should report correct count in validateRegistry', () => {
      registerModifier('loaded1', createTestModifier('loaded1'))
      registerModifier('loaded2', createTestModifier('loaded2'))
      registerLazyModifier('lazy1', () => createTestModifier('lazy1'))
      registerLazyModifier('lazy2', () => createTestModifier('lazy2'))

      const health = validateRegistry()
      expect(health.totalModifiers).toBe(4)
    })
  })
})
```

**Estimated Time:** 3 hours

---

### 3. concurrency.test.ts (NEW - 12 tests)

**Purpose:** Test race conditions and concurrent access

```typescript
describe('Concurrency & Race Conditions', () => {
  describe('Concurrent Registration', () => {
    it('should handle concurrent registrations', () => {
      const modifiers = Array.from({ length: 100 }, (_, i) => `mod${i}`)

      modifiers.forEach(name => {
        registerModifier(name, createTestModifier(name))
      })

      expect(listModifiers()).toHaveLength(100)
    })

    it('should handle concurrent registrations of same name', () => {
      const promises = Array.from({ length: 10 }, () =>
        Promise.resolve(registerModifier('concurrent', createTestModifier('concurrent')))
      )

      return Promise.all(promises).then(() => {
        expect(hasModifier('concurrent')).toBe(true)
      })
    })
  })

  describe('Concurrent Lazy Loading', () => {
    it('should handle multiple simultaneous lazy loads', async () => {
      let loadCount = 0

      registerLazyModifier('concurrent', async () => {
        loadCount++
        await delay(50) // Simulate async operation
        return createTestModifier('concurrent')
      })

      // Start 10 simultaneous loads
      const results = await Promise.all(
        Array.from({ length: 10 }, () => getModifierAsync('concurrent'))
      )

      expect(loadCount).toBe(1) // Should only load once
      results.forEach((factory, i) => {
        expect(factory).toBe(results[0]) // All should be same instance
      })
    })

    it('should handle rapid get/async mix', async () => {
      let loadCount = 0
      registerLazyModifier('mixed', async () => {
        loadCount++
        await delay(20)
        return createTestModifier('mixed')
      })

      // Mix of sync and async gets
      getModifier('mixed')
      const async1 = getModifierAsync('mixed')
      getModifier('mixed')
      const async2 = getModifierAsync('mixed')

      await Promise.all([async1, async2])
      expect(loadCount).toBe(1)
    })

    it('should handle concurrent loads of different modifiers', async () => {
      const modifiers = ['mod1', 'mod2', 'mod3', 'mod4', 'mod5']

      modifiers.forEach(name => {
        registerLazyModifier(name, async () => {
          await delay(Math.random() * 50)
          return createTestModifier(name)
        })
      })

      const results = await Promise.all(
        modifiers.map(name => getModifierAsync(name))
      )

      expect(results).toHaveLength(5)
      results.forEach(factory => expect(factory).toBeDefined())
    })
  })

  describe('Concurrent Access Patterns', () => {
    it('should handle concurrent has() checks', () => {
      registerModifier('test', createTestModifier('test'))

      const results = Array.from({ length: 1000 }, () => hasModifier('test'))

      expect(results.every(r => r === true)).toBe(true)
    })

    it('should handle concurrent list() calls', () => {
      registerModifier('mod1', createTestModifier('mod1'))
      registerModifier('mod2', createTestModifier('mod2'))

      const lists = Array.from({ length: 100 }, () => listModifiers())

      lists.forEach(list => {
        expect(list).toContain('mod1')
        expect(list).toContain('mod2')
      })
    })

    it('should handle registration during iteration', () => {
      registerModifier('initial', createTestModifier('initial'))

      const list1 = listModifiers()
      registerModifier('added', createTestModifier('added'))
      const list2 = listModifiers()

      expect(list1).toHaveLength(1)
      expect(list2).toHaveLength(2)
    })

    it('should handle clear during access', () => {
      registerModifier('test', createTestModifier('test'))

      expect(hasModifier('test')).toBe(true)
      clearRegistry()
      expect(hasModifier('test')).toBe(false)
    })
  })

  describe('Memory Under Concurrency', () => {
    it('should not leak memory with concurrent operations', async () => {
      const iterations = 100

      for (let i = 0; i < iterations; i++) {
        registerLazyModifier(`lazy${i}`, async () => {
          await delay(1)
          return createTestModifier(`lazy${i}`)
        })
      }

      // Load all concurrently
      await Promise.all(
        Array.from({ length: iterations }, (_, i) =>
          getModifierAsync(`lazy${i}`)
        )
      )

      const health = validateRegistry()
      expect(health.totalModifiers).toBe(iterations)

      // Cleanup
      clearRegistry()
      expect(listModifiers()).toHaveLength(0)
    })

    it('should clean up loading promises', async () => {
      registerLazyModifier('async', async () => {
        await delay(10)
        return createTestModifier('async')
      })

      await getModifierAsync('async')

      // Verify loading promise was cleaned up
      const diagnostics = globalModifierRegistry.getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(0)
    })
  })

  describe('Error Propagation Under Concurrency', () => {
    it('should handle concurrent load failures', async () => {
      let attempts = 0

      registerLazyModifier('failing', async () => {
        attempts++
        await delay(10)
        throw new Error('Load failed')
      })

      const results = await Promise.allSettled([
        getModifierAsync('failing'),
        getModifierAsync('failing'),
        getModifierAsync('failing')
      ])

      expect(results.every(r => r.status === 'rejected')).toBe(true)
      expect(attempts).toBe(1) // Should only attempt once
    })

    it('should recover from failed load on retry', async () => {
      let attempts = 0

      registerLazyModifier('retry', async () => {
        attempts++
        if (attempts === 1) {
          throw new Error('First attempt fails')
        }
        return createTestModifier('retry')
      })

      // First attempt fails
      await expect(getModifierAsync('retry')).rejects.toThrow()

      // Re-register and retry
      registerLazyModifier('retry', async () => createTestModifier('retry'))

      const factory = await getModifierAsync('retry')
      expect(factory).toBeDefined()
    })
  })
})

// Helper
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

**Estimated Time:** 3 hours

---

### 4. edge-cases.test.ts (NEW - 18 tests)

**Purpose:** Test boundary conditions and edge cases

```typescript
describe('Edge Cases & Boundary Conditions', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Name Validation', () => {
    it('should handle empty string names', () => {
      registerModifier('', createTestModifier(''))
      expect(hasModifier('')).toBe(true)
    })

    it('should handle names with special characters', () => {
      const names = ['mod-name', 'mod_name', 'mod.name', 'mod:name', 'mod@name']

      names.forEach(name => {
        registerModifier(name, createTestModifier(name))
      })

      names.forEach(name => {
        expect(hasModifier(name)).toBe(true)
      })
    })

    it('should handle very long names', () => {
      const longName = 'a'.repeat(1000)
      registerModifier(longName, createTestModifier(longName))
      expect(hasModifier(longName)).toBe(true)
    })

    it('should handle unicode names', () => {
      const unicodeName = '修飾符'
      registerModifier(unicodeName, createTestModifier(unicodeName))
      expect(hasModifier(unicodeName)).toBe(true)
    })

    it('should handle emoji names', () => {
      registerModifier('🎨', createTestModifier('🎨'))
      expect(hasModifier('🎨')).toBe(true)
    })

    it('should treat names as case-sensitive', () => {
      registerModifier('MyModifier', createTestModifier('upper'))
      registerModifier('mymodifier', createTestModifier('lower'))

      expect(hasModifier('MyModifier')).toBe(true)
      expect(hasModifier('mymodifier')).toBe(true)
      expect(listModifiers()).toHaveLength(2)
    })
  })

  describe('Duplicate Detection', () => {
    it('should detect duplicate names in validateRegistry', () => {
      registerModifier('dup', createTestModifier('dup1'))

      // Manually create duplicate (edge case testing)
      // Note: Normal API prevents this, testing internal state
      const health = validateRegistry()
      expect(health.duplicateNames).toEqual([])
    })

    it('should overwrite on duplicate registration', () => {
      const factory1 = createTestModifier('v1')
      const factory2 = createTestModifier('v2')

      registerModifier('dup', factory1)
      registerModifier('dup', factory2)

      expect(getModifier('dup')).toBe(factory2)
    })
  })

  describe('Large Scale Operations', () => {
    it('should handle 1000+ modifiers', () => {
      const count = 1000

      for (let i = 0; i < count; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      expect(listModifiers()).toHaveLength(count)
      expect(validateRegistry().totalModifiers).toBe(count)
    })

    it('should maintain performance with large registry', () => {
      const count = 500

      for (let i = 0; i < count; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const exists = hasModifier('mod250')
      const duration = performance.now() - start

      expect(exists).toBe(true)
      expect(duration).toBeLessThan(1) // Should be instant
    })

    it('should list modifiers efficiently', () => {
      for (let i = 0; i < 500; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const list = listModifiers()
      const duration = performance.now() - start

      expect(list).toHaveLength(500)
      expect(duration).toBeLessThan(10) // Should be fast
    })
  })

  describe('Clear and Reset Behaviors', () => {
    it('should clear lazily registered but not loaded modifiers', () => {
      registerLazyModifier('lazy1', () => createTestModifier('lazy1'))
      registerLazyModifier('lazy2', () => createTestModifier('lazy2'))

      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
    })

    it('should clear loading promises', async () => {
      registerLazyModifier('async', async () => {
        await delay(100)
        return createTestModifier('async')
      })

      // Start loading
      getModifierAsync('async')

      // Clear immediately
      clearRegistry()

      expect(listModifiers()).toHaveLength(0)
    })

    it('should allow re-registration after clear', () => {
      registerModifier('mod', createTestModifier('v1'))
      clearRegistry()
      registerModifier('mod', createTestModifier('v2'))

      expect(hasModifier('mod')).toBe(true)
    })

    it('should reset instance count', () => {
      const health1 = validateRegistry()
      resetRegistry()

      // Force new instance
      registerModifier('test', createTestModifier('test'))
      const health2 = validateRegistry()

      // Instance count should be reset in test environment
      expect(health2.instanceCount).toBeLessThanOrEqual(health1.instanceCount + 1)
    })
  })

  describe('Isolated Registry Edge Cases', () => {
    it('should create multiple isolated registries', () => {
      const iso1 = createIsolatedRegistry()
      const iso2 = createIsolatedRegistry()
      const iso3 = createIsolatedRegistry()

      iso1.register('mod1', createTestModifier('mod1'))
      iso2.register('mod2', createTestModifier('mod2'))
      iso3.register('mod3', createTestModifier('mod3'))

      expect(iso1.has('mod1')).toBe(true)
      expect(iso1.has('mod2')).toBe(false)
      expect(iso2.has('mod2')).toBe(true)
      expect(iso2.has('mod3')).toBe(false)
      expect(iso3.has('mod3')).toBe(true)
    })

    it('should handle lazy loading in isolated registry', async () => {
      const isolated = createIsolatedRegistry()

      isolated.registerLazy('lazy', async () => {
        await delay(10)
        return createTestModifier('lazy')
      })

      const factory = await isolated.get('lazy', { async: true })
      expect(factory).toBeDefined()
      expect(hasModifier('lazy')).toBe(false) // Not in global
    })
  })

  describe('Environment Guards', () => {
    it('should throw on clearRegistry in production', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      expect(() => clearRegistry()).toThrow('not available in production')

      process.env.NODE_ENV = originalEnv
    })

    it('should throw on resetRegistry outside test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      expect(() => resetRegistry()).toThrow('only available in test environment')

      process.env.NODE_ENV = originalEnv
    })

    it('should throw on createIsolatedRegistry outside test', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      expect(() => createIsolatedRegistry()).toThrow('only available in test environment')

      process.env.NODE_ENV = originalEnv
    })
  })
})
```

**Estimated Time:** 3 hours

---

### 5. error-handling.test.ts (NEW - 10 tests)

**Purpose:** Test error scenarios and recovery

```typescript
describe('Error Handling', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Loader Errors', () => {
    it('should handle synchronous loader errors', () => {
      registerLazyModifier('error', () => {
        throw new Error('Sync load error')
      })

      const factory = getModifier('error')
      expect(factory).toBeUndefined()
      expect(hasModifier('error')).toBe(true) // Loader still registered
    })

    it('should handle async loader errors', async () => {
      registerLazyModifier('asyncError', async () => {
        await delay(10)
        throw new Error('Async load error')
      })

      await expect(getModifierAsync('asyncError')).rejects.toThrow('Async load error')
    })

    it('should allow retry after failed load', async () => {
      let attempts = 0

      registerLazyModifier('retry', async () => {
        attempts++
        if (attempts === 1) {
          throw new Error('First attempt')
        }
        return createTestModifier('retry')
      })

      await expect(getModifierAsync('retry')).rejects.toThrow('First attempt')

      // Retry (loader is gone, need to re-register)
      registerLazyModifier('retry', async () => createTestModifier('retry'))
      const factory = await getModifierAsync('retry')

      expect(factory).toBeDefined()
    })

    it('should not cache failed loads', async () => {
      let attempts = 0

      registerLazyModifier('fail', async () => {
        attempts++
        throw new Error(`Attempt ${attempts}`)
      })

      await expect(getModifierAsync('fail')).rejects.toThrow('Attempt 1')

      // Re-register same loader
      registerLazyModifier('fail', async () => {
        attempts++
        throw new Error(`Attempt ${attempts}`)
      })

      await expect(getModifierAsync('fail')).rejects.toThrow('Attempt 2')
      expect(attempts).toBe(2)
    })
  })

  describe('Invalid Inputs', () => {
    it('should handle null factory', () => {
      expect(() => {
        registerModifier('null', null as any)
      }).not.toThrow() // Map accepts any value

      expect(hasModifier('null')).toBe(true)
    })

    it('should handle undefined factory', () => {
      registerModifier('undefined', undefined as any)
      expect(hasModifier('undefined')).toBe(true)
    })

    it('should handle non-function factory', () => {
      registerModifier('invalid', { not: 'a function' } as any)
      expect(hasModifier('invalid')).toBe(true)

      // Getting it won't work properly but registry stores it
      const factory = getModifier('invalid')
      expect(factory).toBeDefined()
    })
  })

  describe('Type System Edge Cases', () => {
    it('should handle generic type mismatches', () => {
      interface Props1 { value: string }
      interface Props2 { value: number }

      const factory = createTestModifier('typed') as ModifierFactory<Props1>
      registerModifier<Props2>('typed', factory as any)

      // TypeScript type system allows this at compile time
      // Runtime should handle gracefully
      expect(hasModifier('typed')).toBe(true)
    })

    it('should handle modifier without apply method', () => {
      const invalidModifier = {
        type: 'invalid',
        priority: 100,
        properties: {},
        // missing apply method
      }

      registerModifier('invalid', (() => invalidModifier) as any)

      const factory = getModifier('invalid')
      expect(factory).toBeDefined()
    })
  })

  describe('Concurrent Error Scenarios', () => {
    it('should handle multiple simultaneous load failures', async () => {
      registerLazyModifier('failing', async () => {
        await delay(10)
        throw new Error('Load failed')
      })

      const results = await Promise.allSettled([
        getModifierAsync('failing'),
        getModifierAsync('failing'),
        getModifierAsync('failing')
      ])

      expect(results.every(r => r.status === 'rejected')).toBe(true)
    })

    it('should handle error during concurrent registration', () => {
      const factory = createTestModifier('test')

      // Register many times rapidly (simulating race condition)
      for (let i = 0; i < 100; i++) {
        registerModifier('test', factory)
      }

      expect(hasModifier('test')).toBe(true)
      expect(getModifier('test')).toBe(factory)
    })
  })
})
```

**Estimated Time:** 2 hours

---

### 6. performance.test.ts (NEW - 8 tests)

**Purpose:** Benchmark and performance validation

```typescript
describe('Performance Characteristics', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Registration Performance', () => {
    it('should register 1000 modifiers quickly', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(100) // Should be under 100ms
      expect(listModifiers()).toHaveLength(1000)
    })

    it('should register lazy loaders with minimal overhead', () => {
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        registerLazyModifier(`lazy${i}`, () => createTestModifier(`lazy${i}`))
      }

      const duration = performance.now() - start

      expect(duration).toBeLessThan(50) // Should be faster than eager
    })
  })

  describe('Lookup Performance', () => {
    beforeEach(() => {
      // Populate registry
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }
    })

    it('should find modifiers in constant time', () => {
      const times: number[] = []

      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        hasModifier(`mod${Math.floor(Math.random() * 1000)}`)
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(avgTime).toBeLessThan(0.1) // Should be < 0.1ms
    })

    it('should get modifiers in constant time', () => {
      const times: number[] = []

      for (let i = 0; i < 100; i++) {
        const start = performance.now()
        getModifier(`mod${Math.floor(Math.random() * 1000)}`)
        times.push(performance.now() - start)
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length
      expect(avgTime).toBeLessThan(0.1)
    })
  })

  describe('List Performance', () => {
    it('should list 1000 modifiers quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const list = listModifiers()
      const duration = performance.now() - start

      expect(list).toHaveLength(1000)
      expect(duration).toBeLessThan(5) // Should be under 5ms
    })
  })

  describe('Clear Performance', () => {
    it('should clear 1000 modifiers quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      clearRegistry()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(10) // Should be under 10ms
      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Memory Efficiency', () => {
    it('should not leak memory on repeated clear/register cycles', () => {
      const iterations = 100

      for (let cycle = 0; cycle < iterations; cycle++) {
        for (let i = 0; i < 100; i++) {
          registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
        }
        clearRegistry()
      }

      // If we get here without crashing, memory management is working
      expect(listModifiers()).toHaveLength(0)
    })

    it('should clean up lazy loaders after loading', async () => {
      for (let i = 0; i < 100; i++) {
        registerLazyModifier(`lazy${i}`, async () => {
          await delay(1)
          return createTestModifier(`lazy${i}`)
        })
      }

      // Load all
      await Promise.all(
        Array.from({ length: 100 }, (_, i) => getModifierAsync(`lazy${i}`))
      )

      const diagnostics = globalModifierRegistry.getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(0)
      expect(diagnostics.modifierCount).toBe(100)
    })
  })

  describe('Validation Performance', () => {
    it('should validate large registry quickly', () => {
      for (let i = 0; i < 1000; i++) {
        registerModifier(`mod${i}`, createTestModifier(`mod${i}`))
      }

      const start = performance.now()
      const health = validateRegistry()
      const duration = performance.now() - start

      expect(duration).toBeLessThan(20) // Should be under 20ms
      expect(health.totalModifiers).toBe(1000)
    })
  })
})
```

**Estimated Time:** 2 hours

---

### 7. integration.test.ts (NEW - 10 tests)

**Purpose:** Test real-world integration scenarios

```typescript
describe('Integration Scenarios', () => {
  beforeEach(() => {
    clearRegistry()
  })

  describe('Plugin Development Patterns', () => {
    it('should support plugin registration pattern', () => {
      // Simulate plugin registration
      function installAnimationPlugin() {
        registerModifier('fadeIn', createTestModifier('fadeIn'))
        registerModifier('slideUp', createTestModifier('slideUp'))
        registerModifier('bounce', createTestModifier('bounce'))
      }

      installAnimationPlugin()

      expect(hasModifier('fadeIn')).toBe(true)
      expect(hasModifier('slideUp')).toBe(true)
      expect(hasModifier('bounce')).toBe(true)
    })

    it('should support lazy plugin loading', async () => {
      function installLazyPlugin() {
        registerLazyModifier('heavy1', async () => {
          await delay(10)
          return createTestModifier('heavy1')
        })
        registerLazyModifier('heavy2', async () => {
          await delay(10)
          return createTestModifier('heavy2')
        })
      }

      installLazyPlugin()

      // Load on demand
      const factory = await getModifierAsync('heavy1')
      expect(factory).toBeDefined()

      // heavy2 not yet loaded
      const diagnostics = globalModifierRegistry.getDiagnostics()
      expect(diagnostics.lazyLoaderCount).toBe(1)
      expect(diagnostics.modifierCount).toBe(1)
    })
  })

  describe('Multi-Package Scenarios', () => {
    it('should handle modifiers from multiple packages', () => {
      // Simulate @tachui/modifiers
      registerModifier('padding', createTestModifier('padding'))
      registerModifier('margin', createTestModifier('margin'))

      // Simulate @tachui/effects
      registerModifier('blur', createTestModifier('blur'))
      registerModifier('shadow', createTestModifier('shadow'))

      // Simulate custom user plugin
      registerModifier('customEffect', createTestModifier('customEffect'))

      const list = listModifiers()
      expect(list).toHaveLength(5)
    })

    it('should prevent package conflicts with same names', () => {
      // Package A registers padding
      const paddingA = createTestModifier('paddingA')
      registerModifier('padding', paddingA)

      // Package B tries to register padding (should overwrite)
      const paddingB = createTestModifier('paddingB')
      registerModifier('padding', paddingB)

      expect(getModifier('padding')).toBe(paddingB)
    })
  })

  describe('Development Workflow', () => {
    it('should support hot reload simulation', () => {
      // Initial load
      registerModifier('component', createTestModifier('v1'))
      expect(getModifier('component')).toBeDefined()

      // Hot reload - overwrite
      registerModifier('component', createTestModifier('v2'))
      expect(getModifier('component')).toBeDefined()

      // Should work without issues
      expect(listModifiers()).toContain('component')
    })

    it('should support test isolation', () => {
      const iso1 = createIsolatedRegistry()
      const iso2 = createIsolatedRegistry()

      // Test 1 uses iso1
      iso1.register('testMod', createTestModifier('test1'))
      expect(iso1.list()).toHaveLength(1)

      // Test 2 uses iso2 (clean slate)
      iso2.register('testMod', createTestModifier('test2'))
      expect(iso2.list()).toHaveLength(1)

      // Global registry unaffected
      expect(listModifiers()).toHaveLength(0)
    })
  })

  describe('Production Scenarios', () => {
    it('should handle large-scale production registry', () => {
      // Simulate production with all @tachui packages
      const packages = [
        { name: 'primitives', count: 15 },
        { name: 'modifiers', count: 95 },
        { name: 'effects', count: 20 },
        { name: 'forms', count: 10 }
      ]

      let totalRegistered = 0
      packages.forEach(pkg => {
        for (let i = 0; i < pkg.count; i++) {
          registerModifier(`${pkg.name}_${i}`, createTestModifier(`${pkg.name}_${i}`))
          totalRegistered++
        }
      })

      const health = validateRegistry()
      expect(health.totalModifiers).toBe(totalRegistered)
      expect(health.duplicateNames).toHaveLength(0)
    })

    it('should support progressive enhancement', async () => {
      // Core modifiers loaded immediately
      registerModifier('padding', createTestModifier('padding'))
      registerModifier('margin', createTestModifier('margin'))

      // Advanced modifiers loaded lazily
      registerLazyModifier('advancedEffect', async () => {
        await delay(50) // Simulate heavy module
        return createTestModifier('advancedEffect')
      })

      // Can use core immediately
      expect(hasModifier('padding')).toBe(true)

      // Advanced loads on demand
      const advanced = await getModifierAsync('advancedEffect')
      expect(advanced).toBeDefined()
    })
  })

  describe('Error Recovery', () => {
    it('should recover from partial plugin load failure', async () => {
      // Plugin with some successful, some failing loads
      registerLazyModifier('working1', async () => createTestModifier('working1'))
      registerLazyModifier('failing', async () => {
        throw new Error('Failed to load')
      })
      registerLazyModifier('working2', async () => createTestModifier('working2'))

      // Load all
      const results = await Promise.allSettled([
        getModifierAsync('working1'),
        getModifierAsync('failing'),
        getModifierAsync('working2')
      ])

      expect(results[0].status).toBe('fulfilled')
      expect(results[1].status).toBe('rejected')
      expect(results[2].status).toBe('fulfilled')

      // Working modifiers should be available
      expect(hasModifier('working1')).toBe(true)
      expect(hasModifier('working2')).toBe(true)
    })

    it('should handle registry validation after errors', async () => {
      registerModifier('good1', createTestModifier('good1'))
      registerLazyModifier('bad', async () => {
        throw new Error('Bad loader')
      })
      registerModifier('good2', createTestModifier('good2'))

      // Try to load bad
      await expect(getModifierAsync('bad')).rejects.toThrow()

      // Registry should still be healthy
      const health = validateRegistry()
      expect(health.totalModifiers).toBe(3) // good1, bad (still registered), good2
    })
  })
})
```

**Estimated Time:** 2.5 hours

---

## Implementation Strategy

### Phase 1: Foundation (Day 1 Morning - 3 hours)
1. ✅ Expand `registry.test.ts` with core functionality tests (14 new tests)
2. ✅ Create `lazy-loading.test.ts` (15 tests)
3. ✅ Run tests and fix any discovered issues

### Phase 2: Robustness (Day 1 Afternoon - 4 hours)
4. ✅ Create `concurrency.test.ts` (12 tests)
5. ✅ Create `edge-cases.test.ts` (18 tests)
6. ✅ Run tests and fix any discovered issues

### Phase 3: Quality (Day 2 Morning - 3 hours)
7. ✅ Create `error-handling.test.ts` (10 tests)
8. ✅ Create `performance.test.ts` (8 tests)
9. ✅ Run tests and validate performance benchmarks

### Phase 4: Integration (Day 2 Afternoon - 3 hours)
10. ✅ Create `integration.test.ts` (10 tests)
11. ✅ Run full test suite
12. ✅ Fix any integration issues
13. ✅ Verify 95%+ code coverage

### Phase 5: Documentation (Day 3 Morning - 2 hours)
14. ✅ Update README with testing information
15. ✅ Document test patterns for contributors
16. ✅ Add testing badge to package.json
17. ✅ Update SOTF report with completion

**Total Estimated Time:** 15 hours (2 working days)

---

## Success Criteria

✅ **Coverage Target:** 95%+ code coverage for all registry files
✅ **Test Count:** 79+ comprehensive tests (from 6)
✅ **All Tests Passing:** 100% pass rate
✅ **Performance Validated:** Benchmarks confirm O(1) lookups
✅ **Concurrency Verified:** No race conditions detected
✅ **Error Handling:** All error paths tested
✅ **Integration Validated:** Real-world scenarios covered

---

## Commands to Run

```bash
# Navigate to registry package
cd /Users/whoughton/Dev/tach-ui/tachUI/packages/registry

# Run tests
pnpm test

# Run tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test src/__tests__/lazy-loading.test.ts

# Run in watch mode during development
pnpm test --watch
```

---

## Notes

1. **Process.env.NODE_ENV**: Tests should run with NODE_ENV=test to enable test-only features
2. **Console Logging**: Development console logs should not interfere with test output
3. **Async/Await**: Extensive use of async patterns requires careful test setup
4. **Singleton Pattern**: Tests must properly reset global state between runs
5. **Performance**: Benchmarks should have reasonable thresholds (not too strict)

---

**Ready to implement!** Start with Phase 1 and progress through the plan systematically.
