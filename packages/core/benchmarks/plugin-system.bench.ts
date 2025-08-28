/**
 * Plugin System Performance Benchmarks
 * 
 * Benchmarks the simplified plugin system performance including:
 * - Plugin installation speed
 * - Component registration performance
 * - Service registration and retrieval
 * - Plugin uninstallation cleanup
 * - Memory usage optimization
 */

import { describe, it } from 'vitest'
import { SimplifiedTachUIInstance } from '../src/plugins/simplified-tachui-instance'
import type { TachUIPlugin } from '../src/plugins/simplified-types'

// Mock components for testing
const createMockComponent = (name: string) => () => ({ type: 'div', children: name })

// Mock service for testing
class MockService {
  constructor(public name: string) {}
  
  process(data: any) {
    return `${this.name}: ${data}`
  }
  
  cleanup() {
    console.log(`${this.name} cleaned up`)
  }
}

// Test plugin with multiple components
const createTestPlugin = (name: string, componentCount: number): TachUIPlugin => ({
  name,
  version: '1.0.0',
  description: `Test plugin with ${componentCount} components`,
  
  async install(instance) {
    // Register multiple components
    for (let i = 0; i < componentCount; i++) {
      instance.registerComponent(
        `${name}Component${i}`, 
        createMockComponent(`${name}-${i}`),
        {
          category: 'test',
          tags: ['benchmark', 'mock', `plugin-${name}`]
        }
      )
    }
    
    // Register services
    instance.registerService(`${name}Service`, new MockService(name))
    instance.registerService(`${name}Config`, {
      theme: 'default',
      enabled: true,
      settings: { option1: 'value1', option2: 42 }
    })
    
    // Register utility services
    instance.registerService(`${name}Utils`, {
      format: (value: string) => `formatted-${value}`,
      validate: (value: any) => value != null,
      transform: (data: any) => ({ ...data, processed: true })
    })
  },
  
  async uninstall() {
    console.log(`${name} plugin cleanup completed`)
  }
})

describe('Plugin System Performance', () => {
  it('Plugin Installation Performance', async () => {
    console.log('🚀 Testing Plugin Installation Performance...')
    
    const instance = new SimplifiedTachUIInstance()
    const iterations = 10
    const timings: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const plugin = createTestPlugin(`BenchPlugin${i}`, 5)
      
      const start = performance.now()
      await instance.installPlugin(plugin)
      const end = performance.now()
      
      timings.push(end - start)
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length
    const minTime = Math.min(...timings)
    const maxTime = Math.max(...timings)
    
    console.log(`📊 Plugin Installation Results:`)
    console.log(`   Average: ${avgTime.toFixed(2)}ms`)
    console.log(`   Min: ${minTime.toFixed(2)}ms`)
    console.log(`   Max: ${maxTime.toFixed(2)}ms`)
    console.log(`   Plugins installed: ${iterations}`)
    
    // Verify all plugins are installed
    const installedPlugins = instance.getInstalledPlugins()
    console.log(`   Verified installed: ${installedPlugins.length}`)
  }, { timeout: 30000 })
  
  it('Large Plugin Installation', async () => {
    console.log('🔥 Testing Large Plugin Installation...')
    
    const instance = new SimplifiedTachUIInstance()
    const largePlugin = createTestPlugin('LargePlugin', 100) // 100 components
    
    const start = performance.now()
    await instance.installPlugin(largePlugin)
    const end = performance.now()
    
    const installTime = end - start
    
    console.log(`📊 Large Plugin Results:`)
    console.log(`   Installation time: ${installTime.toFixed(2)}ms`)
    console.log(`   Components registered: 100`)
    console.log(`   Services registered: 3`)
    
    // Verify registration
    const stats = instance.getStats()
    console.log(`   Total components: ${stats.components.totalComponents}`)
    console.log(`   Total services: ${stats.services.registered}`)
  }, { timeout: 30000 })
  
  it('Component Discovery Performance', async () => {
    console.log('🔍 Testing Component Discovery Performance...')
    
    const instance = new SimplifiedTachUIInstance()
    
    // Install multiple plugins with different categories
    const plugins = [
      { plugin: createTestPlugin('FormsPlugin', 20), category: 'forms' },
      { plugin: createTestPlugin('UIPlugin', 15), category: 'ui' },
      { plugin: createTestPlugin('DataPlugin', 25), category: 'data' }
    ]
    
    for (const { plugin } of plugins) {
      await instance.installPlugin(plugin)
    }
    
    const iterations = 1000
    const timings: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now()
      
      // Test various discovery operations
      instance.components.has('FormsPluginComponent0')
      instance.components.get('UIPluginComponent5')
      instance.components.listByCategory('data')
      instance.components.list()
      
      const end = performance.now()
      timings.push(end - start)
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length
    
    console.log(`📊 Component Discovery Results:`)
    console.log(`   Average per operation: ${avgTime.toFixed(4)}ms`)
    console.log(`   Operations per second: ${(1000 / avgTime).toFixed(0)}`)
    console.log(`   Total components: ${instance.components.list().length}`)
    
    // Test category filtering
    const dataComponents = instance.components.listByCategory('data')
    console.log(`   Data category components: ${dataComponents.length}`)
  }, { timeout: 30000 })
  
  it('Service Performance', async () => {
    console.log('⚙️ Testing Service Registration and Retrieval...')
    
    const instance = new SimplifiedTachUIInstance()
    const plugin = createTestPlugin('ServicePlugin', 10)
    await instance.installPlugin(plugin)
    
    const iterations = 10000
    const retrievalTimings: number[] = []
    const checkTimings: number[] = []
    
    for (let i = 0; i < iterations; i++) {
      // Test service retrieval
      const retrievalStart = performance.now()
      const service = instance.getService('ServicePluginService')
      const retrievalEnd = performance.now()
      retrievalTimings.push(retrievalEnd - retrievalStart)
      
      // Test service existence check
      const checkStart = performance.now()
      instance.hasService('ServicePluginConfig')
      const checkEnd = performance.now()
      checkTimings.push(checkEnd - checkStart)
    }
    
    const avgRetrieval = retrievalTimings.reduce((a, b) => a + b, 0) / retrievalTimings.length
    const avgCheck = checkTimings.reduce((a, b) => a + b, 0) / checkTimings.length
    
    console.log(`📊 Service Performance Results:`)
    console.log(`   Average retrieval: ${avgRetrieval.toFixed(6)}ms`)
    console.log(`   Average existence check: ${avgCheck.toFixed(6)}ms`)
    console.log(`   Retrievals per second: ${(1000 / avgRetrieval).toFixed(0)}`)
    console.log(`   Checks per second: ${(1000 / avgCheck).toFixed(0)}`)
  }, { timeout: 30000 })
  
  it('Plugin Uninstallation Performance', async () => {
    console.log('🗑️ Testing Plugin Uninstallation Performance...')
    
    const instance = new SimplifiedTachUIInstance()
    const plugins: string[] = []
    
    // Install multiple plugins
    for (let i = 0; i < 10; i++) {
      const plugin = createTestPlugin(`UninstallPlugin${i}`, 10)
      await instance.installPlugin(plugin)
      plugins.push(plugin.name)
    }
    
    console.log(`   Installed ${plugins.length} plugins`)
    
    const timings: number[] = []
    
    for (const pluginName of plugins) {
      const start = performance.now()
      await instance.uninstallPlugin(pluginName)
      const end = performance.now()
      
      timings.push(end - start)
    }
    
    const avgTime = timings.reduce((a, b) => a + b, 0) / timings.length
    const minTime = Math.min(...timings)
    const maxTime = Math.max(...timings)
    
    console.log(`📊 Uninstallation Results:`)
    console.log(`   Average: ${avgTime.toFixed(2)}ms`)
    console.log(`   Min: ${minTime.toFixed(2)}ms`)
    console.log(`   Max: ${maxTime.toFixed(2)}ms`)
    
    // Verify cleanup
    const remainingPlugins = instance.getInstalledPlugins()
    const remainingComponents = instance.components.list()
    
    console.log(`   Remaining plugins: ${remainingPlugins.length}`)
    console.log(`   Remaining components: ${remainingComponents.length}`)
  }, { timeout: 30000 })
  
  it('System Reset Performance', async () => {
    console.log('🔄 Testing System Reset Performance...')
    
    const instance = new SimplifiedTachUIInstance()
    
    // Install many plugins
    for (let i = 0; i < 20; i++) {
      const plugin = createTestPlugin(`ResetPlugin${i}`, 5)
      await instance.installPlugin(plugin)
    }
    
    const statsBefore = instance.getStats()
    console.log(`   Before reset: ${statsBefore.plugins.installed} plugins, ${statsBefore.components.totalComponents} components`)
    
    const start = performance.now()
    await instance.reset()
    const end = performance.now()
    
    const resetTime = end - start
    const statsAfter = instance.getStats()
    
    console.log(`📊 System Reset Results:`)
    console.log(`   Reset time: ${resetTime.toFixed(2)}ms`)
    console.log(`   After reset: ${statsAfter.plugins.installed} plugins, ${statsAfter.components.totalComponents} components`)
  }, { timeout: 30000 })
  
  it('Memory Usage Test', async () => {
    console.log('💾 Testing Memory Usage...')
    
    const instance = new SimplifiedTachUIInstance()
    
    // Measure initial memory
    if (global.gc) {
      global.gc()
    }
    const initialMemory = process.memoryUsage()
    
    // Install many plugins
    for (let i = 0; i < 50; i++) {
      const plugin = createTestPlugin(`MemoryPlugin${i}`, 10)
      await instance.installPlugin(plugin)
    }
    
    // Measure memory after installation
    if (global.gc) {
      global.gc()
    }
    const afterInstallMemory = process.memoryUsage()
    
    const stats = instance.getStats()
    
    // Calculate memory per plugin/component
    const memoryIncrease = afterInstallMemory.heapUsed - initialMemory.heapUsed
    const memoryPerPlugin = memoryIncrease / 50
    const memoryPerComponent = memoryIncrease / stats.components.totalComponents
    
    console.log(`📊 Memory Usage Results:`)
    console.log(`   Initial heap: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   After install heap: ${(afterInstallMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Memory increase: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Memory per plugin: ${(memoryPerPlugin / 1024).toFixed(2)}KB`)
    console.log(`   Memory per component: ${(memoryPerComponent / 1024).toFixed(2)}KB`)
    console.log(`   Total components: ${stats.components.totalComponents}`)
    console.log(`   Total services: ${stats.services.registered}`)
  }, { timeout: 30000 })
  
  it('Concurrent Plugin Operations', async () => {
    console.log('🔀 Testing Concurrent Plugin Operations...')
    
    const instance = new SimplifiedTachUIInstance()
    
    // Create multiple plugins for concurrent testing
    const plugins = Array.from({ length: 10 }, (_, i) => 
      createTestPlugin(`ConcurrentPlugin${i}`, 5)
    )
    
    const start = performance.now()
    
    // Install plugins concurrently
    await Promise.all(plugins.map(plugin => instance.installPlugin(plugin)))
    
    const installEnd = performance.now()
    const installTime = installEnd - start
    
    // Test concurrent component access
    const accessPromises = Array.from({ length: 100 }, async (_, i) => {
      const pluginIndex = i % 10
      const componentName = `ConcurrentPlugin${pluginIndex}Component0`
      return instance.components.has(componentName)
    })
    
    await Promise.all(accessPromises)
    
    const accessEnd = performance.now()
    const accessTime = accessEnd - installEnd
    
    console.log(`📊 Concurrent Operations Results:`)
    console.log(`   Concurrent install time: ${installTime.toFixed(2)}ms`)
    console.log(`   Concurrent access time: ${accessTime.toFixed(2)}ms`)
    console.log(`   Plugins installed: ${instance.getInstalledPlugins().length}`)
  }, { timeout: 30000 })
})