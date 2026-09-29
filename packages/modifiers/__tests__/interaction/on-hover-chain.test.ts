/**
 * `.onHover()` on the builder
 *
 * Hover had a factory and a registry entry but no builder method, so a chain
 * on `.modifier` reached it only through the internal `.modifier()` hatch.
 * The builder now declares it next to `.onTap()`, delegating to the same
 * registry entry, and the factory keeps working as before.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { VStack } from '@tachui/primitives'
import { renderComponent } from '@tachui/core'
import { ModifierBuilderImpl } from '@tachui/core/modifiers'
import { OnHoverModifier, onHover } from '../../src/interaction/on-hover'
import '../../src/preload/basic'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const key of [
    'document', 'window', 'Element', 'HTMLElement', 'DocumentFragment', 'Node',
    'Event', 'MouseEvent',
  ]) {
    ;(globalThis as any)[key] =
      key === 'document' ? dom.window.document
      : key === 'window' ? dom.window
      : (dom.window as any)[key]
  }
})

function stack() {
  return VStack({ children: [], spacing: 0 })
}

function render(component: unknown) {
  const host = document.createElement('div')
  const dispose = renderComponent(component as any, host)
  return { element: host.firstElementChild as HTMLElement, dispose }
}

function hover(element: Element) {
  element.dispatchEvent(new MouseEvent('mouseenter'))
}

function unhover(element: Element) {
  element.dispatchEvent(new MouseEvent('mouseleave'))
}

describe('.modifier.onHover(cb)', () => {
  it('is a builder method, not a registry fallback', () => {
    expect(typeof ModifierBuilderImpl.prototype.onHover).toBe('function')
  })

  it('returns the builder and appends the registered onHover modifier', () => {
    const builder = stack().modifier
    const chained = builder.onHover(() => {})

    expect(chained).toBe(builder)

    const { modifiers } = chained.padding(4).build()
    expect(modifiers[0]).toBeInstanceOf(OnHoverModifier)
    expect(modifiers[0].type).toBe('onHover')
  })

  it('passes the callback to the registry entry', () => {
    const callback = vi.fn()
    const { modifiers } = stack().modifier.onHover(callback).build()

    expect((modifiers[0] as OnHoverModifier).properties.onHover).toBe(callback)
  })

  it('calls back with true on mouseenter and false on mouseleave', () => {
    const callback = vi.fn()
    const { element } = render(stack().modifier.onHover(callback).build())

    hover(element)
    expect(callback).toHaveBeenLastCalledWith(true)

    unhover(element)
    expect(callback).toHaveBeenLastCalledWith(false)
    expect(callback.mock.calls).toEqual([[true], [false]])
  })

  it('composes with .onTap() without either suppressing the other', () => {
    const hoverCallback = vi.fn()
    const tapCallback = vi.fn()
    const { element } = render(
      stack().modifier.onHover(hoverCallback).onTap(tapCallback).build()
    )

    hover(element)
    element.dispatchEvent(new MouseEvent('click'))
    unhover(element)

    expect(hoverCallback.mock.calls).toEqual([[true], [false]])
    expect(tapCallback).toHaveBeenCalledTimes(1)
    expect(tapCallback.mock.calls[0][0]).toBeInstanceOf(MouseEvent)
  })

  it('composes when .onTap() comes first', () => {
    const hoverCallback = vi.fn()
    const tapCallback = vi.fn()
    const { element } = render(
      stack().modifier.onTap(tapCallback).onHover(hoverCallback).build()
    )

    element.dispatchEvent(new MouseEvent('click'))
    hover(element)

    expect(tapCallback).toHaveBeenCalledTimes(1)
    expect(hoverCallback).toHaveBeenLastCalledWith(true)
  })

  it('removes its listeners on unmount and calls back no more', () => {
    const callback = vi.fn()
    const component = stack().modifier.onHover(callback).build()
    const host = document.createElement('div')
    const removeSpy = vi.spyOn(Element.prototype, 'removeEventListener')
    const dispose = renderComponent(component as any, host)
    const element = host.firstElementChild as HTMLElement

    hover(element)
    expect(callback).toHaveBeenLastCalledWith(true)

    dispose()
    const removed = removeSpy.mock.calls.map(([type]) => type)
    removeSpy.mockRestore()
    expect(removed).toEqual(
      expect.arrayContaining(['mouseenter', 'mouseleave'])
    )

    // Cleanup resets hover state once, as the factory always has.
    const callsAtDispose = callback.mock.calls.length

    hover(element)
    unhover(element)
    expect(callback).toHaveBeenCalledTimes(callsAtDispose)
  })
})

describe('onHover factory', () => {
  it('still works through the internal .modifier() hatch', () => {
    const callback = vi.fn()
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    try {
      const { element } = render(
        stack().modifier.modifier(onHover(callback)).build()
      )

      hover(element)
      unhover(element)
      expect(callback.mock.calls).toEqual([[true], [false]])
    } finally {
      warn.mockRestore()
    }
  })

  it('still returns an OnHoverModifier carrying the callback', () => {
    const callback = vi.fn()
    const modifier = onHover(callback)

    expect(modifier).toBeInstanceOf(OnHoverModifier)
    expect(modifier.properties.onHover).toBe(callback)
  })
})

describe('.modifier() documentation', () => {
  const source = readFileSync(
    resolve(__dirname, '../../../core/src/modifiers/builder.ts'),
    'utf8'
  )

  it('keeps .modifier() documented as internal only', () => {
    const doc = source.slice(0, source.indexOf('modifier(modifier: Modifier)'))
    const lastDoc = doc.slice(doc.lastIndexOf('/**'))

    expect(lastDoc).toContain('@deprecated DO NOT USE - This is an internal API only.')
  })

  it('does not present .modifier() as the route for hover', () => {
    expect(source).not.toMatch(/\.modifier\(\s*onHover/)
  })
})
