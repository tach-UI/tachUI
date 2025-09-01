/**
 * Navigation Router Tests
 *
 * Tests for SwiftUI-compatible navigation router implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HTML } from '@tachui/primitives'
import { createSignal } from '@tachui/core'
import {
  createNavigationRouter,
  parseURL,
  buildURL,
  extractRouteParams,
  createRouteMatcher,
  RouterUtils,
  NavigationRouterBuilder,
} from '../src/navigation-router'
import type { NavigationContext, NavigationDestination } from '../src/types'

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

  push(destination: NavigationDestination, path?: string): void {
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

  replace(
    destination: NavigationDestination,
    path?: string,
    title?: string
  ): void {
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

describe('Navigation Router - SwiftUI Compatible Router System', () => {
  let mockContext: MockNavigationContext
  let mockDestination: NavigationDestination

  beforeEach(() => {
    mockContext = new MockNavigationContext()
    mockDestination = () => HTML.div({ children: 'Test View' }).modifier.build()
  })

  describe('createNavigationRouter', () => {
    it('creates a navigation router with context', () => {
      const router = createNavigationRouter(mockContext)

      expect(router).toBeDefined()
      expect(typeof router.push).toBe('function')
      expect(typeof router.pop).toBe('function')
      expect(typeof router.replace).toBe('function')
    })

    it('accepts optional route change callback', () => {
      const onRouteChange = vi.fn()
      const router = createNavigationRouter(mockContext, onRouteChange)

      expect(router).toBeDefined()
    })

    it('initializes with current path from context', () => {
      const router = createNavigationRouter(mockContext)

      expect(router.currentPath()).toBe('/')
    })
  })

  describe('Router Navigation Methods', () => {
    let router: any

    beforeEach(() => {
      router = createNavigationRouter(mockContext)
    })

    it('pushes new destination with path', () => {
      router.push(mockDestination, '/test')

      expect(mockContext.currentPath).toBe('/test')
    })

    it('pushes destination with auto-generated path', () => {
      router.push(mockDestination)

      expect(mockContext.currentPath).toMatch(/^\/destination-\d+$/)
    })

    it('pops to previous destination', () => {
      // Push two destinations
      router.push(mockDestination, '/first')
      router.push(mockDestination, '/second')

      router.pop()

      expect(mockContext.currentPath).toBe('/first')
    })

    it('pops to root', () => {
      router.push(mockDestination, '/first')
      router.push(mockDestination, '/second')
      router.push(mockDestination, '/third')

      router.popToRoot()

      expect(mockContext.currentPath).toBe('/')
    })

    it('replaces current destination', () => {
      router.push(mockDestination, '/original')
      router.replace(mockDestination, '/replaced')

      expect(mockContext.currentPath).toBe('/replaced')
    })

    it('provides navigation state information', () => {
      expect(router.canGoBack()).toBe(false)
      expect(router.canGoForward()).toBe(false)
      expect(router.currentPath()).toBe('/')
    })
  })

  describe('URL Parsing and Building', () => {
    it('parses simple URL', () => {
      const result = parseURL('https://example.com/path')

      expect(result.scheme).toBe('https')
      expect(result.host).toBe('example.com')
      expect(result.path).toBe('/path')
      expect(result.query).toEqual({})
    })

    it('parses URL with query parameters', () => {
      const result = parseURL('https://example.com/search?q=test&page=1')

      expect(result.path).toBe('/search')
      expect(result.query).toEqual({ q: 'test', page: '1' })
    })

    it('parses URL with fragment', () => {
      const result = parseURL('https://example.com/page#section')

      expect(result.path).toBe('/page')
      expect(result.fragment).toBe('section')
    })

    it('handles invalid URLs gracefully', () => {
      const result = parseURL('invalid-url')

      expect(result.path).toBe('/invalid-url')
      expect(result.query).toEqual({})
    })

    it('builds URL from components', () => {
      const components = {
        scheme: 'https',
        host: 'example.com',
        path: '/search',
        query: { q: 'test', page: '1' },
        fragment: 'results',
      }

      const url = buildURL(components)

      expect(url).toBe('https://example.com/search?q=test&page=1#results')
    })

    it('builds URL without scheme/host', () => {
      const components = {
        path: '/search',
        query: { q: 'test' },
      }

      const url = buildURL(components)

      expect(url).toBe('/search?q=test')
    })
  })

  describe('Route Parameter Extraction', () => {
    it('extracts single parameter', () => {
      const params = extractRouteParams('/users/123', '/users/:id')

      expect(params).toEqual({ id: '123' })
    })

    it('extracts multiple parameters', () => {
      const params = extractRouteParams(
        '/users/123/posts/456',
        '/users/:userId/posts/:postId'
      )

      expect(params).toEqual({ userId: '123', postId: '456' })
    })

    it('handles missing parameters', () => {
      const params = extractRouteParams('/users', '/users/:id')

      expect(params).toEqual({ id: '' })
    })

    it('handles extra path segments', () => {
      const params = extractRouteParams('/users/123/extra', '/users/:id')

      expect(params).toEqual({ id: '123' })
    })
  })

  describe('Route Matching', () => {
    it('matches exact routes', () => {
      const matcher = createRouteMatcher('/users')

      expect(matcher('/users')).toBe(true)
      expect(matcher('/users/123')).toBe(false)
      expect(matcher('/posts')).toBe(false)
    })

    it('matches parameterized routes', () => {
      const matcher = createRouteMatcher('/users/:id')

      expect(matcher('/users/123')).toBe(true)
      expect(matcher('/users/abc')).toBe(true)
      expect(matcher('/users')).toBe(false)
      expect(matcher('/users/123/extra')).toBe(false)
    })

    it('matches wildcard routes', () => {
      const matcher = createRouteMatcher('/admin/*')

      expect(matcher('/admin')).toBe(true)
      expect(matcher('/admin/users')).toBe(true)
      expect(matcher('/admin/users/123')).toBe(true)
      expect(matcher('/users')).toBe(false)
    })

    it('matches complex patterns', () => {
      const matcher = createRouteMatcher('/api/v1/users/:id/posts/:postId')

      expect(matcher('/api/v1/users/123/posts/456')).toBe(true)
      expect(matcher('/api/v1/users/123/posts')).toBe(false)
      expect(matcher('/api/v2/users/123/posts/456')).toBe(false)
    })
  })

  describe('Router Utilities', () => {
    it('detects browser routing support', () => {
      // In test environment, this should return false
      expect(RouterUtils.isBrowserRoutingSupported()).toBe(false)
    })

    it('gets current path in test environment', () => {
      expect(RouterUtils.getCurrentPath()).toBe('/')
    })

    it('handles browser navigation in test environment', () => {
      // Should not throw in test environment
      expect(() => {
        RouterUtils.browserNavigate('/test')
      }).not.toThrow()
    })
  })

  describe('Navigation Router Builder', () => {
    it('creates router builder', () => {
      const builder = NavigationRouterBuilder.create(mockContext)

      expect(builder).toBeDefined()
      expect(typeof builder.route).toBe('function')
      expect(typeof builder.routes).toBe('function')
      expect(typeof builder.build).toBe('function')
    })

    it('builds router from builder', () => {
      const builder = NavigationRouterBuilder.create(mockContext)
      const router = builder.build()

      expect(router).toBeDefined()
      expect(typeof router.push).toBe('function')
    })

    it('supports route registration', () => {
      const builder = NavigationRouterBuilder.create(mockContext)

      // Mock console.log to avoid test output
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      builder.route('/test', mockDestination, { title: 'Test' })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Route registered:',
        '/test',
        mockDestination,
        { title: 'Test' }
      )

      consoleSpy.mockRestore()
    })

    it('supports multiple route registration', () => {
      const builder = NavigationRouterBuilder.create(mockContext)

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      const routes = [
        {
          path: '/home',
          component: mockDestination,
          metadata: { title: 'Home' },
        },
        {
          path: '/about',
          component: mockDestination,
          metadata: { title: 'About' },
        },
      ]

      builder.routes(routes)

      expect(consoleSpy).toHaveBeenCalledTimes(2)

      consoleSpy.mockRestore()
    })
  })

  describe('Router Integration', () => {
    it('integrates with navigation context', () => {
      const router = createNavigationRouter(mockContext)

      router.push(mockDestination, '/test')

      expect(mockContext.currentPath).toBe('/test')
    })

    it('handles route change callbacks', () => {
      const onRouteChange = vi.fn()
      const router = createNavigationRouter(mockContext, onRouteChange)

      router.push(mockDestination, '/test')

      expect(onRouteChange).toHaveBeenCalledWith('/test')
    })

    it('provides navigation history', () => {
      const router = createNavigationRouter(mockContext)
      const history = router.getHistory()

      expect(history).toBeDefined()
      expect(Array.isArray(history.entries)).toBe(true)
      expect(typeof history.canGoBack).toBe('boolean')
      expect(typeof history.canGoForward).toBe('boolean')
    })
  })

  describe('Error Handling', () => {
    it('handles invalid URLs in parseURL', () => {
      const result = parseURL('')

      expect(result.path).toBe('/')
      expect(result.query).toEqual({})
    })

    it('handles malformed URLs gracefully', () => {
      const result = parseURL('not-a-url-at-all')

      expect(result.path).toBe('/not-a-url-at-all')
    })

    it('handles empty route parameters', () => {
      const params = extractRouteParams('', '/:id')

      expect(params).toEqual({ id: '' })
    })

    it('handles route matching with special characters', () => {
      const matcher = createRouteMatcher('/search')

      expect(matcher('/search?q=test')).toBe(false)
      expect(matcher('/search')).toBe(true)
    })
  })
})
