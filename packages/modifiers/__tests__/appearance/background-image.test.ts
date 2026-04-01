import { beforeEach, describe, expect, it } from 'vitest'
import { createRoot, setTheme } from '@tachui/core/reactive'
import { ImageAsset } from '@tachui/core/assets'
import { background, backgroundImage } from '../../src/appearance'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '@tachui/types/modifiers'

function applyModifierToElement(
  modifier: { apply: (node: DOMNode, context: ModifierContext) => DOMNode | undefined },
  element: HTMLElement
): void {
  const context: ModifierContext = {
    componentId: 'background-image-test',
    element,
    phase: 'creation',
  }
  modifier.apply({ element } as unknown as DOMNode, context)
}

async function waitForEffects(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

describe('backgroundImage modifier', () => {
  beforeEach(() => {
    setTheme('light')
  })

  it('applies default repeat/size/position values', () => {
    const element = document.createElement('div')

    applyModifierToElement(backgroundImage('url("/pattern.png")'), element)

    expect(element.style.getPropertyValue('background-image')).toContain(
      '/pattern.png'
    )
    expect(element.style.getPropertyValue('background-repeat')).toBe('no-repeat')
    expect(element.style.getPropertyValue('background-size')).toBe('cover')
    expect(element.style.getPropertyValue('background-position')).toBe('center')
  })

  it('maps repeat options to CSS background-repeat values', () => {
    const element = document.createElement('div')

    applyModifierToElement(
      backgroundImage('url("/pattern.png")', {
        repeat: 'tile',
        size: 'auto',
        position: 'top left',
      }),
      element
    )

    expect(element.style.getPropertyValue('background-repeat')).toBe('repeat')
    expect(element.style.getPropertyValue('background-size')).toBe('auto')
    expect(element.style.getPropertyValue('background-position')).toBe('top left')
  })

  it('accepts ImageAssetProxy sources and resolves reactively by theme', async () => {
    const cleanup = createRoot(dispose => {
      const element = document.createElement('div')
      const imageAsset = ImageAsset.init({
        name: 'hero-pattern',
        default: '/light.png',
        light: '/light.png',
        dark: '/dark.png',
      })

      applyModifierToElement(backgroundImage(imageAsset), element)
      return { dispose, element }
    })

    await waitForEffects()
    expect(cleanup.element.style.getPropertyValue('background-image')).toContain(
      '/light.png'
    )

    setTheme('dark')
    await waitForEffects()
    expect(cleanup.element.style.getPropertyValue('background-image')).toContain(
      '/dark.png'
    )

    cleanup.dispose()
  })

  it('does not conflict with background() shorthand when both are applied', () => {
    const element = document.createElement('div')

    applyModifierToElement(background('linear-gradient(45deg, #111, #222)'), element)
    applyModifierToElement(
      backgroundImage('url("/overlay.png")', {
        repeat: 'repeat-x',
        size: 'contain',
        position: 'left top',
      }),
      element
    )

    expect(element.style.getPropertyValue('background-image')).toContain(
      '/overlay.png'
    )
    expect(element.style.getPropertyValue('background-repeat')).toBe('repeat-x')
    expect(element.style.getPropertyValue('background-size')).toBe('contain')
    expect(element.style.getPropertyValue('background-position')).toBe('left top')
  })
})
