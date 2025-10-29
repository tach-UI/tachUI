/**
 * Navigation Path Tests
 *
 * Tests for navigation path management, typed paths,
 * and path manipulation utilities.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import {
  NavigationPath,
  createNavigationPath,
  createTypedNavigationPath,
  TypedNavigationPath,
} from '../src/navigation-path'

describe('Navigation Path - Path Management and Utilities', () => {
  let mockComponent1: any
  let mockComponent2: any
  let mockComponent3: any

  beforeEach(() => {
    mockComponent1 = () =>
      HTML.div({ children: 'Component 1' }).build()
    mockComponent2 = () =>
      HTML.div({ children: 'Component 2' }).build()
    mockComponent3 = () =>
      HTML.div({ children: 'Component 3' }).build()
  })

  describe('Navigation Path Creation', () => {
    it('creates navigation path with segments', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path).toBeDefined()
      expect(path.segments).toEqual(['home', 'settings', 'profile'])
      expect(path.count).toBe(3)
      expect(path.isEmpty).toBe(false)
    })

    it('creates empty navigation path', () => {
      const path = createNavigationPath([])

      expect(path.segments).toEqual([])
      expect(path.count).toBe(0)
      expect(path.isEmpty).toBe(true)
    })

    it('handles single segment paths', () => {
      const path = createNavigationPath(['home'])

      expect(path.segments).toEqual(['home'])
      expect(path.count).toBe(1)
      expect(path.isEmpty).toBe(false)
    })

    it('validates path segments', () => {
      expect(() => createNavigationPath(['valid-segment'])).not.toThrow()
      expect(() => createNavigationPath([''])).not.toThrow() // Empty strings allowed
      expect(() => createNavigationPath(['segment with spaces'])).not.toThrow()
      expect(() => createNavigationPath(['segment/with/slashes'])).not.toThrow()
    })
  })

  describe('Navigation Path Manipulation', () => {
    it('appends segments correctly', () => {
      const path = createNavigationPath(['home'])
      path.append('settings')

      expect(path.segments).toEqual(['home', 'settings'])
      expect(path.count).toBe(2)
    })

    it('appends multiple segments', () => {
      const path = createNavigationPath(['home'])
      path.appendAll(['settings', 'profile'])

      expect(path.segments).toEqual(['home', 'settings', 'profile'])
      expect(path.count).toBe(3)
    })

    it('removes last segment', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])
      path.removeLast()

      expect(path.segments).toEqual(['home', 'settings'])
      expect(path.count).toBe(2)
    })

    it('removes multiple segments', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])
      path.removeLast(2)

      expect(path.segments).toEqual(['home'])
      expect(path.count).toBe(1)
    })

    it('handles removing more segments than available', () => {
      const path = createNavigationPath(['home', 'settings'])
      path.removeLast(5) // Try to remove more than available

      expect(path.segments).toEqual([])
      expect(path.count).toBe(0)
      expect(path.isEmpty).toBe(true)
    })

    it('clears all segments', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])
      path.clear()

      expect(path.segments).toEqual([])
      expect(path.count).toBe(0)
      expect(path.isEmpty).toBe(true)
    })
  })

  describe('Navigation Path Access', () => {
    it('accesses segments by index', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.at(0)).toBe('home')
      expect(path.at(1)).toBe('settings')
      expect(path.at(2)).toBe('profile')
      expect(path.at(3)).toBeUndefined()
      expect(path.at(-1)).toBeUndefined()
    })

    it('provides last segment access', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.last).toBe('profile')

      const singleSegment = createNavigationPath(['home'])
      expect(singleSegment.last).toBe('home')

      const emptyPath = createNavigationPath([])
      expect(emptyPath.last).toBeUndefined()
    })

    it('provides first segment access', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.first).toBe('home')

      const singleSegment = createNavigationPath(['home'])
      expect(singleSegment.first).toBe('home')

      const emptyPath = createNavigationPath([])
      expect(emptyPath.first).toBeUndefined()
    })
  })

  describe('Navigation Path Queries', () => {
    it('checks segment containment', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.contains('home')).toBe(true)
      expect(path.contains('settings')).toBe(true)
      expect(path.contains('profile')).toBe(true)
      expect(path.contains('unknown')).toBe(false)
      expect(path.contains('')).toBe(false)
    })

    it('finds segment index', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.indexOf('home')).toBe(0)
      expect(path.indexOf('settings')).toBe(1)
      expect(path.indexOf('profile')).toBe(2)
      expect(path.indexOf('unknown')).toBe(-1)
    })

    it('provides segment iteration', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])
      const segments: string[] = []

      path.forEach(segment => segments.push(segment))

      expect(segments).toEqual(['home', 'settings', 'profile'])
    })

    it('provides segment mapping', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      const uppercased = path.map(segment => segment.toUpperCase())

      expect(uppercased).toEqual(['HOME', 'SETTINGS', 'PROFILE'])
    })

    it('provides segment filtering', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      const filtered = path.filter(segment => segment.length > 4)

      expect(filtered).toEqual(['settings', 'profile'])
    })
  })

  describe('Navigation Path Operations', () => {
    it('creates subpaths', () => {
      const path = createNavigationPath([
        'home',
        'settings',
        'profile',
        'account',
      ])

      const subpath = path.subpath(1, 3) // From index 1 to 3 (exclusive)

      expect(subpath.segments).toEqual(['settings', 'profile'])
      expect(subpath.count).toBe(2)
    })

    it('handles invalid subpath ranges', () => {
      const path = createNavigationPath(['home', 'settings'])

      expect(() => path.subpath(-1, 2)).not.toThrow()
      expect(() => path.subpath(0, 10)).not.toThrow()
      expect(() => path.subpath(2, 1)).not.toThrow()
    })

    it('reverses path segments', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      const reversed = path.reversed()

      expect(reversed.segments).toEqual(['profile', 'settings', 'home'])
      expect(reversed.count).toBe(3)
    })

    it('replaces segments', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])
      path.replace(1, 'preferences')

      expect(path.segments).toEqual(['home', 'preferences', 'profile'])
    })

    it('handles invalid replace indices', () => {
      const path = createNavigationPath(['home', 'settings'])

      expect(() => path.replace(-1, 'invalid')).not.toThrow()
      expect(() => path.replace(10, 'invalid')).not.toThrow()
    })
  })

  describe('Navigation Path Comparison', () => {
    it('compares paths correctly', () => {
      const path1 = createNavigationPath(['home', 'settings'])
      const path2 = createNavigationPath(['home', 'settings'])
      const path3 = createNavigationPath(['home', 'profile'])

      expect(path1.equals(path2)).toBe(true)
      expect(path1.equals(path3)).toBe(false)
    })

    it('compares with different path instances', () => {
      const path1 = createNavigationPath(['home', 'settings'])
      const path2 = createNavigationPath(['home', 'settings'])

      expect(path1.equals(path2)).toBe(true)
      expect(path1).not.toBe(path2) // Different instances
    })

    it('handles empty path comparisons', () => {
      const empty1 = createNavigationPath([])
      const empty2 = createNavigationPath([])
      const nonEmpty = createNavigationPath(['home'])

      expect(empty1.equals(empty2)).toBe(true)
      expect(empty1.equals(nonEmpty)).toBe(false)
    })

    it('provides path similarity metrics', () => {
      const path1 = createNavigationPath(['home', 'settings', 'profile'])
      const path2 = createNavigationPath(['home', 'settings', 'account'])

      expect(path1.similarity(path2)).toBe(2 / 3) // 2 out of 3 segments match
    })
  })

  describe('Navigation Path Serialization', () => {
    it('converts to string representation', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      expect(path.toString()).toBe('home/settings/profile')
    })

    it('handles empty path string conversion', () => {
      const path = createNavigationPath([])

      expect(path.toString()).toBe('')
    })

    it('handles single segment string conversion', () => {
      const path = createNavigationPath(['home'])

      expect(path.toString()).toBe('home')
    })

    it('creates path from string', () => {
      const path = createNavigationPath.fromString('home/settings/profile')

      expect(path.segments).toEqual(['home', 'settings', 'profile'])
    })

    it('handles empty string path creation', () => {
      const path = createNavigationPath.fromString('')

      expect(path.segments).toEqual([])
      expect(path.isEmpty).toBe(true)
    })

    it('handles malformed string paths', () => {
      expect(() =>
        createNavigationPath.fromString('home//settings')
      ).not.toThrow()
      expect(() =>
        createNavigationPath.fromString('/home/settings/')
      ).not.toThrow()
    })
  })

  describe('Typed Navigation Path', () => {
    it('creates typed navigation path', () => {
      const path = createTypedNavigationPath([
        'dashboard',
        'analytics',
        'reports',
      ])

      expect(path).toBeDefined()
      expect(path.segments).toEqual(['dashboard', 'analytics', 'reports'])
    })

    it('provides type-safe segment access', () => {
      const path = createTypedNavigationPath(['home', 'settings'])

      // TypeScript should enforce type safety
      expect(typeof path.at).toBe('function')
      expect(typeof path.last).toBe('function')
    })

    it('validates path segments against allowed types', () => {
      const validPath = createTypedNavigationPath([
        'home',
        'settings',
        'profile',
      ])
      expect(validPath).toBeDefined()

      // Should handle any string segments
      const anyPath = createTypedNavigationPath(['custom', 'route', '123'])
      expect(anyPath).toBeDefined()
    })

    it('provides path validation', () => {
      const path = createTypedNavigationPath(['home', 'settings'])

      expect(path.isValid()).toBe(true)
      expect(path.validationErrors()).toEqual([])
    })

    it('handles invalid path segments', () => {
      const path = createTypedNavigationPath([''])

      expect(path.isValid()).toBe(true) // Empty strings are allowed
    })
  })

  describe('Navigation Path Events', () => {
    it('provides change event subscription', () => {
      const path = createNavigationPath(['home'])
      const listener = vi.fn()

      const unsubscribe = path.onChange(listener)

      path.append('settings')
      expect(listener).toHaveBeenCalled()

      unsubscribe()
      path.append('profile')
      expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('handles multiple change listeners', () => {
      const path = createNavigationPath(['home'])
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      path.onChange(listener1)
      path.onChange(listener2)

      path.clear()

      expect(listener1).toHaveBeenCalledTimes(1)
      expect(listener2).toHaveBeenCalledTimes(1)
    })

    it('provides before change events', () => {
      const path = createNavigationPath(['home'])
      const beforeListener = vi.fn()

      path.onBeforeChange(beforeListener)

      path.append('settings')

      expect(beforeListener).toHaveBeenCalledWith({
        oldSegments: ['home'],
        newSegments: ['home', 'settings'],
        operation: 'append',
      })
    })

    it('allows preventing changes', () => {
      const path = createNavigationPath(['home'])
      const preventListener = vi.fn(() => false) // Return false to prevent

      path.onBeforeChange(preventListener)

      path.append('settings')

      expect(path.segments).toEqual(['home']) // Should not have changed
      expect(preventListener).toHaveBeenCalled()
    })
  })

  describe('Navigation Path Utilities', () => {
    it('provides path joining utilities', () => {
      const basePath = createNavigationPath(['app'])
      const relativePath = createNavigationPath(['settings', 'profile'])

      const joined = basePath.join(relativePath)

      expect(joined.segments).toEqual(['app', 'settings', 'profile'])
    })

    it('provides path relative utilities', () => {
      const fullPath = createNavigationPath(['app', 'settings', 'profile'])
      const basePath = createNavigationPath(['app'])

      const relative = fullPath.relativeTo(basePath)

      expect(relative.segments).toEqual(['settings', 'profile'])
    })

    it('handles complex path operations', () => {
      const path1 = createNavigationPath(['home', 'settings'])
      const path2 = createNavigationPath(['home', 'profile'])

      const common = path1.findCommonPrefix(path2)
      expect(common.segments).toEqual(['home'])

      const diff = path1.diff(path2)
      expect(diff.added).toEqual(['profile'])
      expect(diff.removed).toEqual(['settings'])
    })

    it('provides path normalization', () => {
      const path = createNavigationPath(['home', '', 'settings', ''])

      const normalized = path.normalized()

      expect(normalized.segments).toEqual(['home', 'settings'])
    })

    it('handles path encoding/decoding', () => {
      const pathWithSpecialChars = createNavigationPath([
        'home',
        'settings with spaces',
        'profile',
      ])

      const encoded = pathWithSpecialChars.encoded()
      const decoded = encoded.decoded()

      expect(decoded.segments).toEqual(pathWithSpecialChars.segments)
    })
  })

  describe('Navigation Path Performance', () => {
    it('handles large path operations efficiently', () => {
      const largePath = createNavigationPath(
        Array.from({ length: 1000 }, (_, i) => `segment${i}`)
      )

      const startTime = performance.now()

      largePath.map(segment => segment.toUpperCase())
      largePath.filter(segment => segment.length > 5)
      largePath.find(segment => segment === 'segment500')

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Should be fast
      expect(largePath.count).toBe(1000)
    })

    it('optimizes path copying', () => {
      const original = createNavigationPath(['home', 'settings', 'profile'])

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        original.copy()
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Should be very fast
    })

    it('handles frequent change events efficiently', () => {
      const path = createNavigationPath(['home'])
      const listener = vi.fn()

      path.onChange(listener)

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        path.append(`segment${i}`)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200) // Should be reasonably fast
      expect(listener).toHaveBeenCalledTimes(1000)
    })
  })

  describe('Navigation Path Integration', () => {
    it('integrates with navigation router', () => {
      const path = createNavigationPath(['home', 'settings'])

      // Simulate router integration
      const routerPath = path.toRouterPath()
      expect(routerPath).toBe('/home/settings')

      const fromRouter = createNavigationPath.fromRouterPath(
        '/dashboard/analytics'
      )
      expect(fromRouter.segments).toEqual(['dashboard', 'analytics'])
    })

    it('integrates with navigation context', () => {
      const path = createNavigationPath(['home', 'settings'])

      // Simulate context integration
      const contextPath = path.toContextPath()
      expect(contextPath.segments).toEqual(['home', 'settings'])

      const fromContext = createNavigationPath.fromContextPath([
        'dashboard',
        'reports',
      ])
      expect(fromContext.segments).toEqual(['dashboard', 'reports'])
    })

    it('provides path metadata', () => {
      const path = createNavigationPath(['home', 'settings', 'profile'])

      const metadata = path.getMetadata()

      expect(metadata).toBeDefined()
      expect(metadata.depth).toBe(3)
      expect(metadata.hasDynamicSegments).toBe(false)
      expect(metadata.complexity).toBeDefined()
    })

    it('supports path bookmarks', () => {
      const path = createNavigationPath(['home', 'settings'])

      path.bookmark('user-settings')
      const bookmarked = createNavigationPath.fromBookmark('user-settings')

      expect(bookmarked.segments).toEqual(['home', 'settings'])
    })
  })

  describe('Error Handling', () => {
    it('handles invalid path operations gracefully', () => {
      const path = createNavigationPath(['home'])

      expect(() => path.at(-1)).not.toThrow()
      expect(() => path.at(100)).not.toThrow()
      expect(() => path.removeLast(10)).not.toThrow()
      expect(() => path.replace(-1, 'invalid')).not.toThrow()
    })

    it('handles malformed string paths', () => {
      expect(() => createNavigationPath.fromString('')).not.toThrow()
      expect(() => createNavigationPath.fromString(null as any)).not.toThrow()
      expect(() =>
        createNavigationPath.fromString('invalid/path//structure')
      ).not.toThrow()
    })

    it('handles event listener errors', () => {
      const path = createNavigationPath(['home'])
      const errorListener = vi.fn(() => {
        throw new Error('Listener error')
      })

      expect(() => path.onChange(errorListener)).not.toThrow()

      path.append('settings')
      // Should not crash even if listener throws
    })

    it('handles concurrent modifications', () => {
      const path = createNavigationPath(['home'])

      const listener1 = vi.fn(() => path.append('from-listener1'))
      const listener2 = vi.fn(() => path.append('from-listener2'))

      path.onChange(listener1)
      path.onChange(listener2)

      path.append('trigger')

      // Should handle concurrent modifications gracefully
      expect(path.segments.length).toBeGreaterThan(1)
    })

    it('validates path integrity', () => {
      const path = createNavigationPath(['home', 'settings'])

      expect(path.isValid()).toBe(true)

      // Simulate corruption
      ;(path as any).segments = null

      expect(path.isValid()).toBe(false)
    })
  })
})
