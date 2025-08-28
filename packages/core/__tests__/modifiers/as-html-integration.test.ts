import { describe, test, expect } from 'vitest'
import { ModifierBuilderImpl } from '../builder'

// Mock components for testing integration
const mockTextComponent = (content: string) => ({
  type: 'Text',
  __tachui_component_type: 'Text',
  content,
  props: { content },
})

const mockVStackComponent = () => ({
  type: 'VStack',
  __tachui_component_type: 'VStack',
  props: { children: [] },
})

describe('AsHTML Integration Tests', () => {
  test('asHTML method exists on ModifierBuilder', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    expect(typeof builder.asHTML).toBe('function')
  })

  test('asHTML returns ModifierBuilder for chaining', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    const result = builder.asHTML()

    expect(result).toBe(builder) // Should return the same builder instance for chaining
    expect(result.asHTML).toBeDefined() // Should still have asHTML method for further chaining
  })

  test('asHTML can be chained with other modifiers', () => {
    const component = mockTextComponent('<p>Styled content</p>')
    const builder = new ModifierBuilderImpl(component)

    // Chain multiple modifiers including asHTML
    const result = builder
      .asHTML()
      .padding(16)
      .backgroundColor('#f0f0f0')
      .cornerRadius(8)

    expect(result).toBe(builder)

    // Build should not throw
    expect(() => result.build()).not.toThrow()
  })

  test('asHTML adds modifier to the modifier list', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    // Access private modifiers array for testing
    const initialModifierCount = (builder as any).modifiers.length

    builder.asHTML()

    const finalModifierCount = (builder as any).modifiers.length
    expect(finalModifierCount).toBe(initialModifierCount + 1)

    // Check that the last modifier is AsHTMLModifier
    const lastModifier = (builder as any).modifiers[finalModifierCount - 1]
    expect(lastModifier.type).toBe('asHTML')
  })

  test('asHTML with options adds configured modifier', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    const customSanitizer = (html: string) =>
      html.replace(/<script.*?<\/script>/gi, '')

    builder.asHTML({
      skipSanitizer: false,
      customSanitizer,
      allowedTags: ['p', 'strong', 'em'],
    })

    const modifiers = (builder as any).modifiers
    const asHTMLModifier = modifiers[modifiers.length - 1]

    expect(asHTMLModifier.type).toBe('asHTML')
    expect(asHTMLModifier.properties.skipSanitizer).toBe(false)
    expect(asHTMLModifier.properties.customSanitizer).toBe(customSanitizer)
    expect(asHTMLModifier.properties.allowedTags).toEqual(['p', 'strong', 'em'])
  })

  test('multiple asHTML calls add multiple modifiers', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    builder.asHTML()
    builder.asHTML({ skipSanitizer: true })

    const modifiers = (builder as any).modifiers
    const asHTMLModifiers = modifiers.filter((m: any) => m.type === 'asHTML')

    expect(asHTMLModifiers).toHaveLength(2)
    expect(asHTMLModifiers[0].properties.skipSanitizer).toBeFalsy()
    expect(asHTMLModifiers[1].properties.skipSanitizer).toBe(true)
  })

  test('asHTML works in complex modifier chains', () => {
    const component = mockTextComponent(
      '<article><h1>Title</h1><p>Content</p></article>'
    )
    const builder = new ModifierBuilderImpl(component)

    // Complex realistic chain
    const result = builder
      .padding({ vertical: 20, horizontal: 16 })
      .backgroundColor('#ffffff')
      .asHTML({ allowedTags: ['article', 'h1', 'p', 'strong', 'em'] })
      .cornerRadius(8)
      .shadow({
        x: 0,
        y: 2,
        blur: 8,
        color: 'rgba(0, 0, 0, 0.1)',
      })
      .margin({ bottom: 16 })
      .maxWidth(600)
      .fontSize('16px')
      .lineHeight(1.6)

    expect(result).toBe(builder)
    expect(() => result.build()).not.toThrow()

    // Check that asHTML modifier is in the chain
    const modifiers = (builder as any).modifiers
    const hasAsHTML = modifiers.some((m: any) => m.type === 'asHTML')
    expect(hasAsHTML).toBe(true)
  })

  test('asHTML modifier priority is correct', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = new ModifierBuilderImpl(component)

    builder.asHTML()

    const modifiers = (builder as any).modifiers
    const asHTMLModifier = modifiers[modifiers.length - 1]

    expect(asHTMLModifier.priority).toBe(25) // After layout, before styling
  })

  test('built component maintains original structure with asHTML modifier', () => {
    const originalContent =
      '<div class="article"><h1>Title</h1><p>Content</p></div>'
    const component = mockTextComponent(originalContent)
    const builder = new ModifierBuilderImpl(component)

    const builtComponent = builder.asHTML().padding(16).build()

    // Component should maintain its basic structure
    expect(builtComponent).toBeDefined()
    expect(typeof builtComponent).toBe('object')

    // Should have modifiers applied
    if ('modifiers' in builtComponent) {
      const modifiers = (builtComponent as any).modifiers
      const hasAsHTML = modifiers.some((m: any) => m.type === 'asHTML')
      const hasPadding = modifiers.some((m: any) => m.type === 'padding')

      expect(hasAsHTML).toBe(true)
      expect(hasPadding).toBe(true)
    }
  })

  test('asHTML error handling in build chain', () => {
    const component = mockVStackComponent() // Non-Text component
    const builder = new ModifierBuilderImpl(component)

    // Adding asHTML to builder should work (error occurs during application)
    expect(() => {
      builder.asHTML()
    }).not.toThrow()

    // Build should work (error occurs during render/apply)
    expect(() => {
      builder.build()
    }).not.toThrow()

    // The error would occur when the modifier is actually applied to DOM
    const modifiers = (builder as any).modifiers
    const asHTMLModifier = modifiers[modifiers.length - 1]

    // Mock DOM application
    const element = document.createElement('div')
    const context = {
      componentId: 'test',
      componentInstance: component,
      element,
      phase: 'creation' as const,
    }

    expect(() => {
      asHTMLModifier.apply(null, context)
    }).toThrow('AsHTML modifier can only be applied to Text components')
  })
})
