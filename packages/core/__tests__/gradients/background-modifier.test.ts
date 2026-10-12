import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BackgroundModifier } from '@tachui/modifiers/appearance/background'
import { LinearGradient } from '../../src/gradients/index'
import { gradientToCSS } from '../../src/gradients/css-generator'
import { createColorAsset } from '../../src/assets'
import type { ModifierContext } from '../../src/modifiers/types'

describe('BackgroundModifier', () => {
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation',
    } as ModifierContext
  })

  it('applies string background', () => {
    const modifier = new BackgroundModifier({
      background: 'red',
    })

    modifier.apply({} as any, mockContext)

    expect(mockElement.style.background).toBe('red')
  })

  it('applies gradient background', () => {
    const gradient = LinearGradient({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom',
    })
    const expected = 'linear-gradient(in oklab to bottom, #FF0000, #00FF00)'
    const setProperty = vi.spyOn(mockElement.style, 'setProperty')

    const modifier = new BackgroundModifier({
      background: gradient,
    })

    modifier.apply({} as any, mockContext)

    // Assert the emitted declaration; the DOM normalizes it on read-back.
    expect(gradientToCSS(gradient)).toBe(expected)
    expect(setProperty.mock.calls.at(-1)?.slice(0, 2)).toEqual([
      'background',
      expected,
    ])
  })

  it('applies Asset background', () => {
    const backgroundAsset = createColorAsset('white', 'black', 'test-bg')

    const modifier = new BackgroundModifier({
      background: backgroundAsset,
    })

    modifier.apply({} as any, mockContext)

    expect(mockElement.style.background).toBe('white')
  })

  it('has correct priority', () => {
    const modifier = new BackgroundModifier({
      background: '#FF0000',
    })

    expect(modifier.priority).toBe(95) // ModifierPriority.APPEARANCE (background)
    expect(modifier.type).toBe('background')
  })

  it('handles missing element gracefully', () => {
    const modifier = new BackgroundModifier({
      background: '#FF0000',
    })

    const contextWithoutElement = {
      componentId: 'test-component',
      phase: 'creation',
    } as ModifierContext

    expect(() => {
      modifier.apply({} as any, contextWithoutElement)
    }).not.toThrow()
  })
})
