/**
 * Tests for Simplified Plugin System - Phase 1
 */

import { describe, test, expect, beforeEach } from 'vitest'
import {
  SimplifiedTachUIInstance,
  SimplifiedPluginManager,
  SimplifiedComponentRegistry,
  PluginError
} from '../simplified-index'
import type { TachUIPlugin, TachUIInstance } from '../simplified-types'

describe('Simplified Plugin System', () => {
  let instance: SimplifiedTachUIInstance

  beforeEach(() => {
    instance = new SimplifiedTachUIInstance()
  })

  describe('SimplifiedPluginManager', () => {
    test('should install and manage plugins correctly', async () => {
      const plugin: TachUIPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        async install(instance: TachUIInstance) {
          instance.registerService('test-service', { value: 'test' })
        }
      }

      await instance.plugins.install(plugin)

      expect(instance.plugins.isInstalled('test-plugin')).toBe(true)
      expect(instance.plugins.getInstalledPlugins()).toContain('test-plugin')
      expect(instance.getService('test-service')).toEqual({ value: 'test' })
    })

    test('should handle plugin errors gracefully', async () => {
      const failingPlugin = {
        name: 'failing-plugin',
        version: '1.0.0',
        async install() {
          throw new Error('Installation failed')
        }
      }

      await expect(instance.plugins.install(failingPlugin)).rejects.toThrow('Installation failed')
      expect(instance.plugins.isInstalled('failing-plugin')).toBe(false)
    })

    test('should validate plugin basics correctly', async () => {
      const invalidPlugin = { name: '', version: '1.0.0' } // Missing install method

      await expect(instance.plugins.install(invalidPlugin as any)).rejects.toThrow('Plugin must have a valid name string')
    })

    test('should uninstall plugins correctly', async () => {
      const plugin: TachUIPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        async install(instance: TachUIInstance) {
          instance.registerService('test-service', { value: 'test' })
        },
        async uninstall() {
          // Cleanup logic would go here
        }
      }

      await instance.plugins.install(plugin)
      expect(instance.plugins.isInstalled('test-plugin')).toBe(true)

      await instance.plugins.uninstall('test-plugin')
      expect(instance.plugins.isInstalled('test-plugin')).toBe(false)
    })
  })

  describe('SimplifiedComponentRegistry', () => {
    test('should register and retrieve components', () => {
      const testComponent = () => ({ type: 'div', props: {}, children: [] })
      
      instance.components.register({
        name: 'TestComponent',
        component: testComponent,
        category: 'test',
        tags: ['example']
      })

      expect(instance.components.has('TestComponent')).toBe(true)
      expect(instance.components.getComponent('TestComponent')).toBe(testComponent)
      
      const registration = instance.components.get('TestComponent')
      expect(registration?.category).toBe('test')
      expect(registration?.tags).toContain('example')
    })

    test('should list components by category', () => {
      const testComponent1 = () => ({ type: 'div', props: {}, children: [] })
      const testComponent2 = () => ({ type: 'span', props: {}, children: [] })

      instance.components.register({
        name: 'TestComponent1',
        component: testComponent1,
        category: 'test'
      })

      instance.components.register({
        name: 'TestComponent2', 
        component: testComponent2,
        category: 'test'
      })

      const testComponents = instance.components.listByCategory('test')
      expect(testComponents).toHaveLength(2)
      expect(testComponents.map(c => c.name)).toContain('TestComponent1')
      expect(testComponents.map(c => c.name)).toContain('TestComponent2')
    })

    test('should unregister components correctly', () => {
      const testComponent = () => ({ type: 'div', props: {}, children: [] })
      
      instance.components.register({
        name: 'TestComponent',
        component: testComponent
      })

      expect(instance.components.has('TestComponent')).toBe(true)
      
      const unregistered = instance.components.unregister('TestComponent')
      expect(unregistered).toBe(true)
      expect(instance.components.has('TestComponent')).toBe(false)
    })
  })

  describe('SimplifiedTachUIInstance', () => {
    test('should integrate plugins and components', async () => {
      const plugin: TachUIPlugin = {
        name: 'ui-plugin',
        version: '1.0.0',
        async install(instance: TachUIInstance) {
          const buttonComponent = () => ({ type: 'button', props: {}, children: [] })
          instance.registerComponent('Button', buttonComponent, {
            category: 'input',
            tags: ['interactive']
          })
        }
      }

      await instance.installPlugin(plugin)

      expect(instance.isPluginInstalled('ui-plugin')).toBe(true)
      expect(instance.components.has('Button')).toBe(true)
      
      const stats = instance.getStats()
      expect(stats.plugins.installed).toBe(1)
      expect(stats.components.totalComponents).toBe(1)
    })

    test('should handle services correctly', () => {
      instance.registerService('config', { theme: 'dark' })
      
      expect(instance.hasService('config')).toBe(true)
      expect(instance.getService('config')).toEqual({ theme: 'dark' })
      
      instance.unregisterService('config')
      expect(instance.hasService('config')).toBe(false)
    })

    test('should reset correctly', async () => {
      const plugin: TachUIPlugin = {
        name: 'test-plugin',
        version: '1.0.0',
        async install(instance: TachUIInstance) {
          instance.registerService('test-service', { value: 'test' })
        }
      }

      await instance.installPlugin(plugin)
      instance.registerService('direct-service', { value: 'direct' })

      expect(instance.getInstalledPlugins()).toHaveLength(1)
      expect(instance.services.size).toBe(2)

      await instance.reset()

      expect(instance.getInstalledPlugins()).toHaveLength(0)
      expect(instance.services.size).toBe(0)
      expect(instance.components.getStats().totalComponents).toBe(0)
    })
  })
})