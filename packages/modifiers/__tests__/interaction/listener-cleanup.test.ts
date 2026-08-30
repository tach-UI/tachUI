/**
 * Listener cleanup tests (#216)
 *
 * Interaction modifiers register DOM event listeners. This suite verifies that
 * every listener registered during `apply()` has a matching `removeEventListener`
 * reachable through the returned `ModifierResult.cleanup` (or `node.dispose`
 * after registry application), and that double-dispose is safe.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { OnHoverModifier } from '../../src/interaction/on-hover'
import { OnContinuousHoverModifier } from '../../src/interaction/on-continuous-hover'
import { OnLongPressGestureModifier } from '../../src/interaction/on-long-press-gesture'
import { InteractionModifier } from '../../src/base'
import { applyModifiersToNode } from '@tachui/core/modifiers/registry'
import type { ModifierContext, DOMNode } from '../../src/types'

interface RegisteredListener {
  type: string
  handler: EventListener
  options?: AddEventListenerOptions | boolean
}

function createElementWithListenerTracking(): HTMLElement {
  const element = document.createElement('div')
  const registered: RegisteredListener[] = []

  const originalAdd = element.addEventListener.bind(element)
  const originalRemove = element.removeEventListener.bind(element)

  vi.spyOn(element, 'addEventListener').mockImplementation(
    (type: string, handler: EventListener, options?: AddEventListenerOptions | boolean) => {
      registered.push({ type, handler, options })
      return originalAdd(type, handler, options)
    }
  )

  vi.spyOn(element, 'removeEventListener').mockImplementation(
    (type: string, handler: EventListener, options?: AddEventListenerOptions | boolean) => {
      const index = registered.findIndex(
        (l) => l.type === type && l.handler === handler
      )
      if (index > -1) {
        registered.splice(index, 1)
      }
      return originalRemove(type, handler, options)
    }
  )

  ;(element as any)._registeredListeners = registered
  return element
}

function makeContext(element: Element): ModifierContext {
  return {
    componentId: 'test-component',
    phase: 'creation',
    element,
  }
}

function makeNode(): DOMNode {
  return { type: 'element', tag: 'div', children: [], props: {} } as any
}

function getRegistered(element: HTMLElement): RegisteredListener[] {
  return (element as any)._registeredListeners as RegisteredListener[]
}

/**
 * Build a matching down/up event pair for whichever gesture branch
 * (pointer/touch/mouse) the given element selects. jsdom has no pointer
 * support and no TouchEvent constructor, so the touch branch gets a plain
 * Event with a minimal `touches` array attached. Note: InteractionModifier's
 * internal long-press setup registers pointer listeners unconditionally, so
 * pass `forcePointer: true` for it.
 */
function makePressEvents(
  el: HTMLElement,
  x: number,
  y: number,
  forcePointer = false
): { down: Event; up: Event } {
  const candidate = el as unknown as Record<string, unknown>
  if (forcePointer || 'onpointerdown' in candidate) {
    return {
      down: new PointerEvent('pointerdown', { clientX: x, clientY: y }),
      up: new PointerEvent('pointerup'),
    }
  }
  if ('ontouchstart' in candidate) {
    const down = new Event('touchstart') as Event & { touches: unknown[] }
    down.touches = [{ clientX: x, clientY: y }]
    return { down, up: new Event('touchend') }
  }
  return {
    down: new MouseEvent('mousedown', { clientX: x, clientY: y, button: 0 }),
    up: new MouseEvent('mouseup'),
  }
}

describe('listener cleanup (#216)', () => {
  let element: HTMLElement

  beforeEach(() => {
    element = createElementWithListenerTracking()
  })

  describe('OnHoverModifier', () => {
    it('returns cleanup that removes every listener it registered', () => {
      const onHover = vi.fn()
      const modifier = new OnHoverModifier({ onHover })

      const result = modifier.apply(makeNode(), makeContext(element))
      expect(result?.cleanup).toHaveLength(1)

      const registeredCount = getRegistered(element).length
      expect(registeredCount).toBeGreaterThan(0)

      result!.cleanup![0]()

      expect(getRegistered(element)).toHaveLength(0)
      // Handlers must be removed with the same references they were added with
      expect(element.removeEventListener).toHaveBeenCalled()
    })

    it('stops delivering hover events after cleanup', () => {
      const onHover = vi.fn()
      const modifier = new OnHoverModifier({ onHover })
      const result = modifier.apply(makeNode(), makeContext(element))!

      element.dispatchEvent(new Event('mouseenter'))
      expect(onHover).toHaveBeenCalledWith(true)

      // Cleanup resets hover state by design, calling onHover(false)
      result.cleanup![0]()
      expect(onHover).toHaveBeenLastCalledWith(false)

      // No further hover events are delivered
      element.dispatchEvent(new Event('mouseenter'))
      expect(onHover).toHaveBeenCalledTimes(2)
    })
  })

  describe('OnContinuousHoverModifier', () => {
    it('returns cleanup that removes enter/move/leave listeners', () => {
      const perform = vi.fn()
      const modifier = new OnContinuousHoverModifier({ perform })

      const result = modifier.apply(makeNode(), makeContext(element))
      const types = getRegistered(element).map((l) => l.type)
      expect(types).toEqual(['mouseenter', 'mousemove', 'mouseleave'])

      result!.cleanup![0]()
      expect(getRegistered(element)).toHaveLength(0)
    })
  })

  describe('OnLongPressGestureModifier', () => {
    it('returns cleanup that removes every registered gesture listener', () => {
      const perform = vi.fn()
      const modifier = new OnLongPressGestureModifier({ perform })

      const result = modifier.apply(makeNode(), makeContext(element))
      const registeredCount = getRegistered(element).length
      // Pointer OR touch OR mouse fallback listeners must all be tracked
      expect(registeredCount).toBeGreaterThanOrEqual(3)

      result!.cleanup![0]()
      expect(getRegistered(element)).toHaveLength(0)
    })

    it('clears pending press timer so perform() is not called after cleanup', () => {
      vi.useFakeTimers()
      try {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 100,
        })

        const result = modifier.apply(makeNode(), makeContext(element))!
        const { down } = makePressEvents(element, 10, 10)
        element.dispatchEvent(down)

        result.cleanup![0]()
        vi.advanceTimersByTime(500)

        expect(perform).not.toHaveBeenCalled()
      } finally {
        vi.useRealTimers()
      }
    })

    it('keeps gesture listeners active after a press ends', () => {
      vi.useFakeTimers()
      try {
        const perform = vi.fn()
        const modifier = new OnLongPressGestureModifier({
          perform,
          minimumDuration: 100,
        })

        const result = modifier.apply(makeNode(), makeContext(element))!
        const first = makePressEvents(element, 10, 10)
        const second = makePressEvents(element, 10, 10)
        const third = makePressEvents(element, 10, 10)

        // First press ends with an up event — listeners must stay registered
        element.dispatchEvent(first.down)
        element.dispatchEvent(first.up)

        // A later press can still trigger the long press
        element.dispatchEvent(second.down)
        vi.advanceTimersByTime(200)
        expect(perform).toHaveBeenCalledTimes(1)

        // Unmount teardown removes the listeners for real
        result.cleanup![0]()
        element.dispatchEvent(third.down)
        vi.advanceTimersByTime(200)
        expect(perform).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('InteractionModifier', () => {
    it('returns cleanup that removes every listener it registered', () => {
      const onTap = vi.fn()
      const onHover = vi.fn()
      const onKeyDown = vi.fn()

      const modifier = new InteractionModifier({ onTap, onHover, onKeyDown })
      const result = modifier.apply(makeNode(), makeContext(element))!

      const registeredTypes = getRegistered(element).map((l) => l.type)
      expect(registeredTypes).toContain('click')
      expect(registeredTypes).toContain('mouseenter')
      expect(registeredTypes).toContain('mouseleave')
      expect(registeredTypes).toContain('keydown')

      result.cleanup![0]()
      expect(getRegistered(element)).toHaveLength(0)
    })

    it('stops delivering events after cleanup', () => {
      const onTap = vi.fn()
      const modifier = new InteractionModifier({ onTap })
      const result = modifier.apply(makeNode(), makeContext(element))!

      element.dispatchEvent(new Event('click'))
      expect(onTap).toHaveBeenCalledTimes(1)

      result.cleanup![0]()

      element.dispatchEvent(new Event('click'))
      expect(onTap).toHaveBeenCalledTimes(1)
    })

    it('removes document-level keyboard shortcut listeners on cleanup', () => {
      const action = vi.fn()
      const removeSpy = vi.spyOn(document, 'removeEventListener')

      const modifier = new InteractionModifier({
        keyboardShortcut: { key: 'k', modifiers: ['cmd'], action },
      })
      const result = modifier.apply(makeNode(), makeContext(element))!

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true })
      )
      expect(action).toHaveBeenCalledTimes(1)

      result.cleanup![0]()

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'k', metaKey: true })
      )
      expect(action).toHaveBeenCalledTimes(1)
      expect(removeSpy).toHaveBeenCalled()
      expect(
        removeSpy.mock.calls.filter((call) => call[0] === 'keydown')
      ).toHaveLength(1)
    })

    it('does not throw when cleanup runs twice (double-dispose)', () => {
      const onTap = vi.fn()
      const modifier = new InteractionModifier({ onTap })
      const result = modifier.apply(makeNode(), makeContext(element))!

      expect(() => {
        result.cleanup![0]()
        result.cleanup![0]()
      }).not.toThrow()
    })

    it('keeps long-press gesture listeners active after a press ends', () => {
      vi.useFakeTimers()
      try {
        const perform = vi.fn()
        const modifier = new InteractionModifier({
          onLongPressGesture: { perform, minimumDuration: 100 },
        })
        const result = modifier.apply(makeNode(), makeContext(element))!
        // InteractionModifier's long-press setup registers pointer listeners
        // unconditionally, so force the pointer event shapes
        const first = makePressEvents(element, 10, 10, true)
        const second = makePressEvents(element, 10, 10, true)
        const third = makePressEvents(element, 10, 10, true)

        // First press ends with an up event — listeners must stay registered
        element.dispatchEvent(first.down)
        element.dispatchEvent(first.up)

        // A later press can still trigger the long press
        element.dispatchEvent(second.down)
        vi.advanceTimersByTime(200)
        expect(perform).toHaveBeenCalledTimes(1)

        // Unmount teardown removes the listeners for real
        result.cleanup![0]()
        element.dispatchEvent(third.down)
        vi.advanceTimersByTime(200)
        expect(perform).toHaveBeenCalledTimes(1)
      } finally {
        vi.useRealTimers()
      }
    })
  })

  describe('registry integration', () => {
    it('chains ModifierResult cleanup onto node.dispose via applyModifiersToNode', () => {
      const onTap = vi.fn()
      const modifier = new InteractionModifier({ onTap })
      const node = makeNode()

      const finalNode = applyModifiersToNode(node, [modifier], makeContext(element))

      element.dispatchEvent(new Event('click'))
      expect(onTap).toHaveBeenCalledTimes(1)

      expect(typeof finalNode.dispose).toBe('function')
      finalNode.dispose!()

      element.dispatchEvent(new Event('click'))
      expect(onTap).toHaveBeenCalledTimes(1)
    })

    it('node.dispose is safe to call twice', () => {
      const modifier = new InteractionModifier({ onTap: vi.fn() })
      const finalNode = applyModifiersToNode(
        makeNode(),
        [modifier],
        makeContext(element)
      )

      expect(() => {
        finalNode.dispose!()
        finalNode.dispose!()
      }).not.toThrow()
    })
  })
})
