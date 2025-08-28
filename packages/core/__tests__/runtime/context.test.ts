/**
 * Context and Dependency Injection Tests (Phase 3.2.1)
 *
 * Comprehensive tests for the context system, provider/consumer patterns,
 * reactive context updates, and dependency injection container.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal } from '../../src/reactive'
import {
  ContextManager,
  contextUtils,
  createContext,
  createContextConsumer,
  DIContainer,
  defaultContextManager,
  globalDI,
  Injectable,
  inject,
  useContext,
  withProvider,
} from '../../src/runtime/context'
import type { ComponentContext, ComponentInstance } from '../../src/runtime/types'

describe('Context and Dependency Injection System', () => {
  afterEach(() => {
    // Clean up after each test
    defaultContextManager.clear()
    globalDI.clear()
  })

  describe('Context Creation and Basic Usage', () => {
    it('should create context with default value', () => {
      const context = createContext('default', { displayName: 'TestContext' })

      expect(context.defaultValue).toBe('default')
      expect(context.displayName).toBe('TestContext')
      expect(typeof context.symbol).toBe('symbol')
    })

    it('should create context without display name', () => {
      const context = createContext(42)

      expect(context.defaultValue).toBe(42)
      expect(context.displayName).toBeUndefined()
      expect(typeof context.symbol).toBe('symbol')
    })

    it('should create contexts with unique symbols', () => {
      const context1 = createContext('value1')
      const context2 = createContext('value2')

      expect(context1.symbol).not.toBe(context2.symbol)
    })
  })

  describe('Context Provider and Consumer', () => {
    let consoleWarnSpy: any

    beforeEach(() => {
      // Suppress expected context warning messages during tests
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation((message) => {
        if (
          typeof message === 'string' &&
          message.includes('Context unnamed used without a Provider')
        ) {
          return // Suppress this expected warning
        }
        // Allow other warnings through
        console.warn.call(console, message)
      })
    })

    afterEach(() => {
      consoleWarnSpy.mockRestore()
    })
    it('should provide and consume context values', () => {
      const context = createContext('default')
      const manager = new ContextManager()

      // Create mock component context
      const componentContext: ComponentContext = {
        id: 'test-component',
        providers: new Map(),
        consumers: new Set(),
        cleanup: new Set(),
      }

      // Set current component
      manager.setCurrentComponent(componentContext)

      // Create provider
      const mockChild: ComponentInstance = {
        type: 'component',
        render: () => [
          {
            type: 'text',
            text: 'child',
          },
        ],
        props: {},
        id: 'child',
      }

      const provider = manager.createProvider(context, 'provided-value', [mockChild])

      // Render provider
      const result = provider.render()
      expect(Array.isArray(result)).toBe(true)
      expect(result[0].type).toBe('element')
    })

    it('should return default value when no provider exists', () => {
      const context = createContext('default-value')
      const getValue = useContext(context)

      expect(getValue()).toBe('default-value')
    })

    it('should warn when using context without provider', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const context = createContext('default', { displayName: 'TestContext' })

      const getValue = useContext(context)
      getValue()

      expect(consoleSpy).toHaveBeenCalledWith(
        'Context TestContext used without a Provider. Using default value.'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('Context Manager', () => {
    let manager: ContextManager

    beforeEach(() => {
      manager = new ContextManager()
    })

    it('should create and manage providers', () => {
      const context = createContext('initial')
      const mockChild: ComponentInstance = {
        type: 'component',
        render: () => [{ type: 'text', text: 'test' }],
        props: {},
        id: 'child',
      }

      const provider = manager.createProvider(context, 'new-value', [mockChild])

      expect(provider.type).toBe('component')
      expect(provider.id).toMatch(/^provider_/)
    })

    it('should update context values', () => {
      const context = createContext('initial')

      // Update should return false when no provider exists
      expect(manager.updateContext(context, 'updated')).toBe(false)
    })

    it('should get all active contexts', () => {
      const contexts = manager.getAllContexts()
      expect(contexts instanceof Map).toBe(true)
    })

    it('should clear all contexts', () => {
      manager.clear()
      const contexts = manager.getAllContexts()
      expect(contexts.size).toBe(0)
    })
  })

  describe('Higher-Order Context Components', () => {
    it('should create provider HOC', () => {
      const context = createContext('default')
      const mockComponent = vi.fn().mockReturnValue({
        type: 'component',
        render: () => [{ type: 'text', text: 'test' }],
        props: {},
        id: 'test',
      })

      const ProviderHOC = withProvider(context, 'provided-value')
      const WrappedComponent = ProviderHOC(mockComponent)

      const instance = WrappedComponent({ testProp: 'test' })

      expect(mockComponent).toHaveBeenCalledWith({ testProp: 'test' })
      expect(instance.type).toBe('component')
    })

    it('should create context consumer', () => {
      const context = createContext('default-value')
      const renderFn = vi.fn().mockReturnValue({
        type: 'component',
        render: () => [{ type: 'text', text: 'consumer' }],
        props: {},
        id: 'consumer',
      })

      const consumer = createContextConsumer(context, renderFn)

      expect(consumer.type).toBe('component')
      expect(consumer.id).toMatch(/^consumer_/)
    })
  })

  describe('Context Utilities', () => {
    it('should create context group', () => {
      const defaults = {
        theme: 'light',
        user: { name: 'Anonymous' },
        count: 0,
      }

      const contexts = contextUtils.createContextGroup(defaults, { prefix: 'App' })

      expect(contexts.theme.defaultValue).toBe('light')
      expect(contexts.theme.displayName).toBe('App.theme')
      expect(contexts.user.defaultValue).toEqual({ name: 'Anonymous' })
      expect(contexts.count.defaultValue).toBe(0)
    })

    it('should combine multiple providers', () => {
      const contexts = contextUtils.createContextGroup({
        theme: 'light',
        user: { name: 'Test' },
      })

      const values = {
        theme: 'dark',
        user: { name: 'User' },
      }

      const mockChild: ComponentInstance = {
        type: 'component',
        render: () => [{ type: 'text', text: 'child' }],
        props: {},
        id: 'child',
      }

      const combined = contextUtils.combineProviders(contexts, values, [mockChild])

      expect(combined.type).toBe('component')
    })

    it('should create validated context', () => {
      const validator = (value: string) => value.length > 0 || 'Value cannot be empty'
      const context = contextUtils.createValidatedContext('test', validator, {
        displayName: 'ValidatedContext',
      })

      expect(context.defaultValue).toBe('test')
      expect(context.displayName).toBe('ValidatedContext')
      expect(context.validate('valid')).toBe(true)
      expect(context.validate('')).toBe('Value cannot be empty')
    })
  })

  describe('Dependency Injection Container', () => {
    let container: DIContainer

    beforeEach(() => {
      container = new DIContainer()
    })

    it('should register and resolve services', () => {
      const service = { name: 'TestService' }
      container.register('testService', service)

      const resolved = container.resolve<typeof service>('testService')
      expect(resolved).toBe(service)
    })

    it('should register and resolve factory functions', () => {
      const factory = () => ({ value: Math.random() })
      container.register('factory', factory)

      const instance1 = container.resolve<ReturnType<typeof factory>>('factory')
      const instance2 = container.resolve<ReturnType<typeof factory>>('factory')

      // Should create new instances each time
      expect(instance1).not.toBe(instance2)
      expect(typeof instance1.value).toBe('number')
    })

    it('should handle singleton services', () => {
      class TestService {
        id = Math.random()
      }

      container.register('singleton', TestService, { singleton: true })

      const instance1 = container.resolve<TestService>('singleton')
      const instance2 = container.resolve<TestService>('singleton')

      expect(instance1).toBe(instance2)
      expect(instance1.id).toBe(instance2.id)
    })

    it('should handle dependency injection', () => {
      class Database {
        name = 'db'
      }

      class UserService {
        constructor(private db: Database) {}
        getDb() {
          return this.db
        }
      }

      container.register('database', Database)
      container.register('userService', UserService, {
        dependencies: ['database'],
      })

      const userService = container.resolve<UserService>('userService')
      expect(userService.getDb().name).toBe('db')
    })

    it('should throw error for unregistered services', () => {
      expect(() => {
        container.resolve('nonexistent')
      }).toThrow('Service nonexistent not found in DI container')
    })

    it('should check if service exists', () => {
      container.register('test', { value: 'test' })

      expect(container.has('test')).toBe(true)
      expect(container.has('nonexistent')).toBe(false)
    })

    it('should get all registered services', () => {
      container.register('service1', { name: 'service1' })
      container.register('service2', () => ({ name: 'service2' }))

      const registered = container.getRegistered()
      expect(registered).toContain('service1')
      expect(registered).toContain('service2')
    })

    it('should clear all services', () => {
      container.register('test', { value: 'test' })
      expect(container.has('test')).toBe(true)

      container.clear()
      expect(container.has('test')).toBe(false)
    })
  })

  describe('Global DI Container', () => {
    it('should provide global inject function', () => {
      globalDI.register('global', { value: 'global-service' })

      const service = inject<{ value: string }>('global')
      expect(service.value).toBe('global-service')
    })

    it('should support Injectable decorator', () => {
      // Skip decorator test for now - requires proper TypeScript configuration
      const DecoratedService = Injectable('decorated')(
        class {
          name = 'decorated'
        }
      )

      const service = inject<InstanceType<typeof DecoratedService>>('decorated')
      expect(service.name).toBe('decorated')
    })

    it('should auto-register class name when no key provided', () => {
      // Skip decorator test for now - requires proper TypeScript configuration
      const AutoService = Injectable()(
        class AutoService {
          value = 'auto'
        }
      )

      const service = inject<InstanceType<typeof AutoService>>('AutoService')
      expect(service.value).toBe('auto')
    })
  })

  describe('Context Integration with Reactive System', () => {
    it('should handle reactive context updates', async () => {
      const context = createContext(0)
      const manager = new ContextManager()

      // Create reactive signal
      const [_count, _setCount] = createSignal(0)

      // Create mock component
      const componentContext: ComponentContext = {
        id: 'reactive-test',
        providers: new Map(),
        consumers: new Set(),
        cleanup: new Set(),
      }

      manager.setCurrentComponent(componentContext)

      // Update context value
      expect(manager.updateContext(context, 5)).toBe(false) // No provider yet

      // Test would need actual provider setup for full reactive integration
    })

    it('should handle nested context providers', () => {
      const outerContext = createContext('outer')
      const innerContext = createContext('inner')
      const manager = new ContextManager()

      const mockChild: ComponentInstance = {
        type: 'component',
        render: () => [{ type: 'text', text: 'nested-child' }],
        props: {},
        id: 'nested',
      }

      // Create nested providers
      const innerProvider = manager.createProvider(innerContext, 'inner-value', [mockChild])
      const outerProvider = manager.createProvider(outerContext, 'outer-value', [innerProvider])

      expect(outerProvider.type).toBe('component')
      expect(innerProvider.type).toBe('component')
    })
  })

  describe('Memory Management and Cleanup', () => {
    it('should clean up context subscriptions', () => {
      const _context = createContext('test')
      const manager = new ContextManager()

      // Setup component
      const componentContext: ComponentContext = {
        id: 'cleanup-test',
        providers: new Map(),
        consumers: new Set(),
        cleanup: new Set(),
      }

      manager.setCurrentComponent(componentContext)

      // Clear should not throw
      expect(() => manager.clear()).not.toThrow()
    })

    it('should handle provider disposal', () => {
      const context = createContext('disposable')
      const manager = new ContextManager()

      const mockChild: ComponentInstance = {
        type: 'component',
        render: () => [{ type: 'text', text: 'child' }],
        props: {},
        id: 'disposable-child',
      }

      const provider = manager.createProvider(context, 'value', [mockChild])
      const rendered = provider.render()

      // Check for dispose function
      expect(Array.isArray(rendered)).toBe(true)
      if (Array.isArray(rendered) && rendered[0] && 'dispose' in rendered[0]) {
        expect(typeof rendered[0].dispose).toBe('function')
      }
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle context creation with complex objects', () => {
      const complexDefault = {
        user: { id: 1, name: 'Test' },
        settings: { theme: 'dark', lang: 'en' },
        features: ['feature1', 'feature2'],
      }

      const context = createContext(complexDefault)
      expect(context.defaultValue).toEqual(complexDefault)
    })

    it('should handle DI container circular dependencies gracefully', () => {
      const container = new DIContainer()

      // This would create a circular dependency - container should handle gracefully
      container.register('serviceA', () => inject('serviceB'), { dependencies: ['serviceB'] })
      container.register('serviceB', () => inject('serviceA'), { dependencies: ['serviceA'] })

      // Should throw error rather than infinite loop
      expect(() => {
        container.resolve('serviceA')
      }).toThrow()
    })

    it('should handle multiple context managers', () => {
      const manager1 = new ContextManager()
      const manager2 = new ContextManager()
      const _context = createContext('test')

      // Each manager should be independent
      manager1.clear()
      manager2.clear()

      expect(manager1.getAllContexts().size).toBe(0)
      expect(manager2.getAllContexts().size).toBe(0)
    })
  })
})
