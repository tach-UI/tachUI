/**
 * The single InteractionModifier and the registered gesture modifiers
 *
 * `@tachui/modifiers` used to carry two further copies of `InteractionModifier`.
 * One of them dropped touch and swipe handlers, core's applied `disabled` only
 * once, and one carried a block of gesture code (long press, keyboard
 * shortcut, focus, continuous hover, hit testing) that no chain reached. Now:
 *
 * - Every entry exports core's one class, which applies touch and swipe
 *   handlers and follows a signal passed as `disabled`.
 * - The gesture behaviors are the standalone modifiers this package defines
 *   and registers with metadata; core's class ignores those props.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIsolatedRegistry, globalModifierRegistry } from '@tachui/registry'
import type { ModifierContext } from '@tachui/types/modifiers'
import { InteractionModifier as CoreInteractionModifier } from '@tachui/core/modifiers/base'
import { createModifierBuilder } from '@tachui/core/modifiers'
import { applyModifiersToNode } from '@tachui/core/modifiers/registry'
import { createComputed, createRoot, createSignal, flushSync } from '@tachui/core/reactive'
import { createComponent, h } from '@tachui/core/runtime'
import { InteractionModifier as SubpathInteractionModifier } from '../../src/base'
import { InteractionModifier as BasicInteractionModifier } from '../../src/basic/base'
import { registerBasicModifiers } from '../../src/basic'
import {
  disabled,
  onSwipeLeft,
  onSwipeRight,
  onTouchStart,
} from '../../src/interaction/dom-events'
import { OnLongPressGestureModifier } from '../../src/interaction/on-long-press-gesture'
import { KeyboardShortcutModifier } from '../../src/interaction/keyboard-shortcut'
import { FocusedModifier } from '../../src/interaction/focused'
import { FocusableModifier } from '../../src/interaction/focusable'
import { OnContinuousHoverModifier } from '../../src/interaction/on-continuous-hover'
import { AllowsHitTestingModifier } from '../../src/interaction/allows-hit-testing'

const savedGlobals: Record<string, unknown> = {}
// `window` stays the runner's, so fake timers reach the long-press timer.
const DOM_GLOBALS = [
  'document',
  'Element',
  'HTMLElement',
  'Node',
  'Event',
  'MouseEvent',
  'KeyboardEvent',
]

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const key of DOM_GLOBALS) {
    savedGlobals[key] = (globalThis as any)[key]
    ;(globalThis as any)[key] = (dom.window as any)[key]
  }
})

afterEach(() => {
  for (const key of DOM_GLOBALS) {
    ;(globalThis as any)[key] = savedGlobals[key]
  }
})

function makeContext(element: Element = document.createElement('div')) {
  document.body.appendChild(element)
  return { componentId: 'test', element, phase: 'creation' } as ModifierContext & {
    element: HTMLElement
  }
}

function makeNode(element?: Element): any {
  return { type: 'element', tag: 'div', children: [], props: {}, element }
}

/** jsdom has no TouchEvent constructor, so attach the touch lists by hand. */
function touchEvent(
  type: string,
  point: { clientX: number; clientY: number }
): Event {
  const event = new Event(type) as Event & {
    touches: unknown[]
    changedTouches: unknown[]
  }
  event.touches = [point]
  event.changedTouches = [point]
  return event
}

function swipe(element: Element, fromX: number, toX: number, deltaY = 0) {
  element.dispatchEvent(touchEvent('touchstart', { clientX: fromX, clientY: 100 }))
  element.dispatchEvent(
    touchEvent('touchend', { clientX: toX, clientY: 100 + deltaY })
  )
}

const entries = [
  ['@tachui/core/modifiers/base', CoreInteractionModifier],
  ['@tachui/modifiers/base', SubpathInteractionModifier],
  ['@tachui/modifiers root', BasicInteractionModifier],
] as const

describe('one InteractionModifier', () => {
  it('is core’s class behind every entry', () => {
    expect(SubpathInteractionModifier).toBe(CoreInteractionModifier)
    expect(BasicInteractionModifier).toBe(CoreInteractionModifier)
    expect(disabled(true)).toBeInstanceOf(CoreInteractionModifier)
  })
})

describe.each(entries)('touch and swipe from %s', (_name, Interaction) => {
  it('delivers every touch event to its handler', () => {
    const context = makeContext()
    const handlers = {
      onTouchStart: vi.fn(),
      onTouchMove: vi.fn(),
      onTouchEnd: vi.fn(),
      onTouchCancel: vi.fn(),
    }
    new Interaction(handlers).apply(makeNode(), context)

    for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) {
      context.element.dispatchEvent(touchEvent(type, { clientX: 0, clientY: 0 }))
    }

    expect(handlers.onTouchStart).toHaveBeenCalledTimes(1)
    expect(handlers.onTouchMove).toHaveBeenCalledTimes(1)
    expect(handlers.onTouchEnd).toHaveBeenCalledTimes(1)
    expect(handlers.onTouchCancel).toHaveBeenCalledTimes(1)
  })

  it('fires onSwipeLeft for a leftward swipe and onSwipeRight for a rightward one', () => {
    const context = makeContext()
    const onSwipeLeftHandler = vi.fn()
    const onSwipeRightHandler = vi.fn()
    new Interaction({
      onSwipeLeft: onSwipeLeftHandler,
      onSwipeRight: onSwipeRightHandler,
    }).apply(makeNode(), context)

    swipe(context.element, 200, 100)
    expect(onSwipeLeftHandler).toHaveBeenCalledTimes(1)
    expect(onSwipeRightHandler).not.toHaveBeenCalled()

    swipe(context.element, 100, 200)
    expect(onSwipeRightHandler).toHaveBeenCalledTimes(1)
    expect(onSwipeLeftHandler).toHaveBeenCalledTimes(1)
  })

  it('ignores short and mostly vertical swipes', () => {
    const context = makeContext()
    const onSwipeLeftHandler = vi.fn()
    const onSwipeRightHandler = vi.fn()
    new Interaction({
      onSwipeLeft: onSwipeLeftHandler,
      onSwipeRight: onSwipeRightHandler,
    }).apply(makeNode(), context)

    swipe(context.element, 100, 70)
    swipe(context.element, 100, 200, 300)

    expect(onSwipeLeftHandler).not.toHaveBeenCalled()
    expect(onSwipeRightHandler).not.toHaveBeenCalled()
  })

  it('removes the touch and swipe listeners on cleanup, twice safely', () => {
    const context = makeContext()
    const onTouchStartHandler = vi.fn()
    const onSwipeRightHandler = vi.fn()
    const result = new Interaction({
      onTouchStart: onTouchStartHandler,
      onSwipeRight: onSwipeRightHandler,
    }).apply(makeNode(), context) as any

    result.cleanup[0]()
    result.cleanup[0]()
    swipe(context.element, 100, 200)

    expect(onTouchStartHandler).not.toHaveBeenCalled()
    expect(onSwipeRightHandler).not.toHaveBeenCalled()
  })
})

describe('touch and swipe factories', () => {
  it('apply their handlers', () => {
    const context = makeContext()
    const touched = vi.fn()
    const left = vi.fn()
    const right = vi.fn()
    for (const modifier of [onTouchStart(touched), onSwipeLeft(left), onSwipeRight(right)]) {
      modifier.apply(makeNode(), context)
    }

    swipe(context.element, 200, 100)
    swipe(context.element, 100, 200)

    expect(touched).toHaveBeenCalledTimes(2)
    expect(left).toHaveBeenCalledTimes(1)
    expect(right).toHaveBeenCalledTimes(1)
  })
})

describe.each(entries)('disabled from %s', (_name, Interaction) => {
  function expectDisabled(element: HTMLElement, isDisabled: boolean) {
    expect(element.hasAttribute('disabled')).toBe(isDisabled)
    expect(element.style.pointerEvents).toBe(isDisabled ? 'none' : '')
    expect(element.style.opacity).toBe(isDisabled ? '0.6' : '')
  }

  it('follows a signal', () => {
    const context = makeContext(document.createElement('button'))
    const [isDisabled, setDisabled] = createSignal(true)
    createRoot(() => {
      new Interaction({ disabled: isDisabled }).apply(makeNode(), context)
    })
    expectDisabled(context.element, true)

    setDisabled(false)
    flushSync()
    expectDisabled(context.element, false)

    setDisabled(true)
    flushSync()
    expectDisabled(context.element, true)
  })

  it('follows a computed', async () => {
    const context = makeContext(document.createElement('button'))
    const [count, setCount] = createSignal(0)
    createRoot(() => {
      const isDisabled = createComputed(() => count() > 0)
      new Interaction({ disabled: isDisabled }).apply(makeNode(), context)
    })
    expectDisabled(context.element, false)

    // An effect reading a computed re-runs after the current task.
    setCount(1)
    flushSync()
    await new Promise(done => setTimeout(done, 0))
    expectDisabled(context.element, true)
  })

  it.each([true, false])('applies a plain %s', value => {
    const context = makeContext(document.createElement('button'))
    context.element.setAttribute('disabled', 'true')
    new Interaction({ disabled: value }).apply(makeNode(), context)
    expectDisabled(context.element, value)
  })

  it('ignores an element that is not an HTMLElement', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    const context = makeContext(svg)
    const [isDisabled] = createSignal(true)

    expect(() => {
      createRoot(() => {
        new Interaction({ disabled: isDisabled }).apply(makeNode(), context)
        new Interaction({ disabled: true }).apply(makeNode(), context)
      })
    }).not.toThrow()
    expect(svg.hasAttribute('disabled')).toBe(false)
  })
})

const gestureModifiers = [
  ['onLongPressGesture', OnLongPressGestureModifier, 85],
  ['keyboardShortcut', KeyboardShortcutModifier, 80],
  ['focused', FocusedModifier, 75],
  ['focusable', FocusableModifier, 75],
  ['onContinuousHover', OnContinuousHoverModifier, 70],
  ['allowsHitTesting', AllowsHitTestingModifier, 95],
] as const

describe('registered gesture modifiers', () => {
  it.each(gestureModifiers)(
    '%s is registered with @tachui/modifiers metadata',
    (name, _Modifier, priority) => {
      expect(globalModifierRegistry.getMetadata(name)).toMatchObject({
        name,
        plugin: '@tachui/modifiers',
        category: 'interaction',
        priority,
      })
    }
  )

  it('registers the same metadata into a given registry without conflicts', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    for (const [name, Modifier] of gestureModifiers) {
      expect(registry.has(name)).toBe(true)
      expect(registry.getMetadata(name)?.plugin).toBe('@tachui/modifiers')
      expect(Modifier.name).toBeTruthy()
    }
    expect(registry.getPluginInfo('@tachui/modifiers')).toBeDefined()
    expect(registry.getConflicts().size).toBe(0)
  })

  it('routes each chain method to its own modifier', () => {
    const builder = createModifierBuilder(createComponent(() => [h('div')], {}))
    const { modifiers } = builder
      .disabled(true)
      .onTap(() => {})
      .onLongPressGesture({ perform: () => {} })
      .keyboardShortcut({ key: 'k', action: () => {} })
      .focused(true)
      .focusable(true, ['activate'])
      .onContinuousHover({ perform: () => {} })
      .allowsHitTesting(false)
      .build()

    expect(modifiers[0]).toBeInstanceOf(CoreInteractionModifier)
    expect(modifiers[1]).toBeInstanceOf(CoreInteractionModifier)
    expect(modifiers.slice(2).map(modifier => modifier.constructor)).toEqual([
      OnLongPressGestureModifier,
      KeyboardShortcutModifier,
      FocusedModifier,
      FocusableModifier,
      OnContinuousHoverModifier,
      AllowsHitTestingModifier,
    ])
  })

  it('leaves the gesture props to them: core’s class registers nothing for those', () => {
    const context = makeContext()
    const addSpy = vi.spyOn(context.element, 'addEventListener')
    const documentAddSpy = vi.spyOn(document, 'addEventListener')

    new CoreInteractionModifier({
      onLongPressGesture: { perform: vi.fn() },
      keyboardShortcut: { key: 'k', action: vi.fn() },
      onContinuousHover: { perform: vi.fn() },
      allowsHitTesting: false,
      focusable: { isFocusable: true },
    }).apply(makeNode(), context)

    expect(addSpy).not.toHaveBeenCalled()
    expect(documentAddSpy).not.toHaveBeenCalled()
    expect(context.element.style.pointerEvents).toBe('')
    expect(context.element.hasAttribute('tabindex')).toBe(false)
  })
})

describe('gesture behavior through the chain', () => {
  function applyChain(
    configure: (builder: ReturnType<typeof createModifierBuilder>) => any,
    element: HTMLElement = document.createElement('div')
  ) {
    const context = makeContext(element)
    const builder = createModifierBuilder(createComponent(() => [h('div')], {}))
    const { modifiers } = configure(builder).build()
    let node: any
    createRoot(() => {
      node = applyModifiersToNode(makeNode(element), modifiers, context)
    })
    return { element: context.element, node }
  }

  it('fires a long press after the hold and not after dispose', () => {
    vi.useFakeTimers()
    // The gesture times the hold with `window.setTimeout`, which this
    // package's test setup keeps apart from the faked global one.
    const fakeSetTimeout = globalThis.setTimeout
    const windowTimer = vi
      .spyOn(window, 'setTimeout')
      .mockImplementation(((callback: () => void, delay?: number) =>
        fakeSetTimeout(callback, delay)) as any)
    try {
      const perform = vi.fn()
      const { element, node } = applyChain(builder =>
        builder.onLongPressGesture({ perform, minimumDuration: 300 })
      )
      // The gesture listens to pointer events where the element has them,
      // then touch events, then mouse events.
      const press = (phase: 'down' | 'up'): Event => {
        const point = { clientX: 5, clientY: 5, button: 0 }
        if ('onpointerdown' in element) return new MouseEvent(`pointer${phase}`, point)
        if ('ontouchstart' in element) {
          return touchEvent(phase === 'down' ? 'touchstart' : 'touchend', point)
        }
        return new MouseEvent(phase === 'down' ? 'mousedown' : 'mouseup', point)
      }

      element.dispatchEvent(press('down'))
      vi.advanceTimersByTime(299)
      expect(perform).not.toHaveBeenCalled()
      vi.advanceTimersByTime(1)
      expect(perform).toHaveBeenCalledTimes(1)
      element.dispatchEvent(press('up'))

      node.dispose()
      node.dispose()
      element.dispatchEvent(press('down'))
      vi.advanceTimersByTime(1000)
      expect(perform).toHaveBeenCalledTimes(1)
    } finally {
      windowTimer.mockRestore()
      vi.useRealTimers()
    }
  })

  it('fires a keyboard shortcut on the bound keys only, until dispose', () => {
    const action = vi.fn()
    const { node } = applyChain(builder =>
      builder.keyboardShortcut({ key: 's', modifiers: ['shift'], action })
    )

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', shiftKey: true }))
    expect(action).not.toHaveBeenCalled()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'S', shiftKey: true }))
    expect(action).toHaveBeenCalledTimes(1)

    node.dispose()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'S', shiftKey: true }))
    expect(action).toHaveBeenCalledTimes(1)
  })

  it('makes an element focusable and activatable from the keyboard, until dispose', () => {
    const onTap = vi.fn()
    const { element, node } = applyChain(builder =>
      builder.onTap(onTap).focusable(true, ['activate'])
    )

    expect(element.tabIndex).toBe(0)
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onTap).toHaveBeenCalledTimes(1)

    node.dispose()
    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('makes an element non-focusable', () => {
    const { element } = applyChain(builder => builder.focusable(false))
    expect(element.tabIndex).toBe(-1)
  })

  it('toggles pointer events with hit testing', () => {
    const blocked = applyChain(builder => builder.allowsHitTesting(false))
    expect(blocked.element.style.pointerEvents).toBe('none')

    const element = document.createElement('div')
    element.style.pointerEvents = 'none'
    const allowed = applyChain(builder => builder.allowsHitTesting(true), element)
    expect(allowed.element.style.pointerEvents).toBe('')
  })

  it('reports continuous hover until dispose', () => {
    const perform = vi.fn()
    const { element, node } = applyChain(builder =>
      builder.onContinuousHover({ coordinateSpace: 'global', perform })
    )

    element.dispatchEvent(new MouseEvent('mouseenter', { clientX: 1, clientY: 2 }))
    element.dispatchEvent(new MouseEvent('mousemove', { clientX: 3, clientY: 4 }))
    expect(perform).toHaveBeenLastCalledWith({ x: 3, y: 4 })

    // Disposing while hovering ends the hover, then nothing more arrives.
    node.dispose()
    expect(perform).toHaveBeenLastCalledWith(null)
    element.dispatchEvent(new MouseEvent('mousemove', { clientX: 5, clientY: 6 }))
    element.dispatchEvent(new MouseEvent('mouseleave'))
    expect(perform).toHaveBeenCalledTimes(3)
  })

  it('keeps the disabled chain reactive', () => {
    const [isDisabled, setDisabled] = createSignal(false)
    const { element } = applyChain(
      builder => builder.disabled(isDisabled),
      document.createElement('button')
    )
    expect(element.hasAttribute('disabled')).toBe(false)

    setDisabled(true)
    flushSync()
    expect(element.hasAttribute('disabled')).toBe(true)
  })
})

describe('gesture code stays out of core', () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap(entry => {
      const path = join(dir, entry)
      return statSync(path).isDirectory()
        ? sourceFiles(path)
        : path.endsWith('.ts')
          ? [path]
          : []
    })
  }

  it('has no gesture setup under packages/core/src', () => {
    const coreSrc = resolve(__dirname, '../../../core/src')
    const gestureCode =
      /setupLongPressGesture|setupKeyboardShortcut|setupFocusManagement|setupFocusable|setupContinuousHover|setupHitTesting|props\.(onLongPressGesture|keyboardShortcut|focused|focusable|onContinuousHover|allowsHitTesting)\b/

    const offenders = sourceFiles(coreSrc).filter(file =>
      gestureCode.test(readFileSync(file, 'utf8'))
    )
    expect(offenders).toEqual([])
  })
})
