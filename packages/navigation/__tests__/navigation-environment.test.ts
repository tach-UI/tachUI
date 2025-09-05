/**
 * Navigation Environment Tests
 *
 * Tests for SwiftUI-compatible navigation environment system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HTML } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import {
  useNavigationEnvironmentContext,
  useNavigationEnvironmentRouter,
  useNavigationEnvironmentState,
  NavigationEnvironmentProvider,
  NavigationEnvironmentUtils,
  clearNavigationEnvironment,
  getNavigationEnvironment,
  hasNavigationEnvironment,
  withNavigationEnvironment,
} from '../src/navigation-environment'
import type { NavigationContext, NavigationRouter } from '../src/types'

// Mock navigation context
class MockNavigationContext implements NavigationContext {
  private _path = '/'
  private _stack: any[] = []

  get stack() {
    return this._stack
  }

  get currentPath() {
    return this._path
  }

  get canGoBack() {
    return this._stack.length > 1
  }

  get canGoForward() {
    return false
  }

  push(destination: any, path?: string): void {
    this._path = path || `/destination-${Date.now()}`
    this._stack.push({ destination, path: this._path })
  }

  pop(): void {
    if (this._stack.length > 1) {
      this._stack.pop()
      this._path = this._stack[this._stack.length - 1]?.path || '/'
    }
  }

  popToRoot(): void {
    this._stack = this._stack.slice(0, 1)
    this._path = this._stack[0]?.path || '/'
  }

  replace(destination: any, path?: string, title?: string): void {
    if (this._stack.length > 0) {
      this._stack[this._stack.length - 1] = {
        destination,
        path: path || this._path,
        title,
      }
    }
    this._path = path || this._path
  }
}

// Mock navigation router
class MockNavigationRouter implements NavigationRouter {
  private _currentPath = '/'

  currentPath(): string {
    return this._currentPath
  }

  canGoBack(): boolean {
    return false
  }

  canGoForward(): boolean {
    return false
  }

  push(destination: any, path?: string): void {
    this._currentPath = path || `/destination-${Date.now()}`
  }

  pop(): void {
    this._currentPath = '/'
  }

  popToRoot(): void {
    this._currentPath = '/'
  }

  replace(destination: any, path?: string): void {
    this._currentPath = path || this._currentPath
  }

  getHistory(): any {
    return {
      entries: [],
      currentIndex: -1,
      canGoBack: false,
      canGoForward: false,
    }
  }
}

describe('Navigation Environment - SwiftUI Compatible Environment System', () => {
  let mockContext: MockNavigationContext
  let mockRouter: MockNavigationRouter

  beforeEach(() => {
    mockContext = new MockNavigationContext()
    mockRouter = new MockNavigationRouter()
    // Clear any existing environment
    clearNavigationEnvironment()
  })

  afterEach(() => {
    clearNavigationEnvironment()
  })

  describe('Navigation Environment Provider', () => {
    it('creates navigation environment provider', () => {
      const provider = NavigationEnvironmentProvider({
        context: mockContext,
        router: mockRouter,
      })

      expect(provider).toBeDefined()
      expect(provider.type).toBe('component')
    })

    it('provides navigation context to children', () => {
      const childComponent = HTML.div({ children: 'Child' }).modifier.build()

      const provider = NavigationEnvironmentProvider({
        context: mockContext,
        router: mockRouter,
        children: [childComponent],
      })

      expect(provider).toBeDefined()
    })

    it('handles missing context gracefully', () => {
      const provider = NavigationEnvironmentProvider({
        router: mockRouter,
      })

      expect(provider).toBeDefined()
    })

    it('handles missing router gracefully', () => {
      const provider = NavigationEnvironmentProvider({
        context: mockContext,
      })

      expect(provider).toBeDefined()
    })
  })

  describe('Navigation Environment Hooks', () => {
    beforeEach(() => {
      // Set up environment for testing
      const provider = NavigationEnvironmentProvider({
        context: mockContext,
        router: mockRouter,
      })
      // Simulate environment setup
      ;(globalThis as any).__navigationEnvironment = {
        context: mockContext,
        router: mockRouter,
      }
    })

    it('provides navigation context hook', () => {
      const context = useNavigationEnvironmentContext()

      expect(context).toBeDefined()
      expect(context.currentPath).toBe('/')
    })

    it('provides navigation router hook', () => {
      const router = useNavigationEnvironmentRouter()

      expect(router).toBeDefined()
      expect(typeof router.push).toBe('function')
      expect(typeof router.pop).toBe('function')
    })

    it('provides navigation state hook', () => {
      const state = useNavigationEnvironmentState()

      expect(state).toBeDefined()
      expect(state.canGoBack).toBeDefined()
      expect(state.canGoForward).toBeDefined()
      expect(state.currentPath).toBeDefined()
    })

    it('handles missing environment gracefully', () => {
      // Clear environment
      delete (globalThis as any).__navigationEnvironment

      expect(() => useNavigationEnvironmentContext()).not.toThrow()
      expect(() => useNavigationEnvironmentRouter()).not.toThrow()
      expect(() => useNavigationEnvironmentState()).not.toThrow()
    })
  })

  describe('Navigation Environment Utilities', () => {
    it('clears navigation environment', () => {
      // Set up environment
      ;(globalThis as any).__navigationEnvironment = {
        context: mockContext,
        router: mockRouter,
      }

      expect(hasNavigationEnvironment()).toBe(true)

      clearNavigationEnvironment()

      expect(hasNavigationEnvironment()).toBe(false)
    })

    it('gets navigation environment', () => {
      // Set up environment
      const env = {
        context: mockContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = env

      const retrieved = getNavigationEnvironment()

      expect(retrieved).toEqual(env)
    })

    it('checks if navigation environment exists', () => {
      expect(hasNavigationEnvironment()).toBe(false)
      ;(globalThis as any).__navigationEnvironment = {
        context: mockContext,
        router: mockRouter,
      }

      expect(hasNavigationEnvironment()).toBe(true)
    })

    it('handles missing environment in getNavigationEnvironment', () => {
      clearNavigationEnvironment()

      const result = getNavigationEnvironment()

      expect(result).toBeNull()
    })
  })

  describe('withNavigationEnvironment HOC', () => {
    it('wraps component with navigation environment', () => {
      const testComponent = HTML.div({ children: 'Test' }).modifier.build()

      const wrapped = withNavigationEnvironment(testComponent, {
        context: mockContext,
        router: mockRouter,
      })

      expect(wrapped).toBeDefined()
      expect(wrapped.type).toBe('component')
    })

    it('preserves original component properties', () => {
      const testComponent = HTML.div({
        children: 'Test',
        className: 'test-class',
      }).modifier.build()

      const wrapped = withNavigationEnvironment(testComponent, {
        context: mockContext,
        router: mockRouter,
      })

      expect(wrapped).toBeDefined()
    })

    it('handles null component gracefully', () => {
      expect(() => {
        withNavigationEnvironment(null as any, {
          context: mockContext,
          router: mockRouter,
        })
      }).not.toThrow()
    })
  })

  describe('Environment State Management', () => {
    it('maintains environment state across components', () => {
      // Set up environment
      const env = {
        context: mockContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = env

      // Multiple calls should return the same environment
      const env1 = getNavigationEnvironment()
      const env2 = getNavigationEnvironment()

      expect(env1).toBe(env2)
    })

    it('isolates environment per test', () => {
      // Each test should start with clean environment
      expect(hasNavigationEnvironment()).toBe(false)

      // Set up environment
      ;(globalThis as any).__navigationEnvironment = {
        context: mockContext,
        router: mockRouter,
      }

      expect(hasNavigationEnvironment()).toBe(true)
    })

    it('handles concurrent environment access', () => {
      // Set up environment
      const env = {
        context: mockContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = env

      // Simulate concurrent access
      const results = [
        getNavigationEnvironment(),
        getNavigationEnvironment(),
        getNavigationEnvironment(),
      ]

      results.forEach(result => {
        expect(result).toEqual(env)
      })
    })
  })

  describe('Environment Integration with Components', () => {
    it('integrates with component lifecycle', () => {
      const testComponent = HTML.div({ children: 'Test' }).modifier.build()

      // Simulate component with environment
      const componentWithEnv = withNavigationEnvironment(testComponent, {
        context: mockContext,
        router: mockRouter,
      })

      expect(componentWithEnv).toBeDefined()
      expect((componentWithEnv as any)._navigationEnvironment).toBeDefined()
    })

    it('provides environment to nested components', () => {
      const childComponent = HTML.span({ children: 'Child' }).modifier.build()
      const parentComponent = HTML.div({
        children: [childComponent],
      }).modifier.build()

      const wrapped = withNavigationEnvironment(parentComponent, {
        context: mockContext,
        router: mockRouter,
      })

      expect(wrapped).toBeDefined()
    })

    it('handles environment updates', () => {
      // Set up initial environment
      const initialEnv = {
        context: mockContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = initialEnv

      // Update environment
      const newContext = new MockNavigationContext()
      const newEnv = {
        context: newContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = newEnv

      const retrieved = getNavigationEnvironment()

      expect(retrieved).toEqual(newEnv)
      expect(retrieved?.context).toBe(newContext)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('handles undefined globalThis gracefully', () => {
      const originalGlobalThis = globalThis
      // Simulate environment without globalThis
      ;(globalThis as any).__navigationEnvironment = undefined

      expect(() => getNavigationEnvironment()).not.toThrow()
      expect(() => hasNavigationEnvironment()).not.toThrow()
      expect(() => clearNavigationEnvironment()).not.toThrow()
    })

    it('handles malformed environment data', () => {
      // Set up malformed environment
      ;(globalThis as any).__navigationEnvironment = {
        context: null,
        router: undefined,
      }

      expect(() => getNavigationEnvironment()).not.toThrow()
      expect(() => useNavigationEnvironmentContext()).not.toThrow()
    })

    it('handles environment cleanup during component lifecycle', () => {
      // Set up environment
      ;(globalThis as any).__navigationEnvironment = {
        context: mockContext,
        router: mockRouter,
      }

      // Simulate component cleanup
      clearNavigationEnvironment()

      expect(hasNavigationEnvironment()).toBe(false)
      expect(getNavigationEnvironment()).toBeNull()
    })

    it('handles rapid environment changes', () => {
      // Rapidly change environment
      for (let i = 0; i < 10; i++) {
        ;(globalThis as any).__navigationEnvironment = {
          context: new MockNavigationContext(),
          router: new MockNavigationRouter(),
        }
      }

      expect(() => getNavigationEnvironment()).not.toThrow()
      expect(hasNavigationEnvironment()).toBe(true)
    })
  })

  describe('Performance and Memory', () => {
    it('efficiently manages environment storage', () => {
      // Set up environment
      const env = {
        context: mockContext,
        router: mockRouter,
      }
      ;(globalThis as any).__navigationEnvironment = env

      // Multiple retrievals should be fast
      const start = performance.now()

      for (let i = 0; i < 1000; i++) {
        getNavigationEnvironment()
        hasNavigationEnvironment()
      }

      const end = performance.now()
      const duration = end - start

      // Should complete in reasonable time (less than 10ms)
      expect(duration).toBeLessThan(10)
    })

    it('properly cleans up environment references', () => {
      // Set up environment with complex objects
      const complexContext = new MockNavigationContext()
      const complexRouter = new MockNavigationRouter()

      ;(globalThis as any).__navigationEnvironment = {
        context: complexContext,
        router: complexRouter,
      }

      // Clear environment
      clearNavigationEnvironment()

      // Environment should be completely cleared
      expect((globalThis as any).__navigationEnvironment).toBeUndefined()
    })

    it('handles large numbers of environment operations', () => {
      const operations = 100

      for (let i = 0; i < operations; i++) {
        ;(globalThis as any).__navigationEnvironment = {
          context: new MockNavigationContext(),
          router: new MockNavigationRouter(),
        }

        expect(hasNavigationEnvironment()).toBe(true)
        expect(getNavigationEnvironment()).toBeDefined()
      }

      clearNavigationEnvironment()
      expect(hasNavigationEnvironment()).toBe(false)
    })
  })
})
