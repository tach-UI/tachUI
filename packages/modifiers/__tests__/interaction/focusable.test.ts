/**
 * Tests for Focusable Modifier
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  FocusableModifier,
  focusable,
  activatable,
  editable,
  type FocusableOptions,
} from '../../src/interaction/focusable'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  private attributes: Map<string, string> = new Map()
  private eventListeners: Map<string, EventListenerOrEventListenerObject[]> =
    new Map()

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value)
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name)
  }

  addEventListener(
    event: string,
    listener: EventListenerOrEventListenerObject
  ) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(listener)
  }

  removeEventListener(
    event: string,
    listener: EventListenerOrEventListenerObject
  ) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  click() {
    const clickEvent = new Event('click')
    const listeners = this.eventListeners.get('click')
    if (listeners) {
      listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener.call(this, clickEvent)
        }
      })
    }
  }

  focus() {
    // Mock focus method for test compatibility
  }

  blur() {
    // Mock blur method for test compatibility
  }

  dispatchEvent(event: Event): boolean {
    const listeners = this.eventListeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        if (typeof listener === 'function') {
          listener.call(this, event)
        } else if (listener.handleEvent) {
          listener.handleEvent(event)
        }
      })
    }
    return true
  }
}

// Mock KeyboardEvent
class MockKeyboardEvent extends Event {
  public key: string

  constructor(type: string, options: { key?: string } = {}) {
    super(type, { bubbles: true, cancelable: true })
    this.key = options.key ?? ''
  }

  preventDefault() {
    // Mock implementation
  }
}

describe('FocusableModifier', () => {
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
  })

  describe('basic functionality', () => {
    it('should create modifier with default options', () => {
      const modifier = new FocusableModifier({})

      expect(modifier.type).toBe('focusable')
      expect(modifier.priority).toBe(75)
      expect(modifier.properties.isFocusable).toBeUndefined()
      expect(modifier.properties.interactions).toEqual([])
    })

    it('should apply modifier to element', () => {
      const modifier = new FocusableModifier({ isFocusable: true })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      expect(mockElement.tabIndex).toBe(0) // Should make element focusable
    })

    it('should handle null context element gracefully', () => {
      const modifier = new FocusableModifier({ isFocusable: true })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })

    it('should handle non-HTMLElement gracefully', () => {
      const svgElement = { tagName: 'svg' } as unknown as HTMLElement
      const svgContext = { ...mockContext, element: svgElement }
      const modifier = new FocusableModifier({ isFocusable: true })

      expect(() => {
        modifier.apply(mockNode, svgContext)
      }).not.toThrow()
    })
  })

  describe('focusable behavior', () => {
    it('should make element focusable when isFocusable is true', () => {
      const modifier = new FocusableModifier({ isFocusable: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(0)
      expect(mockElement.getAttribute('aria-label')).toBe('Focusable element')
    })

    it('should make element non-focusable when isFocusable is false', () => {
      mockElement.tabIndex = 0
      mockElement.setAttribute('aria-label', 'Test element')

      const modifier = new FocusableModifier({ isFocusable: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(-1)
      expect(mockElement.getAttribute('aria-label')).toBeNull()
      expect(mockElement.getAttribute('role')).toBeNull()
    })

    it('should not change tabIndex if element is already focusable', () => {
      mockElement.tabIndex = 2 // Already has custom tabIndex
      const modifier = new FocusableModifier({ isFocusable: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(2) // Should not change existing positive tabIndex
    })

    it('should default to focusable when isFocusable is undefined', () => {
      const modifier = new FocusableModifier({})

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(0)
    })
  })

  describe('activate interaction', () => {
    it('should set up activate interaction', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('role')).toBe('button')
      expect(mockElement.getAttribute('aria-label')).toBe('Activatable element')
    })

    it('should handle keyboard activation with Space key', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      const clickSpy = vi.spyOn(mockElement, 'click')

      // Simulate Space key press
      const spaceEvent = new MockKeyboardEvent('keydown', { key: ' ' })
      const preventDefaultSpy = vi.spyOn(spaceEvent, 'preventDefault')

      mockElement.dispatchEvent(spaceEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should handle keyboard activation with Enter key', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      const clickSpy = vi.spyOn(mockElement, 'click')

      // Simulate Enter key press
      const enterEvent = new MockKeyboardEvent('keydown', { key: 'Enter' })
      const preventDefaultSpy = vi.spyOn(enterEvent, 'preventDefault')

      mockElement.dispatchEvent(enterEvent)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(clickSpy).toHaveBeenCalled()
    })

    it('should not activate on other keys', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      const clickSpy = vi.spyOn(mockElement, 'click')

      // Simulate 'a' key press
      const aEvent = new MockKeyboardEvent('keydown', { key: 'a' })
      mockElement.dispatchEvent(aEvent)

      expect(clickSpy).not.toHaveBeenCalled()
    })
  })

  describe('edit interaction', () => {
    it('should set up edit interaction', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['edit'],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('role')).toBe('textbox')
      expect(mockElement.getAttribute('contenteditable')).toBe('true')
      expect(mockElement.getAttribute('aria-label')).toBe('Editable content')
    })
  })

  describe('multiple interactions', () => {
    it('should handle both activate and edit interactions', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate', 'edit'],
      })

      modifier.apply(mockNode, mockContext)

      // edit should take precedence for role
      expect(mockElement.getAttribute('role')).toBe('textbox')
      expect(mockElement.getAttribute('contenteditable')).toBe('true')
      expect(mockElement.getAttribute('aria-label')).toBe('Editable content')

      // But keyboard activation should still work
      const clickSpy = vi.spyOn(mockElement, 'click')
      const spaceEvent = new MockKeyboardEvent('keydown', { key: ' ' })
      mockElement.dispatchEvent(spaceEvent)

      expect(clickSpy).toHaveBeenCalled()
    })
  })

  describe('aria-label handling', () => {
    it('should not override existing aria-label for activate', () => {
      mockElement.setAttribute('aria-label', 'Custom button label')

      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('aria-label')).toBe('Custom button label')
    })

    it('should not override existing aria-label for edit', () => {
      mockElement.setAttribute('aria-label', 'Custom input label')

      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['edit'],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('aria-label')).toBe('Custom input label')
    })

    it('should not set aria-label if aria-labelledby exists', () => {
      mockElement.setAttribute('aria-labelledby', 'label-id')

      const modifier = new FocusableModifier({ isFocusable: true })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('aria-label')).toBeNull()
      expect(mockElement.getAttribute('aria-labelledby')).toBe('label-id')
    })

    it('should not override existing role', () => {
      mockElement.setAttribute('role', 'checkbox')

      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.getAttribute('role')).toBe('checkbox')
    })
  })

  describe('cleanup', () => {
    it('should store cleanup function for activate interaction', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      expect((mockElement as any)._focusableCleanup).toBeDefined()
      expect(typeof (mockElement as any)._focusableCleanup).toBe('function')
    })

    it('should clean up event listeners when cleanup is called', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      const removeEventListenerSpy = vi.spyOn(
        mockElement,
        'removeEventListener'
      )
      const cleanup = (mockElement as any)._focusableCleanup

      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })

    it('should remove attributes and cleanup when making element non-focusable', () => {
      // First make element focusable with interactions
      mockElement.tabIndex = 0
      mockElement.setAttribute('role', 'button')
      mockElement.setAttribute('aria-label', 'Test')
      mockElement.setAttribute('contenteditable', 'true')

      // Mock existing cleanup function
      const existingCleanup = vi.fn()
      ;(mockElement as any)._focusableCleanup = existingCleanup

      const modifier = new FocusableModifier({ isFocusable: false })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(-1)
      expect(mockElement.getAttribute('role')).toBeNull()
      expect(mockElement.getAttribute('aria-label')).toBeNull()
      expect(mockElement.getAttribute('contenteditable')).toBeNull()
      expect(existingCleanup).toHaveBeenCalled()
      expect((mockElement as any)._focusableCleanup).toBeUndefined()
    })
  })

  describe('factory functions', () => {
    it('should create modifier via focusable factory', () => {
      const modifier = focusable(true, ['activate'])

      expect(modifier).toBeInstanceOf(FocusableModifier)
      expect(modifier.properties.isFocusable).toBe(true)
      expect(modifier.properties.interactions).toEqual(['activate'])
    })

    it('should use defaults in focusable factory', () => {
      const modifier = focusable()

      expect(modifier.properties.isFocusable).toBe(true)
      expect(modifier.properties.interactions).toEqual([])
    })

    it('should create activatable modifier', () => {
      const modifier = activatable()

      expect(modifier).toBeInstanceOf(FocusableModifier)
      expect(modifier.properties.isFocusable).toBe(true)
      expect(modifier.properties.interactions).toEqual(['activate'])
    })

    it('should create editable modifier', () => {
      const modifier = editable()

      expect(modifier).toBeInstanceOf(FocusableModifier)
      expect(modifier.properties.isFocusable).toBe(true)
      expect(modifier.properties.interactions).toEqual(['edit'])
    })

    it('should support FocusableOptions interface', () => {
      const options: FocusableOptions = {
        isFocusable: false,
        interactions: ['activate', 'edit'],
      }
      const modifier = new FocusableModifier(options)

      expect(modifier.properties).toEqual(options)
    })
  })

  describe('edge cases', () => {
    it('should handle empty interactions array', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: [],
      })

      modifier.apply(mockNode, mockContext)

      expect(mockElement.tabIndex).toBe(0)
      expect(mockElement.getAttribute('aria-label')).toBe('Focusable element')
      expect(mockElement.getAttribute('role')).toBeNull()
    })

    it('should not crash when calling cleanup that doesnt exist', () => {
      const modifier = new FocusableModifier({ isFocusable: false })

      modifier.apply(mockNode, mockContext)

      // Since isFocusable is false, no cleanup function should be created
      expect((mockElement as any)._focusableCleanup).toBeUndefined()
    })

    it('should handle multiple cleanup function calls', () => {
      const modifier = new FocusableModifier({
        isFocusable: true,
        interactions: ['activate'],
      })

      modifier.apply(mockNode, mockContext)

      const cleanup = (mockElement as any)._focusableCleanup

      expect(() => {
        cleanup()
        cleanup() // Should not crash on second call
      }).not.toThrow()
    })
  })
})
