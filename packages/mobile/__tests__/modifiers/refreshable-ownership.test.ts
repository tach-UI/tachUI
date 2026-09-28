/**
 * `refreshable` is set up by this package alone
 *
 * `LifecycleModifier` used to carry its own pull-to-refresh setup in both
 * `@tachui/modifiers` copies. That class is now core's, which leaves
 * `refreshable` to `MobileGestureModifier`: a `refreshable` prop on a
 * lifecycle modifier sets nothing up, so an element carrying both gets one
 * indicator and one set of touch listeners.
 *
 * The package's test setup replaces `document` with mocks, so this suite
 * swaps a real jsdom document in for its own run.
 */

import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LifecycleModifier } from '@tachui/core'
import type { ModifierContext } from '@tachui/core'
import { refreshable } from '../../src/modifiers'

const DOM_GLOBALS = ['document', 'window', 'HTMLElement', 'Element', 'Node'] as const

function installDom(): () => void {
  const dom = new JSDOM('<!doctype html><html><body></body></html>')
  const saved = DOM_GLOBALS.map(key => [key, (globalThis as any)[key]] as const)
  for (const key of DOM_GLOBALS) {
    ;(globalThis as any)[key] =
      key === 'document' ? dom.window.document
      : key === 'window' ? dom.window
      : (dom.window as any)[key]
  }
  return () => {
    for (const [key, value] of saved) (globalThis as any)[key] = value
  }
}

function touch(type: string, clientY: number): Event {
  const event = new (window as any).Event(type, { cancelable: true })
  Object.assign(event, { touches: [{ clientY }] })
  return event
}

function pull(element: Element, distance: number): void {
  element.dispatchEvent(touch('touchstart', 0))
  element.dispatchEvent(touch('touchmove', distance))
  element.dispatchEvent(touch('touchend', distance))
}

describe('refreshable ownership', () => {
  let parent: HTMLElement
  let element: HTMLElement
  let context: ModifierContext
  let listened: string[]
  let restoreDom: () => void

  beforeEach(() => {
    restoreDom = installDom()
    parent = document.createElement('div')
    element = document.createElement('div')
    parent.appendChild(element)
    document.body.appendChild(parent)
    context = { componentId: 'test', element, phase: 'creation' }

    listened = []
    const addEventListener = element.addEventListener.bind(element)
    element.addEventListener = ((type: string, ...rest: any[]) => {
      listened.push(type)
      return (addEventListener as any)(type, ...rest)
    }) as typeof element.addEventListener
  })

  afterEach(() => {
    parent.remove()
    restoreDom()
  })

  it('takes effect through the mobile modifier', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)

    refreshable({ onRefresh }).apply({} as any, context)
    pull(element, 120)
    await Promise.resolve()

    expect(parent.children).toHaveLength(2)
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('is not set up by a lifecycle modifier', () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)

    new LifecycleModifier({ refreshable: { onRefresh } } as any).apply(
      {} as any,
      context
    )
    pull(element, 120)

    expect(parent.children).toHaveLength(1)
    expect(listened).toEqual([])
    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('is set up once when both carry it', async () => {
    const onRefresh = vi.fn().mockResolvedValue(undefined)

    new LifecycleModifier({ refreshable: { onRefresh } } as any).apply(
      {} as any,
      context
    )
    refreshable({ onRefresh }).apply({} as any, context)
    pull(element, 120)
    await Promise.resolve()

    expect(parent.children).toHaveLength(2)
    expect(listened.sort()).toEqual(['touchend', 'touchmove', 'touchstart'])
    expect(onRefresh).toHaveBeenCalledTimes(1)
  })
})
