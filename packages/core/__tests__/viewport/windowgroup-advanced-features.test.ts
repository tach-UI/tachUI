/**
 * WindowGroup Advanced Features Tests
 *
 * Tests for advanced WindowGroup functionality including:
 * - Window grouping strategies (tabs, stack, cascade, tile)
 * - Window tabbing configuration and management
 * - Window pooling system for performance optimization
 * - State synchronization across window groups
 * - Window lifecycle events and data-driven management
 *
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Text } from '../../src/components'
import { disposeViewportManager, initializeViewportSystem, WindowGroup } from '../../src/viewport'
import type {
  StateSyncScope,
  WindowGroupingStrategy,
  WindowPoolConfig,
  WindowTabConfig,
} from '../../src/viewport/types'

describe('WindowGroup Advanced Features', () => {
  beforeEach(() => {
    // Initialize clean viewport system for each test
    initializeViewportSystem()

    // Mock console methods to suppress expected output
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    // Clean up after each test
    disposeViewportManager()
    vi.restoreAllMocks()
  })

  describe('Window Grouping Strategies', () => {
    it('should set and get grouping strategy', () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
        groupingStrategy: 'tabs',
      })

      expect(windowGroup.group.getGroupingStrategy()).toBe('tabs')
    })

    it('should support different grouping strategies', () => {
      const strategies: WindowGroupingStrategy[] = ['tabs', 'stack', 'cascade', 'tile']

      strategies.forEach((strategy) => {
        const windowGroup = WindowGroup({
          id: `test-group-${strategy}`,
          children: () => Text('Test Window'),
          groupingStrategy: strategy,
        })

        expect(windowGroup.group.getGroupingStrategy()).toBe(strategy)
      })
    })

    it('should apply grouping strategy when configured', () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
      })

      windowGroup.configureGrouping('cascade')
      expect(windowGroup.group.getGroupingStrategy()).toBe('cascade')
    })
  })

  describe('Window Tabbing Configuration', () => {
    it('should configure tab settings', () => {
      const tabConfig: WindowTabConfig = {
        enabled: true,
        maxTabs: 5,
        tabPosition: 'top',
        allowDetach: true,
        allowReorder: false,
      }

      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
        tabConfig,
      })

      const retrievedConfig = windowGroup.group.getTabConfig()
      expect(retrievedConfig.enabled).toBe(true)
      expect(retrievedConfig.maxTabs).toBe(5)
      expect(retrievedConfig.tabPosition).toBe('top')
      expect(retrievedConfig.allowDetach).toBe(true)
      expect(retrievedConfig.allowReorder).toBe(false)
    })

    it('should update tab configuration', () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
      })

      const newTabConfig: WindowTabConfig = {
        enabled: true,
        tabPosition: 'bottom',
        allowDetach: false,
        allowReorder: true,
      }

      windowGroup.configureTabs(newTabConfig)
      const config = windowGroup.group.getTabConfig()
      expect(config.tabPosition).toBe('bottom')
      expect(config.allowDetach).toBe(false)
      expect(config.allowReorder).toBe(true)
    })
  })

  describe('Window Pooling System', () => {
    it('should configure window pooling', () => {
      const poolConfig: WindowPoolConfig = {
        enabled: true,
        maxPoolSize: 3,
        reuseThreshold: 5000,
        keepAliveTime: 60000,
      }

      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
        poolConfig,
      })

      const retrievedConfig = windowGroup.group.getPoolConfig()
      expect(retrievedConfig.enabled).toBe(true)
      expect(retrievedConfig.maxPoolSize).toBe(3)
      expect(retrievedConfig.reuseThreshold).toBe(5000)
      expect(retrievedConfig.keepAliveTime).toBe(60000)
    })

    it('should track pooled windows', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
        poolConfig: {
          enabled: true,
          maxPoolSize: 2,
          reuseThreshold: 1000,
          keepAliveTime: 5000,
        },
      })

      // Initially no pooled windows
      expect(windowGroup.group.getPooledWindows()).toHaveLength(0)

      // Open window with data (which will create a modal in jsdom)
      await windowGroup.openForData('test-document')
      const windows = windowGroup.getWindows()
      expect(windows).toHaveLength(1)

      // Return window to pool
      if (windows[0]) {
        await windowGroup.group.returnToPool(windows[0])
        expect(windowGroup.group.getPooledWindows()).toHaveLength(1)
      }
    })

    it('should reuse pooled windows when available', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
        poolConfig: {
          enabled: true,
          maxPoolSize: 3,
          reuseThreshold: 10000,
          keepAliveTime: 30000,
        },
      })

      // Open first window
      await windowGroup.openForData('document1')
      const firstWindows = windowGroup.getWindows()
      expect(firstWindows).toHaveLength(1)

      const firstWindowId = firstWindows[0]?.id

      // Return to pool
      if (firstWindows[0]) {
        await windowGroup.group.returnToPool(firstWindows[0])
      }

      // Open new window - should reuse from pool
      await windowGroup.openForData('document2')
      const secondWindows = windowGroup.getWindows()
      expect(secondWindows).toHaveLength(1)

      // Should be the same window instance (reused)
      expect(secondWindows[0]?.id).toBe(firstWindowId)
    })
  })

  describe('State Synchronization', () => {
    it('should sync state within window group', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
        stateSyncScope: 'group',
      })

      // Test state synchronization
      windowGroup.syncGroupState('theme', 'dark')
      expect(windowGroup.getGroupState('theme')).toBe('dark')
    })

    it('should notify state change callbacks', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        children: () => Text('Test Window'),
        stateSyncScope: 'group',
      })

      const mockCallback = vi.fn()
      const unsubscribe = windowGroup.onGroupStateChange('counter', mockCallback)

      // Change state
      windowGroup.syncGroupState('counter', 42)
      expect(mockCallback).toHaveBeenCalledWith(42)

      // Unsubscribe and change again
      unsubscribe()
      windowGroup.syncGroupState('counter', 84)
      expect(mockCallback).toHaveBeenCalledTimes(1) // Should not be called again
    })

    it('should support different sync scopes', () => {
      const scopes: StateSyncScope[] = ['none', 'group', 'global']

      scopes.forEach((scope) => {
        const windowGroup = WindowGroup({
          id: `test-group-${scope}`,
          children: () => Text('Test Window'),
          stateSyncScope: scope,
        })

        windowGroup.enableStateSync(scope)
        // Test that configuration is applied
        expect(() => windowGroup.syncGroupState('test', 'value')).not.toThrow()
      })
    })
  })

  describe('Window Lifecycle Events', () => {
    it('should track window creation events', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
      })

      const creationCallback = vi.fn()
      windowGroup.group.onWindowCreated(creationCallback)

      await windowGroup.openForData('test-doc')
      expect(creationCallback).toHaveBeenCalledTimes(1)
    })

    it('should track window destruction events', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
      })

      const destructionCallback = vi.fn()
      windowGroup.group.onWindowDestroyed(destructionCallback)

      await windowGroup.openForData('test-doc')
      await windowGroup.closeAll()

      expect(destructionCallback).toHaveBeenCalledTimes(1)
    })

    it('should track group empty/full events', async () => {
      const windowGroup = WindowGroup({
        id: 'test-group',
        for: String,
        children: (data: string) => Text(data),
        maxInstances: 2,
      })

      const emptyCallback = vi.fn()
      const fullCallback = vi.fn()

      windowGroup.group.onGroupEmpty(emptyCallback)
      windowGroup.group.onGroupFull(fullCallback)

      // Fill group to capacity
      await windowGroup.openForData('doc1')
      await windowGroup.openForData('doc2') // Second window

      expect(fullCallback).toHaveBeenCalledTimes(1)

      // Empty the group
      await windowGroup.closeAll()
      expect(emptyCallback).toHaveBeenCalledTimes(1)
    })
  })

  describe('Data-Driven Window Management', () => {
    it('should manage windows for different data items', async () => {
      interface Document {
        id: string
        name: string
      }

      const windowGroup = WindowGroup({
        id: 'document-group',
        for: Object as new () => Document,
        children: (doc: Document) => Text(doc.name),
      })

      const doc1 = { id: '1', name: 'Document 1' }
      const doc2 = { id: '2', name: 'Document 2' }

      // Open windows for different documents
      await windowGroup.openForData(doc1)
      await windowGroup.openForData(doc2)

      const windows = windowGroup.getWindows()
      expect(windows).toHaveLength(2)

      // Opening same document should reuse window
      await windowGroup.openForData(doc1)
      expect(windowGroup.getWindows()).toHaveLength(2) // Still 2 windows
    })

    it('should respect max instances limit', async () => {
      const windowGroup = WindowGroup({
        id: 'limited-group',
        for: String,
        children: (data: string) => Text(data),
        maxInstances: 2,
      })

      // Open more windows than the limit
      await windowGroup.openForData('doc1')
      await windowGroup.openForData('doc2')
      await windowGroup.openForData('doc3') // Should trigger oldest window closure

      expect(windowGroup.getWindows()).toHaveLength(2)
    })
  })

  describe('Enhanced Window Configuration', () => {
    it('should apply all Phase 2 configurations', () => {
      const windowGroup = WindowGroup({
        id: 'fully-configured-group',
        children: () => Text('Test Window'),
        groupingStrategy: 'tabs',
        tabConfig: {
          enabled: true,
          maxTabs: 4,
          tabPosition: 'top',
          allowDetach: true,
          allowReorder: true,
        },
        poolConfig: {
          enabled: true,
          maxPoolSize: 3,
          reuseThreshold: 5000,
          keepAliveTime: 30000,
        },
        stateSyncScope: 'group',
        maxInstances: 5,
      })

      // Verify all configurations are applied
      expect(windowGroup.group.getGroupingStrategy()).toBe('tabs')
      expect(windowGroup.group.getTabConfig().enabled).toBe(true)
      expect(windowGroup.group.getPoolConfig().enabled).toBe(true)
    })
  })

  describe('Platform Adaptation', () => {
    it('should handle tab grouping based on platform capabilities', () => {
      const windowGroup = WindowGroup({
        id: 'platform-aware-group',
        children: () => Text('Test Window'),
        groupingStrategy: 'tabs',
        tabConfig: {
          enabled: true,
          tabPosition: 'top',
          allowDetach: true,
          allowReorder: true,
        },
      })

      // Should not throw error even if platform doesn't support tabs
      expect(() => {
        windowGroup.configureTabs({
          enabled: true,
          tabPosition: 'bottom',
          allowDetach: false,
          allowReorder: false,
        })
      }).not.toThrow()
    })

    it('should gracefully handle pooling on different platforms', () => {
      const windowGroup = WindowGroup({
        id: 'pooling-test-group',
        children: () => Text('Test Window'),
        poolConfig: {
          enabled: true,
          maxPoolSize: 5,
          reuseThreshold: 1000,
          keepAliveTime: 10000,
        },
      })

      expect(windowGroup.group.getPoolConfig().enabled).toBe(true)
      expect(windowGroup.group.getPooledWindows()).toHaveLength(0)
    })
  })
})
