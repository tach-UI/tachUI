/**
 * Tests for KeyboardShortcut Modifier
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  KeyboardShortcutModifier,
  keyboardShortcut,
  keyboardShortcutBuilder,
  type KeyboardShortcutOptions,
} from '../../src/interaction/keyboard-shortcut'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  private eventListeners: Map<string, EventListenerOrEventListenerObject[]> =
    new Map()

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
  public ctrlKey: boolean
  public metaKey: boolean
  public shiftKey: boolean
  public altKey: boolean

  constructor(
    type: string,
    options: {
      key?: string
      ctrlKey?: boolean
      metaKey?: boolean
      shiftKey?: boolean
      altKey?: boolean
    } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.key = options.key ?? ''
    this.ctrlKey = options.ctrlKey ?? false
    this.metaKey = options.metaKey ?? false
    this.shiftKey = options.shiftKey ?? false
    this.altKey = options.altKey ?? false
  }

  preventDefault() {
    // Mock implementation
  }

  stopPropagation() {
    // Mock implementation
  }
}

// Mock document and navigator
const mockDocument = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}

const originalDocument = global.document
const originalNavigator = global.navigator

describe('KeyboardShortcutModifier', () => {
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

    // Mock global objects
    global.document = mockDocument as any
    global.navigator = { platform: 'MacIntel' } as any
  })

  afterEach(() => {
    global.document = originalDocument
    global.navigator = originalNavigator
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should create modifier with required options', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd'],
        action,
      })

      expect(modifier.type).toBe('keyboardShortcut')
      expect(modifier.priority).toBe(80)
      expect(modifier.properties.key).toBe('s')
      expect(modifier.properties.action).toBe(action)
    })

    it('should apply modifier to element', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      expect(mockDocument.addEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })

    it('should handle null context element gracefully', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })
  })

  describe('key matching', () => {
    it('should trigger action on exact key match', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      // Get the keydown handler that was registered
      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      expect(keydownHandler).toBeDefined()

      // Simulate keydown event
      const event = new MockKeyboardEvent('keydown', { key: 's' })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should be case insensitive', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 'S', action })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Test lowercase key
      const event = new MockKeyboardEvent('keydown', { key: 's' })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should not trigger on wrong key', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const event = new MockKeyboardEvent('keydown', { key: 'a' })
      keydownHandler(event)

      expect(action).not.toHaveBeenCalled()
    })
  })

  describe('modifier key handling', () => {
    it('should handle cmd modifier on Mac', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Simulate Cmd+S on Mac
      const event = new MockKeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle cmd as ctrl on non-Mac platforms', () => {
      global.navigator = { platform: 'Win32' } as any

      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Simulate Ctrl+S on Windows (should work for 'cmd' modifier)
      const event = new MockKeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
      })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle multiple modifier keys', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd', 'shift'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Simulate Cmd+Shift+S
      const event = new MockKeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        shiftKey: true,
      })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should not trigger if required modifiers are missing', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd', 'shift'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Simulate Cmd+S (missing shift)
      const event = new MockKeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
      })
      keydownHandler(event)

      expect(action).not.toHaveBeenCalled()
    })

    it('should not trigger if extra modifiers are present', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: ['cmd'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Simulate Cmd+Shift+S (extra shift)
      const event = new MockKeyboardEvent('keydown', {
        key: 's',
        metaKey: true,
        shiftKey: true,
      })
      keydownHandler(event)

      expect(action).not.toHaveBeenCalled()
    })

    it('should handle alt modifier', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 'f',
        modifiers: ['alt'],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const event = new MockKeyboardEvent('keydown', {
        key: 'f',
        altKey: true,
      })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })
  })

  describe('element-scoped shortcuts', () => {
    it('should use element scope for focusable elements', () => {
      mockElement.tabIndex = 0 // Make element focusable

      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      // Should add listener to element, not document
      expect(mockElement.addEventListener).toBeDefined()
    })
  })

  describe('factory functions', () => {
    it('should create modifier via keyboardShortcut factory', () => {
      const action = vi.fn()
      const modifier = keyboardShortcut({
        key: 's',
        modifiers: ['cmd'],
        action,
      })

      expect(modifier).toBeInstanceOf(KeyboardShortcutModifier)
      expect(modifier.properties.key).toBe('s')
      expect(modifier.properties.action).toBe(action)
    })

    it('should create modifier via keyboardShortcutBuilder factory', () => {
      const action = vi.fn()
      const modifier = keyboardShortcutBuilder('s', ['cmd'], action)

      expect(modifier).toBeInstanceOf(KeyboardShortcutModifier)
      expect(modifier.properties.key).toBe('s')
      expect(modifier.properties.modifiers).toEqual(['cmd'])
      expect(modifier.properties.action).toBe(action)
    })

    it('should support options without modifiers', () => {
      const action = vi.fn()
      const options: KeyboardShortcutOptions = { key: 'Enter', action }

      const modifier = keyboardShortcut(options)

      expect(modifier.properties.modifiers).toEqual([])
    })
  })

  describe('event handling', () => {
    it('should prevent default and stop propagation on match', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const event = new MockKeyboardEvent('keydown', { key: 's' })
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault')
      const stopPropagationSpy = vi.spyOn(event, 'stopPropagation')

      keydownHandler(event)

      expect(preventDefaultSpy).toHaveBeenCalled()
      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(action).toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should store cleanup function for removal', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      expect((mockElement as any)._keyboardShortcutCleanup).toBeDefined()
      expect(typeof (mockElement as any)._keyboardShortcutCleanup).toBe(
        'function'
      )
    })

    it('should clean up event listeners when cleanup is called', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({ key: 's', action })

      modifier.apply(mockNode, mockContext)

      const cleanup = (mockElement as any)._keyboardShortcutCleanup
      cleanup()

      expect(mockDocument.removeEventListener).toHaveBeenCalledWith(
        'keydown',
        expect.any(Function)
      )
    })
  })

  describe('edge cases', () => {
    it('should handle empty modifiers array', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 's',
        modifiers: [],
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      // Should trigger on just 's' without any modifiers
      const event = new MockKeyboardEvent('keydown', { key: 's' })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })

    it('should handle special keys', () => {
      const action = vi.fn()
      const modifier = new KeyboardShortcutModifier({
        key: 'Escape',
        action,
      })

      modifier.apply(mockNode, mockContext)

      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const event = new MockKeyboardEvent('keydown', { key: 'Escape' })
      keydownHandler(event)

      expect(action).toHaveBeenCalledTimes(1)
    })
  })
})
