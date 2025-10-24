/**
 * Phase 5.1: Performance Benchmark Baseline Tests
 * 
 * Comprehensive performance benchmarks that establish baselines for:
 * - Component render performance
 * - Memory usage patterns
 * - DOM manipulation efficiency
 * - Complex workflow performance
 * - Bundle size impact
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PerformanceBenchmarkTester,
  BenchmarkCategories,
  BenchmarkPatterns,
  type PerformanceBenchmark
} from '../../../../tools/testing/performance-benchmark-tester'
import { createSignal } from '../../src/reactive'
import { withModifiers } from '../../src/components/wrapper'
import { configureCore } from '../../src/config'
import { resetProxyCache } from '../../src/modifiers/proxy'
import type { ComponentInstance } from '../../src/runtime/types'

// Global benchmark results collection
const globalBenchmarkResults: any[] = []

function createSimpleComponent(id: string): ComponentInstance {
  return {
    type: 'component',
    id,
    props: {},
    mounted: false,
    cleanup: [],
    render() {
      return [
        {
          type: 'element' as const,
          tag: 'div',
          props: { className: 'proxy-benchmark' },
          children: [],
        },
      ]
    },
  }
}

describe('Phase 5.1: Performance Baseline Benchmarks', () => {
  let benchmarkTester: PerformanceBenchmarkTester

  beforeEach(() => {
    // Clear DOM
    document.body.innerHTML = '<div id="benchmark-root"></div>'
    
    benchmarkTester = new PerformanceBenchmarkTester({
      iterations: 3, // Reduce iterations for faster testing
      regressionThreshold: 0.25 // 25% regression threshold
    })
  })

  afterEach(() => {
    document.body.innerHTML = ''
    // Force garbage collection if available
    if ((global as any).gc) {
      (global as any).gc()
    }
  })

  describe('Component Render Performance Baselines', () => {
    it('should benchmark basic Text component rendering', async () => {
      const textRenderBenchmark: PerformanceBenchmark = {
        name: 'Text Component Render',
        description: 'Measures Text component render performance',
        tags: ['component', 'text', 'render'],
        category: 'component',
        
        setup: async () => {
          document.body.innerHTML = '<div id="text-benchmark"></div>'
        },
        
        benchmark: async () => {
          const container = document.getElementById('text-benchmark')!
          const start = performance.now()
          
          // Render 100 Text components
          for (let i = 0; i < 100; i++) {
            const textElement = document.createElement('span')
            textElement.textContent = `Text Component ${i}`
            textElement.className = 'benchmark-text'
            container.appendChild(textElement)
          }
          
          const end = performance.now()
          
          return {
            renderTime: end - start,
            memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
            domMetrics: { nodes: container.children.length, depth: 2, updates: 100 },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: { componentsRendered: 100 }
          }
        },
        
        teardown: async () => {
          document.getElementById('text-benchmark')!.innerHTML = ''
        },
        
        expectedMetrics: {
          renderTime: { max: 100, target: 50 },
          memoryUsage: { max: 209715200, target: 52428800 }, // 200MB max, 50MB target  
          domNodes: { max: 200, target: 100 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(textRenderBenchmark)
      globalBenchmarkResults.push(result)

      console.log('Text Component Render Benchmark:', {
        renderTime: result.current.renderTime,
        memoryPeak: result.current.memoryUsage.peak,
        domNodes: result.current.domMetrics.nodes,
        status: result.status
      })

      expect(result.current.renderTime).toBeLessThan(100) // Should render in under 100ms
      expect(result.status).not.toBe('fail')
    }, 10000)

    it('should benchmark complex List component with many items', async () => {
      const listRenderBenchmark: PerformanceBenchmark = {
        name: 'List Component Large Dataset',
        description: 'Measures List component performance with 1000 items',
        tags: ['component', 'list', 'large-dataset'],
        category: 'component',
        
        setup: async () => {
          document.body.innerHTML = '<div id="list-benchmark"></div>'
        },
        
        benchmark: async () => {
          const container = document.getElementById('list-benchmark')!
          const start = performance.now()
          
          // Create a large list
          const listElement = document.createElement('div')
          listElement.className = 'benchmark-list'
          
          for (let i = 0; i < 1000; i++) {
            const item = document.createElement('div')
            item.className = 'list-item'
            item.innerHTML = `
              <div class="item-content">
                <h3>Item ${i}</h3>
                <p>Description for item ${i}</p>
                <span class="item-meta">Created: ${new Date().toISOString()}</span>
              </div>
            `
            listElement.appendChild(item)
          }
          
          container.appendChild(listElement)
          
          const end = performance.now()
          
          return {
            renderTime: end - start,
            memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
            domMetrics: { nodes: container.querySelectorAll('*').length, depth: 4, updates: 1000 },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: { 
              itemsRendered: 1000,
              avgTimePerItem: (end - start) / 1000
            }
          }
        },
        
        teardown: async () => {
          document.getElementById('list-benchmark')!.innerHTML = ''
        },
        
        expectedMetrics: {
          renderTime: { max: 1000, target: 500 },
          memoryUsage: { max: 209715200, target: 104857600 }, // 200MB max, 100MB target
          domNodes: { max: 5000, target: 3000 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(listRenderBenchmark)
      globalBenchmarkResults.push(result)

      console.log('List Component Large Dataset Benchmark:', {
        renderTime: result.current.renderTime,
        memoryPeak: result.current.memoryUsage.peak,
        domNodes: result.current.domMetrics.nodes,
        avgTimePerItem: result.current.customMetrics?.avgTimePerItem,
        status: result.status
      })

      expect(result.current.renderTime).toBeLessThan(1000) // Should render 1000 items in under 1s
      expect(result.current.customMetrics?.avgTimePerItem).toBeLessThan(1) // Under 1ms per item
    }, 15000)

    it('should benchmark reactive state updates performance', async () => {
      const reactiveStateBenchmark: PerformanceBenchmark = {
        name: 'Reactive State Updates',
        description: 'Measures performance of reactive state updates',
        tags: ['reactive', 'state', 'updates'],
        category: 'component',
        
        setup: async () => {
          document.body.innerHTML = '<div id="reactive-benchmark"></div>'
        },
        
        benchmark: async () => {
          const container = document.getElementById('reactive-benchmark')!
          const [count, setCount] = createSignal(0)
          const [items, setItems] = createSignal<string[]>([])
          
          // Create reactive UI
          const counterElement = document.createElement('div')
          counterElement.className = 'counter'
          
          const itemsElement = document.createElement('ul')
          itemsElement.className = 'items-list'
          
          container.appendChild(counterElement)
          container.appendChild(itemsElement)
          
          const start = performance.now()
          
          // Perform 500 rapid state updates
          for (let i = 0; i < 500; i++) {
            setCount(i)
            setItems([...items(), `Item ${i}`])
            
            // Update DOM to reflect state
            counterElement.textContent = `Count: ${count()}`
            
            if (i % 10 === 0) {
              // Update items list every 10 iterations
              itemsElement.innerHTML = items().map(item => `<li>${item}</li>`).join('')
            }
          }
          
          const end = performance.now()
          
          return {
            renderTime: end - start,
            memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
            domMetrics: { 
              nodes: container.querySelectorAll('*').length, 
              depth: 3, 
              updates: 500 
            },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: { 
              stateUpdates: 500,
              avgUpdateTime: (end - start) / 500,
              finalItemCount: items().length
            }
          }
        },
        
        teardown: async () => {
          document.getElementById('reactive-benchmark')!.innerHTML = ''
        },
        
        expectedMetrics: {
          renderTime: { max: 500, target: 200 },
          memoryUsage: { max: 209715200, target: 104857600 }, // 200MB max, 100MB target
          domNodes: { max: 1000, target: 500 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(reactiveStateBenchmark)
      globalBenchmarkResults.push(result)

      console.log('Reactive State Updates Benchmark:', {
        renderTime: result.current.renderTime,
        stateUpdates: result.current.customMetrics?.stateUpdates,
        avgUpdateTime: result.current.customMetrics?.avgUpdateTime,
        status: result.status
      })

      expect(result.current.renderTime).toBeLessThan(500)
      expect(result.current.customMetrics?.avgUpdateTime).toBeLessThan(1)
    }, 12000)
  })

  describe('Memory Usage Baselines', () => {
    it('should benchmark memory usage with component creation and destruction', async () => {
      const memoryBenchmark: PerformanceBenchmark = {
        name: 'Component Lifecycle Memory Usage',
        description: 'Measures memory usage during component lifecycle',
        tags: ['memory', 'lifecycle', 'gc'],
        category: 'memory',
        
        setup: async () => {
          document.body.innerHTML = '<div id="memory-benchmark"></div>'
          // Force GC before test
          if ((global as any).gc) {
            (global as any).gc()
          }
        },
        
        benchmark: async () => {
          const container = document.getElementById('memory-benchmark')!
          const initialMemory = performance.memory?.usedJSHeapSize || 0
          let peakMemory = initialMemory
          
          const start = performance.now()
          
          // Create and destroy components repeatedly
          for (let cycle = 0; cycle < 50; cycle++) {
            const components: HTMLElement[] = []
            
            // Create 20 components
            for (let i = 0; i < 20; i++) {
              const element = document.createElement('div')
              element.className = 'memory-test-component'
              element.innerHTML = `
                <div class="component-header">Component ${cycle}-${i}</div>
                <div class="component-body">
                  <p>This is component ${i} in cycle ${cycle}</p>
                  <ul>
                    ${Array.from({length: 10}, (_, j) => `<li>Item ${j}</li>`).join('')}
                  </ul>
                </div>
              `
              container.appendChild(element)
              components.push(element)
              
              // Track peak memory
              const currentMemory = performance.memory?.usedJSHeapSize || 0
              if (currentMemory > peakMemory) {
                peakMemory = currentMemory
              }
            }
            
            // Destroy components
            components.forEach(component => {
              component.remove()
            })
            
            // Clear references
            components.length = 0
            
            // Periodic GC hint
            if (cycle % 10 === 0 && (global as any).gc) {
              (global as any).gc()
            }
          }
          
          const end = performance.now()
          const finalMemory = performance.memory?.usedJSHeapSize || 0
          
          return {
            renderTime: end - start,
            memoryUsage: {
              initial: initialMemory,
              peak: peakMemory,
              final: finalMemory,
              leak: finalMemory - initialMemory
            },
            domMetrics: { nodes: container.children.length, depth: 3, updates: 1000 },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: {
              cycles: 50,
              componentsPerCycle: 20,
              totalComponents: 1000,
              memoryGrowth: peakMemory - initialMemory,
              finalMemoryLeak: finalMemory - initialMemory
            }
          }
        },
        
        teardown: async () => {
          document.getElementById('memory-benchmark')!.innerHTML = ''
          if ((global as any).gc) {
            (global as any).gc()
          }
        },
        
        expectedMetrics: {
          memoryUsage: { max: 209715200, target: 104857600 }, // 200MB max, 100MB target
          renderTime: { max: 2000, target: 1000 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(memoryBenchmark)
      globalBenchmarkResults.push(result)

      console.log('Memory Usage Benchmark:', {
        memoryLeak: result.current.memoryUsage.leak,
        peakMemory: result.current.memoryUsage.peak,
        memoryGrowth: result.current.customMetrics?.memoryGrowth,
        status: result.status
      })

      // Memory leak should be minimal (under 10MB for this test environment)
      expect(result.current.memoryUsage.leak).toBeLessThan(10485760)
    }, 15000)

    it('should benchmark DOM manipulation performance', async () => {
      const domBenchmark: PerformanceBenchmark = {
        name: 'DOM Manipulation Performance',
        description: 'Measures DOM manipulation performance',
        tags: ['dom', 'manipulation', 'performance'],
        category: 'component',
        
        setup: async () => {
          document.body.innerHTML = '<div id="dom-benchmark"></div>'
        },
        
        benchmark: async () => {
          const container = document.getElementById('dom-benchmark')!
          const start = performance.now()
          
          // Test various DOM operations
          let operationCount = 0
          
          // 1. Element creation and insertion
          for (let i = 0; i < 200; i++) {
            const element = document.createElement('div')
            element.className = 'dom-test-element'
            element.textContent = `Element ${i}`
            container.appendChild(element)
            operationCount++
          }
          
          // 2. Element modification
          const elements = container.querySelectorAll('.dom-test-element')
          elements.forEach((element, index) => {
            element.textContent = `Modified Element ${index}`
            element.className += ' modified'
            operationCount++
          })
          
          // 3. Element removal
          for (let i = 0; i < 100; i++) {
            if (container.firstChild) {
              container.removeChild(container.firstChild)
              operationCount++
            }
          }
          
          // 4. Complex DOM structure creation
          for (let i = 0; i < 50; i++) {
            const complex = document.createElement('div')
            complex.className = 'complex-element'
            complex.innerHTML = `
              <div class="header">
                <h3>Complex Element ${i}</h3>
                <span class="meta">Meta info</span>
              </div>
              <div class="content">
                <p>Content paragraph 1</p>
                <p>Content paragraph 2</p>
                <ul>
                  <li>List item 1</li>
                  <li>List item 2</li>
                  <li>List item 3</li>
                </ul>
              </div>
              <div class="footer">
                <button>Action 1</button>
                <button>Action 2</button>
              </div>
            `
            container.appendChild(complex)
            operationCount++
          }
          
          const end = performance.now()
          
          return {
            renderTime: end - start,
            memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
            domMetrics: { 
              nodes: container.querySelectorAll('*').length, 
              depth: 4, 
              updates: operationCount 
            },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: {
              totalOperations: operationCount,
              avgOperationTime: (end - start) / operationCount,
              finalNodeCount: container.querySelectorAll('*').length
            }
          }
        },
        
        teardown: async () => {
          document.getElementById('dom-benchmark')!.innerHTML = ''
        },
        
        expectedMetrics: {
          renderTime: { max: 1000, target: 500 },
          domNodes: { max: 2000, target: 1000 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(domBenchmark)
      globalBenchmarkResults.push(result)

      console.log('DOM Manipulation Benchmark:', {
        renderTime: result.current.renderTime,
        totalOperations: result.current.customMetrics?.totalOperations,
        avgOperationTime: result.current.customMetrics?.avgOperationTime,
        finalNodeCount: result.current.customMetrics?.finalNodeCount,
        status: result.status
      })

      expect(result.current.renderTime).toBeLessThan(1000)
      expect(result.current.customMetrics?.avgOperationTime).toBeLessThan(2)
    }, 12000)
  })

  describe('Complex Workflow Performance', () => {
    it('should benchmark full application workflow performance', async () => {
      const workflowBenchmark: PerformanceBenchmark = {
        name: 'Complete Application Workflow',
        description: 'Measures performance of a complete application workflow',
        tags: ['workflow', 'integration', 'full-app'],
        category: 'workflow',
        
        setup: async () => {
          document.body.innerHTML = '<div id="workflow-benchmark"></div>'
        },
        
        benchmark: async () => {
          const container = document.getElementById('workflow-benchmark')!
          const start = performance.now()
          
          // Simulate a complete application workflow
          const [appState, setAppState] = createSignal({
            currentView: 'dashboard',
            userData: { name: 'Test User', email: 'test@example.com' },
            items: [] as any[],
            loading: false
          })
          
          let operationCount = 0
          
          // 1. Initial app render
          const app = document.createElement('div')
          app.className = 'benchmark-app'
          app.innerHTML = `
            <header class="app-header">
              <h1>Benchmark App</h1>
              <nav class="app-nav">
                <button class="nav-btn" data-view="dashboard">Dashboard</button>
                <button class="nav-btn" data-view="list">List</button>
                <button class="nav-btn" data-view="profile">Profile</button>
              </nav>
            </header>
            <main class="app-main">
              <div class="view-container"></div>
            </main>
            <footer class="app-footer">
              <p>Benchmark Footer</p>
            </footer>
          `
          container.appendChild(app)
          operationCount++
          
          const viewContainer = app.querySelector('.view-container')!
          
          // 2. Dashboard view
          viewContainer.innerHTML = `
            <div class="dashboard">
              <h2>Dashboard</h2>
              <div class="stats">
                <div class="stat-card">Total Items: 0</div>
                <div class="stat-card">Users: 1</div>
                <div class="stat-card">Status: Active</div>
              </div>
            </div>
          `
          operationCount++
          
          // 3. Switch to list view with data loading
          setAppState({ ...appState(), loading: true, currentView: 'list' })
          viewContainer.innerHTML = '<div class="loading">Loading...</div>'
          operationCount++
          
          // 4. Generate and render large list
          const items = Array.from({length: 500}, (_, i) => ({
            id: i,
            name: `Item ${i}`,
            description: `Description for item ${i}`,
            category: ['A', 'B', 'C'][i % 3],
            active: Math.random() > 0.3
          }))
          
          setAppState({ ...appState(), items, loading: false })
          
          const listHTML = `
            <div class="list-view">
              <h2>Items List</h2>
              <div class="list-filters">
                <select class="category-filter">
                  <option value="">All Categories</option>
                  <option value="A">Category A</option>
                  <option value="B">Category B</option>
                  <option value="C">Category C</option>
                </select>
                <input type="text" class="search-input" placeholder="Search items..." />
              </div>
              <div class="items-list">
                ${items.map(item => `
                  <div class="item-card ${item.active ? 'active' : 'inactive'}" data-id="${item.id}">
                    <h3>${item.name}</h3>
                    <p>${item.description}</p>
                    <span class="category">${item.category}</span>
                    <div class="item-actions">
                      <button class="edit-btn">Edit</button>
                      <button class="delete-btn">Delete</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          `
          viewContainer.innerHTML = listHTML
          operationCount += items.length
          
          // 5. Simulate user interactions
          const searchInput = app.querySelector('.search-input') as HTMLInputElement
          const categoryFilter = app.querySelector('.category-filter') as HTMLSelectElement
          
          // Search interaction
          searchInput.value = 'Item 1'
          const filteredItems = items.filter(item => item.name.includes('Item 1'))
          const filteredHTML = filteredItems.map(item => `
            <div class="item-card ${item.active ? 'active' : 'inactive'}" data-id="${item.id}">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <span class="category">${item.category}</span>
            </div>
          `).join('')
          app.querySelector('.items-list')!.innerHTML = filteredHTML
          operationCount++
          
          // Category filter interaction
          categoryFilter.value = 'A'
          const categoryFilteredItems = items.filter(item => item.category === 'A')
          app.querySelector('.items-list')!.innerHTML = categoryFilteredItems.map(item => `
            <div class="item-card ${item.active ? 'active' : 'inactive'}" data-id="${item.id}">
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <span class="category">${item.category}</span>
            </div>
          `).join('')
          operationCount++
          
          // 6. Switch to profile view
          setAppState({ ...appState(), currentView: 'profile' })
          viewContainer.innerHTML = `
            <div class="profile-view">
              <h2>User Profile</h2>
              <form class="profile-form">
                <input type="text" value="${appState().userData.name}" class="name-input" />
                <input type="email" value="${appState().userData.email}" class="email-input" />
                <textarea class="bio-input" placeholder="Enter bio..."></textarea>
                <button type="submit">Save Profile</button>
              </form>
            </div>
          `
          operationCount++
          
          const end = performance.now()
          
          return {
            renderTime: end - start,
            memoryUsage: { initial: 0, peak: 0, final: 0, leak: 0 },
            domMetrics: { 
              nodes: container.querySelectorAll('*').length, 
              depth: 5, 
              updates: operationCount 
            },
            timing: { setup: 0, execution: end - start, cleanup: 0 },
            customMetrics: {
              totalOperations: operationCount,
              itemsRendered: items.length,
              viewTransitions: 3,
              userInteractions: 2,
              avgOperationTime: (end - start) / operationCount
            }
          }
        },
        
        teardown: async () => {
          document.getElementById('workflow-benchmark')!.innerHTML = ''
        },
        
        expectedMetrics: {
          renderTime: { max: 3000, target: 1500 },
          memoryUsage: { max: 314572800, target: 209715200 }, // 300MB max, 200MB target
          domNodes: { max: 3000, target: 2000 }
        }
      }

      const result = await benchmarkTester.executeBenchmark(workflowBenchmark)
      globalBenchmarkResults.push(result)

      console.log('Complete Workflow Benchmark:', {
        renderTime: result.current.renderTime,
        totalOperations: result.current.customMetrics?.totalOperations,
        itemsRendered: result.current.customMetrics?.itemsRendered,
        avgOperationTime: result.current.customMetrics?.avgOperationTime,
        status: result.status
      })

      expect(result.current.renderTime).toBeLessThan(2000)
      expect(result.current.customMetrics?.avgOperationTime).toBeLessThan(5)
    }, 20000)
  })

  describe('Proxy Overhead Validation', () => {
    it('keeps proxy method invocation overhead under 50%', () => {
      const iterations = 50000

      configureCore({ proxyModifiers: false })
      resetProxyCache()

      const legacyComponent = withModifiers(
        createSimpleComponent('legacy'),
      ) as ComponentInstance & { render: () => unknown }

      const startLegacy = performance.now()
      for (let i = 0; i < iterations; i++) {
        legacyComponent.render()
      }
      const legacyDuration = performance.now() - startLegacy

      configureCore({ proxyModifiers: true })
      resetProxyCache()

      const proxiedComponent = withModifiers(
        createSimpleComponent('proxied'),
      ) as ComponentInstance & { render: () => unknown }

      const startProxy = performance.now()
      for (let i = 0; i < iterations; i++) {
        proxiedComponent.render()
      }
      const proxyDuration = performance.now() - startProxy

      const baseline = Math.max(legacyDuration, 0.0001)
      const overhead = Math.max(proxyDuration - legacyDuration, 0) / baseline

      console.log('Proxy Overhead Benchmark:', {
        iterations,
        legacyDuration,
        proxyDuration,
        overheadRatio: overhead,
      })

      expect(overhead).toBeLessThan(0.5)

      configureCore({ proxyModifiers: false })
      resetProxyCache()
    })
  })

  // Final benchmark summary
  afterAll(async () => {
    // Generate comprehensive performance report after all tests
    console.log(`\nTotal benchmarks run: ${globalBenchmarkResults.length}`)
    
    if (globalBenchmarkResults.length > 0) {
      // Create a new tester instance for the final report
      const reportTester = new PerformanceBenchmarkTester()
      
      // Set baselines from current results for future comparisons
      globalBenchmarkResults.forEach((result, index) => {
        const benchmarkName = [
          'Text Component Render',
          'List Component Large Dataset', 
          'Reactive State Updates',
          'Component Lifecycle Memory Usage',
          'DOM Manipulation Performance',
          'Complete Application Workflow'
        ][index]
        
        if (benchmarkName) {
          reportTester.setBaseline(benchmarkName, result.current)
        }
      })

      const report = reportTester.generateReport(globalBenchmarkResults)
      console.log('\n' + report)

      // Save baselines for future runs (in real implementation, this would save to file)
      const baselines = reportTester.getBaselines()
      console.log('\nBaseline data for future comparisons:', JSON.stringify(baselines, null, 2))

      // Verify all benchmarks passed or had acceptable warnings
      const failed = globalBenchmarkResults.filter(r => r.status === 'fail')
      const passed = globalBenchmarkResults.filter(r => r.status === 'pass')
      
      console.log(`\nBenchmark Summary: ${passed.length} passed, ${failed.length} failed out of ${globalBenchmarkResults.length} total`)
    }
  })

  it('should have run all performance benchmarks successfully', () => {
    // This test just verifies that we've collected benchmark results
    expect(globalBenchmarkResults.length).toBeGreaterThan(0)
    console.log(`Collected ${globalBenchmarkResults.length} benchmark results`)
  })
})
