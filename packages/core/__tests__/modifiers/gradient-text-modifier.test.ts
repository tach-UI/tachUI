/**
 * Gradient Text Modifier Test Suite
 *
 * Tests the gradientText modifier method on the modifier chain
 */

import { describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'

describe('Gradient Text Modifier', () => {
  it('should apply gradient text modifier correctly', () => {
    const gradient = 'linear-gradient(135deg, #ff0000, #00ff00, #0000ff)'

    const textComponent = Text('Hello World')
      .gradientText(gradient)
      .build()

    // Verify the component has the expected modifiers
    expect(textComponent.modifiers).toBeDefined()
    expect(textComponent.modifiers.length).toBe(1)

    const gradientModifier = textComponent.modifiers[0]
    expect(gradientModifier.type).toBe('backgroundClip')
    expect(gradientModifier.properties.backgroundImage).toBe(gradient)
    expect(gradientModifier.properties.backgroundClip).toBe('text')
    expect(gradientModifier.properties.color).toBe('transparent')
    expect(gradientModifier.properties.webkitBackgroundClip).toBe('text')
    expect(gradientModifier.properties.webkitTextFillColor).toBe('transparent')
  })

  it('should chain with other modifiers', () => {
    const gradient = 'linear-gradient(45deg, #667eea, #764ba2)'

    const textComponent = Text('Chained Gradient')
      .fontSize(24)
      .gradientText(gradient)
      .padding({ horizontal: 16, vertical: 8 })
      .build()

    expect(textComponent.modifiers).toBeDefined()
    expect(textComponent.modifiers.length).toBe(3)

    // Check order: fontSize, gradientText, padding
    expect(textComponent.modifiers[0].type).toBe('appearance') // fontSize
    expect(textComponent.modifiers[1].type).toBe('backgroundClip') // gradientText
    expect(textComponent.modifiers[2].type).toBe('padding') // padding
  })

  it('should work with different gradient types', () => {
    const testCases = [
      'linear-gradient(90deg, #ff0000, #00ff00)',
      'radial-gradient(circle, #667eea, #764ba2)',
      'conic-gradient(from 45deg, #ff0000, #ffff00, #00ff00, #0000ff)',
    ]

    testCases.forEach(gradient => {
      const textComponent = Text('Test').gradientText(gradient).build()

      const gradientModifier = textComponent.modifiers[0]
      expect(gradientModifier.properties.backgroundImage).toBe(gradient)
    })
  })

  it('should apply consistent webkit properties for cross-browser compatibility', () => {
    const gradient = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

    const textComponent = Text('Webkit Test')
      .gradientText(gradient)
      .build()

    const gradientModifier = textComponent.modifiers[0]

    // Ensure webkit properties are correctly set
    expect(gradientModifier.properties.webkitBackgroundClip).toBe('text')
    expect(gradientModifier.properties.webkitTextFillColor).toBe('transparent')
    expect(gradientModifier.properties.backgroundClip).toBe('text')
    expect(gradientModifier.properties.color).toBe('transparent')
  })

  it('should work with empty string gradient (edge case)', () => {
    const textComponent = Text('Edge Case').gradientText('').build()

    const gradientModifier = textComponent.modifiers[0]
    expect(gradientModifier.properties.backgroundImage).toBe('')
    expect(gradientModifier.properties.backgroundClip).toBe('text')
  })
})
