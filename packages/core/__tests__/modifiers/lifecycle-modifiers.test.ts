/**
 * Tests for Lifecycle Modifiers (Phase 6.1)
 *
 * Tests onAppear, onDisappear, task, and refreshable modifiers
 * that provide SwiftUI-compatible lifecycle functionality.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HTML, Text } from '@tachui/primitives'
import { LifecycleModifier } from '../../src/modifiers/base'
import { lifecycleModifiers } from '../../src/modifiers/presets'
import { createSignal } from '../../src/reactive'
import { onAppear, onDisappear } from '@tachui/viewport/modifiers'
import { refreshable } from '@tachui/mobile/modifiers'
import { applyModifiersToNode } from '../../src/modifiers'

// Mock IntersectionObserver
class MockIntersectionObserver {
  private callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
  }

  observe() {
    // Mock observe
  }

  disconnect() {
    // Mock disconnect
  }

  // Helper to trigger intersection
  triggerIntersection(isIntersecting: boolean) {
    const entry = {
      isIntersecting,
      target: document.createElement('div'),
      intersectionRatio: isIntersecting ? 1 : 0,
      boundingClientRect: {} as DOMRectReadOnly,
      intersectionRect: {} as DOMRectReadOnly,
      rootBounds: {} as DOMRectReadOnly,
      time: Date.now(),
    } as IntersectionObserverEntry

    this.callback([entry], this)
  }
}

// Mock DOM environment
function createMockElement(tagName: string = 'div'): HTMLElement {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {} as CSSStyleDeclaration,
    children: [] as HTMLElement[],
    parentElement: null as HTMLElement | null,
    appendChild: vi.fn(),
    removeChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(),
    textContent: '',
    id: `mock-${Math.random()}`,
  } as any

  return element
}

let mockObserver: MockIntersectionObserver

beforeEach(() => {
  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(callback => {
    mockObserver = new MockIntersectionObserver(callback)
    return mockObserver
  }) as any

  // Mock document
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => createMockElement(tagName)),
    querySelector: vi.fn(),
    head: {
      appendChild: vi.fn(),
    } as any,
  } as any
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('Lifecycle Modifiers (Phase 6.1)', () => {
  describe('onAppear Modifier', () => {
    it('should create onAppear modifier with correct properties', () => {
      const handler = vi.fn()
      const modifier = lifecycleModifiers.onAppear(handler)

      expect(modifier).toBeInstanceOf(LifecycleModifier)
      expect(modifier.type).toBe('lifecycle')
      expect(modifier.properties.onAppear).toBe(handler)
    })

    it('should call handler when element appears in viewport', () => {
      const handler = vi.fn()
      const element = createMockElement()

      const modifier = lifecycleModifiers.onAppear(handler)
      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      expect(global.IntersectionObserver).toHaveBeenCalled()

      // Simulate element appearing
      mockObserver.triggerIntersection(true)
      expect(handler).toHaveBeenCalled()
    })

    it.skip('should integrate with modifier builder', () => {
      const handler = vi.fn()
      const component = Text('Appearing text').fontSize(16).build()

      // Apply onAppear modifier manually since it's been moved to @tachui/viewport
      const onAppearModifier = onAppear(handler)
      expect(onAppearModifier).toBeDefined()
      expect(onAppearModifier.type).toBe('onAppear')
      expect(typeof onAppearModifier.apply).toBe('function')
    })
  })

  describe('onDisappear Modifier', () => {
    it('should create onDisappear modifier with correct properties', () => {
      const handler = vi.fn()
      const modifier = lifecycleModifiers.onDisappear(handler)

      expect(modifier).toBeInstanceOf(LifecycleModifier)
      expect(modifier.type).toBe('lifecycle')
      expect(modifier.properties.onDisappear).toBe(handler)
    })

    it('should call handler when element disappears from viewport', () => {
      const handler = vi.fn()
      const element = createMockElement()

      const modifier = lifecycleModifiers.onDisappear(handler)
      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      // Simulate element disappearing
      mockObserver.triggerIntersection(false)
      expect(handler).toHaveBeenCalled()
    })

    it.skip('should integrate with modifier builder', () => {
      const handler = vi.fn()
      const component = HTML.div({ children: 'Disappearing content' })
        .backgroundColor('#f0f0f0')
        .build()

      // Apply onDisappear modifier manually since it's been moved to @tachui/viewport
      const onDisappearModifier = onDisappear(handler)
      expect(onDisappearModifier).toBeDefined()
      expect(onDisappearModifier.type).toBe('onDisappear')
      expect(typeof onDisappearModifier.apply).toBe('function')
    })
  })

  describe('task Modifier', () => {
    it('should create task modifier with sync operation', () => {
      const operation = vi.fn()
      const modifier = lifecycleModifiers.task(operation)

      expect(modifier).toBeInstanceOf(LifecycleModifier)
      expect(modifier.type).toBe('lifecycle')
      expect(modifier.properties.task?.operation).toBe(operation)
      expect(modifier.properties.task?.priority).toBe('default')
    })

    it('should create task modifier with async operation and options', () => {
      const operation = vi.fn().mockResolvedValue(undefined)
      const modifier = lifecycleModifiers.task(operation, {
        id: 'test-task',
        priority: 'userInitiated',
      })

      expect(modifier.properties.task?.operation).toBe(operation)
      expect(modifier.properties.task?.id).toBe('test-task')
      expect(modifier.properties.task?.priority).toBe('userInitiated')
    })

    it('should execute task when applied', async () => {
      const operation = vi.fn().mockResolvedValue(undefined)
      const element = createMockElement()

      const modifier = lifecycleModifiers.task(operation)
      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      // Allow async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0))
      expect(operation).toHaveBeenCalled()
    })

    it.skip('should integrate with modifier builder', () => {
      const operation = vi.fn()
      const component = Text('Task component')
        .modifier.task(operation, { id: 'test-task', priority: 'background' })
        .padding(16)
        .build()

      const lifecycleModifier = component.modifiers.find(
        m => m.type === 'lifecycle'
      )
      expect(lifecycleModifier).toBeDefined()
      expect(lifecycleModifier?.properties.task?.operation).toBe(operation)
      expect(lifecycleModifier?.properties.task?.id).toBe('test-task')
      expect(lifecycleModifier?.properties.task?.priority).toBe('background')
    })

    it('should handle task priorities', () => {
      const priorities = [
        'background',
        'userInitiated',
        'utility',
        'default',
      ] as const

      priorities.forEach(priority => {
        const operation = vi.fn()
        const modifier = lifecycleModifiers.task(operation, { priority })

        expect(modifier.properties.task?.priority).toBe(priority)
      })
    })
  })

  describe('refreshable Modifier', () => {
    it('should create refreshable modifier with onRefresh handler', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      const modifier = lifecycleModifiers.refreshable(onRefresh)

      expect(modifier).toBeInstanceOf(LifecycleModifier)
      expect(modifier.type).toBe('lifecycle')
      expect(modifier.properties.refreshable?.onRefresh).toBe(onRefresh)
    })

    it('should create refreshable modifier with reactive isRefreshing signal', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      const [isRefreshing] = createSignal(false)

      const modifier = lifecycleModifiers.refreshable(onRefresh, isRefreshing)

      expect(modifier.properties.refreshable?.onRefresh).toBe(onRefresh)
      expect(modifier.properties.refreshable?.isRefreshing).toBe(isRefreshing)
    })

    it.skip('should integrate with modifier builder', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      const [isRefreshing] = createSignal(false)

      const component = HTML.div({ children: 'Refreshable content' })
        .backgroundColor('#ffffff')
        .padding(20)
        .build()

      // Apply refreshable modifier manually since it's been moved to @tachui/mobile
      const refreshableModifier = refreshable(onRefresh, isRefreshing)
      expect(refreshableModifier).toBeDefined()
      expect(refreshableModifier.type).toBe('refreshable')
      expect(typeof refreshableModifier.apply).toBe('function')
    })

    it.skip('should set up touch event listeners when applied', () => {
      const onRefresh = vi.fn().mockResolvedValue(undefined)
      const element = createMockElement()
      element.parentElement = createMockElement()

      const modifier = lifecycleModifiers.refreshable(onRefresh)
      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      // Verify touch event listeners were added
      expect(element.addEventListener).toHaveBeenCalledWith(
        'touchstart',
        expect.any(Function),
        {
          passive: false,
        }
      )
      expect(element.addEventListener).toHaveBeenCalledWith(
        'touchmove',
        expect.any(Function),
        {
          passive: false,
        }
      )
      expect(element.addEventListener).toHaveBeenCalledWith(
        'touchend',
        expect.any(Function)
      )
    })
  })

  describe('Combined Lifecycle Modifiers', () => {
    it.skip('should support multiple lifecycle modifiers on same component', () => {
      const onAppearHandler = vi.fn()
      const onDisappearHandler = vi.fn()
      const taskOperation = vi.fn()
      const onRefresh = vi.fn().mockResolvedValue(undefined)

      const component = HTML.div({ children: 'Multi-lifecycle component' })
        .modifier.onAppear(onAppearHandler)
        .onDisappear(onDisappearHandler)
        .task(taskOperation, { id: 'multi-task' })
        .refreshable(onRefresh)
        .backgroundColor('#f8f9fa')
        .padding(16)
        .build()

      const lifecycleModifiers = component.modifiers.filter(
        m => m.type === 'lifecycle'
      )
      expect(lifecycleModifiers).toHaveLength(4)

      // Verify each modifier has correct properties
      const appearModifier = lifecycleModifiers.find(m => m.properties.onAppear)
      const disappearModifier = lifecycleModifiers.find(
        m => m.properties.onDisappear
      )
      const taskModifier = lifecycleModifiers.find(m => m.properties.task)
      const refreshableModifier = lifecycleModifiers.find(
        m => m.properties.refreshable
      )

      expect(appearModifier?.properties.onAppear).toBe(onAppearHandler)
      expect(disappearModifier?.properties.onDisappear).toBe(onDisappearHandler)
      expect(taskModifier?.properties.task?.operation).toBe(taskOperation)
      expect(refreshableModifier?.properties.refreshable?.onRefresh).toBe(
        onRefresh
      )
    })

    it.skip('should work with other modifier types', () => {
      const onAppearHandler = vi.fn()

      const component = Text('Complex component')
        .modifier.onAppear(onAppearHandler)
        .fontSize(18)
        .fontWeight('bold')
        .backgroundColor('#007AFF')
        .foregroundColor('#ffffff')
        .padding(12)
        .cornerRadius(8)
        .onTap(() => console.log('Tapped!'))
        .transition('all', 200)
        .build()

      const modifierTypes = component.modifiers.map(m => m.type)
      expect(modifierTypes).toContain('lifecycle')
      expect(modifierTypes).toContain('appearance')
      expect(modifierTypes).toContain('padding')
      expect(modifierTypes).toContain('interaction')
      expect(modifierTypes).toContain('transition')
    })
  })

  describe('SwiftUI Compatibility', () => {
    it.skip('should match SwiftUI onAppear behavior patterns', () => {
      // SwiftUI: .onAppear { /* action */ }
      const onAppearAction = vi.fn()

      const component = Text('SwiftUI-style onAppear')
        .modifier.onAppear(onAppearAction)
        .build()

      const lifecycleModifier = component.modifiers.find(
        m => m.type === 'lifecycle'
      )
      expect(lifecycleModifier?.properties.onAppear).toBe(onAppearAction)
    })

    it.skip('should match SwiftUI task behavior patterns', () => {
      // SwiftUI: .task { await someAsyncOperation() }
      const asyncOperation = vi.fn().mockResolvedValue(undefined)

      const component = HTML.div({ children: 'Async task component' })
        .modifier.task(asyncOperation, { priority: 'userInitiated' })
        .build()

      const lifecycleModifier = component.modifiers.find(
        m => m.type === 'lifecycle'
      )
      expect(lifecycleModifier?.properties.task?.operation).toBe(asyncOperation)
      expect(lifecycleModifier?.properties.task?.priority).toBe('userInitiated')
    })

    it.skip('should match SwiftUI refreshable behavior patterns', () => {
      // SwiftUI: .refreshable { await refresh() }
      const refreshOperation = vi.fn().mockResolvedValue(undefined)

      const component = HTML.div({ children: 'Refreshable content' })
        .modifier.refreshable(refreshOperation)
        .build()

      const lifecycleModifier = component.modifiers.find(
        m => m.type === 'lifecycle'
      )
      expect(lifecycleModifier?.properties.refreshable?.onRefresh).toBe(
        refreshOperation
      )
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined element gracefully', () => {
      const handler = vi.fn()
      const modifier = lifecycleModifiers.onAppear(handler)

      // Should not throw when element is undefined
      expect(() => {
        modifier.apply(
          { type: 'element', tag: 'div', props: {} },
          {
            componentId: 'test-comp',
            element: undefined as any,
            phase: 'creation',
          }
        )
      }).not.toThrow()
    })

    it('should handle task errors gracefully', async () => {
      const errorOperation = vi.fn().mockRejectedValue(new Error('Task failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const element = createMockElement()
      const modifier = lifecycleModifiers.task(errorOperation)

      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      // Allow async operation to complete
      await new Promise(resolve => setTimeout(resolve, 0))

      expect(errorOperation).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith(
        'TachUI Task Error:',
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })

    it('should handle refresh errors gracefully', async () => {
      const errorRefresh = vi
        .fn()
        .mockRejectedValue(new Error('Refresh failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const element = createMockElement()
      element.parentElement = createMockElement()

      const modifier = lifecycleModifiers.refreshable(errorRefresh)
      modifier.apply(
        { type: 'element', tag: 'div', props: {} },
        {
          componentId: 'test-comp',
          element,
          phase: 'creation',
        }
      )

      // Should not throw during setup
      expect(consoleSpy).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })
})
