/**
 * `docs/guide/examples/css-modifier-examples.md`, rendered
 *
 * The page used to show forms `.css()` never supported — nested `@media`,
 * `@supports` and `&:focus-visible` blocks, a function in place of a signal —
 * which were silently dropped. Each example now on it is rendered here and
 * checked against what the page says it does, so the page cannot drift back.
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Text, VStack } from '@tachui/primitives'
import {
  createMemo,
  createSignal,
  flushSync,
  renderComponent,
} from '@tachui/core'
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

async function flushReactiveUpdates(): Promise<void> {
  flushSync()
  await new Promise<void>(resolve => queueMicrotask(resolve))
}

function render(component: unknown): HTMLElement {
  const host = document.createElement('div')
  renderComponent(component as any, host)
  return host.firstElementChild as HTMLElement
}

const style = (element: HTMLElement, property: string) =>
  element.style.getPropertyValue(property)

describe('CSS modifier examples page', () => {
  it('single properties', () => {
    const element = render(
      (Text('Smooth scrolling') as any)
        .cssProperty('scroll-behavior', 'smooth')
        .cssProperty('containerType', 'inline-size')
        .padding(16)
    )

    expect(style(element, 'scroll-behavior')).toBe('smooth')
    expect(style(element, 'container-type')).toBe('inline-size')
    expect(style(element, 'padding')).toBe('16px')
  })

  it('several properties at once', () => {
    const element = render(
      (VStack({ children: [] }) as any).css({
        border: '1px solid rgba(255, 255, 255, 0.3)',
        borderRadius: '16px',
        background: 'rgba(255, 255, 255, 0.1)',
      })
    )

    expect(style(element, 'border-radius')).toBe('16px')
    expect(style(element, 'background')).toContain('rgba(255, 255, 255, 0.1)')
  })

  it('grid and scroll snapping', () => {
    const grid = render(
      (VStack({ children: [] }) as any).css({
        display: 'grid',
        gridAutoFlow: 'dense',
        gap: '12px',
      })
    )
    const snap = render(
      (VStack({ children: [] }) as any).css({
        scrollSnapType: 'y mandatory',
        overscrollBehavior: 'contain',
      })
    )

    expect(style(grid, 'display')).toBe('grid')
    expect(style(grid, 'grid-auto-flow')).toBe('dense')
    expect(style(snap, 'scroll-snap-type')).toBe('y mandatory')
    expect(style(snap, 'overscroll-behavior')).toBe('contain')
  })

  it('design tokens: cssVariable adds the -- prefix', () => {
    const element = render(
      (VStack({ children: [] }) as any)
        .cssVariable('color-primary', '#007AFF')
        .cssVariable('--space-md', '16px')
    )

    expect(style(element, '--color-primary')).toBe('#007AFF')
    expect(style(element, '--space-md')).toBe('16px')
  })

  it('theme-aware values follow a memo', async () => {
    const [scheme, setScheme] = createSignal<'light' | 'dark'>('light')
    const background = createMemo(() =>
      scheme() === 'dark' ? '#1a1a1a' : '#ffffff'
    )
    const element = render(
      (VStack({ children: [] }) as any)
        .cssVariable('bg-primary', background)
        .css({ backgroundColor: 'var(--bg-primary)' })
    )

    expect(style(element, '--bg-primary')).toBe('#ffffff')

    setScheme('dark')
    await flushReactiveUpdates()

    expect(style(element, '--bg-primary')).toBe('#1a1a1a')
    expect(style(element, 'background-color')).toBe('var(--bg-primary)')
  })

  it('a layered background follows a memo', async () => {
    const [dark, setDark] = createSignal(false)
    const layered = createMemo(() =>
      dark() ? 'linear-gradient(black, gray)' : 'linear-gradient(white, silver)'
    )
    const element = render(
      (VStack({ children: [] }) as any).css({ background: layered })
    )

    setDark(true)
    await flushReactiveUpdates()

    expect(style(element, 'background')).toContain('linear-gradient(black, gray)')
  })

  // The page's vendor-prefix rule: a leading capital gets a leading dash.
  // `-webkit-line-clamp` is used because JSDOM drops most prefixed
  // properties it does not implement.
  it('vendor prefixes, camelCase or kebab-case', () => {
    const camel = render(
      (VStack({ children: [] }) as any).css({ WebkitLineClamp: '2' })
    )
    const kebab = render(
      (VStack({ children: [] }) as any).css({ '-webkit-line-clamp': '3' })
    )

    expect(style(camel, '-webkit-line-clamp')).toBe('2')
    expect(style(kebab, '-webkit-line-clamp')).toBe('3')
  })

  it('numbers: px except on unitless properties', () => {
    const element = render(
      (VStack({ children: [] }) as any).css({ marginTop: 4, flex: 1, opacity: 0.5 })
    )

    expect(style(element, 'margin-top')).toBe('4px')
    expect(style(element, 'flex-grow') || style(element, 'flex')).toMatch(/^1/)
    expect(style(element, 'opacity')).toBe('0.5')
  })

  it('beyond inline styles: the css prop sets a class', () => {
    const element = render(VStack({ children: [], css: 'card' } as any))

    expect(element.classList.contains('card')).toBe(true)
  })
})
