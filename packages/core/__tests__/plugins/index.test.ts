/**
 * Simplified Plugin System Integration Tests - Phase 1 Implementation
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  globalTachUIInstance,
  installPlugin,
  registerComponent,
  registerService,
  SimplifiedPluginManager,
} from '../../src/plugins/index'
import type { TachUIPlugin } from '../../src/plugins/index'

// Mock plugin for testing
const createMockPlugin = (name: string = 'test-plugin'): TachUIPlugin => ({
  name,
  version: '1.0.0',
  install: vi.fn().mockResolvedValue(undefined),
  uninstall: vi.fn().mockResolvedValue(undefined)
})

// Mock component for testing
const createMockComponent = () => {
  const component = vi.fn().mockImplementation(() => document.createElement('div'))
  component.displayName = 'MockComponent'
  return component
}

describe('Simplified Plugin System Integration', () => {
  // Clear plugin state between tests
  beforeEach(() => {
    // Reset the global TachUI instance
    globalTachUIInstance.plugins = new SimplifiedPluginManager(globalTachUIInstance)
    globalTachUIInstance.services.clear()
    vi.clearAllMocks()
  })

  describe('Plugin Installation', () => {
    it('should install plugins through the global instance', async () => {
      const plugin = createMockPlugin('test-install')
      
      await installPlugin(plugin)
      
      expect(plugin.install).toHaveBeenCalledWith(globalTachUIInstance)
      expect(globalTachUIInstance.plugins.isInstalled('test-install')).toBe(true)
    })

    it('should throw error for invalid plugins', async () => {
      const invalidPlugin = { name: '', version: '1.0.0' } as any
      
      await expect(installPlugin(invalidPlugin)).rejects.toThrow()
    })

    it('should handle plugin installation errors', async () => {
      const failingPlugin = createMockPlugin('failing-plugin')
      failingPlugin.install = vi.fn().mockRejectedValue(new Error('Installation failed'))
      
      await expect(installPlugin(failingPlugin)).rejects.toThrow('Installation failed')
    })
  })

  describe('Plugin Management', () => {
    it('should track installed plugins', async () => {
      const plugin1 = createMockPlugin('plugin-one')
      const plugin2 = createMockPlugin('plugin-two')
      
      await installPlugin(plugin1)
      await installPlugin(plugin2)
      
      const installedPlugins = globalTachUIInstance.plugins.getInstalledPlugins()
      expect(installedPlugins).toEqual(['plugin-one', 'plugin-two'])
    })

    it('should uninstall plugins correctly', async () => {
      const plugin = createMockPlugin('uninstall-test')
      
      await installPlugin(plugin)
      expect(globalTachUIInstance.plugins.isInstalled('uninstall-test')).toBe(true)
      
      await globalTachUIInstance.plugins.uninstall('uninstall-test')
      expect(globalTachUIInstance.plugins.isInstalled('uninstall-test')).toBe(false)
      expect(plugin.uninstall).toHaveBeenCalled()
    })
  })

  describe('Component Registration', () => {
    it('should register components through global function', () => {
      const component = createMockComponent()
      
      registerComponent('TestComponent', component)
      
      const registered = globalTachUIInstance.components.get('TestComponent')
      expect(registered).toBeDefined()
      expect(registered?.component).toBe(component)
    })

    it('should register components with options', () => {
      const component = createMockComponent()
      
      registerComponent('TestComponent', component, {
        category: 'testing',
        tags: ['mock', 'test']
      })
      
      const registered = globalTachUIInstance.components.get('TestComponent')
      expect(registered?.category).toBe('testing')
      expect(registered?.tags).toEqual(['mock', 'test'])
    })
  })

  describe('Service Registration', () => {
    it('should register services through global function', () => {
      const service = { test: true, method: vi.fn() }
      
      registerService('testService', service)
      
      expect(globalTachUIInstance.services.get('testService')).toBe(service)
    })

    it('should handle service registration with different types', () => {
      const stringService = 'test-string'
      const numberService = 42
      const functionService = vi.fn()
      
      registerService('string', stringService)
      registerService('number', numberService)
      registerService('function', functionService)
      
      expect(globalTachUIInstance.services.get('string')).toBe(stringService)
      expect(globalTachUIInstance.services.get('number')).toBe(numberService)
      expect(globalTachUIInstance.services.get('function')).toBe(functionService)
    })
  })

  describe('Integration Scenarios', () => {
    it('should allow plugins to register components and services', async () => {
      const component = createMockComponent()
      const service = { utility: vi.fn() }
      
      const plugin: TachUIPlugin = {
        name: 'integration-plugin',
        version: '1.0.0',
        install: vi.fn().mockImplementation(async (instance) => {
          instance.registerComponent('IntegrationComponent', component, {
            category: 'integration'
          })
          instance.registerService('integrationService', service)
        }),
        uninstall: vi.fn().mockImplementation(async () => {
          globalTachUIInstance.components.unregister('IntegrationComponent')
          globalTachUIInstance.services.delete('integrationService')
        })
      }
      
      await installPlugin(plugin)
      
      // Verify component was registered
      const registeredComponent = globalTachUIInstance.components.get('IntegrationComponent')
      expect(registeredComponent).toBeDefined()
      expect(registeredComponent?.component).toBe(component)
      expect(registeredComponent?.category).toBe('integration')
      
      // Verify service was registered
      expect(globalTachUIInstance.services.get('integrationService')).toBe(service)
      
      // Test uninstallation
      await globalTachUIInstance.plugins.uninstall('integration-plugin')
      expect(plugin.uninstall).toHaveBeenCalled()
    })

    it('should provide access to the global TachUI instance', () => {
      expect(globalTachUIInstance).toBeDefined()
      expect(globalTachUIInstance.plugins).toBeInstanceOf(SimplifiedPluginManager)
      expect(globalTachUIInstance.components).toBeDefined()
      expect(globalTachUIInstance.services).toBeInstanceOf(Map)
    })
  })
})