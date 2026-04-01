import { describe, expect, it } from 'vitest'
import { blendMode, backgroundBlendMode } from '../../src/appearance'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '@tachui/types/modifiers'

function applyModifierToElement(
  modifier: { apply: (node: DOMNode, context: ModifierContext) => DOMNode | undefined },
  element: HTMLElement
): void {
  const context: ModifierContext = {
    componentId: 'blend-mode-test',
    element,
    phase: 'creation',
  }
  modifier.apply({ element } as unknown as DOMNode, context)
}

describe('blend mode modifiers', () => {
  it('blendMode sets mix-blend-mode', () => {
    const element = document.createElement('div')
    applyModifierToElement(blendMode('multiply'), element)
    expect(element.style.getPropertyValue('mix-blend-mode')).toBe('multiply')
  })

  it('backgroundBlendMode sets background-blend-mode', () => {
    const element = document.createElement('div')
    applyModifierToElement(backgroundBlendMode('screen'), element)
    expect(element.style.getPropertyValue('background-blend-mode')).toBe('screen')
  })

  it('coexists with backgroundImage/backgroundColor styles', () => {
    const element = document.createElement('div')
    element.style.setProperty('background-image', 'url("/texture.png")')
    element.style.setProperty('background-color', 'rgb(58, 134, 255)')

    applyModifierToElement(backgroundBlendMode('overlay'), element)

    expect(element.style.getPropertyValue('background-image')).toContain(
      '/texture.png'
    )
    expect(element.style.getPropertyValue('background-color')).toBe(
      'rgb(58, 134, 255)'
    )
    expect(element.style.getPropertyValue('background-blend-mode')).toBe('overlay')
  })
})
