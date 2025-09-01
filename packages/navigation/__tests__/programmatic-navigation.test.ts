/**
 * Programmatic Navigation Tests
 *
 * Tests for programmatic navigation utilities, deep linking,
 * navigation persistence, and animation management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import {
  createProgrammaticNavigationPath,
  ProgrammaticNavigationPath,
  ProgrammaticNavigationUtils,
  NavigationAnimationManager,
  NavigationPersistenceManager,
  DeepLinkManager,
  deepLinkManager,
  navigationAnimationManager,
  navigationPersistenceManager,
} from '../src/programmatic-navigation'

describe('Programmatic Navigation - Advanced Navigation Utilities', () => {
  let mockView1: any
  let mockView2: any
  let mockView3: any

  beforeEach(() => {
    mockView1 = () => HTML.div({ children: 'View 1' }).modifier.build()
    mockView2 = () => HTML.div({ children: 'View 2' }).modifier.build()
    mockView3 = () => HTML.div({ children: 'View 3' }).modifier.build()
  })

  describe('Programmatic Navigation Path', () => {
    it('creates navigation path with segments', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])

      expect(path).toBeDefined()
      expect(path.segments).toEqual(['home', 'settings', 'profile'])
      expect(path.count).toBe(3)
      expect(path.isEmpty).toBe(false)
    })

    it('handles empty path creation', () => {
      const path = createProgrammaticNavigationPath([])

      expect(path.segments).toEqual([])
      expect(path.count).toBe(0)
      expect(path.isEmpty).toBe(true)
    })

    it('appends segments correctly', () => {
      const path = createProgrammaticNavigationPath(['home'])
      path.append('settings')

      expect(path.segments).toEqual(['home', 'settings'])
      expect(path.count).toBe(2)
    })

    it('appends multiple segments', () => {
      const path = createProgrammaticNavigationPath(['home'])
      path.appendAll(['settings', 'profile'])

      expect(path.segments).toEqual(['home', 'settings', 'profile'])
      expect(path.count).toBe(3)
    })

    it('removes last segment', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])
      path.removeLast()

      expect(path.segments).toEqual(['home', 'settings'])
      expect(path.count).toBe(2)
    })

    it('removes multiple segments', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])
      path.removeLast(2)

      expect(path.segments).toEqual(['home'])
      expect(path.count).toBe(1)
    })

    it('clears all segments', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])
      path.clear()

      expect(path.segments).toEqual([])
      expect(path.count).toBe(0)
      expect(path.isEmpty).toBe(true)
    })

    it('checks segment containment', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])

      expect(path.contains('home')).toBe(true)
      expect(path.contains('settings')).toBe(true)
      expect(path.contains('unknown')).toBe(false)
    })

    it('accesses segments by index', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])

      expect(path.at(0)).toBe('home')
      expect(path.at(1)).toBe('settings')
      expect(path.at(2)).toBe('profile')
      expect(path.at(3)).toBeUndefined()
      expect(path.at(-1)).toBeUndefined()
    })

    it('provides last segment access', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])

      expect(path.last).toBe('profile')

      const emptyPath = createProgrammaticNavigationPath([])
      expect(emptyPath.last).toBeUndefined()
    })

    it('replaces all segments', () => {
      const path = createProgrammaticNavigationPath(['home', 'settings'])
      path.replaceAll(['dashboard', 'analytics'])

      expect(path.segments).toEqual(['dashboard', 'analytics'])
      expect(path.count).toBe(2)
    })

    it('compares paths correctly', () => {
      const path1 = createProgrammaticNavigationPath(['home', 'settings'])
      const path2 = createProgrammaticNavigationPath(['home', 'settings'])
      const path3 = createProgrammaticNavigationPath(['home', 'profile'])

      expect(path1.equals(path2)).toBe(true)
      expect(path1.equals(path3)).toBe(false)
    })

    it('creates string representation', () => {
      const path = createProgrammaticNavigationPath([
        'home',
        'settings',
        'profile',
      ])

      expect(path.toString()).toBe('home/settings/profile')
    })

    it('creates copies correctly', () => {
      const original = createProgrammaticNavigationPath(['home', 'settings'])
      const copy = original.copy()

      expect(copy.segments).toEqual(original.segments)
      expect(copy).not.toBe(original) // Different instances
    })
  })

  describe('Programmatic Navigation Utils', () => {
    it('validates navigation paths', () => {
      expect(
        ProgrammaticNavigationUtils.isValidPath(['home', 'settings'])
      ).toBe(true)
      expect(ProgrammaticNavigationUtils.isValidPath([])).toBe(true)
      expect(ProgrammaticNavigationUtils.isValidPath([''])).toBe(false)
      expect(ProgrammaticNavigationUtils.isValidPath(['home', ''])).toBe(false)
    })

    it('normalizes navigation paths', () => {
      expect(
        ProgrammaticNavigationUtils.normalizePath(['home', 'settings', ''])
      ).toEqual(['home', 'settings'])
      expect(ProgrammaticNavigationUtils.normalizePath(['', 'home'])).toEqual([
        'home',
      ])
      expect(ProgrammaticNavigationUtils.normalizePath([])).toEqual([])
    })

    it('creates path from string', () => {
      const path = ProgrammaticNavigationUtils.fromString(
        'home/settings/profile'
      )

      expect(path.segments).toEqual(['home', 'settings', 'profile'])
    })

    it('handles empty string path', () => {
      const path = ProgrammaticNavigationUtils.fromString('')

      expect(path.segments).toEqual([])
      expect(path.isEmpty).toBe(true)
    })

    it('calculates path differences', () => {
      const path1 = createProgrammaticNavigationPath(['home', 'settings'])
      const path2 = createProgrammaticNavigationPath(['home', 'profile'])

      const diff = ProgrammaticNavigationUtils.calculateDifference(path1, path2)

      expect(diff.commonPrefix).toEqual(['home'])
      expect(diff.removed).toEqual(['settings'])
      expect(diff.added).toEqual(['profile'])
    })

    it('finds common prefix', () => {
      const paths = [
        createProgrammaticNavigationPath(['home', 'settings', 'profile']),
        createProgrammaticNavigationPath(['home', 'settings', 'account']),
        createProgrammaticNavigationPath(['home', 'dashboard']),
      ]

      const common = ProgrammaticNavigationUtils.findCommonPrefix(paths)

      expect(common).toEqual(['home'])
    })
  })

  describe('Navigation Animation Manager', () => {
    it('creates animation configurations', () => {
      const config = NavigationAnimationManager.createConfig({
        type: 'slide',
        direction: 'left',
        duration: 300,
        easing: 'ease-out',
      })

      expect(config).toBeDefined()
      expect(config.type).toBe('slide')
      expect(config.direction).toBe('left')
      expect(config.duration).toBe(300)
    })

    it('provides preset animations', () => {
      const slideLeft = NavigationAnimationManager.presets.slideLeft
      const fadeIn = NavigationAnimationManager.presets.fadeIn
      const scaleIn = NavigationAnimationManager.presets.scaleIn

      expect(slideLeft).toBeDefined()
      expect(fadeIn).toBeDefined()
      expect(scaleIn).toBeDefined()
    })

    it('combines multiple animations', () => {
      const combined = NavigationAnimationManager.combine([
        NavigationAnimationManager.presets.slideLeft,
        NavigationAnimationManager.presets.fadeIn,
      ])

      expect(combined).toBeDefined()
      expect(Array.isArray(combined)).toBe(true)
    })

    it('validates animation configurations', () => {
      expect(
        NavigationAnimationManager.isValidConfig({
          type: 'slide',
          duration: 300,
        })
      ).toBe(true)
      expect(
        NavigationAnimationManager.isValidConfig({ type: 'invalid' as any })
      ).toBe(false)
      expect(NavigationAnimationManager.isValidConfig({ duration: -100 })).toBe(
        false
      )
    })

    it('manages animation queue', () => {
      const manager = new NavigationAnimationManager()

      expect(manager.isAnimating()).toBe(false)

      manager.startAnimation('test')
      expect(manager.isAnimating()).toBe(true)

      manager.endAnimation('test')
      expect(manager.isAnimating()).toBe(false)
    })
  })

  describe('Navigation Persistence Manager', () => {
    it('saves navigation state', () => {
      const manager = new NavigationPersistenceManager()
      const state = { path: '/home', timestamp: Date.now() }

      manager.saveState('test-key', state)

      expect(manager.getState('test-key')).toEqual(state)
    })

    it('loads navigation state', () => {
      const manager = new NavigationPersistenceManager()
      const state = { path: '/settings', timestamp: Date.now() }

      manager.saveState('test-key', state)
      const loaded = manager.loadState('test-key')

      expect(loaded).toEqual(state)
    })

    it('handles missing state gracefully', () => {
      const manager = new NavigationPersistenceManager()

      expect(manager.loadState('nonexistent')).toBeNull()
      expect(manager.getState('nonexistent')).toBeUndefined()
    })

    it('clears navigation state', () => {
      const manager = new NavigationPersistenceManager()
      const state = { path: '/home', timestamp: Date.now() }

      manager.saveState('test-key', state)
      expect(manager.getState('test-key')).toBeDefined()

      manager.clearState('test-key')
      expect(manager.getState('test-key')).toBeUndefined()
    })

    it('validates state structure', () => {
      const manager = new NavigationPersistenceManager()

      expect(
        manager.isValidState({ path: '/home', timestamp: Date.now() })
      ).toBe(true)
      expect(manager.isValidState({ path: '/home' })).toBe(false)
      expect(manager.isValidState({ timestamp: Date.now() })).toBe(false)
      expect(manager.isValidState(null)).toBe(false)
    })

    it('handles storage errors gracefully', () => {
      const manager = new NavigationPersistenceManager()

      // Mock storage error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage quota exceeded')
      })

      expect(() =>
        manager.saveState('test', { path: '/home', timestamp: Date.now() })
      ).not.toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })
  })

  describe('Deep Link Manager', () => {
    it('parses deep links correctly', () => {
      const manager = new DeepLinkManager()

      const result = manager.parseDeepLink('myapp://profile/123?tab=settings')

      expect(result).toBeDefined()
      expect(result?.scheme).toBe('myapp')
      expect(result?.path).toBe('/profile/123')
      expect(result?.query).toEqual({ tab: 'settings' })
    })

    it('handles malformed deep links', () => {
      const manager = new DeepLinkManager()

      expect(manager.parseDeepLink('')).toBeNull()
      expect(manager.parseDeepLink('invalid')).toBeNull()
      expect(manager.parseDeepLink('://missing-scheme')).toBeNull()
    })

    it('validates deep link schemes', () => {
      const manager = new DeepLinkManager()

      expect(manager.isValidScheme('myapp')).toBe(true)
      expect(manager.isValidScheme('http')).toBe(true)
      expect(manager.isValidScheme('')).toBe(false)
      expect(manager.isValidScheme('invalid-scheme!')).toBe(false)
    })

    it('manages deep link handlers', () => {
      const manager = new DeepLinkManager()
      const handler = vi.fn()

      manager.registerHandler('profile', handler)
      manager.handleDeepLink('myapp://profile/123')

      expect(handler).toHaveBeenCalledWith({
        scheme: 'myapp',
        path: '/profile/123',
        params: { id: '123' },
        query: {},
      })
    })

    it('handles unregistered deep link types', () => {
      const manager = new DeepLinkManager()

      expect(() => manager.handleDeepLink('myapp://unknown/123')).not.toThrow()
    })

    it('provides deep link metadata', () => {
      const manager = new DeepLinkManager()

      const metadata = manager.getDeepLinkMetadata(
        'myapp://profile/123?tab=settings'
      )

      expect(metadata).toBeDefined()
      expect(metadata?.isDeepLink).toBe(true)
      expect(metadata?.scheme).toBe('myapp')
      expect(metadata?.path).toBe('/profile/123')
    })
  })

  describe('Global Managers', () => {
    it('provides global deep link manager instance', () => {
      expect(deepLinkManager).toBeDefined()
      expect(typeof deepLinkManager.parseDeepLink).toBe('function')
      expect(typeof deepLinkManager.registerHandler).toBe('function')
    })

    it('provides global animation manager instance', () => {
      expect(navigationAnimationManager).toBeDefined()
      expect(typeof navigationAnimationManager.startAnimation).toBe('function')
      expect(typeof navigationAnimationManager.endAnimation).toBe('function')
    })

    it('provides global persistence manager instance', () => {
      expect(navigationPersistenceManager).toBeDefined()
      expect(typeof navigationPersistenceManager.saveState).toBe('function')
      expect(typeof navigationPersistenceManager.loadState).toBe('function')
    })
  })

  describe('Integration Scenarios', () => {
    it('combines programmatic navigation with persistence', () => {
      const path = createProgrammaticNavigationPath(['home', 'settings'])
      const state = { path: path.toString(), timestamp: Date.now() }

      navigationPersistenceManager.saveState('nav-state', state)
      const loaded = navigationPersistenceManager.loadState('nav-state')

      expect(loaded?.path).toBe('home/settings')
    })

    it('handles animated navigation transitions', () => {
      const animation = NavigationAnimationManager.presets.slideLeft

      navigationAnimationManager.startAnimation('page-transition')

      // Simulate navigation
      expect(navigationAnimationManager.isAnimating()).toBe(true)

      navigationAnimationManager.endAnimation('page-transition')
      expect(navigationAnimationManager.isAnimating()).toBe(false)
    })

    it('integrates deep linking with programmatic navigation', () => {
      const handler = vi.fn(linkData => {
        const path = createProgrammaticNavigationPath([linkData.path.slice(1)])
        return path
      })

      deepLinkManager.registerHandler('profile', handler)
      const result = deepLinkManager.handleDeepLink('myapp://profile/123')

      expect(handler).toHaveBeenCalled()
      expect(result).toBeDefined()
    })
  })

  describe('Error Handling', () => {
    it('handles invalid path operations gracefully', () => {
      const path = createProgrammaticNavigationPath(['home'])

      expect(() => path.removeLast(10)).not.toThrow()
      expect(() => path.at(-1)).not.toThrow()
      expect(() => path.at(100)).not.toThrow()
    })

    it('handles animation errors gracefully', () => {
      const manager = new NavigationAnimationManager()

      expect(() => manager.startAnimation('')).not.toThrow()
      expect(() => manager.endAnimation('nonexistent')).not.toThrow()
    })

    it('handles persistence storage failures', () => {
      // Mock localStorage failure
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage failed')
      })

      expect(() =>
        navigationPersistenceManager.saveState('test', {
          path: '/home',
          timestamp: Date.now(),
        })
      ).not.toThrow()

      // Restore
      localStorage.setItem = originalSetItem
    })

    it('handles malformed deep links', () => {
      expect(() => deepLinkManager.parseDeepLink('')).not.toThrow()
      expect(() => deepLinkManager.parseDeepLink(null as any)).not.toThrow()
      expect(() => deepLinkManager.handleDeepLink('invalid')).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('handles rapid path operations efficiently', () => {
      const path = createProgrammaticNavigationPath([])

      const startTime = performance.now()

      for (let i = 0; i < 1000; i++) {
        path.append(`segment${i}`)
        path.removeLast()
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Should be very fast
    })

    it('handles concurrent animation management', () => {
      const manager = new NavigationAnimationManager()

      const startTime = performance.now()

      // Start multiple animations
      for (let i = 0; i < 100; i++) {
        manager.startAnimation(`anim${i}`)
      }

      // End them
      for (let i = 0; i < 100; i++) {
        manager.endAnimation(`anim${i}`)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Should be very fast
    })

    it('handles bulk persistence operations', () => {
      const startTime = performance.now()

      // Save many states
      for (let i = 0; i < 100; i++) {
        navigationPersistenceManager.saveState(`key${i}`, {
          path: `/page${i}`,
          timestamp: Date.now(),
        })
      }

      // Load them back
      for (let i = 0; i < 100; i++) {
        navigationPersistenceManager.loadState(`key${i}`)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200) // Should be reasonably fast
    })
  })
})
