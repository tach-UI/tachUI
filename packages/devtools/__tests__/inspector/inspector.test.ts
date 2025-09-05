/**
 * Tests for the component inspector system
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Mock createSignal before importing DevTools
vi.mock('@tachui/core', () => ({
  createSignal: vi.fn((initial: any) => {
    let value = initial
    const getter = () => {
      // Handle arrays specially
      if (Array.isArray(value)) {
        return [...value]
      }
      return value
    }
    const setter = (newValue: any) => {
      value = newValue
    }
    getter.peek = () => value
    return [getter, setter]
  }),
}))

import {
  DevTools,
  globalDevTools,
  enableDevelopmentMode,
  getComponentTree,
  type ComponentTreeNode,
  type DebugEvent,
} from '../../src/inspector'

describe('Component Inspector', () => {
  let devTools: DevTools

  beforeEach(() => {
    devTools = DevTools.getInstance()
    devTools.configure({ autoEnable: false })
  })

  afterEach(() => {
    devTools.disable()
    devTools.clear()
  })

  describe('DevTools initialization', () => {
    it('should create singleton instance', () => {
      const instance1 = DevTools.getInstance()
      const instance2 = DevTools.getInstance()
      expect(instance1).toBe(instance2)
    })

    it('should start disabled by default', () => {
      expect(devTools.isEnabled()).toBe(false)
    })

    it('should accept configuration', () => {
      devTools.configure({
        autoEnable: false,
        trackAllComponents: false,
        enableWarnings: false,
      })

      expect(devTools.isEnabled()).toBe(false)
    })
  })

  describe('enable/disable functionality', () => {
    it('should enable dev tools', () => {
      devTools.enable()
      expect(devTools.isEnabled()).toBe(true)
    })

    it('should disable dev tools', () => {
      devTools.enable()
      expect(devTools.isEnabled()).toBe(true)

      devTools.disable()
      expect(devTools.isEnabled()).toBe(false)
    })

    it('should enable with configuration', () => {
      devTools.configure({
        autoEnable: true,
        trackAllComponents: true,
        enableWarnings: true,
      })

      expect(devTools.isEnabled()).toBe(true)
    })
  })

  describe('component registration', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should register component instances', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      const tree = devTools.getComponentTree()
      expect(tree.has('button-1')).toBe(true)

      const node = tree.get('button-1')
      expect(node?.name).toBe('Button')
      expect(node?.type).toBe('Button')
      expect(node?.props).toEqual({ children: 'Click me' })
    })

    it('should handle parent-child relationships', () => {
      const parentComponent = {
        type: 'VStack',
        props: { children: [] },
        id: 'vstack-1',
      }

      const childComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('vstack-1', parentComponent as any)
      devTools.registerComponent('button-1', childComponent as any, 'vstack-1')

      const tree = devTools.getComponentTree()
      const parentNode = tree.get('vstack-1')
      const childNode = tree.get('button-1')

      expect(parentNode?.children).toContain(childNode)
      expect(childNode?.parent).toBe(parentNode)
      expect(childNode?.depth).toBe(1)
    })

    it('should not register components when disabled', () => {
      devTools.disable()

      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      const tree = devTools.getComponentTree()
      expect(tree.has('button-1')).toBe(false)
    })
  })

  describe('component unregistration', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should unregister component instances', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      expect(devTools.getComponentTree().has('button-1')).toBe(true)

      devTools.unregisterComponent('button-1')
      expect(devTools.getComponentTree().has('button-1')).toBe(false)
    })

    it('should handle parent-child unregistration', () => {
      const parentComponent = {
        type: 'VStack',
        props: { children: [] },
        id: 'vstack-1',
      }

      const childComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('vstack-1', parentComponent as any)
      devTools.registerComponent('button-1', childComponent as any, 'vstack-1')

      let tree = devTools.getComponentTree()
      expect(tree.has('vstack-1')).toBe(true)
      expect(tree.has('button-1')).toBe(true)

      devTools.unregisterComponent('button-1')

      // Get fresh tree reference after unregistration
      tree = devTools.getComponentTree()
      expect(tree.has('vstack-1')).toBe(true)
      expect(tree.has('button-1')).toBe(false)

      const parentNode = tree.get('vstack-1')
      expect(parentNode?.children).toHaveLength(0)
    })
  })

  describe('component updates', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should update component data', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      devTools.updateComponent('button-1', {
        renderCount: 5,
        lastRenderTime: 10.5,
      })

      const node = devTools.getComponent('button-1')
      expect(node?.renderCount).toBe(5)
      expect(node?.lastRenderTime).toBe(10.5)
    })

    it('should not update when disabled', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      devTools.disable()

      devTools.updateComponent('button-1', { renderCount: 5 })

      const node = devTools.getComponent('button-1')
      expect(node?.renderCount).toBe(0) // Should remain unchanged
    })
  })

  describe('component tree queries', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should get root components', () => {
      const rootComponent = {
        type: 'App',
        props: {},
        id: 'app-1',
      }

      const childComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('app-1', rootComponent as any)
      devTools.registerComponent('button-1', childComponent as any, 'app-1')

      const roots = devTools.getRootComponents()
      expect(roots).toHaveLength(1)
      expect(roots[0].id).toBe('app-1')
      expect(roots[0].parent).toBe(null)
    })

    it('should find components by name', () => {
      const button1 = {
        type: 'Button',
        props: { children: 'Button 1' },
        id: 'button-1',
      }

      const button2 = {
        type: 'Button',
        props: { children: 'Button 2' },
        id: 'button-2',
      }

      const textComponent = {
        type: 'Text',
        props: { children: 'Hello' },
        id: 'text-1',
      }

      devTools.registerComponent('button-1', button1 as any)
      devTools.registerComponent('button-2', button2 as any)
      devTools.registerComponent('text-1', textComponent as any)

      const buttons = devTools.findComponentsByName('Button')
      expect(buttons).toHaveLength(2)
      expect(buttons.map(b => b.id)).toEqual(['button-1', 'button-2'])

      const texts = devTools.findComponentsByName('Text')
      expect(texts).toHaveLength(1)
      expect(texts[0].id).toBe('text-1')
    })

    it('should get component by ID', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      const component = devTools.getComponent('button-1')
      expect(component?.id).toBe('button-1')
      expect(component?.name).toBe('Button')

      const nonExistent = devTools.getComponent('non-existent')
      expect(nonExistent).toBeUndefined()
    })
  })

  describe('debug events', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should track component mount events', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      const events = devTools.getDebugEvents()

      // Find the component mount event (not the DevTools enabled event)
      const mountEvent = events.find(
        e => e.type === 'component_mount' && e.componentId
      )

      expect(mountEvent).toBeDefined()
      expect(mountEvent?.componentId).toBe('button-1')
      expect(mountEvent?.componentName).toBe('Button')
      expect(mountEvent?.data.props).toEqual({ children: 'Click me' })
    })

    it('should track component unmount events', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      devTools.unregisterComponent('button-1')

      const events = devTools.getDebugEvents()
      const unmountEvent = events.find(e => e.type === 'component_unmount')

      expect(unmountEvent).toBeDefined()
      expect(unmountEvent?.componentId).toBe('button-1')
      expect(unmountEvent?.componentName).toBe('Button')
    })

    it('should limit debug events array size', () => {
      // Register many components to trigger event limit
      for (let i = 0; i < 1100; i++) {
        const mockComponent = {
          type: 'Button',
          props: { children: `Button ${i}` },
          id: `button-${i}`,
        }
        devTools.registerComponent(`button-${i}`, mockComponent as any)
      }

      const events = devTools.getDebugEvents()
      expect(events.length).toBeLessThanOrEqual(1000)
    })
  })

  describe('warnings and errors', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should add warnings to components', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      devTools.addWarning('button-1', 'Slow render detected')

      const node = devTools.getComponent('button-1')
      expect(node?.warnings).toContain('Slow render detected')
    })

    it('should add errors to components', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      devTools.addError('button-1', 'Component crashed')

      const node = devTools.getComponent('button-1')
      expect(node?.errors).toContain('Component crashed')
    })

    it('should not add warnings when disabled', () => {
      // First clear any existing data
      devTools.clear()

      // Then disable devTools
      devTools.disable()

      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      // Try to register component and add warning when disabled
      devTools.registerComponent('button-1', mockComponent as any)
      devTools.addWarning('button-1', 'Test warning')

      // Component should not be registered when disabled
      const node = devTools.getComponent('button-1')
      expect(node).toBeUndefined()
    })
  })

  describe('performance summary', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should calculate performance summary', () => {
      const component1 = {
        type: 'Button',
        props: { children: 'Button 1' },
        id: 'button-1',
      }

      const component2 = {
        type: 'Text',
        props: { children: 'Hello' },
        id: 'text-1',
      }

      devTools.registerComponent('button-1', component1 as any)
      devTools.registerComponent('text-1', component2 as any)

      // Update with some metrics
      devTools.updateComponent('button-1', {
        renderCount: 10,
        lastRenderTime: 5.5,
        memoryUsage: 1024,
      })

      devTools.updateComponent('text-1', {
        renderCount: 5,
        lastRenderTime: 2.1,
        memoryUsage: 512,
      })

      const summary = devTools.getPerformanceSummary()

      expect(summary.componentCount).toBe(2)
      expect(summary.averageRenderTime).toBeGreaterThan(0)
      expect(summary.memoryUsage).toBe(1536) // 1024 + 512
      expect(summary.warningCount).toBe(0)
      expect(summary.errorCount).toBe(0)
    })

    it('should identify slow components', () => {
      const slowComponent = {
        type: 'SlowComponent',
        props: {},
        id: 'slow-1',
      }

      devTools.registerComponent('slow-1', slowComponent as any)
      devTools.updateComponent('slow-1', {
        renderCount: 1,
        lastRenderTime: 20, // > 16ms threshold
        memoryUsage: 0,
      })

      const summary = devTools.getPerformanceSummary()
      expect(summary.slowComponents).toHaveLength(1)
      expect(summary.slowComponents[0].name).toBe('SlowComponent')
      expect(summary.slowComponents[0].renderTime).toBe(20)
    })
  })

  describe('data export', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should export debug data', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)

      const exportedData = devTools.exportDebugData()
      const parsed = JSON.parse(exportedData)

      expect(parsed).toHaveProperty('componentTree')
      expect(parsed).toHaveProperty('debugEvents')
      expect(parsed).toHaveProperty('timestamp')

      // componentTree is exported as Array.from(map.entries()), so it's an array of [key, value] pairs
      const componentTreeKeys = parsed.componentTree.map(
        ([key]: [string, any]) => key
      )
      expect(componentTreeKeys).toContain('button-1')
    })

    it('should clear all data', () => {
      const mockComponent = {
        type: 'Button',
        props: { children: 'Click me' },
        id: 'button-1',
      }

      devTools.registerComponent('button-1', mockComponent as any)
      expect(devTools.getComponentTree().size).toBeGreaterThan(0)
      expect(devTools.getDebugEvents().length).toBeGreaterThan(0)

      devTools.clear()

      expect(devTools.getComponentTree().size).toBe(0)
      expect(devTools.getDebugEvents().length).toBe(0)
    })
  })

  describe('global functions', () => {
    it('should enable development mode globally', () => {
      enableDevelopmentMode()
      expect(globalDevTools.isEnabled()).toBe(true)
    })

    it('should get component tree globally', () => {
      const tree = getComponentTree()
      expect(tree).toBeInstanceOf(Map)
    })
  })

  describe('reactive debugging', () => {
    beforeEach(() => {
      devTools.enable()
    })

    it('should track reactive operations', () => {
      devTools.trackReactiveOperation('signal', 'update', 'signal-1')

      const events = devTools.getDebugEvents()
      const reactiveEvent = events.find(e => e.type === 'reactive_update')

      expect(reactiveEvent).toBeDefined()
      expect(reactiveEvent?.data.type).toBe('signal')
      expect(reactiveEvent?.data.operation).toBe('update')
    })

    it('should track context changes', () => {
      devTools.trackContextChange('theme', 'dark', 'component-1')

      const events = devTools.getDebugEvents()
      const contextEvent = events.find(e => e.type === 'context_change')

      expect(contextEvent).toBeDefined()
      expect(contextEvent?.data.contextName).toBe('theme')
      expect(contextEvent?.data.newValue).toBe('dark')
    })
  })
})
