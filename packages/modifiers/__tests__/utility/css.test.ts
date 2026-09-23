/**
 * `.css()`
 *
 * The escape hatch for properties without a typed modifier. It takes a
 * `Signal` for any value, as `CSSStyleProperties` declares, and updates that
 * property in place. It used to read each signal once in its constructor, so
 * a reactive value froze at its first value.
 */

import { JSDOM } from 'jsdom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Text } from '@tachui/primitives'
import {
  createMemo,
  createSignal,
  flushSync,
  renderComponent,
} from '@tachui/core'
import '../../src/preload/basic'
import { css, cssVendor } from '../../src/utility/css'

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

// A memo-driven update lands a microtask after the flush, as it does for the
// typed modifiers.
async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

describe('.css()', () => {
  it('applies static values, camelCase or kebab-case', () => {
    const element = render(
      (Text('x') as any).css({
        backgroundColor: 'red',
        'text-decoration': 'underline',
      })
    )

    expect(element.style.backgroundColor).toBe('red')
    expect(element.style.textDecoration).toBe('underline')
  })

  // A layered background has no typed modifier: gradients are not valid
  // `background-color`. It is the case the escape hatch exists for.
  it('updates a memo value in place', async () => {
    const [dark, setDark] = createSignal(false)
    const background = createMemo(() =>
      dark()
        ? 'linear-gradient(black, gray)'
        : 'linear-gradient(white, silver)'
    )
    const element = render((Text('x') as any).css({ background }))

    expect(element.style.background).toBe('linear-gradient(white, silver)')

    setDark(true)
    await flushReactiveUpdates()

    expect(element.style.background).toBe('linear-gradient(black, gray)')
  })

  it('mixes signal and static values in one object', () => {
    const [outline, setOutline] = createSignal('1px solid red')
    const element = render(
      (Text('x') as any).css({ outline, cursor: 'pointer' })
    )

    setOutline('2px dashed blue')
    flushSync()

    expect(element.style.outline).toBe('2px dashed blue')
    expect(element.style.cursor).toBe('pointer')
  })

  it('gives a number px, and leaves a unitless property unitless', () => {
    const [opacity, setOpacity] = createSignal(0.5)
    const element = render(
      (Text('x') as any).css({ opacity, marginTop: 4, zIndex: 3 })
    )

    expect(element.style.opacity).toBe('0.5')
    expect(element.style.marginTop).toBe('4px')
    expect(element.style.zIndex).toBe('3')

    setOpacity(0.25)
    flushSync()

    expect(element.style.opacity).toBe('0.25')
  })

  it('takes a signal through cssProperty and cssVariable', () => {
    const [decoration, setDecoration] = createSignal('underline')
    const [accent, setAccent] = createSignal('red')
    const element = render(
      (Text('x') as any)
        .cssProperty('textDecoration', decoration)
        .cssVariable('accent', accent)
    )

    setDecoration('line-through')
    setAccent('blue')
    flushSync()

    expect(element.style.textDecoration).toBe('line-through')
    expect(element.style.getPropertyValue('--accent')).toBe('blue')
  })

  // A signal with no value clears the property. Converting it would write the
  // text "undefined", which a custom property stores and passes to every
  // `var()` that reads it.
  it('clears a property when its signal has no value', () => {
    const [accent, setAccent] = createSignal<string | undefined>('red')
    const [outline, setOutline] = createSignal<string | null>('1px solid red')
    const element = render(
      (Text('x') as any).cssVariable('accent', accent).css({ outline })
    )

    setAccent(undefined)
    setOutline(null)
    flushSync()

    expect(element.style.getPropertyValue('--accent')).toBe('')
    expect(element.style.outline).toBe('')
  })

  it('copies its options, so a later change to the object has no effect', () => {
    const theme = { color: 'red' }
    const component = (Text('x') as any).css(theme)
    theme.color = 'blue'

    expect(render(component).style.color).toBe('red')
  })

  it('ignores a __proto__ key and applies the rest', () => {
    const options = JSON.parse('{"__proto__": "x", "color": "red"}')
    const element = render((Text('x') as any).css(options))

    expect(element.style.color).toBe('red')
  })

  // What the warning says was not applied must not be: a custom property
  // would otherwise store an object as "[object Object]", and an array as its
  // joined items.
  it('writes no structured value, even outside development', () => {
    const element = render(
      (Text('x') as any).css({
        '--theme': { mode: 'dark' },
        '--tokens': ['a', 'b'],
        color: 'red',
      })
    )

    expect(element.style.getPropertyValue('--theme')).toBe('')
    expect(element.style.getPropertyValue('--tokens')).toBe('')
    expect(element.style.color).toBe('red')
  })

  it('takes a signal through cssVendor', () => {
    const [lines, setLines] = createSignal('2')
    const element = document.createElement('div')
    cssVendor('webkit', 'line-clamp', lines).apply({} as any, {
      element,
    } as any)

    setLines('3')
    flushSync()

    expect(element.style.getPropertyValue('-webkit-line-clamp')).toBe('3')
  })
})

// The property names `.css()` writes, recorded rather than read back from
// JSDOM, which drops the prefixed properties it does not implement.
function writtenProperties(options: Record<string, string>): string[] {
  const names: string[] = []
  const element = {
    style: { setProperty: (name: string) => names.push(name) },
  }
  css(options).apply({} as any, { element } as any)
  return names
}

describe('.css() property names', () => {
  it('gives every vendor prefix its leading dash', () => {
    expect(
      writtenProperties({
        WebkitBackdropFilter: 'blur(1px)',
        webkitLineClamp: '2',
        MozAppearance: 'none',
        mozUserSelect: 'none',
        msFilter: 'none',
        oTransition: 'none',
      })
    ).toEqual([
      '-webkit-backdrop-filter',
      '-webkit-line-clamp',
      '-moz-appearance',
      '-moz-user-select',
      '-ms-filter',
      '-o-transition',
    ])
  })

  // The modifiers themselves write lowercase CSSOM names such as
  // `webkitLineClamp`. Without the leading dash the browser drops the
  // declaration, so `.lineClamp()` never clamped.
  it('lets .lineClamp() write its -webkit- declarations', () => {
    const element = render((Text('x') as any).lineClamp(3))

    // JSDOM implements -webkit-line-clamp but not -webkit-box-orient, so
    // only the first can be read back here.
    expect(element.style.getPropertyValue('-webkit-line-clamp')).toBe('3')
  })

  it('leaves kebab-case and custom properties as written', () => {
    expect(
      writtenProperties({ 'text-decoration': 'underline', '--accent': 'red' })
    ).toEqual(['text-decoration', '--accent'])
  })
})

describe('.css() in development', () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    process.env.NODE_ENV = 'development'
  })

  afterEach(() => {
    process.env.NODE_ENV = originalEnv
    vi.restoreAllMocks()
  })

  it('warns about a rule, which no inline style can hold', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      (Text('x') as any).css({
        '@media (prefers-reduced-motion: reduce)': 'transition: none',
        '&:focus-visible': 'outline: 2px solid',
        ' @supports(display:grid)': 'display: grid',
        outline: { width: 2 },
        '--tokens': ['a', 'b'],
        color: 'red',
      })
    )

    const warned = warn.mock.calls.map(call => String(call[0]))
    expect(warned).toHaveLength(5)
    expect(warned[0]).toContain('@media (prefers-reduced-motion: reduce)')
    expect(warned[1]).toContain('&:focus-visible')
    expect(warned[2]).toContain('@supports(display:grid)')
    expect(warned[3]).toContain('"outline"')
    expect(warned[4]).toContain('"--tokens"')
  })

  it('does not warn about declarations', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render((Text('x') as any).css({ color: 'red', '--accent': 'blue' }))

    expect(warn).not.toHaveBeenCalled()
  })
})
