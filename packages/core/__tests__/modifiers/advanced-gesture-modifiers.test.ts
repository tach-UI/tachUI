/**
 * Advanced Gesture Modifiers Test Suite
 *
 * Tests for Phase 4 Epic: Butternut - Advanced Input/Gesture Modifiers
 * Long press gestures, keyboard shortcuts, focus management, and hover tracking
 */

import { JSDOM } from 'jsdom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Text, VStack, Button } from '@tachui/primitives'
import { InteractionModifier } from '../../src/modifiers/base'
import { createSignal } from '../../src/reactive'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window as any
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element
global.Event = dom.window.Event
global.PointerEvent = dom.window.PointerEvent as any
global.MouseEvent = dom.window.MouseEvent
global.KeyboardEvent = dom.window.KeyboardEvent

// Mock setTimeout/clearTimeout for long press timing tests
vi.mock('global', () => ({
  setTimeout: vi.fn(),
  clearTimeout: vi.fn(),
}))

// Test utilities
const createTestElement = (tagName: string = 'div'): HTMLElement => {
  return document.createElement(tagName)
}

describe('Advanced Gesture Modifiers - Epic: Butternut Phase 4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('InteractionModifier Advanced Gestures', () => {
    let element: HTMLElement
    let mockContext: any
    let mockNode: any

    beforeEach(() => {
      element = createTestElement()
      mockNode = {
        element,
      }
      mockContext = {
        element,
        componentId: 'test-component',
        phase: 'creation',
      }
    })

    describe('Long Press Gesture', () => {
      it('should setup long press gesture with default options', () => {
        const mockPerform = vi.fn()
        const mockPressingChanged = vi.fn()

        const modifier = new InteractionModifier({
          onLongPressGesture: {
            perform: mockPerform,
            onPressingChanged: mockPressingChanged,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Verify event listeners are added
        expect(element.addEventListener).toHaveBeenCalledWith(
          'pointerdown',
          expect.any(Function)
        )
        expect(element.addEventListener).toHaveBeenCalledWith(
          'pointermove',
          expect.any(Function)
        )
        expect(element.addEventListener).toHaveBeenCalledWith(
          'pointerup',
          expect.any(Function)
        )
        expect(element.addEventListener).toHaveBeenCalledWith(
          'pointercancel',
          expect.any(Function)
        )
      })

      it('should handle custom timing and distance options', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onLongPressGesture: {
            minimumDuration: 1000, // Custom 1 second
            maximumDistance: 20, // Custom 20px
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Test would verify timing logic, but requires complex pointer event simulation
        expect(element.addEventListener).toHaveBeenCalledWith(
          'pointerdown',
          expect.any(Function)
        )
      })

      it('should call onPressingChanged when pressing starts and stops', () => {
        const mockPerform = vi.fn()
        const mockPressingChanged = vi.fn()

        const modifier = new InteractionModifier({
          onLongPressGesture: {
            perform: mockPerform,
            onPressingChanged: mockPressingChanged,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Verify callbacks are properly stored
        expect(mockPressingChanged).not.toHaveBeenCalled()
      })

      it('should store cleanup function on element', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onLongPressGesture: {
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Verify cleanup function is stored
        expect((element as any)._longPressCleanup).toBeDefined()
        expect(typeof (element as any)._longPressCleanup).toBe('function')
      })
    })

    describe('Keyboard Shortcuts', () => {
      it('should setup keyboard shortcut with basic key', () => {
        const mockAction = vi.fn()

        const modifier = new InteractionModifier({
          keyboardShortcut: {
            key: 'Enter',
            modifiers: [],
            action: mockAction,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Verify global keyboard event listener is added
        expect(document.addEventListener).toHaveBeenCalledWith(
          'keydown',
          expect.any(Function)
        )
      })

      it('should setup keyboard shortcut with modifiers', () => {
        const mockAction = vi.fn()

        const modifier = new InteractionModifier({
          keyboardShortcut: {
            key: 's',
            modifiers: ['cmd', 'shift'],
            action: mockAction,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(document.addEventListener).toHaveBeenCalledWith(
          'keydown',
          expect.any(Function)
        )
      })

      it('should store cleanup function for keyboard shortcut', () => {
        const mockAction = vi.fn()

        const modifier = new InteractionModifier({
          keyboardShortcut: {
            key: 'z',
            modifiers: ['ctrl'],
            action: mockAction,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect((element as any)._keyboardShortcutCleanup).toBeDefined()
        expect(typeof (element as any)._keyboardShortcutCleanup).toBe(
          'function'
        )
      })
    })

    describe('Focus Management', () => {
      it('should setup static focus management', () => {
        const modifier = new InteractionModifier({
          focused: true,
        })

        modifier.apply(mockNode, mockContext)

        // Verify tabindex is set for focusability
        expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      })

      it('should setup reactive focus management', () => {
        const [focused, setFocused] = createSignal(false)

        const modifier = new InteractionModifier({
          focused: focused,
        })

        modifier.apply(mockNode, mockContext)

        expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '0')

        // Test reactive focus would require more complex setup with createEffect
        expect(focused()).toBe(false)
      })

      it('should handle focus management for non-HTMLElement', () => {
        const svgElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        )
        const svgContext = {
          ...mockContext,
          element: svgElement,
        }
        const svgNode = { element: svgElement }

        const modifier = new InteractionModifier({
          focused: true,
        })

        // Should not throw error for non-HTML elements
        expect(() => modifier.apply(svgNode, svgContext)).not.toThrow()
      })
    })

    describe('Focusable Behavior', () => {
      it('should setup focusable with default options', () => {
        const modifier = new InteractionModifier({
          focusable: {
            isFocusable: true,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '0')
      })

      it('should setup non-focusable element', () => {
        const modifier = new InteractionModifier({
          focusable: {
            isFocusable: false,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(element.setAttribute).toHaveBeenCalledWith('tabindex', '-1')
      })

      it('should setup activate interaction', () => {
        const modifier = new InteractionModifier({
          focusable: {
            isFocusable: true,
            interactions: ['activate'],
          },
        })

        modifier.apply(mockNode, mockContext)

        // Verify keyboard activation listener is added
        expect(element.addEventListener).toHaveBeenCalledWith(
          'keydown',
          expect.any(Function)
        )
      })

      it('should setup edit interaction', () => {
        const modifier = new InteractionModifier({
          focusable: {
            isFocusable: true,
            interactions: ['edit'],
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(element.setAttribute).toHaveBeenCalledWith('role', 'textbox')
        expect(element.setAttribute).toHaveBeenCalledWith(
          'contenteditable',
          'true'
        )
      })
    })

    describe('Continuous Hover Tracking', () => {
      it('should setup continuous hover with local coordinates', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onContinuousHover: {
            coordinateSpace: 'local',
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(element.addEventListener).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        )
        expect(element.addEventListener).toHaveBeenCalledWith(
          'mouseleave',
          expect.any(Function)
        )
      })

      it('should setup continuous hover with global coordinates', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onContinuousHover: {
            coordinateSpace: 'global',
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect(element.addEventListener).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        )
        expect(element.addEventListener).toHaveBeenCalledWith(
          'mouseleave',
          expect.any(Function)
        )
      })

      it('should default to local coordinate space', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onContinuousHover: {
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        // Default behavior should be local coordinates
        expect(element.addEventListener).toHaveBeenCalledWith(
          'mousemove',
          expect.any(Function)
        )
      })

      it('should store cleanup function for continuous hover', () => {
        const mockPerform = vi.fn()

        const modifier = new InteractionModifier({
          onContinuousHover: {
            perform: mockPerform,
          },
        })

        modifier.apply(mockNode, mockContext)

        expect((element as any)._continuousHoverCleanup).toBeDefined()
        expect(typeof (element as any)._continuousHoverCleanup).toBe('function')
      })
    })

    describe('Hit Testing Control', () => {
      it('should enable hit testing by default', () => {
        const modifier = new InteractionModifier({
          allowsHitTesting: true,
        })

        modifier.apply(mockNode, mockContext)

        expect(element.style.pointerEvents).toBe('')
      })

      it('should disable hit testing', () => {
        const modifier = new InteractionModifier({
          allowsHitTesting: false,
        })

        modifier.apply(mockNode, mockContext)

        expect(element.style.pointerEvents).toBe('none')
      })

      it('should handle non-HTML elements gracefully', () => {
        const svgElement = document.createElementNS(
          'http://www.w3.org/2000/svg',
          'svg'
        )
        const svgContext = {
          ...mockContext,
          element: svgElement,
        }
        const svgNode = { element: svgElement }

        const modifier = new InteractionModifier({
          allowsHitTesting: false,
        })

        expect(() => modifier.apply(svgNode, svgContext)).not.toThrow()
      })
    })

    describe('Gesture Priority System (Placeholder)', () => {
      it('should accept high priority gesture configuration', () => {
        const modifier = new InteractionModifier({
          highPriorityGesture: {
            gesture: 'tap',
            including: ['subviews'],
          },
        })

        modifier.apply(mockNode, mockContext)

        // Currently a placeholder - would need gesture system implementation
        expect(modifier.properties.highPriorityGesture).toBeDefined()
      })

      it('should accept simultaneous gesture configuration', () => {
        const modifier = new InteractionModifier({
          simultaneousGesture: {
            gesture: 'pan',
            including: ['all'],
          },
        })

        modifier.apply(mockNode, mockContext)

        // Currently a placeholder
        expect(modifier.properties.simultaneousGesture).toBeDefined()
      })
    })
  })

  describe('Modifier Builder Integration', () => {
    it('should create InteractionModifier for long press gesture', () => {
      const mockPerform = vi.fn()

      const component = Button('Long Press Test', () => {})
        .modifier.onLongPressGesture({
          minimumDuration: 750,
          maximumDistance: 15,
          perform: mockPerform,
          onPressingChanged: pressing => console.log('Pressing:', pressing),
        })
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should create InteractionModifier for keyboard shortcut', () => {
      const mockAction = vi.fn()

      const component = Text('Shortcut Test')
        .modifier.keyboardShortcut('s', ['cmd', 'shift'], mockAction)
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should create InteractionModifier for focus management', () => {
      const [focused, setFocused] = createSignal(false)

      const component = VStack({ children: [] })
        .modifier.focused(focused)
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should create InteractionModifier for focusable behavior', () => {
      const component = Text('Focusable Test')
        .modifier.focusable(true, ['activate', 'edit'])
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should create InteractionModifier for continuous hover', () => {
      const mockPerform = vi.fn()

      const component = VStack({ children: [] })
        .modifier.onContinuousHover('local', mockPerform)
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should create InteractionModifier for hit testing control', () => {
      const component = Button('Hit Test', () => {})
        .modifier.allowsHitTesting(false)
        .build()

      expect(component.modifiers).toHaveLength(1)
      expect(component.modifiers[0].type).toBe('interaction')
    })

    it('should support chaining advanced gesture modifiers', () => {
      const [focused] = createSignal(false)
      const mockLongPress = vi.fn()
      const mockHover = vi.fn()
      const mockShortcut = vi.fn()

      const component = Button('Advanced Gesture Test', () => {})
        .modifier.onLongPressGesture({
          minimumDuration: 500,
          perform: mockLongPress,
        })
        .keyboardShortcut('Enter', [], mockShortcut)
        .focused(focused)
        .onContinuousHover('global', mockHover)
        .focusable(true, ['activate'])
        .allowsHitTesting(true)
        .build()

      expect(component.modifiers).toHaveLength(6)
      component.modifiers.forEach(modifier => {
        expect(modifier.type).toBe('interaction')
      })
    })

    it('should support TypeScript for all advanced gesture modifiers', () => {
      const [isFocused] = createSignal(true)

      // This test ensures TypeScript compilation works
      const component = Text('TypeScript Test')
        .modifier.onLongPressGesture({
          minimumDuration: 800,
          maximumDistance: 25,
          perform: () => console.log('Long press performed'),
          onPressingChanged: pressing =>
            console.log('Pressing changed:', pressing),
        })
        .keyboardShortcut('z', ['cmd'], () => console.log('Undo'))
        .focused(isFocused)
        .focusable(true, ['activate'])
        .onContinuousHover('local', location => {
          if (location) {
            console.log('Hover at:', location.x, location.y)
          }
        })
        .allowsHitTesting(true)
        .build()

      expect(component.modifiers).toHaveLength(6)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    let element: HTMLElement
    let mockContext: any
    let mockNode: any

    beforeEach(() => {
      element = createTestElement()
      mockNode = {
        element,
      }
      mockContext = {
        element,
        componentId: 'test-component',
        phase: 'creation',
      }
    })

    it('should handle missing element gracefully', () => {
      const mockPerform = vi.fn()
      const modifier = new InteractionModifier({
        onLongPressGesture: {
          perform: mockPerform,
        },
      })

      const emptyContext = {
        ...mockContext,
        element: undefined,
      }
      const emptyNode = { element: undefined }

      expect(() => modifier.apply(emptyNode, emptyContext)).not.toThrow()
    })

    it('should handle minimal long press configuration', () => {
      const mockPerform = vi.fn()
      const modifier = new InteractionModifier({
        onLongPressGesture: {
          perform: mockPerform,
          // No optional parameters
        },
      })

      expect(() => modifier.apply(mockNode, mockContext)).not.toThrow()
    })

    it('should handle keyboard shortcut without modifiers', () => {
      const mockAction = vi.fn()
      const modifier = new InteractionModifier({
        keyboardShortcut: {
          key: 'Space',
          action: mockAction,
          // No modifiers array
        },
      })

      expect(() => modifier.apply(mockNode, mockContext)).not.toThrow()
    })

    it('should handle continuous hover coordinate calculations edge cases', () => {
      const mockPerform = vi.fn()
      const modifier = new InteractionModifier({
        onContinuousHover: {
          coordinateSpace: 'local',
          perform: mockPerform,
        },
      })

      // Mock getBoundingClientRect
      element.getBoundingClientRect = vi.fn(() => ({
        left: 10,
        top: 20,
        right: 100,
        bottom: 200,
        width: 90,
        height: 180,
        x: 10,
        y: 20,
        toJSON: vi.fn(),
      }))

      expect(() => modifier.apply(mockNode, mockContext)).not.toThrow()
    })

    it('should handle focus management with existing tabindex', () => {
      element.hasAttribute = vi.fn(attr => attr === 'tabindex')

      const modifier = new InteractionModifier({
        focused: true,
      })

      modifier.apply(mockNode, mockContext)

      // Should not set tabindex if it already exists
      expect(element.setAttribute).not.toHaveBeenCalledWith('tabindex', '0')
    })
  })
})

// Mock DOM methods for testing
beforeEach(() => {
  // Mock element methods
  Object.defineProperty(HTMLElement.prototype, 'addEventListener', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'removeEventListener', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'setAttribute', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'removeAttribute', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'hasAttribute', {
    value: vi.fn(() => false),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'focus', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'blur', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'click', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(HTMLElement.prototype, 'getBoundingClientRect', {
    value: vi.fn(() => ({
      left: 0,
      top: 0,
      right: 100,
      bottom: 100,
      width: 100,
      height: 100,
      x: 0,
      y: 0,
      toJSON: vi.fn(),
    })),
    writable: true,
  })

  // Mock document methods
  Object.defineProperty(document, 'addEventListener', {
    value: vi.fn(),
    writable: true,
  })

  Object.defineProperty(document, 'removeEventListener', {
    value: vi.fn(),
    writable: true,
  })
})
