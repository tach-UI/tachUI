import { describe, test, expect } from 'vitest'
import { createModifierBuilder } from '../../src/modifiers/builder'

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
    const builder = createModifierBuilder(component)

    expect(typeof builder.asHTML).toBe('function')
  })

  test('asHTML returns ModifierBuilder for chaining', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = createModifierBuilder(component)

    const result = builder.asHTML()

    expect(result.asHTML).toBeDefined()
  })

  test('asHTML can be chained with other modifiers', () => {
    const component = mockTextComponent('<p>Styled content</p>')
    const builder = createModifierBuilder(component)

    const result = builder
      .asHTML()
      .padding(16)
      .backgroundColor('#f0f0f0')
      .cornerRadius(8)

    expect(result).toBe(builder)
    expect(() => result.build()).not.toThrow()
  })

  test('asHTML adds modifier to the modifier list', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = createModifierBuilder(component)

    const initialModifierCount = (builder as any).modifiers.length

    builder.asHTML()

    const finalModifierCount = (builder as any).modifiers.length
    expect(finalModifierCount).toBe(initialModifierCount + 1)

    const lastModifier = (builder as any).modifiers[finalModifierCount - 1]
    expect(lastModifier.type).toBe('asHTML')
  })

  test('asHTML with options adds configured modifier', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = createModifierBuilder(component)

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
    const builder = createModifierBuilder(component)

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
    const builder = createModifierBuilder(component)

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

    const modifiers = (builder as any).modifiers
    const hasAsHTML = modifiers.some((m: any) => m.type === 'asHTML')
    expect(hasAsHTML).toBe(true)
  })

  test('asHTML modifier priority is correct', () => {
    const component = mockTextComponent('<p>Test</p>')
    const builder = createModifierBuilder(component)

    builder.asHTML()

    const modifiers = (builder as any).modifiers
    const asHTMLModifier = modifiers[modifiers.length - 1]

    expect(asHTMLModifier.priority).toBe(10)
  })

  test('built component maintains original structure with asHTML modifier', () => {
    const originalContent =
      '<div class="article"><h1>Title</h1><p>Content</p></div>'
    const component = mockTextComponent(originalContent)
    const builder = createModifierBuilder(component)

    const builtComponent = builder.asHTML().padding(16).build()

    expect(builtComponent).toBeDefined()
    expect(typeof builtComponent).toBe('object')

    if ('modifiers' in builtComponent) {
      const modifiers = (builtComponent as any).modifiers
      const hasAsHTML = modifiers.some((m: any) => m.type === 'asHTML')
      const hasPadding = modifiers.some((m: any) => m.type === 'padding')

      expect(hasAsHTML).toBe(true)
      expect(hasPadding).toBe(true)
    }
  })

  test('asHTML error handling in build chain', () => {
    const component = mockVStackComponent()
    const builder = createModifierBuilder(component)

    expect(() => {
      builder.asHTML()
    }).not.toThrow()

    expect(() => {
      builder.build()
    }).not.toThrow()

    const modifiers = (builder as any).modifiers
    const asHTMLModifier = modifiers[modifiers.length - 1]

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
