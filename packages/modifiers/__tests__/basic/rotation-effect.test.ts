/**
 * `.rotationEffect()`
 *
 * The builder type declared it and `AnimationModifier` could apply it, but no
 * factory was registered, so the chain had nothing to resolve: code that
 * typechecked threw "rotationEffect is not a function". These tests go
 * through the component chain, which is where that failure showed.
 *
 * It also has to compose: a raw `.transform()` after it, or a scale with an
 * anchor of its own, must not erase it or its anchor.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { HStack, Text } from '@tachui/primitives'
import { createSignal, flushSync, renderComponent } from '@tachui/core'
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

describe('.rotationEffect()', () => {
  it('is registered as a modifier', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')

    expect(globalModifierRegistry.has('rotationEffect')).toBe(true)
  })

  it('rotates by degrees around the center by default', () => {
    const element = render((Text('x') as any).rotationEffect(90))

    expect(element.style.transform).toBe('rotate(90deg)')
    expect(element.style.transformOrigin).toBe('')
  })

  it('rotates a stack around the anchor it is given', () => {
    const element = render(
      (HStack({ children: [Text('x')] }) as any).rotationEffect(
        -45,
        'bottomTrailing'
      )
    )

    // The anchor travels inside the transform rather than through
    // `transform-origin`, which could only hold one effect's anchor.
    expect(element.style.transform).toBe(
      'translate(50%, 50%) rotate(-45deg) translate(-50%, -50%)'
    )
    expect(element.style.transformOrigin).toBe('')
  })

  it('follows a signal', () => {
    const [angle, setAngle] = createSignal(10)
    const element = render((Text('x') as any).rotationEffect(angle))

    expect(element.style.transform).toBe('rotate(10deg)')

    setAngle(30)
    flushSync()

    expect(element.style.transform).toBe('rotate(30deg)')
  })

  it('composes with scaleEffect in either order', () => {
    const rotatedFirst = render(
      (Text('x') as any).rotationEffect(90).scaleEffect(2)
    )
    const scaledFirst = render(
      (Text('x') as any).scaleEffect(2).rotationEffect(90)
    )

    for (const element of [rotatedFirst, scaledFirst]) {
      expect(element.style.transform).toBe('rotate(90deg) scale(2, 2)')
    }
  })

  it('replaces a previous rotation rather than stacking it', () => {
    const [angle, setAngle] = createSignal(10)
    const element = render(
      (Text('x') as any).scaleEffect(2).rotationEffect(angle)
    )

    setAngle(20)
    flushSync()

    expect(element.style.transform).not.toContain('rotate(10deg)')
    expect(element.style.transform).toContain('rotate(20deg)')
    expect(element.style.transform).toContain('scale(2, 2)')
  })

  it('survives a raw transform chained after it', () => {
    const element = render(
      (Text('x') as any).rotationEffect(90).transform('translateX(10px)')
    )

    expect(element.style.transform).toBe('rotate(90deg) translateX(10px)')
  })

  it('survives a signal-driven raw transform updating', () => {
    const [raw, setRaw] = createSignal('translateX(10px)')
    const element = render(
      (Text('x') as any).rotationEffect(90).transform(raw)
    )

    setRaw('translateY(4px)')
    flushSync()

    expect(element.style.transform).toBe('rotate(90deg) translateY(4px)')
  })

  // A raw transform is opaque, so a rotate inside it is not replaced by the
  // effect: both apply, the effect outermost.
  it('stacks with a rotate inside a raw transform', () => {
    const element = render(
      (Text('x') as any).transform('rotate(10deg)').rotationEffect(20)
    )

    expect(element.style.transform).toBe('rotate(20deg) rotate(10deg)')
  })

  it('keeps an anchor of its own beside a scale anchored elsewhere', () => {
    const element = render(
      (Text('x') as any)
        .scaleEffect(2, undefined, 'topLeading')
        .rotationEffect(90, 'bottomTrailing')
    )

    expect(element.style.transform).toBe(
      'translate(50%, 50%) rotate(90deg) translate(-50%, -50%) ' +
        'translate(-50%, -50%) scale(2, 2) translate(50%, 50%)'
    )
    expect(element.style.transformOrigin).toBe('')
  })

  it('keeps the rotation when a raw transform clears to none', () => {
    const [raw, setRaw] = createSignal('translateX(10px)')
    const element = render(
      (Text('x') as any).rotationEffect(90).transform(raw)
    )

    setRaw('none')
    flushSync()

    expect(element.style.transform).toBe('rotate(90deg)')
  })
})
