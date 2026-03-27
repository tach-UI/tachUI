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
    expect(cleanup.element.style.background).toBe('#EDEAE9')

    setTheme('dark')
    await waitForEffects()
    expect(cleanup.element.style.background).toBe('#332A25')

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
    expect(cleanup.element.style.color).toBe('#EDEAE9')

    setTheme('dark')
    await waitForEffects()
    expect(cleanup.element.style.color).toBe('#332A25')

    cleanup.dispose()
  })
})
