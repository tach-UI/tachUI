import { describe, it, expect, beforeEach } from 'vitest'
import { BackgroundModifier } from '../../modifiers/background'
import { LinearGradient } from '../index'
import { createColorAsset } from '../../assets'
import type { ModifierContext } from '../../modifiers/types'

describe('BackgroundModifier', () => {
  let mockElement: HTMLElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = document.createElement('div')
    mockContext = {
      componentId: 'test-component',
      element: mockElement,
      phase: 'creation'
    } as ModifierContext
  })

  it('applies string background', () => {
    const modifier = new BackgroundModifier({
      background: 'red'
    })

    modifier.apply({} as any, mockContext)

    expect(mockElement.style.background).toBe('red')
  })

  it('applies gradient background', () => {
    const gradient = LinearGradient({
      colors: ['#FF0000', '#00FF00'],
      startPoint: 'top',
      endPoint: 'bottom'
    })

    const modifier = new BackgroundModifier({
      background: gradient
    })

    modifier.apply({} as any, mockContext)

    expect(mockElement.style.background).toBe('linear-gradient(to bottom, #FF0000, #00FF00)')
  })

  it('applies Asset background', () => {
    const backgroundAsset = createColorAsset('white', 'black', 'test-bg')

    const modifier = new BackgroundModifier({
      background: backgroundAsset
    })

    modifier.apply({} as any, mockContext)

    expect(mockElement.style.background).toBe('white')
  })

  it('has correct priority', () => {
    const modifier = new BackgroundModifier({
      background: '#FF0000'
    })

    expect(modifier.priority).toBe(95)
    expect(modifier.type).toBe('background')
  })

  it('handles missing element gracefully', () => {
    const modifier = new BackgroundModifier({
      background: '#FF0000'
    })

    const contextWithoutElement = {
      componentId: 'test-component',
      phase: 'creation'
    } as ModifierContext

    expect(() => {
      modifier.apply({} as any, contextWithoutElement)
    }).not.toThrow()
  })
})