/**
 * Tests for OnContinuousHover Modifier
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  OnContinuousHoverModifier,
  onContinuousHover,
  onContinuousHoverLocal,
  onContinuousHoverGlobal,
  type OnContinuousHoverOptions,
} from '../../src/interaction/on-continuous-hover'
import type { ModifierContext, DOMNode } from '../../src/types'

// Mock DOM environment
class MockElement {
  public style: Record<string, string> = {}
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

// Mock MouseEvent
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

describe('OnContinuousHoverModifier', () => {
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
    it('should create modifier with required options', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      expect(modifier.type).toBe('onContinuousHover')
      expect(modifier.priority).toBe(70)
      expect(modifier.properties.perform).toBe(perform)
      expect(modifier.properties.coordinateSpace).toBeUndefined()
    })

    it('should apply modifier to element', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      const result = modifier.apply(mockNode, mockContext)

      expect(result).toBeUndefined()
      // Should have added event listeners
      expect(mockElement.addEventListener).toBeDefined()
    })

    it('should handle null context element gracefully', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })
      const nullContext = { ...mockContext, element: undefined }

      expect(() => {
        modifier.apply(mockNode, nullContext)
      }).not.toThrow()
    })
  })

  describe('local coordinate space (default)', () => {
    it('should track hover with local coordinates', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'local',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      // Simulate mouse enter at global position (50, 60)
      // Element is at (10, 20) with 100x100 size
      // So local coordinates should be (40, 40)
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })
    })

    it('should update coordinates on mouse move', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'local',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      // Enter hover
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })
      perform.mockClear()

      // Move mouse
      const mouseMove = new MockMouseEvent('mousemove', {
        clientX: 70,
        clientY: 80,
      })
      mockElement.dispatchEvent(mouseMove)

      expect(perform).toHaveBeenCalledWith({ x: 60, y: 60 })
    })

    it('should call perform with null on mouse leave', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Enter hover
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })
      perform.mockClear()

      // Leave hover
      const mouseLeave = new MockMouseEvent('mouseleave')
      mockElement.dispatchEvent(mouseLeave)

      expect(perform).toHaveBeenCalledWith(null)
    })
  })

  describe('global coordinate space', () => {
    it('should track hover with global coordinates', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'global',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      // Simulate mouse enter at global position (150, 200)
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 150,
        clientY: 200,
      })
      mockElement.dispatchEvent(mouseEnter)

      // Global coordinates should be unchanged
      expect(perform).toHaveBeenCalledWith({ x: 150, y: 200 })
    })

    it('should update global coordinates on mouse move', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'global',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      // Enter hover
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 150,
        clientY: 200,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 150, y: 200 })
      perform.mockClear()

      // Move mouse
      const mouseMove = new MockMouseEvent('mousemove', {
        clientX: 175,
        clientY: 225,
      })
      mockElement.dispatchEvent(mouseMove)

      expect(perform).toHaveBeenCalledWith({ x: 175, y: 225 })
    })
  })

  describe('hover state management', () => {
    it('should not call perform on mouse move when not hovering', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Move mouse without entering hover first
      const mouseMove = new MockMouseEvent('mousemove', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseMove)

      expect(perform).not.toHaveBeenCalled()
    })

    it('should handle rapid hover enter/leave cycles', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Enter
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)
      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })

      // Leave
      const mouseLeave1 = new MockMouseEvent('mouseleave')
      mockElement.dispatchEvent(mouseLeave1)
      expect(perform).toHaveBeenCalledWith(null)

      // Enter again
      const mouseEnter2 = new MockMouseEvent('mouseenter', {
        clientX: 60,
        clientY: 70,
      })
      mockElement.dispatchEvent(mouseEnter2)
      expect(perform).toHaveBeenCalledWith({ x: 50, y: 50 })

      expect(perform).toHaveBeenCalledTimes(3)
    })

    it('should handle mouse move after mouse leave', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Enter, move, then leave
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      const mouseMove = new MockMouseEvent('mousemove', {
        clientX: 70,
        clientY: 80,
      })
      mockElement.dispatchEvent(mouseMove)

      const mouseLeave = new MockMouseEvent('mouseleave')
      mockElement.dispatchEvent(mouseLeave)

      perform.mockClear()

      // Move after leaving should not trigger perform
      const mouseMoveAfterLeave = new MockMouseEvent('mousemove', {
        clientX: 90,
        clientY: 100,
      })
      mockElement.dispatchEvent(mouseMoveAfterLeave)

      expect(perform).not.toHaveBeenCalled()
    })
  })

  describe('cleanup', () => {
    it('should store cleanup function for later removal', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      expect((mockElement as any)._continuousHoverCleanup).toBeDefined()
      expect(typeof (mockElement as any)._continuousHoverCleanup).toBe(
        'function'
      )
    })

    it('should clean up event listeners when cleanup is called', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      const removeEventListenerSpy = vi.spyOn(
        mockElement,
        'removeEventListener'
      )
      const cleanup = (mockElement as any)._continuousHoverCleanup

      cleanup()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mousemove',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function)
      )
    })

    it('should call perform with null when cleanup is called during hover', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Enter hover state
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })
      perform.mockClear()

      // Call cleanup while hovering
      const cleanup = (mockElement as any)._continuousHoverCleanup
      cleanup()

      expect(perform).toHaveBeenCalledWith(null)
    })

    it('should not call perform when cleanup is called without active hover', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      // Call cleanup without entering hover
      const cleanup = (mockElement as any)._continuousHoverCleanup
      cleanup()

      expect(perform).not.toHaveBeenCalled()
    })
  })

  describe('factory functions', () => {
    it('should create modifier via onContinuousHover factory', () => {
      const perform = vi.fn()
      const modifier = onContinuousHover({
        coordinateSpace: 'global',
        perform,
      })

      expect(modifier).toBeInstanceOf(OnContinuousHoverModifier)
      expect(modifier.properties.coordinateSpace).toBe('global')
      expect(modifier.properties.perform).toBe(perform)
    })

    it('should create local coordinate modifier via convenience factory', () => {
      const perform = vi.fn()
      const modifier = onContinuousHoverLocal(perform)

      expect(modifier).toBeInstanceOf(OnContinuousHoverModifier)
      expect(modifier.properties.coordinateSpace).toBe('local')
      expect(modifier.properties.perform).toBe(perform)
    })

    it('should create global coordinate modifier via convenience factory', () => {
      const perform = vi.fn()
      const modifier = onContinuousHoverGlobal(perform)

      expect(modifier).toBeInstanceOf(OnContinuousHoverModifier)
      expect(modifier.properties.coordinateSpace).toBe('global')
      expect(modifier.properties.perform).toBe(perform)
    })

    it('should support OnContinuousHoverOptions interface', () => {
      const perform = vi.fn()
      const options: OnContinuousHoverOptions = {
        coordinateSpace: 'local',
        perform,
      }
      const modifier = new OnContinuousHoverModifier(options)

      expect(modifier.properties).toEqual(options)
    })
  })

  describe('coordinate calculation edge cases', () => {
    it('should handle zero-positioned element', () => {
      // Override getBoundingClientRect to return zero position
      mockElement.getBoundingClientRect = () => ({
        left: 0,
        top: 0,
        right: 100,
        bottom: 100,
        width: 100,
        height: 100,
        x: 0,
        y: 0,
      })

      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'local',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 25,
        clientY: 50,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: 25, y: 50 })
    })

    it('should handle negative local coordinates', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'local',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      // Mouse at (5, 15) but element is at (10, 20) = local (-5, -5)
      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 5,
        clientY: 15,
      })
      mockElement.dispatchEvent(mouseEnter)

      expect(perform).toHaveBeenCalledWith({ x: -5, y: -5 })
    })

    it('should handle fractional coordinates', () => {
      // Override getBoundingClientRect to return fractional values
      mockElement.getBoundingClientRect = () => ({
        left: 10.5,
        top: 20.3,
        right: 110.5,
        bottom: 120.3,
        width: 100,
        height: 100,
        x: 10.5,
        y: 20.3,
      })

      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({
        coordinateSpace: 'local',
        perform,
      })

      modifier.apply(mockNode, mockContext)

      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50.7,
        clientY: 60.8,
      })
      mockElement.dispatchEvent(mouseEnter)

      // Should handle floating point math correctly
      expect(perform).toHaveBeenCalledWith({
        x: 50.7 - 10.5,
        y: 60.8 - 20.3,
      })
    })
  })

  describe('default behavior', () => {
    it('should default to local coordinate space when not specified', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      modifier.apply(mockNode, mockContext)

      const mouseEnter = new MockMouseEvent('mouseenter', {
        clientX: 50,
        clientY: 60,
      })
      mockElement.dispatchEvent(mouseEnter)

      // Should calculate local coordinates (default behavior)
      expect(perform).toHaveBeenCalledWith({ x: 40, y: 40 })
    })
  })
})
