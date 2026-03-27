import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot, setTheme } from '@tachui/core/reactive'
import { ColorAsset } from '@tachui/core/assets'
import { backgroundColor, foregroundColor } from '../../src/appearance'
import type { ModifierContext } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/types/runtime'

function applyModifierToElement(modifier: { apply: (node: DOMNode, context: ModifierContext) => DOMNode | undefined }, element: HTMLElement): void {
  const context: ModifierContext = {
    componentId: 'background-theme-reactivity-test',
    element,
    phase: 'creation',
  }

  modifier.apply({ element } as unknown as DOMNode, context)
}

async function waitForEffects(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

function expectColorValue(actual: string, hex: string, rgb: string): void {
  expect([hex.toLowerCase(), rgb]).toContain(actual.toLowerCase())
}

describe('Background Modifier Theme Reactivity', () => {
  beforeEach(() => {
    setTheme('light')
  })

  it('updates backgroundColor(ColorAsset) when theme changes', async () => {
    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      const asset = ColorAsset.init({
        name: 'backgroundAsset',
        default: '#EDEAE9',
        light: '#EDEAE9',
        dark: '#332A25',
      })

      applyModifierToElement(backgroundColor(asset), element)
      return { dispose, element }
    })

    await waitForEffects()
    expectColorValue(cleanup.element.style.background, '#EDEAE9', 'rgb(237, 234, 233)')

    setTheme('dark')
    await waitForEffects()
    expectColorValue(cleanup.element.style.background, '#332A25', 'rgb(51, 42, 37)')

    cleanup.dispose()
  })

  it('keeps foregroundColor(ColorAsset) behavior unchanged', async () => {
    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      const asset = ColorAsset.init({
        name: 'foregroundAsset',
        default: '#EDEAE9',
        light: '#EDEAE9',
        dark: '#332A25',
      })

      applyModifierToElement(foregroundColor(asset), element)
      return { dispose, element }
    })

    await waitForEffects()
    expectColorValue(cleanup.element.style.color, '#EDEAE9', 'rgb(237, 234, 233)')

    setTheme('dark')
    await waitForEffects()
    expectColorValue(cleanup.element.style.color, '#332A25', 'rgb(51, 42, 37)')

    cleanup.dispose()
  })
})
