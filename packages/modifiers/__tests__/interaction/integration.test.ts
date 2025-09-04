/**
 * Integration Tests for Interaction Modifiers
 *
 * Tests combinations of gesture, focus, and interaction modifiers working together.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  onLongPressGesture,
  keyboardShortcut,
  focused,
  focusable,
  onContinuousHover,
  allowsHitTesting,
} from '../../src/interaction'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
  public tabIndex = -1
  public _focused = false
  public onpointerdown: any = null // Support pointer event detection
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

  click() {
    const clickEvent = new Event('click')
    this.dispatchEvent(clickEvent)
  }

  getBoundingClientRect() {
    return {
      left: 10,
      top: 20,
      right: 110,
      bottom: 120,
      width: 100,
      height: 100,
      x: 10,
      y: 20,
    }
  }
}

// Mock events
class MockPointerEvent extends Event {
  public clientX: number
  public clientY: number

  constructor(
    type: string,
    options: { clientX?: number; clientY?: number } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.clientX = options.clientX ?? 0
    this.clientY = options.clientY ?? 0
  }
}

class MockMouseEvent extends Event {
  public clientX: number
  public clientY: number

  constructor(
    type: string,
    options: { clientX?: number; clientY?: number } = {}
  ) {
    super(type, { bubbles: true, cancelable: true })
    this.clientX = options.clientX ?? 0
    this.clientY = options.clientY ?? 0
  }
}

class MockKeyboardEvent extends Event {
  public key: string
  public metaKey: boolean

  constructor(type: string, options: { key?: string; metaKey?: boolean } = {}) {
    super(type, { bubbles: true, cancelable: true })
    this.key = options.key ?? ''
    this.metaKey = options.metaKey ?? false
  }

  preventDefault() {}
  stopPropagation() {}
}

// Mock global objects
const mockDocument = {
  activeElement: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
}

const originalDocument = global.document
const originalNavigator = global.navigator
const originalRequestAnimationFrame = global.requestAnimationFrame

describe('Interaction Modifiers Integration', () => {
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
    global.navigator = { platform: 'MacIntel' } as any
    global.requestAnimationFrame = vi.fn(callback => {
      callback(0)
      return 0
    })

    vi.useFakeTimers()
  })

  afterEach(() => {
    global.document = originalDocument
    global.navigator = originalNavigator
    global.requestAnimationFrame = originalRequestAnimationFrame
    vi.clearAllTimers()
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('focusable + keyboard shortcut integration', () => {
    it('should work together for accessible interactive elements', () => {
      const shortcutAction = vi.fn()

      // Apply both modifiers
      const focusableMod = focusable(true, ['activate'])
      const shortcutMod = keyboardShortcut({
        key: 's',
        modifiers: ['cmd'],
        action: shortcutAction,
      })

      focusableMod.apply(mockNode, mockContext)
      shortcutMod.apply(mockNode, mockContext)

      // Element should be focusable with proper ARIA
      expect(mockElement.tabIndex).toBe(0)
      expect(mockElement.getAttribute('role')).toBe('button')

      // Keyboard shortcut should work
      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const cmdS = new MockKeyboardEvent('keydown', { key: 's', metaKey: true })
      keydownHandler(cmdS)

      expect(shortcutAction).toHaveBeenCalledTimes(1)

      // Space key activation should work
      const spaceEvent = new MockKeyboardEvent('keydown', { key: ' ' })
      const clickSpy = vi.spyOn(mockElement, 'click')
      mockElement.dispatchEvent(spaceEvent)

      expect(clickSpy).toHaveBeenCalled()
    })

    it('should handle focus management with shortcuts', () => {
      const shortcutAction = vi.fn()

      // Make element focusable and add focused modifier
      const focusableMod = focusable(true)
      const focusedMod = focused(true)
      const shortcutMod = keyboardShortcut({ key: 'f', action: shortcutAction })

      focusableMod.apply(mockNode, mockContext)
      focusedMod.apply(mockNode, mockContext)
      shortcutMod.apply(mockNode, mockContext)

      // Run any pending async operations
      vi.runAllTimers()

      // Element should be focused
      expect(mockElement._focused).toBe(true)
      expect(mockElement.tabIndex).toBe(0)

      // Shortcut should work
      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const fKey = new MockKeyboardEvent('keydown', { key: 'f' })
      keydownHandler(fKey)

      expect(shortcutAction).toHaveBeenCalled()
    })
  })

  describe('long press + continuous hover integration', () => {
    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should handle both gestures simultaneously',
      () => {
        const longPressAction = vi.fn()
        const hoverCallback = vi.fn()

        const longPressMod = onLongPressGesture({
          perform: longPressAction,
          minimumDuration: 500,
        })
        const hoverMod = onContinuousHover({
          coordinateSpace: 'local',
          perform: hoverCallback,
        })

        longPressMod.apply(mockNode, mockContext)
        hoverMod.apply(mockNode, mockContext)

        // Start hover
        const mouseEnter = new MockMouseEvent('mouseenter', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(mouseEnter)

        expect(hoverCallback).toHaveBeenCalledWith({ x: 40, y: 40 })

        // Start long press while hovering
        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 55,
          clientY: 65,
        })
        mockElement.dispatchEvent(pointerDown)

        // Move mouse while long pressing (should update hover but not cancel long press)
        const mouseMove = new MockMouseEvent('mousemove', {
          clientX: 60,
          clientY: 70,
        })
        mockElement.dispatchEvent(mouseMove)

        expect(hoverCallback).toHaveBeenCalledWith({ x: 50, y: 50 })

        // Complete long press
        vi.advanceTimersByTime(500)

        expect(longPressAction).toHaveBeenCalledTimes(1)
      }
    )

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should handle hover ending during long press',
      () => {
        const longPressAction = vi.fn()
        const hoverCallback = vi.fn()

        const longPressMod = onLongPressGesture({ perform: longPressAction })
        const hoverMod = onContinuousHover({ perform: hoverCallback })

        longPressMod.apply(mockNode, mockContext)
        hoverMod.apply(mockNode, mockContext)

        // Start hover and long press
        const mouseEnter = new MockMouseEvent('mouseenter', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(mouseEnter)

        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(pointerDown)

        // Leave hover while long pressing
        const mouseLeave = new MockMouseEvent('mouseleave')
        mockElement.dispatchEvent(mouseLeave)

        expect(hoverCallback).toHaveBeenLastCalledWith(null)

        // Long press should still complete
        vi.advanceTimersByTime(500)
        expect(longPressAction).toHaveBeenCalled()
      }
    )
  })

  describe('hit testing integration', () => {
    it('should disable all interactions when hit testing is disabled', () => {
      const longPressAction = vi.fn()
      const hoverCallback = vi.fn()
      const shortcutAction = vi.fn()

      // Apply all modifiers
      const hitTestingMod = allowsHitTesting(false)
      const longPressMod = onLongPressGesture({ perform: longPressAction })
      const hoverMod = onContinuousHover({ perform: hoverCallback })
      const shortcutMod = keyboardShortcut({ key: 's', action: shortcutAction })

      hitTestingMod.apply(mockNode, mockContext)
      longPressMod.apply(mockNode, mockContext)
      hoverMod.apply(mockNode, mockContext)
      shortcutMod.apply(mockNode, mockContext)

      // Element should not receive pointer events
      expect(mockElement.style.pointerEvents).toBe('none')

      // But keyboard events should still work (they don't depend on hit testing)
      const keydownHandler = mockDocument.addEventListener.mock.calls.find(
        call => call[0] === 'keydown'
      )?.[1]

      const sKey = new MockKeyboardEvent('keydown', { key: 's' })
      keydownHandler(sKey)

      expect(shortcutAction).toHaveBeenCalled()
    })

    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should re-enable interactions when hit testing is enabled',
      () => {
        const longPressAction = vi.fn()

        // Start with hit testing disabled
        const hitTestingDisabled = allowsHitTesting(false)
        const longPressMod = onLongPressGesture({ perform: longPressAction })

        hitTestingDisabled.apply(mockNode, mockContext)
        longPressMod.apply(mockNode, mockContext)

        expect(mockElement.style.pointerEvents).toBe('none')

        // Enable hit testing
        const hitTestingEnabled = allowsHitTesting(true)
        hitTestingEnabled.apply(mockNode, mockContext)

        expect(mockElement.style.pointerEvents).toBe('')

        // Long press should now work
        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(pointerDown)

        vi.advanceTimersByTime(500)
        expect(longPressAction).toHaveBeenCalled()
      }
    )
  })

  describe('complex interaction scenarios', () => {
    it.skipIf(process.env.TEST_ISOLATION === 'true')(
      'should handle full accessibility-enhanced interactive element',
      () => {
        const longPressAction = vi.fn()
        const shortcutAction = vi.fn()
        const hoverCallback = vi.fn()

        // Create a fully interactive, accessible element
        const focusableMod = focusable(true, ['activate'])
        const focusedMod = focused(false) // Start unfocused
        const longPressMod = onLongPressGesture({ perform: longPressAction })
        const shortcutMod = keyboardShortcut({
          key: 'Enter',
          action: shortcutAction,
        })
        const hoverMod = onContinuousHover({ perform: hoverCallback })
        const hitTestingMod = allowsHitTesting(true)

        // Apply all modifiers
        focusableMod.apply(mockNode, mockContext)
        focusedMod.apply(mockNode, mockContext)
        longPressMod.apply(mockNode, mockContext)
        shortcutMod.apply(mockNode, mockContext)
        hoverMod.apply(mockNode, mockContext)
        hitTestingMod.apply(mockNode, mockContext)

        // Verify element setup
        expect(mockElement.tabIndex).toBe(0)
        expect(mockElement.getAttribute('role')).toBe('button')
        expect(mockElement.style.pointerEvents).toBeUndefined()

        // Test hover interaction
        const mouseEnter = new MockMouseEvent('mouseenter', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(mouseEnter)
        expect(hoverCallback).toHaveBeenCalledWith({ x: 40, y: 40 })

        // Test long press
        const pointerDown = new MockPointerEvent('pointerdown', {
          clientX: 50,
          clientY: 60,
        })
        mockElement.dispatchEvent(pointerDown)
        vi.advanceTimersByTime(500)
        expect(longPressAction).toHaveBeenCalled()

        // Test keyboard shortcut
        const keydownHandler = mockDocument.addEventListener.mock.calls.find(
          call => call[0] === 'keydown'
        )?.[1]

        const enterKey = new MockKeyboardEvent('keydown', { key: 'Enter' })
        keydownHandler(enterKey)
        expect(shortcutAction).toHaveBeenCalled()

        // Test activation via Space key
        const spaceEvent = new MockKeyboardEvent('keydown', { key: ' ' })
        const clickSpy = vi.spyOn(mockElement, 'click')
        mockElement.dispatchEvent(spaceEvent)
        expect(clickSpy).toHaveBeenCalled()
      }
    )

    it('should handle modifier priority and application order', () => {
      const modifiers = [
        allowsHitTesting(true), // Priority 95
        onLongPressGesture({ perform: vi.fn() }), // Priority 85
        keyboardShortcut({ key: 's', action: vi.fn() }), // Priority 80
        focused(false), // Priority 75
        focusable(true), // Priority 75
        onContinuousHover({ perform: vi.fn() }), // Priority 70
      ]

      // Apply modifiers in different order than their priorities
      const shuffledOrder = [2, 5, 1, 0, 4, 3] // Indices in different order

      shuffledOrder.forEach(index => {
        modifiers[index].apply(mockNode, mockContext)
      })

      // All should be applied successfully regardless of application order
      expect(mockElement.style.pointerEvents).toBeUndefined() // Hit testing enabled but not explicitly set
      expect(mockElement.tabIndex).toBe(0) // Focusable
      expect((mockElement as any)._hitTestingEnabled).toBe(true)
      expect((mockElement as any)._longPressCleanup).toBeDefined()
      expect((mockElement as any)._continuousHoverCleanup).toBeDefined()
      expect((mockElement as any)._focusedCleanup).toBeDefined()
      expect((mockElement as any)._keyboardShortcutCleanup).toBeDefined()
    })
  })

  describe('cleanup and memory management', () => {
    it('should clean up all modifiers properly', () => {
      const modifiers = [
        onLongPressGesture({ perform: vi.fn() }),
        keyboardShortcut({ key: 's', action: vi.fn() }),
        focused(false),
        focusable(true, ['activate']),
        onContinuousHover({ perform: vi.fn() }),
      ]

      // Apply all modifiers
      modifiers.forEach(mod => mod.apply(mockNode, mockContext))

      // Verify cleanup functions exist
      expect((mockElement as any)._longPressCleanup).toBeDefined()
      expect((mockElement as any)._keyboardShortcutCleanup).toBeDefined()
      expect((mockElement as any)._focusedCleanup).toBeDefined()
      expect((mockElement as any)._focusableCleanup).toBeDefined()
      expect((mockElement as any)._continuousHoverCleanup).toBeDefined()

      // Call all cleanup functions
      ;(mockElement as any)._longPressCleanup?.()
      ;(mockElement as any)._keyboardShortcutCleanup?.()
      ;(mockElement as any)._focusedCleanup?.()
      ;(mockElement as any)._focusableCleanup?.()
      ;(mockElement as any)._continuousHoverCleanup?.()

      // Verify cleanup worked
      expect(mockDocument.removeEventListener).toHaveBeenCalled()
    })

    it('should handle partial cleanup gracefully', () => {
      const longPressMod = onLongPressGesture({ perform: vi.fn() })
      const hoverMod = onContinuousHover({ perform: vi.fn() })

      longPressMod.apply(mockNode, mockContext)
      hoverMod.apply(mockNode, mockContext)

      // Clean up only one modifier
      ;(mockElement as any)._longPressCleanup?.()

      // Other modifier should still work
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })

      expect(() => {
        mockElement.dispatchEvent(mouseEnter)
      }).not.toThrow()
    })
  })
})
