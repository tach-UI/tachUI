/**
 * Simplified Plugin System Integration Tests
 * 
 * Comprehensive tests verifying the simplified plugin system works correctly
 * with all components integrated together.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SimplifiedTachUIInstance } from '../../src/plugins/simplified-tachui-instance'
import type { TachUIPlugin } from '../../src/plugins/simplified-types'

describe('Simplified Plugin System Integration', () => {
  let instance: SimplifiedTachUIInstance
  
  beforeEach(() => {
    instance = new SimplifiedTachUIInstance()
    vi.clearAllMocks()
  })

  describe('End-to-End Plugin Workflow', () => {
    it('should complete full plugin lifecycle successfully', async () => {
      // Mock plugin with components and services
      const testPlugin: TachUIPlugin = {
        name: 'test-integration-plugin',
        version: '1.0.0',
        description: 'Integration test plugin',
        
        async install(inst) {
          // Register components
          inst.registerComponent('TestComponent', () => ({ type: 'div', children: 'test' }), {
            category: 'test',
            tags: ['integration', 'test']
          })
          
          inst.registerComponent('AnotherComponent', () => ({ type: 'span', children: 'another' }), {
            category: 'test',
            tags: ['integration']
          })
          
          // Register services
          inst.registerService('testConfig', { theme: 'test', enabled: true })
          inst.registerService('testUtility', { format: (str: string) => `formatted-${str}` })
        },
        
        async uninstall() {
          console.log('Test plugin uninstalled')
        }
      }

      // Install plugin
      await instance.installPlugin(testPlugin)
      
      // Verify plugin is installed
      expect(instance.isPluginInstalled('test-integration-plugin')).toBe(true)
      expect(instance.getInstalledPlugins()).toContain('test-integration-plugin')
      
      // Verify components were registered
      expect(instance.components.has('TestComponent')).toBe(true)
      expect(instance.components.has('AnotherComponent')).toBe(true)
      
      const testComponent = instance.components.get('TestComponent')
      expect(testComponent).toBeDefined()
      expect(testComponent?.category).toBe('test')
      expect(testComponent?.tags).toEqual(['integration', 'test'])
      
      // Verify services were registered
      expect(instance.hasService('testConfig')).toBe(true)
      expect(instance.hasService('testUtility')).toBe(true)
      
      const config = instance.getService('testConfig')
      expect(config).toEqual({ theme: 'test', enabled: true })
      
      const utility = instance.getService('testUtility')
      expect(utility.format('hello')).toBe('formatted-hello')
      
      // Test statistics
      const stats = instance.getStats()
      expect(stats.plugins.installed).toBeGreaterThanOrEqual(1)
      expect(stats.plugins.list).toContain('test-integration-plugin')
      expect(stats.components.totalComponents).toBeGreaterThanOrEqual(2)
      expect(stats.services.registered).toBeGreaterThanOrEqual(2)
      
      // Uninstall plugin
      await instance.uninstallPlugin('test-integration-plugin')
      
      // Verify plugin is uninstalled
      expect(instance.isPluginInstalled('test-integration-plugin')).toBe(false)
      expect(instance.getInstalledPlugins()).not.toContain('test-integration-plugin')
      
      // Verify components were unregistered
      expect(instance.components.has('TestComponent')).toBe(false)
      expect(instance.components.has('AnotherComponent')).toBe(false)
    })

    it('should handle multiple plugins with interdependencies', async () => {
      const basePlugin: TachUIPlugin = {
        name: 'base-plugin',
        version: '1.0.0',
        
        async install(inst) {
          inst.registerService('baseService', { version: '1.0.0', utils: { helper: () => 'base-helper' } })
        }
      }
      
      const dependentPlugin: TachUIPlugin = {
        name: 'dependent-plugin', 
        version: '1.0.0',
        
        async install(inst) {
          // Use base service
          const baseService = inst.getService('baseService')
          expect(baseService).toBeDefined()
          
          inst.registerService('dependentService', { 
            base: baseService,
            enhanced: () => `enhanced-${baseService.utils.helper()}`
          })
          
          inst.registerComponent('DependentComponent', () => ({
            type: 'div',
            children: baseService.utils.helper()
          }), { category: 'dependent' })
        }
      }
      
      // Install base plugin first
      await instance.installPlugin(basePlugin)
      
      // Install dependent plugin
      await instance.installPlugin(dependentPlugin)
      
      // Verify both plugins are installed
      expect(instance.getInstalledPlugins()).toEqual(['base-plugin', 'dependent-plugin'])
      
      // Verify dependent plugin can use base service
      const dependentService = instance.getService('dependentService')
      expect(dependentService.enhanced()).toBe('enhanced-base-helper')
      
      // Verify component registration
      expect(instance.components.has('DependentComponent')).toBe(true)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle plugin installation errors gracefully', async () => {
      const faultyPlugin: TachUIPlugin = {
        name: 'faulty-plugin',
        version: '1.0.0',
        
        async install() {
          throw new Error('Installation failed')
        }
      }
      
      await expect(instance.installPlugin(faultyPlugin)).rejects.toThrow('Installation failed')
      
      // Verify plugin is not registered as installed
      expect(instance.isPluginInstalled('faulty-plugin')).toBe(false)
      expect(instance.getInstalledPlugins()).not.toContain('faulty-plugin')
    })
    
    it('should handle uninstallation errors gracefully', async () => {
      const problematicPlugin: TachUIPlugin = {
        name: 'problematic-plugin',
        version: '1.0.0',
        
        async install(inst) {
          inst.registerService('problemService', { data: 'test' })
        },
        
        async uninstall() {
          throw new Error('Uninstallation failed')
        }
      }
      
      // Install successfully
      await instance.installPlugin(problematicPlugin)
      expect(instance.isPluginInstalled('problematic-plugin')).toBe(true)
      
      // Uninstall should handle error gracefully
      await expect(instance.uninstallPlugin('problematic-plugin')).rejects.toThrow('Uninstallation failed')
      
      // Plugin should still be marked as uninstalled despite error in cleanup
      expect(instance.isPluginInstalled('problematic-plugin')).toBe(false)
    })
  })

  describe('Real-World Usage Patterns', () => {
    it('should support forms plugin-like registration pattern', async () => {
      const formsLikePlugin: TachUIPlugin = {
        name: 'forms-like-plugin',
        version: '1.0.0',
        
        async install(inst) {
          // Register multiple components with consistent categorization
          const formComponents = [
            { name: 'Form', component: () => ({ type: 'form' }) },
            { name: 'TextField', component: () => ({ type: 'input' }) },
            { name: 'Button', component: () => ({ type: 'button' }) },
          ]
          
          formComponents.forEach(({ name, component }) => {
            inst.registerComponent(name, component as any, {
              category: 'forms',
              tags: ['form', 'input']
            })
          })
          
          // Register configuration and utilities
          inst.registerService('formsConfig', { theme: 'default', validation: {} })
          inst.registerService('validation', { 
            required: (value: any) => value != null,
            email: (value: string) => /\S+@\S+\.\S+/.test(value)
          })
        }
      }
      
      await instance.installPlugin(formsLikePlugin)
      
      // Verify component registration
      const formStats = instance.components.listByCategory('forms')
      expect(formStats).toHaveLength(3)
      expect(formStats.map(c => c.name)).toEqual(['Form', 'TextField', 'Button'])
      
      // Verify service registration
      const config = instance.getService('formsConfig')
      expect(config.theme).toBe('default')
      
      const validation = instance.getService('validation')
      expect(validation.required('test')).toBe(true)
      expect(validation.required(null)).toBe(false)
      expect(validation.email('test@example.com')).toBe(true)
    })
    
    it('should support symbols plugin-like usage without plugin interface', () => {
      // Symbols package doesn't use plugin interface - just component exports
      // Verify this usage pattern works with our system
      
      const mockSymbolComponent = () => ({ type: 'svg', children: 'icon' })
      
      // Direct component registration (simulating how symbols would be used)
      instance.registerComponent('Symbol', mockSymbolComponent as any, {
        category: 'symbols',
        tags: ['icon', 'symbol']
      })
      
      // Verify registration
      expect(instance.components.has('Symbol')).toBe(true)
      const symbolComponent = instance.components.get('Symbol')
      expect(symbolComponent?.category).toBe('symbols')
    })
  })

  describe('Performance and Scale Integration', () => {
    it('should handle large numbers of components and services efficiently', async () => {
      const largePlugin: TachUIPlugin = {
        name: 'large-plugin',
        version: '1.0.0',
        
        async install(inst) {
          // Register many components
          for (let i = 0; i < 100; i++) {
            inst.registerComponent(`Component${i}`, () => ({ type: 'div', children: `component-${i}` }), {
              category: 'large',
              tags: ['generated', `item-${i}`]
            })
          }
          
          // Register many services  
          for (let i = 0; i < 50; i++) {
            inst.registerService(`service${i}`, { id: i, data: `service-data-${i}` })
          }
        }
      }
      
      const start = performance.now()
      await instance.installPlugin(largePlugin)
      const installTime = performance.now() - start
      
      // Should install quickly (under 100ms for 150 registrations)
      expect(installTime).toBeLessThan(100)
      
      // Verify all components are registered
      const largeComponents = instance.components.listByCategory('large')
      expect(largeComponents).toHaveLength(100)
      
      // Verify services
      expect(instance.hasService('service0')).toBe(true)
      expect(instance.hasService('service49')).toBe(true)
      expect(instance.getService('service25').id).toBe(25)
      
      // Test statistics performance
      const statsStart = performance.now()
      const stats = instance.getStats()
      const statsTime = performance.now() - statsStart
      
      expect(statsTime).toBeLessThan(10) // Stats should be fast
      expect(stats.components.totalComponents).toBeGreaterThanOrEqual(100)
      expect(stats.services.registered).toBeGreaterThanOrEqual(50)
    })
  })

  describe('System Reset Integration', () => {
    it('should reset entire system cleanly', async () => {
      // Install multiple plugins
      const plugin1: TachUIPlugin = {
        name: 'plugin1',
        version: '1.0.0',
        async install(inst) {
          inst.registerComponent('Comp1', () => ({ type: 'div' }), { category: 'test' })
          inst.registerService('service1', { data: 'test1' })
        }
      }
      
      const plugin2: TachUIPlugin = {
        name: 'plugin2',
        version: '1.0.0',
        async install(inst) {
          inst.registerComponent('Comp2', () => ({ type: 'div' }), { category: 'test' })
          inst.registerService('service2', { data: 'test2' })
        }
      }
      
      await instance.installPlugin(plugin1)
      await instance.installPlugin(plugin2)
      
      // Verify plugins are installed
      expect(instance.getInstalledPlugins()).toHaveLength(2)
      expect(instance.components.list()).toHaveLength(2)
      expect(instance.getStats().services.registered).toBeGreaterThanOrEqual(2)
      
      // Reset system
      await instance.reset()
      
      // Verify everything is cleared
      expect(instance.getInstalledPlugins()).toHaveLength(0)
      expect(instance.components.list()).toHaveLength(0)
      expect(instance.services.size).toBe(0)
      
      const stats = instance.getStats()
      expect(stats.plugins.installed).toBe(0)
      expect(stats.components.totalComponents).toBe(0)
      expect(stats.services.registered).toBe(0)
    })
  })
})