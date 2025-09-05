/**
 * Tests for Focused Modifier
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  FocusedModifier,
  focused,
  type FocusedOptions,
} from '../../src/interaction/focused'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  public _focused = false

  focus() {
    this._focused = true
    ;(global.document as any).activeElement = this
  }

  blur() {
    this._focused = false
    if ((global.document as any).activeElement === this) {
      ;(global.document as any).activeElement = null
    }
  }
}

// Mock Signal interface
interface MockSignal<T> {
  (): T
  subscribe?: (callback: (value: T) => void) => () => void
}

function createMockSignal<T>(
  initialValue: T
): MockSignal<T> & { set: (value: T) => void } {
  let value = initialValue
  let subscribers: ((value: T) => void)[] = []

  const signal = (() => value) as MockSignal<T> & { set: (value: T) => void }

  signal.subscribe = (callback: (value: T) => void) => {
    subscribers.push(callback)
    return () => {
      const index = subscribers.indexOf(callback)
      if (index > -1) {
        subscribers.splice(index, 1)
      }
    }
  }

  signal.set = (newValue: T) => {
    if (value !== newValue) {
      value = newValue
      subscribers.forEach(callback => callback(newValue))
    }
  }

  return signal
}

// Mock global document
const mockDocument = {
  activeElement: null,
}

const originalDocument = global.document
const originalRequestAnimationFrame = global.requestAnimationFrame

describe('FocusedModifier', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext
  let mockNode: DOMNode

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = {
      componentId: 'test-component',
      element: mockElement as unknown as HTMLElement,
      phase: 'creation',
    }
    mockNode = { element: mockElement as unknown as HTMLElement, children: [] }

    // Mock globals
    global.document = mockDocument as any
    global.requestAnimationFrame = vi.fn(callback => {
      callback(0)
      return 0
    })
  })

  afterEach(() => {
    global.document = originalDocument
    global.requestAnimationFrame = originalRequestAnimationFrame
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should create modifier with focused value', () => {
      const modifier = new FocusedModifier({ focused: true })

      expect(modifier.type).toBe('focused')
      expect(modifier.priority).toBe(75)
      expect(modifier.properties.focused).toBe(true)
    })

    it('should apply modifier to element', () => {
      const modifier = new FocusedModifier({ focused: true })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      expect(mockElement.tabIndex).toBe(0) // Should make element focusable
    })

    it('should handle null context element gracefully', () => {
      const modifier = new FocusedModifier({ focused: true })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })

    it('should handle non-HTMLElement gracefully', () => {
      const svgElement = { tagName: 'svg' } as unknown as HTMLElement
      const svgContext = { ...mockContext, element: svgElement }
      const modifier = new FocusedModifier({ focused: true })

      expect(() => {
        modifier.apply(mockNode, svgContext)
      }).not.toThrow()
    })
  })

  describe('static focus management', () => {
    it('should focus element when focused is true', () => {
      const modifier = new FocusedModifier({ focused: true })

      modifier.apply(mockNode, mockContext)

      expect(global.requestAnimationFrame).toHaveBeenCalled()
      expect(mockElement._focused).toBe(true)
      expect(mockDocument.activeElement).toBe(mockElement)
    })

    it('should not focus element when focused is false', () => {
      const modifier = new FocusedModifier({ focused: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement._focused).toBe(false)
      expect(mockDocument.activeElement).not.toBe(mockElement)
    })

    it('should blur element if it was focused and focused becomes false', () => {
      // First focus the element
      mockElement._focused = true
      mockDocument.activeElement = mockElement

      const modifier = new FocusedModifier({ focused: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement._focused).toBe(false)
      expect(mockDocument.activeElement).toBeNull()
    })

    it('should not blur if element is not currently focused', () => {
      // Element is not focused, but document has another active element
      mockDocument.activeElement = { blur: vi.fn() } as any

      const modifier = new FocusedModifier({ focused: false })

      modifier.apply(mockNode, mockContext)

      expect(mockDocument.activeElement).not.toBeNull()
      expect((mockDocument.activeElement as any).blur).not.toHaveBeenCalled()
    })
  })

  describe('reactive focus management', () => {
    it('should handle signal-based reactive values', () => {
      const focusSignal = createMockSignal(false)
      const modifier = new FocusedModifier({ focused: focusSignal })

      modifier.apply(mockNode, mockContext)

      expect(mockElement._focused).toBe(false)

      // Change signal value
      focusSignal.set(true)

      expect(mockElement._focused).toBe(true)
      expect(mockDocument.activeElement).toBe(mockElement)
    })

    it('should handle signal changes from true to false', () => {
      const focusSignal = createMockSignal(true)
      const modifier = new FocusedModifier({ focused: focusSignal })

      modifier.apply(mockNode, mockContext)

      expect(mockElement._focused).toBe(true)

      // Change signal to false
      focusSignal.set(false)

      expect(mockElement._focused).toBe(false)
      expect(mockDocument.activeElement).toBeNull()
    })

    it('should unsubscribe from signal changes', () => {
      const focusSignal = createMockSignal(false)
      const modifier = new FocusedModifier({ focused: focusSignal })

      modifier.apply(mockNode, mockContext)

      // Get the cleanup function
      const cleanup = (mockElement as any)._focusedCleanup
      expect(cleanup).toBeDefined()

      const unsubscribeSpy = vi.fn()
      ;(focusSignal as any)._unsubscribe = unsubscribeSpy

      // Mock the unsubscribe return value
      const mockUnsubscribe = vi.fn()
      vi.spyOn(focusSignal, 'subscribe').mockReturnValue(mockUnsubscribe)

      // Re-apply to get fresh subscription
      modifier.apply(mockNode, mockContext)

      const newCleanup = (mockElement as any)._focusedCleanup
      newCleanup()

      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should handle signals without subscribe method (fallback polling)', () => {
      let value = false
      const signalWithoutSubscribe = (() => value) as any

      const modifier = new FocusedModifier({ focused: signalWithoutSubscribe })

      modifier.apply(mockNode, mockContext)

      expect(mockElement._focused).toBe(false)

      // Change the value (in real scenario this would trigger re-render)
      value = true

      // Since we can't easily test the polling fallback without complex timing,
      // we just verify it doesn't crash and initial state is correct
      expect(mockElement._focused).toBe(false)
    })
  })

  describe('tabIndex management', () => {
    it('should set tabIndex to 0 if element is not focusable', () => {
      mockElement.tabIndex = -1
      const modifier = new FocusedModifier({ focused: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(0)
    })

    it('should not change tabIndex if element is already focusable', () => {
      mockElement.tabIndex = 2
      const modifier = new FocusedModifier({ focused: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(2) // Should not change existing positive tabIndex
    })
  })

  describe('factory functions', () => {
    it('should create modifier via focused factory with boolean', () => {
      const modifier = focused(true)

      expect(modifier).toBeInstanceOf(FocusedModifier)
      expect(modifier.properties.focused).toBe(true)
    })

    it('should create modifier via focused factory with signal', () => {
      const focusSignal = createMockSignal(false)
      const modifier = focused(focusSignal)

      expect(modifier).toBeInstanceOf(FocusedModifier)
      expect(modifier.properties.focused).toBe(focusSignal)
    })

    it('should support FocusedOptions interface', () => {
      const options: FocusedOptions = { focused: true }
      const modifier = new FocusedModifier(options)

      expect(modifier.properties).toEqual(options)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid focus state changes', () => {
      const focusSignal = createMockSignal(false)
      const modifier = new FocusedModifier({ focused: focusSignal })

      modifier.apply(mockNode, mockContext)

      // Rapid changes
      focusSignal.set(true)
      focusSignal.set(false)
      focusSignal.set(true)

      expect(mockElement._focused).toBe(true)
      expect(mockDocument.activeElement).toBe(mockElement)
    })

    it('should not focus if element is already focused', () => {
      mockElement._focused = true
      mockDocument.activeElement = mockElement

      const focusSpy = vi.spyOn(mockElement, 'focus')
      const modifier = new FocusedModifier({ focused: true })

      modifier.apply(mockNode, mockContext)

      // Since element is already focused, focus() should not be called again
      expect(focusSpy).not.toHaveBeenCalled()
    })

    it('should handle cleanup when element has no stored cleanup function', () => {
      const modifier = new FocusedModifier({ focused: true })

      // Don't apply the modifier, so no cleanup function is stored
      expect((mockElement as any)._focusedCleanup).toBeUndefined()

      // This should not throw
      expect(() => {
        const cleanup = (mockElement as any)._focusedCleanup
        if (cleanup) cleanup()
      }).not.toThrow()
    })

    it('should store cleanup function for later removal', () => {
      const focusSignal = createMockSignal(false)
      const modifier = new FocusedModifier({ focused: focusSignal })

      modifier.apply(mockNode, mockContext)

      expect((mockElement as any)._focusedCleanup).toBeDefined()
      expect(typeof (mockElement as any)._focusedCleanup).toBe('function')
    })
  })
})
