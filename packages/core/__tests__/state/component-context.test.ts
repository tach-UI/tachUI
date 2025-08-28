/**
 * Component Context System Tests
 *
 * Tests for the component context system that enables proper
 * @State, @Binding, and @EnvironmentObject functionality.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createRoot } from '../../src/reactive/context'
import {
  ComponentContextDebug,
  consumeEnvironmentValue,
  createComponentContext,
  createEnvironmentKey,
  getCurrentComponentContext,
  provideEnvironmentValue,
  runWithComponentContext,
  setCurrentComponentContext,
  withComponentContext,
} from '../../src/runtime/component-context'
import type { ComponentProps } from '../../src/runtime/types'

describe('Component Context System', () => {
  beforeEach(() => {
    // Clean up any existing context
    setCurrentComponentContext(null)
  })

  afterEach(() => {
    setCurrentComponentContext(null)
  })

  describe('Context Creation and Management', () => {
    it('creates component context with unique ID', () => {
      const context = createComponentContext('test-component')

      expect(context.id).toBe('test-component')
      expect(context.parent).toBeUndefined()
      expect(context.providers.size).toBe(0)
      expect(context.consumers.size).toBe(0)
    })

    it('creates nested component context with parent', () => {
      const parent = createComponentContext('parent-component')
      const child = createComponentContext('child-component', parent)

      expect(child.parent).toBe(parent)
      expect(child.id).toBe('child-component')
    })

    it('throws error when accessing context outside component', () => {
      expect(() => {
        getCurrentComponentContext()
      }).toThrow('@State can only be used within a component context')
    })

    it('provides current context when set', () => {
      const context = createComponentContext('test-component')

      setCurrentComponentContext(context)

      expect(getCurrentComponentContext()).toBe(context)
    })
  })

  describe('Context Execution', () => {
    it('runs function with specific context', () => {
      const context = createComponentContext('test-component')
      let capturedContext: any = null

      const result = runWithComponentContext(context, () => {
        capturedContext = getCurrentComponentContext()
        return 'test-result'
      })

      expect(result).toBe('test-result')
      expect(capturedContext).toBe(context)

      // Context should be cleaned up after execution
      expect(() => getCurrentComponentContext()).toThrow()
    })

    it('restores previous context after execution', () => {
      const context1 = createComponentContext('context-1')
      const context2 = createComponentContext('context-2')

      setCurrentComponentContext(context1)

      runWithComponentContext(context2, () => {
        expect(getCurrentComponentContext()).toBe(context2)
      })

      expect(getCurrentComponentContext()).toBe(context1)
    })

    it('handles nested context execution', () => {
      const context1 = createComponentContext('context-1')
      const context2 = createComponentContext('context-2')
      const context3 = createComponentContext('context-3')

      const results: string[] = []

      runWithComponentContext(context1, () => {
        results.push(getCurrentComponentContext().id)

        runWithComponentContext(context2, () => {
          results.push(getCurrentComponentContext().id)

          runWithComponentContext(context3, () => {
            results.push(getCurrentComponentContext().id)
          })

          results.push(getCurrentComponentContext().id)
        })

        results.push(getCurrentComponentContext().id)
      })

      expect(results).toEqual(['context-1', 'context-2', 'context-3', 'context-2', 'context-1'])
    })
  })

  describe('State Management', () => {
    it('stores and retrieves state values', () => {
      const context = createComponentContext('test-component')

      runWithComponentContext(context, () => {
        const ctx = getCurrentComponentContext()

        ctx.setState('counter', 42)
        expect(ctx.getState('counter')).toBe(42)
        expect(ctx.hasState('counter')).toBe(true)
        expect(ctx.hasState('nonexistent')).toBe(false)
      })
    })

    it('stores and retrieves bindings', () => {
      const context = createComponentContext('test-component')
      const binding = { get: () => 'test', set: () => {} }

      runWithComponentContext(context, () => {
        const ctx = getCurrentComponentContext()

        ctx.setBinding('testBinding', binding)
        expect(ctx.getBinding('testBinding')).toBe(binding)
      })
    })

    it('tracks update count on state changes', () => {
      const context = createComponentContext('test-component') as any

      const initialMetrics = context.getMetrics()
      expect(initialMetrics.updateCount).toBe(0)

      runWithComponentContext(context, () => {
        const ctx = getCurrentComponentContext()
        ctx.setState('counter', 42)
      })

      const updatedMetrics = context.getMetrics()
      expect(updatedMetrics.updateCount).toBe(1)
    })
  })

  describe('Environment Object System', () => {
    it('provides and consumes environment values', () => {
      const context = createComponentContext('test-component')
      const TestKey = createEnvironmentKey<string>('TestKey')

      runWithComponentContext(context, () => {
        provideEnvironmentValue(TestKey, 'test-value')
        const value = consumeEnvironmentValue(TestKey)

        expect(value).toBe('test-value')
      })
    })

    it('inherits environment values from parent context', () => {
      const parent = createComponentContext('parent-component')
      const child = createComponentContext('child-component', parent)
      const TestKey = createEnvironmentKey<string>('TestKey')

      runWithComponentContext(parent, () => {
        provideEnvironmentValue(TestKey, 'parent-value')
      })

      runWithComponentContext(child, () => {
        const value = consumeEnvironmentValue(TestKey)
        expect(value).toBe('parent-value')
      })
    })

    it('prefers local environment values over parent', () => {
      const parent = createComponentContext('parent-component')
      const child = createComponentContext('child-component', parent)
      const TestKey = createEnvironmentKey<string>('TestKey')

      runWithComponentContext(parent, () => {
        provideEnvironmentValue(TestKey, 'parent-value')
      })

      runWithComponentContext(child, () => {
        provideEnvironmentValue(TestKey, 'child-value')
        const value = consumeEnvironmentValue(TestKey)
        expect(value).toBe('child-value')
      })
    })

    it('uses default value when environment value not found', () => {
      const TestKey = createEnvironmentKey<string>('TestKey', 'default-value')
      const context = createComponentContext('test-component')

      runWithComponentContext(context, () => {
        const value = consumeEnvironmentValue(TestKey)
        expect(value).toBe('default-value')
      })
    })

    it('throws error when required environment value not found', () => {
      const TestKey = createEnvironmentKey<string>('TestKey')
      const context = createComponentContext('test-component')

      runWithComponentContext(context, () => {
        expect(() => {
          consumeEnvironmentValue(TestKey)
        }).toThrow("Environment value for 'TestKey' not found")
      })
    })

    it('tracks environment consumers', () => {
      const context = createComponentContext('test-component')
      const TestKey = createEnvironmentKey<string>('TestKey', 'default-value')

      runWithComponentContext(context, () => {
        consumeEnvironmentValue(TestKey)

        expect(context.consumers.has(TestKey.symbol)).toBe(true)
      })
    })
  })

  describe('Component Wrapper', () => {
    it('wraps component with context injection', () => {
      const TestComponent = (props: ComponentProps) => ({
        type: 'component' as const,
        render: () => ({ type: 'element' as const, tag: 'div' }),
        props,
        id: 'test-component',
      })

      const WrappedComponent = withComponentContext(TestComponent)
      const instance = WrappedComponent({})

      expect(instance.context).toBeDefined()
      expect(instance.context!.id).toMatch(/component-/)
      expect(instance.cleanup).toBeDefined()
      expect(instance.cleanup!.length).toBe(1)
    })

    it('provides custom context ID to wrapped component', () => {
      const TestComponent = (props: ComponentProps) => ({
        type: 'component' as const,
        render: () => ({ type: 'element' as const, tag: 'div' }),
        props,
        id: 'test-component',
      })

      const WrappedComponent = withComponentContext(TestComponent, 'custom-context')
      const instance = WrappedComponent({})

      expect(instance.context!.id).toBe('custom-context')
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('runs cleanup functions on dispose', () => {
      const context = createComponentContext('test-component')
      const cleanupFn = vi.fn()

      runWithComponentContext(context, () => {
        getCurrentComponentContext().onCleanup(cleanupFn)
      })

      context.dispose()

      expect(cleanupFn).toHaveBeenCalledTimes(1)
    })

    it('clears all stores on dispose', () => {
      const context = createComponentContext('test-component')
      const TestKey = createEnvironmentKey<string>('TestKey')

      runWithComponentContext(context, () => {
        const ctx = getCurrentComponentContext()
        ctx.setState('test', 'value')
        ctx.setBinding('testBinding', {})
        provideEnvironmentValue(TestKey, 'test-value')
      })

      // Verify stores have content
      expect(context.providers.size).toBeGreaterThan(0)

      context.dispose()

      // Verify stores are cleared
      expect(context.providers.size).toBe(0)
      expect(context.consumers.size).toBe(0)
    })

    it('handles cleanup errors gracefully', () => {
      const context = createComponentContext('test-component')
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      runWithComponentContext(context, () => {
        getCurrentComponentContext().onCleanup(() => {
          throw new Error('Cleanup error')
        })
      })

      expect(() => {
        context.dispose()
      }).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error in component context cleanup'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Performance Metrics', () => {
    it('tracks context performance metrics', () => {
      const context = createComponentContext('test-component') as any
      const startTime = Date.now()

      const metrics = context.getMetrics()

      expect(metrics.id).toBe('test-component')
      expect(metrics.createdAt).toBeGreaterThanOrEqual(startTime)
      expect(metrics.updateCount).toBe(0)
      expect(metrics.stateCount).toBe(0)
      expect(metrics.bindingCount).toBe(0)
      expect(metrics.providerCount).toBe(0)
      expect(metrics.consumerCount).toBe(0)
    })
  })

  describe('Debug Utilities', () => {
    it('provides current context debug info', () => {
      const context = createComponentContext('test-component')

      setCurrentComponentContext(context)

      expect(ComponentContextDebug.getCurrentContext()).toBe(context)
    })

    it('provides context hierarchy', () => {
      const grandparent = createComponentContext('grandparent')
      const parent = createComponentContext('parent', grandparent)
      const child = createComponentContext('child', parent)

      setCurrentComponentContext(child)

      const hierarchy = ComponentContextDebug.getContextHierarchy()

      expect(hierarchy).toEqual([child, parent, grandparent])
    })

    it('provides context metrics', () => {
      const context = createComponentContext('test-component')

      setCurrentComponentContext(context)

      const metrics = ComponentContextDebug.getContextMetrics()

      expect(metrics).toBeDefined()
      expect(metrics!.id).toBe('test-component')
    })

    it('returns null metrics when no context', () => {
      const metrics = ComponentContextDebug.getContextMetrics()

      expect(metrics).toBeNull()
    })
  })

  describe('Integration with Reactive System', () => {
    it('integrates with reactive context', () => {
      createRoot((dispose) => {
        const context = createComponentContext('test-component')

        runWithComponentContext(context, () => {
          const currentContext = getCurrentComponentContext()
          expect(currentContext).toBe(context)
        })

        dispose()
      })
    })
  })
})
