/**
 * Navigation Manager Tests
 *
 * Tests for navigation manager, global navigation coordination,
 * and navigation event management.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSignal } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import {
  NavigationManager,
  GlobalNavigation,
  createNavigationCoordinator,
  createNavigationEventEmitter,
  NavigationEventEmitter,
} from '../src/navigation-manager'

describe('Navigation Manager - Global Navigation Coordination', () => {
  let mockView1: any
  let mockView2: any
  let mockNavigationContext: any

  beforeEach(() => {
    mockView1 = () => HTML.div({ children: 'View 1' }).modifier.build()
    mockView2 = () => HTML.div({ children: 'View 2' }).modifier.build()

    mockNavigationContext = {
      currentPath: '/home',
      navigationId: 'test-nav',
      canGoBack: false,
      stack: [],
      push: vi.fn(),
      pop: vi.fn(),
      replace: vi.fn(),
    }
  })

  describe('Navigation Manager Core', () => {
    it('creates navigation manager instance', () => {
      const manager = new NavigationManager()

      expect(manager).toBeDefined()
      expect(typeof manager.registerNavigation).toBe('function')
      expect(typeof manager.unregisterNavigation).toBe('function')
      expect(typeof manager.getNavigation).toBe('function')
    })

    it('registers navigation contexts', () => {
      const manager = new NavigationManager()

      manager.registerNavigation('test-nav', mockNavigationContext)

      const registered = manager.getNavigation('test-nav')
      expect(registered).toBe(mockNavigationContext)
    })

    it('unregisters navigation contexts', () => {
      const manager = new NavigationManager()

      manager.registerNavigation('test-nav', mockNavigationContext)
      expect(manager.getNavigation('test-nav')).toBeDefined()

      manager.unregisterNavigation('test-nav')
      expect(manager.getNavigation('test-nav')).toBeUndefined()
    })

    it('handles multiple navigation contexts', () => {
      const manager = new NavigationManager()

      const context1 = { ...mockNavigationContext, navigationId: 'nav1' }
      const context2 = { ...mockNavigationContext, navigationId: 'nav2' }

      manager.registerNavigation('nav1', context1)
      manager.registerNavigation('nav2', context2)

      expect(manager.getNavigation('nav1')).toBe(context1)
      expect(manager.getNavigation('nav2')).toBe(context2)
      expect(manager.getAllNavigationIds()).toEqual(['nav1', 'nav2'])
    })

    it('provides navigation enumeration', () => {
      const manager = new NavigationManager()

      manager.registerNavigation('nav1', mockNavigationContext)
      manager.registerNavigation('nav2', {
        ...mockNavigationContext,
        navigationId: 'nav2',
      })

      const allIds = manager.getAllNavigationIds()
      expect(allIds).toContain('nav1')
      expect(allIds).toContain('nav2')
      expect(allIds.length).toBe(2)
    })

    it('handles navigation state synchronization', () => {
      const manager = new NavigationManager()

      const context1 = { ...mockNavigationContext, currentPath: '/page1' }
      const context2 = {
        ...mockNavigationContext,
        currentPath: '/page2',
        navigationId: 'nav2',
      }

      manager.registerNavigation('nav1', context1)
      manager.registerNavigation('nav2', context2)

      // Should maintain separate states
      expect(manager.getNavigation('nav1')?.currentPath).toBe('/page1')
      expect(manager.getNavigation('nav2')?.currentPath).toBe('/page2')
    })
  })

  describe('Global Navigation', () => {
    it('provides global navigation instance', () => {
      expect(GlobalNavigation).toBeDefined()
      expect(typeof GlobalNavigation.registerNavigation).toBe('function')
      expect(typeof GlobalNavigation.getNavigation).toBe('function')
    })

    it('manages global navigation registry', () => {
      GlobalNavigation.registerNavigation('global-test', mockNavigationContext)

      const registered = GlobalNavigation.getNavigation('global-test')
      expect(registered).toBe(mockNavigationContext)

      GlobalNavigation.unregisterNavigation('global-test')
      expect(GlobalNavigation.getNavigation('global-test')).toBeUndefined()
    })

    it('handles global navigation coordination', () => {
      const context1 = { ...mockNavigationContext, navigationId: 'global1' }
      const context2 = { ...mockNavigationContext, navigationId: 'global2' }

      GlobalNavigation.registerNavigation('global1', context1)
      GlobalNavigation.registerNavigation('global2', context2)

      expect(GlobalNavigation.getAllNavigationIds()).toContain('global1')
      expect(GlobalNavigation.getAllNavigationIds()).toContain('global2')
    })

    it('provides global navigation utilities', () => {
      expect(typeof GlobalNavigation.findNavigationByPath).toBe('function')
      expect(typeof GlobalNavigation.getActiveNavigation).toBe('function')
      expect(typeof GlobalNavigation.broadcastNavigationEvent).toBe('function')
    })

    it('finds navigation by path', () => {
      const context1 = {
        ...mockNavigationContext,
        currentPath: '/home',
        navigationId: 'nav1',
      }
      const context2 = {
        ...mockNavigationContext,
        currentPath: '/settings',
        navigationId: 'nav2',
      }

      GlobalNavigation.registerNavigation('nav1', context1)
      GlobalNavigation.registerNavigation('nav2', context2)

      const found = GlobalNavigation.findNavigationByPath('/settings')
      expect(found).toBe(context2)
    })

    it('broadcasts navigation events globally', () => {
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      GlobalNavigation.addNavigationListener(listener1)
      GlobalNavigation.addNavigationListener(listener2)

      const event = { type: 'navigation', navigationId: 'test', path: '/new' }
      GlobalNavigation.broadcastNavigationEvent(event)

      expect(listener1).toHaveBeenCalledWith(event)
      expect(listener2).toHaveBeenCalledWith(event)
    })
  })

  describe('Navigation Coordinator', () => {
    it('creates navigation coordinator', () => {
      const coordinator = createNavigationCoordinator()

      expect(coordinator).toBeDefined()
      expect(typeof coordinator.coordinateNavigation).toBe('function')
      expect(typeof coordinator.addNavigation).toBe('function')
      expect(typeof coordinator.removeNavigation).toBe('function')
    })

    it('coordinates multiple navigation instances', () => {
      const coordinator = createNavigationCoordinator()

      const nav1 = { ...mockNavigationContext, navigationId: 'coord1' }
      const nav2 = { ...mockNavigationContext, navigationId: 'coord2' }

      coordinator.addNavigation(nav1)
      coordinator.addNavigation(nav2)

      expect(coordinator.getAllNavigations()).toHaveLength(2)
    })

    it('handles navigation conflicts', () => {
      const coordinator = createNavigationCoordinator()

      const nav1 = {
        ...mockNavigationContext,
        navigationId: 'conflict',
        currentPath: '/page1',
      }
      const nav2 = {
        ...mockNavigationContext,
        navigationId: 'conflict',
        currentPath: '/page2',
      }

      coordinator.addNavigation(nav1)

      // Should handle conflict gracefully
      expect(() => coordinator.addNavigation(nav2)).not.toThrow()
    })

    it('provides coordination strategies', () => {
      const coordinator = createNavigationCoordinator()

      expect(typeof coordinator.setCoordinationStrategy).toBe('function')
      expect(typeof coordinator.getCoordinationStrategy).toBe('function')
    })

    it('manages navigation priorities', () => {
      const coordinator = createNavigationCoordinator()

      const highPriority = {
        ...mockNavigationContext,
        navigationId: 'high',
        priority: 10,
      }
      const lowPriority = {
        ...mockNavigationContext,
        navigationId: 'low',
        priority: 1,
      }

      coordinator.addNavigation(highPriority)
      coordinator.addNavigation(lowPriority)

      const prioritized = coordinator.getNavigationsByPriority()
      expect(prioritized[0]).toBe(highPriority)
      expect(prioritized[1]).toBe(lowPriority)
    })
  })

  describe('Navigation Event Emitter', () => {
    it('creates navigation event emitter', () => {
      const emitter = createNavigationEventEmitter()

      expect(emitter).toBeDefined()
      expect(typeof emitter.emit).toBe('function')
      expect(typeof emitter.on).toBe('function')
      expect(typeof emitter.off).toBe('function')
    })

    it('emits navigation events', () => {
      const emitter = createNavigationEventEmitter()
      const listener = vi.fn()

      emitter.on('navigation', listener)

      const event = { type: 'push', navigationId: 'test', path: '/new' }
      emitter.emit('navigation', event)

      expect(listener).toHaveBeenCalledWith(event)
    })

    it('manages multiple event listeners', () => {
      const emitter = createNavigationEventEmitter()
      const listener1 = vi.fn()
      const listener2 = vi.fn()

      emitter.on('navigation', listener1)
      emitter.on('navigation', listener2)

      const event = { type: 'pop', navigationId: 'test' }
      emitter.emit('navigation', event)

      expect(listener1).toHaveBeenCalledWith(event)
      expect(listener2).toHaveBeenCalledWith(event)
    })

    it('removes event listeners', () => {
      const emitter = createNavigationEventEmitter()
      const listener = vi.fn()

      emitter.on('navigation', listener)
      emitter.off('navigation', listener)

      const event = { type: 'replace', navigationId: 'test', path: '/replaced' }
      emitter.emit('navigation', event)

      expect(listener).not.toHaveBeenCalled()
    })

    it('handles event namespaces', () => {
      const emitter = createNavigationEventEmitter()
      const globalListener = vi.fn()
      const specificListener = vi.fn()

      emitter.on('navigation', globalListener)
      emitter.on('navigation:push', specificListener)

      emitter.emit('navigation:push', { type: 'push', path: '/test' })

      expect(globalListener).toHaveBeenCalled()
      expect(specificListener).toHaveBeenCalled()
    })

    it('provides event history', () => {
      const emitter = createNavigationEventEmitter()

      emitter.emit('navigation', { type: 'push', path: '/page1' })
      emitter.emit('navigation', { type: 'push', path: '/page2' })

      const history = emitter.getEventHistory()
      expect(history).toHaveLength(2)
      expect(history[0].type).toBe('push')
      expect(history[1].type).toBe('push')
    })
  })

  describe('Navigation Event Emitter Class', () => {
    it('provides NavigationEventEmitter class', () => {
      const emitter = new NavigationEventEmitter()

      expect(emitter).toBeDefined()
      expect(typeof emitter.emitEvent).toBe('function')
      expect(typeof emitter.addListener).toBe('function')
      expect(typeof emitter.removeListener).toBe('function')
    })

    it('manages event listeners with class interface', () => {
      const emitter = new NavigationEventEmitter()
      const listener = vi.fn()

      const subscription = emitter.addListener('navigation', listener)

      emitter.emitEvent('navigation', { type: 'push', path: '/test' })

      expect(listener).toHaveBeenCalled()

      subscription.unsubscribe()
      emitter.emitEvent('navigation', { type: 'pop' })

      expect(listener).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('provides event filtering', () => {
      const emitter = new NavigationEventEmitter()
      const pushListener = vi.fn()
      const popListener = vi.fn()

      emitter.addListener(
        'navigation',
        pushListener,
        event => event.type === 'push'
      )
      emitter.addListener(
        'navigation',
        popListener,
        event => event.type === 'pop'
      )

      emitter.emitEvent('navigation', { type: 'push', path: '/test' })
      emitter.emitEvent('navigation', { type: 'pop' })

      expect(pushListener).toHaveBeenCalledTimes(1)
      expect(popListener).toHaveBeenCalledTimes(1)
    })

    it('handles event buffering', () => {
      const emitter = new NavigationEventEmitter()
      const listener = vi.fn()

      // Emit events before adding listener
      emitter.emitEvent('navigation', { type: 'push', path: '/early' })

      // Add listener with buffering
      emitter.addListener('navigation', listener, undefined, true)

      expect(listener).toHaveBeenCalledWith({ type: 'push', path: '/early' })
    })
  })

  describe('Integration Scenarios', () => {
    it('integrates manager with coordinator and emitter', () => {
      const manager = new NavigationManager()
      const coordinator = createNavigationCoordinator()
      const emitter = createNavigationEventEmitter()

      const navigationContext = {
        ...mockNavigationContext,
        navigationId: 'integrated-nav',
      }

      // Register navigation with manager
      manager.registerNavigation('integrated-nav', navigationContext)

      // Add to coordinator
      coordinator.addNavigation(navigationContext)

      // Set up event handling
      emitter.on('navigation', event => {
        coordinator.coordinateNavigation(event)
      })

      // Simulate navigation event
      const navEvent = {
        type: 'push',
        navigationId: 'integrated-nav',
        path: '/new',
      }
      emitter.emit('navigation', navEvent)

      expect(navigationContext.push).toHaveBeenCalled()
    })

    it('handles complex navigation hierarchies', () => {
      const manager = new NavigationManager()

      // Create hierarchical navigation structure
      const rootNav = {
        ...mockNavigationContext,
        navigationId: 'root',
        currentPath: '/',
      }
      const childNav = {
        ...mockNavigationContext,
        navigationId: 'child',
        currentPath: '/child',
      }
      const grandchildNav = {
        ...mockNavigationContext,
        navigationId: 'grandchild',
        currentPath: '/child/grandchild',
      }

      manager.registerNavigation('root', rootNav)
      manager.registerNavigation('child', childNav)
      manager.registerNavigation('grandchild', grandchildNav)

      // Should handle hierarchical relationships
      expect(manager.getNavigation('root')).toBe(rootNav)
      expect(manager.getNavigation('child')).toBe(childNav)
      expect(manager.getNavigation('grandchild')).toBe(grandchildNav)
    })

    it('manages navigation state across multiple contexts', () => {
      const manager = new NavigationManager()

      const contexts = [
        {
          ...mockNavigationContext,
          navigationId: 'nav1',
          currentPath: '/page1',
        },
        {
          ...mockNavigationContext,
          navigationId: 'nav2',
          currentPath: '/page2',
        },
        {
          ...mockNavigationContext,
          navigationId: 'nav3',
          currentPath: '/page3',
        },
      ]

      contexts.forEach(context => {
        manager.registerNavigation(context.navigationId, context)
      })

      // Should maintain separate states
      expect(manager.getNavigation('nav1')?.currentPath).toBe('/page1')
      expect(manager.getNavigation('nav2')?.currentPath).toBe('/page2')
      expect(manager.getNavigation('nav3')?.currentPath).toBe('/page3')
    })
  })

  describe('Error Handling', () => {
    it('handles invalid navigation registration', () => {
      const manager = new NavigationManager()

      expect(() =>
        manager.registerNavigation('', mockNavigationContext)
      ).not.toThrow()
      expect(() =>
        manager.registerNavigation('valid-id', null as any)
      ).not.toThrow()
    })

    it('handles navigation lookup errors', () => {
      const manager = new NavigationManager()

      expect(manager.getNavigation('nonexistent')).toBeUndefined()
      expect(manager.getNavigation('')).toBeUndefined()
    })

    it('handles coordinator errors gracefully', () => {
      const coordinator = createNavigationCoordinator()

      expect(() => coordinator.addNavigation(null as any)).not.toThrow()
      expect(() => coordinator.removeNavigation('')).not.toThrow()
    })

    it('handles event emitter errors', () => {
      const emitter = createNavigationEventEmitter()

      expect(() => emitter.emit('invalid-event', {})).not.toThrow()
      expect(() => emitter.on('', () => {})).not.toThrow()
      expect(() => emitter.off('', () => {})).not.toThrow()
    })

    it('handles global navigation errors', () => {
      expect(() =>
        GlobalNavigation.registerNavigation('', mockNavigationContext)
      ).not.toThrow()
      expect(() =>
        GlobalNavigation.unregisterNavigation(null as any)
      ).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('handles rapid navigation registration', () => {
      const manager = new NavigationManager()

      const startTime = performance.now()

      for (let i = 0; i < 100; i++) {
        const context = { ...mockNavigationContext, navigationId: `nav${i}` }
        manager.registerNavigation(`nav${i}`, context)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Should be fast
      expect(manager.getAllNavigationIds()).toHaveLength(100)
    })

    it('handles rapid navigation lookups', () => {
      const manager = new NavigationManager()

      // Register many navigations
      for (let i = 0; i < 100; i++) {
        const context = { ...mockNavigationContext, navigationId: `nav${i}` }
        manager.registerNavigation(`nav${i}`, context)
      }

      const startTime = performance.now()

      // Rapid lookups
      for (let i = 0; i < 1000; i++) {
        manager.getNavigation(`nav${i % 100}`)
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(50) // Should be very fast
    })

    it('handles concurrent event emissions', () => {
      const emitter = createNavigationEventEmitter()
      const listeners = Array.from({ length: 10 }, () => vi.fn())

      listeners.forEach(listener => {
        emitter.on('navigation', listener)
      })

      const startTime = performance.now()

      // Emit many events
      for (let i = 0; i < 100; i++) {
        emitter.emit('navigation', {
          type: 'push',
          navigationId: `nav${i}`,
          path: `/page${i}`,
        })
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100) // Should be reasonably fast

      // All listeners should have been called
      listeners.forEach(listener => {
        expect(listener).toHaveBeenCalledTimes(100)
      })
    })

    it('handles large navigation hierarchies efficiently', () => {
      const manager = new NavigationManager()

      const startTime = performance.now()

      // Create large hierarchy
      for (let i = 0; i < 50; i++) {
        for (let j = 0; j < 10; j++) {
          const context = {
            ...mockNavigationContext,
            navigationId: `nav${i}-${j}`,
            currentPath: `/level${i}/item${j}`,
          }
          manager.registerNavigation(`nav${i}-${j}`, context)
        }
      }

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(200) // Should be reasonably fast
      expect(manager.getAllNavigationIds()).toHaveLength(500)
    })
  })
})
