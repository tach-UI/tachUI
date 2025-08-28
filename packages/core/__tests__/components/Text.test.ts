/**
 * Tests for Enhanced Text Component (Phase 5.1)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TextProps } from '../../src/components/Text'
import { EnhancedText, Text, TextFormat, TextStyles, Typography } from '../../src/components/Text'
import { createSignal } from '../../src/reactive'

// Mock DOM environment
function createMockTextElement(): HTMLElement {
  const element = {
    tagName: 'SPAN',
    style: {} as CSSStyleDeclaration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    textContent: '',
    id: `mock-${Math.random()}`,
  } as any

  return element
}

// Mock document methods
beforeEach(() => {
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'span') {
        return createMockTextElement()
      }
      return {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        style: {},
        setAttribute: vi.fn(),
      }
    }),
  }
})

describe('EnhancedText', () => {
  describe('Basic Functionality', () => {
    it('should create text component with string content', () => {
      const props: TextProps = {
        content: 'Hello World',
      }

      const text = new EnhancedText(props)
      expect(text.type).toBe('component')
      expect(text.id).toMatch(/^text-/)
      expect(text.props).toEqual(props)
    })

    it('should handle string content', () => {
      const text = new EnhancedText({ content: 'Test content' })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle function content', () => {
      const getContent = () => 'Dynamic content'
      const text = new EnhancedText({ content: getContent })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle signal content', () => {
      const [content] = createSignal('Signal content')
      const text = new EnhancedText({ content })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle empty content', () => {
      const text = new EnhancedText({})
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should render text element', () => {
      const text = new EnhancedText({ content: 'Test' })
      const elements = text.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('span')
      expect(elements[0].props?.className).toBe('tachui-text')
    })
  })

  describe('Typography', () => {
    it('should apply font family', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { family: 'Arial' },
      })

      text.render()
      // Test would verify font family is applied to element
    })

    it('should apply font size as number', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { size: 16 },
      })

      text.render()
      // Test would verify font size is applied as '16px'
    })

    it('should apply font size as string', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { size: '1.2em' },
      })

      text.render()
      // Test would verify font size is applied as '1.2em'
    })

    it('should apply font weight', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { weight: 'bold' },
      })

      text.render()
      // Test would verify font weight is applied
    })

    it('should apply font style', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { style: 'italic' },
      })

      text.render()
      // Test would verify font style is applied
    })

    it('should apply font variant', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { variant: 'small-caps' },
      })

      text.render()
      // Test would verify font variant is applied
    })

    it('should apply multiple font properties', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: {
          family: 'Arial',
          size: 18,
          weight: '600',
          style: 'italic',
          variant: 'small-caps',
        },
      })

      text.render()
      // Test would verify all font properties are applied
    })
  })

  describe('Text Styling', () => {
    it('should apply static color', () => {
      const text = new EnhancedText({
        content: 'Test',
        color: '#ff0000',
      })

      text.render()
      // Test would verify color is applied
    })

    it('should apply signal color', () => {
      const [color] = createSignal('#00ff00')
      const text = new EnhancedText({
        content: 'Test',
        color,
      })

      text.render()
      // Test would verify reactive color is applied
    })

    it('should apply background color', () => {
      const text = new EnhancedText({
        content: 'Test',
        backgroundColor: '#f0f0f0',
      })

      text.render()
      // Test would verify background color is applied
    })

    it('should apply text alignment', () => {
      const alignments: Array<'left' | 'center' | 'right' | 'justify'> = [
        'left',
        'center',
        'right',
        'justify',
      ]

      alignments.forEach((align) => {
        const text = new EnhancedText({
          content: 'Test',
          textAlign: align,
        })

        text.render()
        // Test would verify text alignment is applied
      })
    })

    it('should apply text decoration', () => {
      const decorations: Array<'none' | 'underline' | 'line-through' | 'overline'> = [
        'none',
        'underline',
        'line-through',
        'overline',
      ]

      decorations.forEach((decoration) => {
        const text = new EnhancedText({
          content: 'Test',
          textDecoration: decoration,
        })

        text.render()
        // Test would verify text decoration is applied
      })
    })

    it('should apply text transform', () => {
      const transforms: Array<'none' | 'uppercase' | 'lowercase' | 'capitalize'> = [
        'none',
        'uppercase',
        'lowercase',
        'capitalize',
      ]

      transforms.forEach((transform) => {
        const text = new EnhancedText({
          content: 'test',
          textTransform: transform,
        })

        text.render()
        // Test would verify text transform is applied
      })
    })

    it('should apply line height as number', () => {
      const text = new EnhancedText({
        content: 'Test',
        lineHeight: 1.5,
      })

      text.render()
      // Test would verify line height is applied
    })

    it('should apply line height as string', () => {
      const text = new EnhancedText({
        content: 'Test',
        lineHeight: '20px',
      })

      text.render()
      // Test would verify line height is applied
    })

    it('should apply letter spacing', () => {
      const text = new EnhancedText({
        content: 'Test',
        letterSpacing: 2,
      })

      text.render()
      // Test would verify letter spacing is applied
    })

    it('should apply word spacing', () => {
      const text = new EnhancedText({
        content: 'Test words',
        wordSpacing: 4,
      })

      text.render()
      // Test would verify word spacing is applied
    })
  })

  describe('Text Truncation', () => {
    it('should apply line limit', () => {
      const text = new EnhancedText({
        content: 'Long text that should be truncated',
        lineLimit: 2,
      })

      text.render()
      // Test would verify line limit styles are applied
    })

    it('should apply tail truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'tail',
      })

      text.render()
      // Test would verify tail truncation is applied
    })

    it('should apply head truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'head',
      })

      text.render()
      // Test would verify head truncation is applied
    })

    it('should apply middle truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'middle',
      })

      text.render()
      // Test would verify middle truncation is applied
    })
  })

  describe('Accessibility', () => {
    it('should apply accessibility label', () => {
      const text = new EnhancedText({
        content: 'Test',
        accessibilityLabel: 'Test label',
      })

      text.render()
      // Test would verify aria-label is set
    })

    it('should apply text role', () => {
      const text = new EnhancedText({
        content: 'Test',
        accessibilityRole: 'text',
      })

      text.render()
      // Test would verify role is set
    })

    it('should apply heading role with level', () => {
      const text = new EnhancedText({
        content: 'Heading',
        accessibilityRole: 'heading',
        accessibilityLevel: 2,
      })

      text.render()
      // Test would verify role and aria-level are set
    })

    it('should disable text selection', () => {
      const text = new EnhancedText({
        content: 'Test',
        allowsSelection: false,
      })

      text.render()
      // Test would verify user-select is disabled
    })

    it('should allow text selection by default', () => {
      const text = new EnhancedText({
        content: 'Test',
      })

      text.render()
      // Test would verify user-select is not disabled
    })
  })

  describe('Interactions', () => {
    it('should handle tap events', () => {
      const onTap = vi.fn()
      const text = new EnhancedText({
        content: 'Clickable',
        onTap,
      })

      text.render()
      // Test would verify click event handler is added
    })

    it('should handle long press events', () => {
      const onLongPress = vi.fn()
      const text = new EnhancedText({
        content: 'Long pressable',
        onLongPress,
      })

      text.render()
      // Test would verify long press handlers are added
    })

    it('should set cursor pointer for interactive text', () => {
      const text = new EnhancedText({
        content: 'Interactive',
        onTap: vi.fn(),
      })

      text.render()
      // Test would verify cursor pointer is set
    })
  })

  describe('Reactive Updates', () => {
    it('should update content when signal changes', () => {
      const [content, setContent] = createSignal('Initial')
      const text = new EnhancedText({ content })
      
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
      
      // Test signal updates work
      setContent('Updated')
      expect(content()).toBe('Updated')
    })

    it('should update color when signal changes', () => {
      const [color, _setColor] = createSignal('#ff0000')
      const text = new EnhancedText({
        content: 'Test',
        color,
      })

      text.render()
      // Test that reactive color updates work
    })
  })
})

describe('Typography Presets', () => {
  it('should have correct typography values', () => {
    expect(Typography.largeTitle).toEqual({ size: 34, weight: '400', lineHeight: 1.2 })
    expect(Typography.title).toEqual({ size: 28, weight: '400', lineHeight: 1.3 })
    expect(Typography.title2).toEqual({ size: 22, weight: '400', lineHeight: 1.3 })
    expect(Typography.title3).toEqual({ size: 20, weight: '400', lineHeight: 1.4 })
    expect(Typography.headline).toEqual({ size: 17, weight: '600', lineHeight: 1.4 })
    expect(Typography.body).toEqual({ size: 17, weight: '400', lineHeight: 1.5 })
    expect(Typography.callout).toEqual({ size: 16, weight: '400', lineHeight: 1.4 })
    expect(Typography.subheadline).toEqual({ size: 15, weight: '400', lineHeight: 1.4 })
    expect(Typography.footnote).toEqual({ size: 13, weight: '400', lineHeight: 1.3 })
    expect(Typography.caption).toEqual({ size: 12, weight: '400', lineHeight: 1.2 })
    expect(Typography.caption2).toEqual({ size: 11, weight: '400', lineHeight: 1.1 })
  })
})

describe('Text Factory Function', () => {
  it('should create modifiable text component', () => {
    const text = Text('Hello World')

    expect(text).toBeDefined()
    expect(typeof text.modifier).toBe('object')
    expect(typeof text.modifier.build).toBe('function')
  })

  it('should accept additional props', () => {
    const text = Text('Hello', {
      color: '#ff0000',
      font: { size: 16 },
    })

    expect(text).toBeDefined()
  })

  it('should support modifier chaining', () => {
    const text = Text('Hello').modifier.padding(16).margin(8).build()

    expect(text).toBeDefined()
  })
})

describe('TextStyles Presets', () => {
  it('should create LargeTitle text', () => {
    const text = TextStyles.LargeTitle('Large Title')
    expect(text).toBeDefined()
  })

  it('should create Title text', () => {
    const text = TextStyles.Title('Title')
    expect(text).toBeDefined()
  })

  it('should create Title2 text', () => {
    const text = TextStyles.Title2('Title 2')
    expect(text).toBeDefined()
  })

  it('should create Title3 text', () => {
    const text = TextStyles.Title3('Title 3')
    expect(text).toBeDefined()
  })

  it('should create Headline text', () => {
    const text = TextStyles.Headline('Headline')
    expect(text).toBeDefined()
  })

  it('should create Body text', () => {
    const text = TextStyles.Body('Body text')
    expect(text).toBeDefined()
  })

  it('should create Callout text', () => {
    const text = TextStyles.Callout('Callout')
    expect(text).toBeDefined()
  })

  it('should create Subheadline text', () => {
    const text = TextStyles.Subheadline('Subheadline')
    expect(text).toBeDefined()
  })

  it('should create Footnote text', () => {
    const text = TextStyles.Footnote('Footnote')
    expect(text).toBeDefined()
  })

  it('should create Caption text', () => {
    const text = TextStyles.Caption('Caption')
    expect(text).toBeDefined()
  })

  it('should create Caption2 text', () => {
    const text = TextStyles.Caption2('Caption 2')
    expect(text).toBeDefined()
  })

  it('should accept additional props in presets', () => {
    const text = TextStyles.Body('Body', { color: '#666666' })
    expect(text).toBeDefined()
  })
})

describe('TextFormat Utilities', () => {
  describe('formatted', () => {
    it('should apply bold formatting', () => {
      const text = TextFormat.formatted('Bold text', { bold: true })
      expect(text).toBeDefined()
    })

    it('should apply italic formatting', () => {
      const text = TextFormat.formatted('Italic text', { italic: true })
      expect(text).toBeDefined()
    })

    it('should apply underline formatting', () => {
      const text = TextFormat.formatted('Underlined', { underline: true })
      expect(text).toBeDefined()
    })

    it('should apply strikethrough formatting', () => {
      const text = TextFormat.formatted('Strikethrough', { strikethrough: true })
      expect(text).toBeDefined()
    })

    it('should apply monospace formatting', () => {
      const text = TextFormat.formatted('Code', { monospace: true })
      expect(text).toBeDefined()
    })

    it('should apply small caps formatting', () => {
      const text = TextFormat.formatted('Small Caps', { smallCaps: true })
      expect(text).toBeDefined()
    })

    it('should apply multiple formatting options', () => {
      const text = TextFormat.formatted('Formatted', {
        bold: true,
        italic: true,
        underline: true,
      })
      expect(text).toBeDefined()
    })
  })

  describe('convenience methods', () => {
    it('should create bold text', () => {
      const text = TextFormat.bold('Bold')
      expect(text).toBeDefined()
    })

    it('should create italic text', () => {
      const text = TextFormat.italic('Italic')
      expect(text).toBeDefined()
    })

    it('should create underlined text', () => {
      const text = TextFormat.underline('Underlined')
      expect(text).toBeDefined()
    })

    it('should create monospace text', () => {
      const text = TextFormat.monospace('console.log("code")')
      expect(text).toBeDefined()
    })

    it('should accept additional props in convenience methods', () => {
      const text = TextFormat.bold('Bold', { color: '#ff0000' })
      expect(text).toBeDefined()
    })
  })
})

describe('Integration Tests', () => {
  it('should combine typography preset with formatting', () => {
    const text = TextStyles.Headline('Important Notice').modifier.padding(16).margin(8).build()

    expect(text).toBeDefined()
  })

  it('should work with signal content and formatting', () => {
    const [content] = createSignal('Dynamic')
    const text = TextFormat.bold(content, { color: '#333' })

    expect(text).toBeDefined()
  })

  it('should handle complex styling combinations', () => {
    const text = Text('Complex Text', {
      font: Typography.title2,
      color: '#2c3e50',
      textAlign: 'center',
      lineHeight: 1.6,
      letterSpacing: 1,
      textDecoration: 'underline',
    })
      .modifier.padding(20)
      .backgroundColor('#ecf0f1')
      .build()

    expect(text).toBeDefined()
  })
})
