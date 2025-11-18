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
