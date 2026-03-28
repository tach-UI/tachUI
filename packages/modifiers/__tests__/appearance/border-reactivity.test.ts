import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot, createSignal, flushSync, setTheme } from '@tachui/core/reactive'
import { ColorAsset } from '@tachui/core/assets'
import { border } from '../../src/appearance'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'

const testDisposers: Array<() => void> = []

function applyModifierToElement(
  modifier: { apply: (node: DOMNode, context: ModifierContext) => DOMNode | undefined },
  element: HTMLElement
): void {
  const context: ModifierContext = {
    componentId: 'border-reactivity-test',
    element,
    phase: 'creation',
  }

  modifier.apply({ element } as unknown as DOMNode, context)
}

function expectColorValue(actual: string, hex: string, rgb: string): void {
  expect([hex.toLowerCase(), rgb.toLowerCase()]).toContain(actual.toLowerCase())
}

async function waitForEffects(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('Border Modifier Reactivity', () => {
  beforeEach(() => {
    setTheme('light')
    flushSync()
  })

  afterEach(() => {
    while (testDisposers.length > 0) {
      const dispose = testDisposers.pop()
      dispose?.()
    }
    setTheme('light')
    flushSync()
  })

  it('updates border color when color signal changes', () => {
    const [color, setColor] = createSignal('#ff0000')

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      applyModifierToElement(
        border({
          width: 1,
          style: 'solid',
          color: color as unknown as string,
        }),
        element
      )
      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#ff0000',
      'rgb(255, 0, 0)'
    )
    setColor('#0000ff')
    flushSync()
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#0000ff',
      'rgb(0, 0, 255)'
    )
  })

  it('updates border width when width signal changes', () => {
    const [width, setWidth] = createSignal(1)

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      applyModifierToElement(
        border({
          width,
          style: 'solid',
          color: '#111111',
        } as any),
        element
      )
      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('1px')
    setWidth(3)
    flushSync()
    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('3px')
  })

  it('updates border style when style signal changes', () => {
    const [style, setStyle] = createSignal<'solid' | 'dashed'>('solid')

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      applyModifierToElement(
        border({
          width: 1,
          color: '#111111',
          style: style as unknown as 'solid',
        } as any),
        element
      )
      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    expect(cleanup.element.style.getPropertyValue('border-style')).toBe('solid')
    setStyle('dashed')
    flushSync()
    expect(cleanup.element.style.getPropertyValue('border-style')).toBe('dashed')
  })

  it('supports mixed reactive color with static border width', () => {
    const [color, setColor] = createSignal('#112233')

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      applyModifierToElement(
        border({
          width: 2,
          style: 'solid',
          color: color as unknown as string,
        }),
        element
      )
      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('2px')
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#112233',
      'rgb(17, 34, 51)'
    )

    setColor('#334455')
    flushSync()

    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('2px')
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#334455',
      'rgb(51, 68, 85)'
    )
  })

  it('updates signal color and signal width together without clobbering', () => {
    const [color, setColor] = createSignal('#112233')
    const [width, setWidth] = createSignal(1)

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      applyModifierToElement(
        border({
          width,
          style: 'solid',
          color: color as unknown as string,
        } as any),
        element
      )
      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('1px')
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#112233',
      'rgb(17, 34, 51)'
    )

    setWidth(4)
    setColor('#334455')
    flushSync()

    expect(cleanup.element.style.getPropertyValue('border-width')).toBe('4px')
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#334455',
      'rgb(51, 68, 85)'
    )
  })

  it('re-resolves ColorAsset border color when theme changes', async () => {
    setTheme('dark')
    await waitForEffects()

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      const asset = ColorAsset.init({
        name: 'borderAsset',
        default: '#EDEAE9',
        light: '#EDEAE9',
        dark: '#332A25',
      })

      applyModifierToElement(
        border({
          width: 1,
          style: 'solid',
          color: asset as unknown as string,
        }),
        element
      )

      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    await waitForEffects()
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#332A25',
      'rgb(51, 42, 37)'
    )

    setTheme('light')
    await waitForEffects()
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-color'),
      '#EDEAE9',
      'rgb(237, 234, 233)'
    )
  })

  it('re-resolves side-specific ColorAsset border color when theme changes', async () => {
    setTheme('dark')
    await waitForEffects()

    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      const asset = ColorAsset.init({
        name: 'topBorderAsset',
        default: '#EDEAE9',
        light: '#EDEAE9',
        dark: '#332A25',
      })

      applyModifierToElement(
        border({
          top: {
            width: 1,
            style: 'solid',
            color: asset as unknown as string,
          },
        } as any),
        element
      )

      return { dispose, element }
    })
    testDisposers.push(cleanup.dispose)

    await waitForEffects()
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-top-color'),
      '#332A25',
      'rgb(51, 42, 37)'
    )

    setTheme('light')
    await waitForEffects()
    expectColorValue(
      cleanup.element.style.getPropertyValue('border-top-color'),
      '#EDEAE9',
      'rgb(237, 234, 233)'
    )
  })
})
