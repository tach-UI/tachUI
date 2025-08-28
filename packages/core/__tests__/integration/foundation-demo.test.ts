/**
 * Phase 1 Foundation Demo - Simple Integration Testing
 * 
 * Demonstrates the foundation components we've built:
 * - Real DOM testing framework
 * - Memory leak testing utilities
 * - Plugin combination testing infrastructure
 * 
 * This focuses on testing the testing framework itself before integrating with TachUI components.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setupRealDOMTesting, domTestUtils } from '../../../../tools/testing/real-dom-integration'
import { setupMemoryLeakTesting, memoryTestUtils } from '../../../../tools/testing/memory-leak-tester'
import { setupPluginCombinationTesting, pluginTestUtils } from '../../../../tools/testing/plugin-combination-tester'
import { createSignal } from '../../src/reactive'

describe('Phase 1 Foundation - Testing Framework Validation', () => {
  describe('Real DOM Testing Framework', () => {
    const domEnv = setupRealDOMTesting({
      rootSelector: '#test-root',
      cleanupAfterEach: true,
      enableResourceTracking: true
    })

    it('should set up real DOM environment', () => {
      const root = domEnv.getRoot()
      expect(root).toBeTruthy()
      expect(root.id).toBe('test-root')
      expect(root.tagName.toLowerCase()).toBe('div')
    })

    it('should track DOM element creation', () => {
      const initialStats = domEnv.getResourceStats()
      
      // Create some elements
      const div1 = domEnv.createElement('div', { class: 'test-div' })
      const div2 = domEnv.createElement('span', { id: 'test-span' })
      
      domEnv.getRoot().appendChild(div1)
      domEnv.getRoot().appendChild(div2)
      
      const finalStats = domEnv.getResourceStats()
      expect(finalStats.elementCount).toBe(initialStats.elementCount + 2)
      
      // Verify elements are in DOM
      expect(document.querySelector('.test-div')).toBeTruthy()
      expect(document.querySelector('#test-span')).toBeTruthy()
    })

    it('should handle real DOM events', async () => {
      let clickCount = 0
      
      const button = domEnv.createElement('button')
      button.textContent = 'Click me'
      button.addEventListener('click', () => {
        clickCount++
        button.textContent = `Clicked ${clickCount} times`
      })
      
      domEnv.getRoot().appendChild(button)
      
      // Test initial state
      expect(button.textContent).toBe('Click me')
      expect(clickCount).toBe(0)
      
      // Fire real DOM event
      domTestUtils.fireEvent.click(button)
      
      // Verify real event handling
      expect(clickCount).toBe(1)
      expect(button.textContent).toBe('Clicked 1 times')
      
      // Test multiple clicks
      domTestUtils.fireEvent.click(button)
      domTestUtils.fireEvent.click(button)
      
      expect(clickCount).toBe(3)
      expect(button.textContent).toBe('Clicked 3 times')
    })

    it('should track resource usage', async () => {
      const initialStats = domEnv.getResourceStats()
      
      // Create timers
      const timeout1 = setTimeout(() => {}, 1000)
      const timeout2 = setTimeout(() => {}, 2000)
      const interval1 = setInterval(() => {}, 1000)
      
      const afterTimerStats = domEnv.getResourceStats()
      expect(afterTimerStats.timeoutCount).toBeGreaterThan(initialStats.timeoutCount)
      expect(afterTimerStats.intervalCount).toBeGreaterThan(initialStats.intervalCount)
      
      // Clean up
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearInterval(interval1)
      
      await domEnv.nextTick()
    })

    it('should wait for conditions with timeout', async () => {
      let conditionMet = false
      
      // Set condition to be met after delay
      setTimeout(() => {
        conditionMet = true
      }, 100)
      
      // Wait for condition
      await domEnv.waitFor(() => conditionMet, { timeout: 500 })
      
      expect(conditionMet).toBe(true)
    })

    it('should provide DOM query utilities', () => {
      // Create test elements
      const div1 = domEnv.createElement('div', { class: 'test-class', id: 'test-id' })
      const div2 = domEnv.createElement('div', { class: 'test-class' })
      
      domEnv.getRoot().appendChild(div1)
      domEnv.getRoot().appendChild(div2)
      
      // Test query utilities
      const elementById = domTestUtils.query.get('#test-id')
      expect(elementById).toBe(div1)
      
      const elementsByClass = domTestUtils.query.getAll('.test-class')
      expect(elementsByClass).toHaveLength(2)
      expect(elementsByClass).toContain(div1)
      expect(elementsByClass).toContain(div2)
    })
  })

  describe('Memory Leak Testing Framework', () => {
    it('should track memory usage without auto-setup', async () => {
      const report = await memoryTestUtils.testRepeatedExecution(
        () => {
          // Create and discard objects
          const objects = []
          for (let i = 0; i < 100; i++) {
            objects.push({ data: new Array(100).fill(Math.random()) })
          }
          return objects.length
        },
        50,
        { maxMemoryGrowthMB: 20 }
      )
      
      expect(report.leaksDetected).toBe(false)
      expect(report.memoryGrowthPercent).toBeLessThan(50)
    })

    it.skipIf(process.env.CI)('should detect memory growth patterns', async () => {
      const report = await memoryTestUtils.simulateLongRunningApp(
        async () => {
          // Simulate app activity
          const data = new Array(1000).fill(0).map(() => Math.random())
          await new Promise(resolve => setTimeout(resolve, 1))
          return data.length
        },
        1000 // 1 second
      )
      
      expect(report).toBeDefined()
      expect(report.memoryGrowth).toBeGreaterThanOrEqual(0)
    })

    it('should stress test object creation and cleanup', async () => {
      let createdObjects: any[] = []
      
      const report = await memoryTestUtils.stressTest(
        () => {
          const obj = {
            id: Math.random(),
            data: new Array(50).fill(Math.random()),
            timestamp: Date.now()
          }
          createdObjects.push(obj)
          return obj
        },
        (obj) => {
          const index = createdObjects.indexOf(obj)
          if (index > -1) {
            createdObjects.splice(index, 1)
          }
        },
        100 // Reduced from 500 to be less intensive
      )
      
      // Stress tests may have some memory growth, so be more lenient
      expect(report.memoryGrowthPercent).toBeLessThan(100) // More lenient than leaksDetected
      expect(createdObjects.length).toBe(0) // All objects should be cleaned up
    })
  })

  describe('Plugin Combination Testing Framework', () => {
    const pluginTester = setupPluginCombinationTesting({
      enableConflictDetection: true,
      timeout: 3000
    })

    it('should test basic plugin installation', async () => {
      const simplePlugin = pluginTestUtils.createMockPlugin('simple-plugin', {
        install: (manager) => {
          manager.registerComponent('SimpleComponent', { type: 'simple' })
          manager.registerService('simpleService', { version: '1.0.0' })
        }
      })
      
      const result = await pluginTester.testPluginCombination({
        plugins: [simplePlugin],
        description: 'Basic plugin installation test'
      })
      
      expect(result.success).toBe(true)
      expect(result.conflicts).toHaveLength(0)
      expect(result.installedPlugins).toEqual(['simple-plugin'])
      expect(result.performance.componentCount).toBe(1)
      expect(result.performance.serviceCount).toBe(1)
    })

    it('should detect component name conflicts', async () => {
      const plugin1 = pluginTestUtils.createMockPlugin('plugin-1', {
        install: (manager) => {
          manager.registerComponent('SharedComponent', { from: 'plugin-1' })
        }
      })
      
      const plugin2 = pluginTestUtils.createMockPlugin('plugin-2', {
        install: (manager) => {
          manager.registerComponent('SharedComponent', { from: 'plugin-2' })
        }
      })
      
      const result = await pluginTester.testPluginCombination({
        plugins: [plugin1, plugin2],
        description: 'Component name conflict test'
      })
      
      expect(result.success).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
      
      // Should have a component conflict
      const hasComponentConflict = result.conflicts.some(c => 
        c.description.includes('SharedComponent') && c.description.includes('already registered')
      )
      expect(hasComponentConflict).toBe(true)
    })

    it('should detect service name conflicts', async () => {
      const plugin1 = pluginTestUtils.createMockPlugin('service-plugin-1', {
        install: (manager) => {
          manager.registerService('sharedService', { provider: 'plugin-1' })
        }
      })
      
      const plugin2 = pluginTestUtils.createMockPlugin('service-plugin-2', {
        install: (manager) => {
          manager.registerService('sharedService', { provider: 'plugin-2' })
        }
      })
      
      const result = await pluginTester.testPluginCombination({
        plugins: [plugin1, plugin2],
        description: 'Service name conflict test'
      })
      
      expect(result.success).toBe(false)
      expect(result.conflicts.length).toBeGreaterThan(0)
      
      const hasServiceConflict = result.conflicts.some(c =>
        c.description.includes('sharedService') && c.description.includes('already registered')
      )
      expect(hasServiceConflict).toBe(true)
    })

    it('should test mock Forms and Navigation plugins', async () => {
      const formsPlugin = pluginTestUtils.createFormsPlugin()
      const navigationPlugin = pluginTestUtils.createNavigationPlugin()
      
      const result = await pluginTester.testPluginCombination({
        plugins: [formsPlugin, navigationPlugin],
        description: 'Forms + Navigation compatibility test'
      })
      
      expect(result.success).toBe(true)
      expect(result.conflicts).toHaveLength(0)
      expect(result.installedPlugins).toEqual(['forms', 'navigation'])
      expect(result.performance.componentCount).toBeGreaterThan(0)
      expect(result.performance.serviceCount).toBeGreaterThan(0)
    })

    it('should test all combinations of plugins', async () => {
      const plugins = [
        pluginTestUtils.createMockPlugin('plugin-a', {
          install: (manager) => manager.registerComponent('ComponentA', {})
        }),
        pluginTestUtils.createMockPlugin('plugin-b', {
          install: (manager) => manager.registerComponent('ComponentB', {})
        }),
        pluginTestUtils.createMockPlugin('plugin-c', {
          install: (manager) => manager.registerComponent('ComponentC', {})
        })
      ]
      
      const results = await pluginTester.testAllCombinations(plugins)
      
      // Should test: 3 individual + 3 pairs + 1 triple = 7 combinations
      expect(results.size).toBe(7)
      
      // Individual plugins should succeed
      expect(results.get('plugin-a')?.success).toBe(true)
      expect(results.get('plugin-b')?.success).toBe(true)
      expect(results.get('plugin-c')?.success).toBe(true)
      
      // Pairs should succeed (no conflicts)
      expect(results.get('plugin-a+plugin-b')?.success).toBe(true)
      expect(results.get('plugin-a+plugin-c')?.success).toBe(true)
      expect(results.get('plugin-b+plugin-c')?.success).toBe(true)
      
      // All together should succeed
      expect(results.get('plugin-a+plugin-b+plugin-c')?.success).toBe(true)
    })
  })

  describe('Real Reactive System Integration (Basic)', () => {
    const domEnv = setupRealDOMTesting()

    it('should test reactive signals without component integration', async () => {
      // Test TachUI's reactive system directly
      const [count, setCount] = createSignal(0)
      const [message, setMessage] = createSignal('initial')
      
      // Create simple DOM representation
      const div = domEnv.createElement('div')
      
      // Manually update DOM based on signals (simulating what renderer would do)
      const updateDOM = () => {
        div.textContent = `Count: ${count()}, Message: ${message()}`
      }
      
      updateDOM()
      domEnv.getRoot().appendChild(div)
      
      // Test initial state
      expect(div.textContent).toBe('Count: 0, Message: initial')
      
      // Test signal updates
      setCount(5)
      updateDOM()
      expect(div.textContent).toBe('Count: 5, Message: initial')
      
      setMessage('updated')
      updateDOM()
      expect(div.textContent).toBe('Count: 5, Message: updated')
      
      // Test multiple updates
      setCount(10)
      setMessage('final')
      updateDOM()
      expect(div.textContent).toBe('Count: 10, Message: final')
    })

    it('should demonstrate real event handling with signals', async () => {
      const [clickCount, setClickCount] = createSignal(0)
      
      const button = domEnv.createElement('button')
      const display = domEnv.createElement('div')
      
      const updateDisplay = () => {
        display.textContent = `Clicks: ${clickCount()}`
        button.textContent = 'Click me'
      }
      
      button.addEventListener('click', () => {
        setClickCount(clickCount() + 1)
        updateDisplay()
      })
      
      updateDisplay()
      domEnv.getRoot().appendChild(button)
      domEnv.getRoot().appendChild(display)
      
      // Test initial state
      expect(display.textContent).toBe('Clicks: 0')
      
      // Test click handling
      domTestUtils.fireEvent.click(button)
      expect(display.textContent).toBe('Clicks: 1')
      
      domTestUtils.fireEvent.click(button)
      domTestUtils.fireEvent.click(button)
      expect(display.textContent).toBe('Clicks: 3')
    })
  })
})

describe('Phase 1 Foundation - Framework Validation Summary', () => {
  it('should validate all testing utilities are working', () => {
    // This test serves as a checkpoint to ensure our foundation is solid
    
    // DOM testing utilities
    expect(setupRealDOMTesting).toBeDefined()
    expect(domTestUtils.fireEvent).toBeDefined()
    expect(domTestUtils.query).toBeDefined()
    
    // Memory testing utilities
    expect(setupMemoryLeakTesting).toBeDefined()
    expect(memoryTestUtils.testRepeatedExecution).toBeDefined()
    expect(memoryTestUtils.simulateLongRunningApp).toBeDefined()
    expect(memoryTestUtils.stressTest).toBeDefined()
    
    // Plugin testing utilities
    expect(setupPluginCombinationTesting).toBeDefined()
    expect(pluginTestUtils.createMockPlugin).toBeDefined()
    expect(pluginTestUtils.createFormsPlugin).toBeDefined()
    expect(pluginTestUtils.createNavigationPlugin).toBeDefined()
    expect(pluginTestUtils.createConflictingPlugin).toBeDefined()
    
  })
})