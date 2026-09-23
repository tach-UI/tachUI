/**
 * Size modifiers driven by a signal
 *
 * `infinity` is a sentinel, not a CSS value: a static `.width(infinity)`
 * expands the element with flex properties and writes no width. A signal
 * that becomes `infinity` has to get the same treatment, and give it up again
 * when it changes back, rather than having the sentinel written as a value.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Text } from '@tachui/primitives'
import {
  createRoot,
  createSignal,
  flushSync,
  infinity,
  renderComponent,
  type Dimension,
} from '@tachui/core'
import { width } from '../../src/basic/size'
import '../../src/preload/basic'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const k of [
    'document', 'window', 'Element', 'HTMLElement', 'DocumentFragment', 'Node',
  ]) {
    ;(globalThis as any)[k] =
      k === 'document' ? dom.window.document
      : k === 'window' ? dom.window
      : (dom.window as any)[k]
  }
})

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

describe('reactive size modifiers', () => {
  it('follows a signal between lengths', () => {
    const [width, setWidth] = createSignal<Dimension>(120)
    const element = render((Text('x') as any).width(width))

    expect(element.style.width).toBe('120px')

    setWidth('50%')
    flushSync()

    expect(element.style.width).toBe('50%')
  })

  it('expands when a signal becomes infinity, and stops when it leaves', () => {
    const [width, setWidth] = createSignal<Dimension>(120)
    const element = render((Text('x') as any).width(width))

    setWidth(infinity)
    flushSync()

    expect(element.style.width).toBe('')
    expect(element.style.flexGrow).toBe('1')
    expect(element.style.getPropertyPriority('flex-grow')).toBe('important')

    setWidth(80)
    flushSync()

    expect(element.style.width).toBe('80px')
    expect(element.style.flexGrow).toBe('')
    expect(element.style.alignSelf).toBe('')
  })

  it('lifts the constraint when a max-size signal becomes infinity', () => {
    const [maxWidth, setMaxWidth] = createSignal<Dimension>(300)
    const element = render((Text('x') as any).maxWidth(maxWidth))

    expect(element.style.maxWidth).toBe('300px')

    setMaxWidth(infinity)
    flushSync()

    expect(element.style.maxWidth).toBe('none')
  })

  // `null` is the usual "not loaded yet" value. It unsets the size, as
  // `undefined` does, rather than being written.
  it('clears the size when a signal yields null or undefined', () => {
    const [width, setWidth] = createSignal<Dimension | null | undefined>(120)
    const element = render((Text('x') as any).width(width))

    setWidth(null)
    flushSync()
    expect(element.style.width).toBe('')

    setWidth(60)
    flushSync()
    setWidth(undefined)
    flushSync()
    expect(element.style.width).toBe('')
  })

  it('copies its options, so a later change has no effect', () => {
    const options: { width: Dimension } = { width: 40 }
    const component = (Text('x') as any).size(options)
    options.width = 90

    expect(render(component).style.width).toBe('40px')
  })

  // The reactive path runs through bindReactiveStyle, which ties the update to
  // its owner and shares one binding per element and modifier.
  describe('lifecycle', () => {
    function widthWrites(element: HTMLElement): () => number {
      let writes = 0
      const setProperty = element.style.setProperty.bind(element.style)
      element.style.setProperty = (name: string, ...rest: any[]) => {
        if (name === 'width') writes += 1
        return (setProperty as any)(name, ...rest)
      }
      return () => writes
    }

    it('stops updating once its owner is disposed', () => {
      const [value, setValue] = createSignal<Dimension>(10)
      const element = document.createElement('div')

      const dispose = createRoot(dispose => {
        width(value).apply({} as any, { element } as any)
        return dispose
      })
      dispose()

      const writes = widthWrites(element)
      setValue(20)
      flushSync()

      expect(writes()).toBe(0)
      expect(element.style.width).toBe('10px')
    })

    // Outside any owner, the binding is registered for the sweep that
    // disposes updaters of elements that are gone. A bare effect was never
    // disposed, and kept writing to the detached element and holding it.
    it('stops updating an unowned element once it is swept', () => {
      vi.useFakeTimers()
      try {
        const [value, setValue] = createSignal<Dimension>(10)
        const element = document.createElement('div')

        width(value).apply({} as any, { element } as any)
        vi.advanceTimersByTime(60_000)

        const writes = widthWrites(element)
        setValue(20)
        flushSync()

        expect(writes()).toBe(0)
      } finally {
        vi.useRealTimers()
      }
    })

    it('shares one binding when applied twice to the same element', () => {
      const [value, setValue] = createSignal<Dimension>(10)
      const element = document.createElement('div')
      const modifier = width(value)

      createRoot(() => {
        modifier.apply({} as any, { element } as any)
        modifier.apply({} as any, { element } as any)
      })

      const writes = widthWrites(element)
      setValue(20)
      flushSync()

      expect(writes()).toBe(1)
      expect(element.style.width).toBe('20px')
    })
  })
})
