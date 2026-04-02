import { describe, expect, it } from 'vitest'
import {
  blendMode,
  backgroundBlendMode,
  backgroundImage,
  backgroundColor,
} from '../../src/appearance'
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

  it('blendMode supports normal as reset/off mode', () => {
    const element = document.createElement('div')
    applyModifierToElement(blendMode('multiply'), element)
    expect(element.style.getPropertyValue('mix-blend-mode')).toBe('multiply')

    applyModifierToElement(blendMode('normal'), element)
    expect(element.style.getPropertyValue('mix-blend-mode')).toBe('normal')
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

  it('blendMode and backgroundBlendMode can coexist on the same element', () => {
    const element = document.createElement('div')

    applyModifierToElement(blendMode('difference'), element)
    applyModifierToElement(backgroundBlendMode('screen'), element)

    expect(element.style.getPropertyValue('mix-blend-mode')).toBe('difference')
    expect(element.style.getPropertyValue('background-blend-mode')).toBe('screen')
  })

  it('integrates with backgroundImage and backgroundColor modifiers', () => {
    const element = document.createElement('div')

    // Regression: backgroundColor applied after backgroundImage should not wipe image.
    applyModifierToElement(backgroundImage('url("/texture.png")'), element)
    applyModifierToElement(backgroundColor('#3a86ff'), element)
    applyModifierToElement(backgroundBlendMode('overlay'), element)

    expect(element.style.getPropertyValue('background-image')).toContain(
      '/texture.png'
    )
    expect(
      ['#3a86ff', 'rgb(58, 134, 255)'].includes(
        element.style.getPropertyValue('background-color')
      )
    ).toBe(true)
    expect(element.style.getPropertyValue('background-blend-mode')).toBe('overlay')
  })
})
