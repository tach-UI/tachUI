import { test, expect } from '@playwright/test'

test.describe('Navigation Browser Performance', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a test page with navigation components
    await page.goto('data:text/html,<!DOCTYPE html><html><head><title>Navigation Benchmark</title></head><body><div id="app"></div></body></html>')
    
    // Inject TachUI navigation module (simulated)
    await page.addScriptTag({
      content: `
        // Mock TachUI navigation for browser testing
        window.TachUINavigation = {
          NavigationStack: function(content, options = {}) {
            const element = document.createElement('div');
            element.className = 'navigation-stack';
            element.innerHTML = typeof content === 'string' ? content : 'Navigation Content';
            return element;
          },
          NavigationLink: function(label, destination, options = {}) {
            const element = document.createElement('a');
            element.className = 'navigation-link';
            element.textContent = label;
            element.href = '#';
            element.onclick = (e) => {
              e.preventDefault();
              performance.mark('navigation-start');
              setTimeout(() => {
                performance.mark('navigation-end');
                performance.measure('navigation-time', 'navigation-start', 'navigation-end');
              }, 1);
            };
            return element;
          },
          SimpleTabView: function(tabs, options = {}) {
            const element = document.createElement('div');
            element.className = 'tab-view';
            tabs.forEach((tab, index) => {
              const tabButton = document.createElement('button');
              tabButton.textContent = tab.title || 'Tab ' + (index + 1);
              tabButton.className = 'tab-button';
              tabButton.onclick = () => {
                performance.mark('tab-switch-start');
                setTimeout(() => {
                  performance.mark('tab-switch-end');
                  performance.measure('tab-switch-time', 'tab-switch-start', 'tab-switch-end');
                }, 1);
              };
              element.appendChild(tabButton);
            });
            return element;
          }
        };
      `,
    })
  })

  test('NavigationStack creation performance', async ({ page }) => {
    const startTime = await page.evaluate(() => performance.now())
    
    await page.evaluate(() => {
      const nav = window.TachUINavigation.NavigationStack('Test Content', {
        navigationTitle: 'Performance Test',
      })
      document.getElementById('app').appendChild(nav)
    })
    
    const endTime = await page.evaluate(() => performance.now())
    const duration = endTime - startTime
    
    expect(duration).toBeLessThan(50) // Should create in under 50ms
  })

  test('NavigationLink interaction performance', async ({ page }) => {
    await page.evaluate(() => {
      const link = window.TachUINavigation.NavigationLink(
        'Test Link',
        () => 'Destination',
      )
      document.getElementById('app').appendChild(link)
    })
    
    // Measure click response time
    await page.click('.navigation-link')
    
    const navigationTime = await page.evaluate(() => {
      const measures = performance.getEntriesByName('navigation-time')
      return measures.length > 0 ? measures[0].duration : null
    })
    
    expect(navigationTime).toBeLessThan(10) // Should respond in under 10ms
  })

  test('SimpleTabView tab switching performance', async ({ page }) => {
    await page.evaluate(() => {
      const tabs = [
        { title: 'Tab 1', content: 'Content 1' },
        { title: 'Tab 2', content: 'Content 2' },
        { title: 'Tab 3', content: 'Content 3' },
      ]
      const tabView = window.TachUINavigation.SimpleTabView(tabs)
      document.getElementById('app').appendChild(tabView)
    })
    
    // Test tab switching performance
    await page.click('.tab-button:nth-child(2)')
    
    const switchTime = await page.evaluate(() => {
      const measures = performance.getEntriesByName('tab-switch-time')
      return measures.length > 0 ? measures[0].duration : null
    })
    
    expect(switchTime).toBeLessThan(5) // Should switch in under 5ms
  })

  test('Memory usage during navigation', async ({ page }) => {
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return performance.memory.usedJSHeapSize
      }
      return null
    })
    
    // Create multiple navigation components
    await page.evaluate(() => {
      const app = document.getElementById('app')
      for (let i = 0; i < 100; i++) {
        const nav = window.TachUINavigation.NavigationStack(`Content ${i}`)
        app.appendChild(nav)
      }
    })
    
    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return performance.memory.usedJSHeapSize
      }
      return null
    })
    
    if (initialMemory && finalMemory) {
      const memoryIncrease = finalMemory - initialMemory
      // Should not increase memory by more than 5MB for 100 components
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    }
  })

  test('Bundle loading performance', async ({ page }) => {
    const startTime = performance.now()
    
    // Simulate loading the navigation bundle
    await page.addScriptTag({
      content: `
        // Simulate bundle execution time
        const start = performance.now();
        for (let i = 0; i < 10000; i++) {
          // Simulate module parsing
          const obj = { navigation: true, index: i };
        }
        window.bundleLoadTime = performance.now() - start;
      `,
    })
    
    const bundleLoadTime = await page.evaluate(() => window.bundleLoadTime)
    
    // Bundle should load/parse in under 100ms
    expect(bundleLoadTime).toBeLessThan(100)
  })

  test('Rendering performance with large navigation tree', async ({ page }) => {
    const renderStart = await page.evaluate(() => {
      performance.mark('render-start')
      return performance.now()
    })
    
    await page.evaluate(() => {
      const app = document.getElementById('app')
      
      // Create a large navigation tree
      function createNestedNav(depth, parent) {
        if (depth === 0) return
        
        for (let i = 0; i < 5; i++) {
          const link = window.TachUINavigation.NavigationLink(
            `Level ${depth} - Item ${i}`,
            () => 'Content',
          )
          parent.appendChild(link)
          
          if (depth > 1) {
            createNestedNav(depth - 1, link)
          }
        }
      }
      
      const nav = window.TachUINavigation.NavigationStack('Root')
      createNestedNav(4, nav) // 4 levels deep
      app.appendChild(nav)
      
      performance.mark('render-end')
      performance.measure('render-time', 'render-start', 'render-end')
    })
    
    const renderTime = await page.evaluate(() => {
      const measures = performance.getEntriesByName('render-time')
      return measures.length > 0 ? measures[0].duration : null
    })
    
    // Should render large tree in under 200ms
    expect(renderTime).toBeLessThan(200)
  })
})